import mongoose from 'mongoose';
import Dish from '../models/Dish.js';
import Inventory from '../models/Inventory.js';
import { canConvertUnit, convertQuantity, normalizeUnit } from './unitConversion.js';

function isObjectIdLike(value) {
  if (!value) return false;
  if (value instanceof mongoose.Types.ObjectId) return true;
  return mongoose.Types.ObjectId.isValid(String(value));
}

function normalizeName(value) {
  return String(value || '').trim();
}

async function resolveDishesForOrderItems(items) {
  const dishIds = [];
  const dishNames = [];

  for (const item of items || []) {
    if (isObjectIdLike(item?.dish)) dishIds.push(String(item.dish));
    const name = normalizeName(item?.name);
    if (name) dishNames.push(name);
  }

  const queries = [];
  if (dishIds.length) {
    queries.push(
      Dish.find({ _id: { $in: dishIds } })
        .select('_id name recipeItems ingredients')
        .populate('recipeItems.item', '_id name unit restaurant vendorId')
    );
  }
  if (dishNames.length) {
    // Case-insensitive match by exact name (fallback for voice/older orders)
    const unique = Array.from(new Set(dishNames.map((n) => n.toLowerCase())));
    queries.push(
      Dish.find({
        $or: unique.map((lower) => ({ name: new RegExp(`^${escapeRegex(lower)}$`, 'i') })),
      })
        .select('_id name recipeItems ingredients')
        .populate('recipeItems.item', '_id name unit restaurant vendorId')
    );
  }

  const results = (await Promise.all(queries)).flat();
  const byId = new Map(results.map((d) => [String(d._id), d]));
  const byLowerName = new Map(results.map((d) => [String(d.name || '').toLowerCase(), d]));

  return { byId, byLowerName };
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function previewInventoryDeductions({ restaurantId, items }) {
  const resolved = await resolveDishesForOrderItems(items);

  const missing = [];
  const rawDeductions = new Map();

  for (const orderItem of items || []) {
    const qty = Number(orderItem?.quantity || 1);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    let dishDoc = null;
    if (isObjectIdLike(orderItem?.dish)) {
      dishDoc = resolved.byId.get(String(orderItem.dish)) || null;
    }
    if (!dishDoc) {
      const lower = String(orderItem?.name || '').trim().toLowerCase();
      if (lower) dishDoc = resolved.byLowerName.get(lower) || null;
    }

    if (!dishDoc) {
      missing.push({ name: orderItem?.name || 'Unknown', reason: 'Dish not found in dishes collection' });
      continue;
    }

    const recipeItems = Array.isArray(dishDoc.recipeItems) ? dishDoc.recipeItems : [];
    if (recipeItems.length === 0) {
      missing.push({ name: dishDoc.name, dishId: String(dishDoc._id), reason: 'Recipe not configured' });
      continue;
    }

    for (const r of recipeItems) {
      const inv = r?.item;
      if (!inv || !inv._id) {
        missing.push({ name: dishDoc.name, dishId: String(dishDoc._id), reason: 'Recipe references missing inventory item' });
        continue;
      }

      // Ensure restaurant scoping (avoid cross-restaurant leakage)
      if (restaurantId && inv.restaurant && String(inv.restaurant) !== String(restaurantId)) {
        missing.push({
          name: dishDoc.name,
          dishId: String(dishDoc._id),
          reason: `Recipe inventory item (${inv.name}) belongs to a different restaurant`,
        });
        continue;
      }

      const recipeUnit = normalizeUnit(r.unit);
      const inventoryUnit = normalizeUnit(inv.unit);
      const perServingQty = Number(r.quantity);

      if (!Number.isFinite(perServingQty) || perServingQty <= 0) {
        missing.push({ name: dishDoc.name, dishId: String(dishDoc._id), reason: `Invalid recipe quantity for ${inv.name}` });
        continue;
      }

      if (!canConvertUnit(recipeUnit, inventoryUnit)) {
        missing.push({
          name: dishDoc.name,
          dishId: String(dishDoc._id),
          reason: `Unit mismatch for ${inv.name}: recipe ${recipeUnit} -> inventory ${inventoryUnit}`,
        });
        continue;
      }

      const neededInInventoryUnit = convertQuantity(perServingQty, recipeUnit, inventoryUnit) * qty;
      const key = String(inv._id);
      rawDeductions.set(key, {
        item: inv._id,
        unit: inventoryUnit,
        quantity: (rawDeductions.get(key)?.quantity || 0) + neededInInventoryUnit,
      });
    }
  }

  return {
    deductions: Array.from(rawDeductions.values()).map((d) => ({
      item: d.item,
      unit: d.unit,
      quantity: Number(d.quantity),
    })),
    missing,
  };
}

export async function applyInventoryDeductions({ restaurantId, deductions }) {
  const applied = [];

  for (const d of deductions || []) {
    const qty = Number(d?.quantity);
    if (!d?.item || !Number.isFinite(qty) || qty <= 0) continue;

    const filter = {
      _id: d.item,
      quantity: { $gte: qty },
    };
    if (restaurantId) filter.restaurant = restaurantId;

    const updated = await Inventory.findOneAndUpdate(
      filter,
      { $inc: { quantity: -qty }, $set: { lastUpdated: new Date() } },
      { new: true }
    );

    if (!updated) {
      // rollback what we already deducted
      for (const a of applied) {
        await Inventory.findOneAndUpdate(
          { _id: a.item, ...(restaurantId ? { restaurant: restaurantId } : {}) },
          { $inc: { quantity: a.quantity }, $set: { lastUpdated: new Date() } }
        );
      }
      return {
        ok: false,
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Insufficient inventory for this order',
          item: String(d.item),
          required: qty,
        },
      };
    }

    applied.push({ item: d.item, quantity: qty, unit: d.unit });
  }

  return { ok: true, applied };
}

export async function restoreInventoryFromOrderLedger({ restaurantId, inventoryDeductions }) {
  const ledger = Array.isArray(inventoryDeductions) ? inventoryDeductions : [];
  for (const entry of ledger) {
    const qty = Number(entry?.quantity);
    if (!entry?.item || !Number.isFinite(qty) || qty <= 0) continue;

    const filter = { _id: entry.item };
    if (restaurantId) filter.restaurant = restaurantId;

    await Inventory.findOneAndUpdate(
      filter,
      { $inc: { quantity: qty }, $set: { lastUpdated: new Date() } },
      { new: true }
    );
  }
}
