import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from '../models/Restaurant.js';
import Inventory from '../models/Inventory.js';
import Dish from '../models/Dish.js';
import User from '../models/User.js';
import {
  previewInventoryDeductions,
  applyInventoryDeductions,
  restoreInventoryFromOrderLedger,
} from '../services/inventoryConsumption.js';

dotenv.config();

function must(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function almostEqual(a, b, eps = 1e-9) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  must(mongoUri, 'MONGO_URI is required (same value you use to run backend/index.js)');

  const cleanup = String(process.env.CLEANUP || 'true').toLowerCase() !== 'false';

  const runId = `smoke_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const dishName = `Smoke Masala Dosa ${runId}`;

  let restaurant = null;
  let managerUser = null;
  let inventoryDocs = [];
  let dish = null;

  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    managerUser = await User.create({
      name: `Smoke Manager ${runId}`,
      email: `smoke_manager_${runId}@example.com`,
      password: `SmokePass_${runId}`,
      role: 'manager',
    });

    restaurant = await Restaurant.create({
      name: `SmokeTest Restaurant ${runId}`,
      cuisine: ['Test'],
      createdBy: managerUser._id,
      tables: [
        {
          tableId: `smoke_table_${runId}`,
          tableNumber: '1',
          seats: 4,
          position: { x: 0, y: 0 },
        },
      ],
    });

    // Inventory units must match your enum: ['kg','liters','pieces','gms','ml','packs']
    const riceBatter = await Inventory.create({
      restaurant: restaurant._id,
      name: `Rice Batter ${runId}`,
      quantity: 1000,
      unit: 'gms',
    });
    const potato = await Inventory.create({
      restaurant: restaurant._id,
      name: `Potato ${runId}`,
      quantity: 20,
      unit: 'pieces',
    });
    const oil = await Inventory.create({
      restaurant: restaurant._id,
      name: `Oil ${runId}`,
      quantity: 500,
      unit: 'ml',
    });
    inventoryDocs = [riceBatter, potato, oil];

    dish = await Dish.create({
      name: dishName,
      description: 'Smoke-test dish',
      ingredients: [],
      recipeItems: [
        { item: riceBatter._id, quantity: 200, unit: 'gms' }, // per serving
        { item: potato._id, quantity: 2, unit: 'pieces' },
        { item: oil._id, quantity: 10, unit: 'ml' },
      ],
      price: 120,
      category: 'Test',
      dietary: [],
      image: '',
    });

    const orderItems = [
      {
        dish: dish._id,
        name: dish.name,
        quantity: 2,
        price: dish.price,
        modifications: [],
      },
    ];

    const preview = await previewInventoryDeductions({ restaurantId: restaurant._id, items: orderItems });

    if (preview.missing.length) {
      throw new Error(`Preview reported missing recipe/units: ${JSON.stringify(preview.missing, null, 2)}`);
    }

    const expected = new Map([
      [String(riceBatter._id), 400],
      [String(potato._id), 4],
      [String(oil._id), 20],
    ]);

    for (const d of preview.deductions) {
      const want = expected.get(String(d.item));
      if (want == null) continue;
      if (!almostEqual(d.quantity, want)) {
        throw new Error(`Unexpected deduction for ${d.item}: got ${d.quantity}, expected ${want}`);
      }
    }

    const before = await Inventory.find({ _id: { $in: inventoryDocs.map((x) => x._id) } }).sort({ name: 1 });
    const applyRes = await applyInventoryDeductions({ restaurantId: restaurant._id, deductions: preview.deductions });
    if (!applyRes.ok) {
      throw new Error(`applyInventoryDeductions failed: ${JSON.stringify(applyRes.error)}`);
    }

    const afterDeduct = await Inventory.find({ _id: { $in: inventoryDocs.map((x) => x._id) } }).sort({ name: 1 });

    const beforeMap = new Map(before.map((i) => [String(i._id), i]));
    for (const entry of applyRes.applied) {
      const invBefore = beforeMap.get(String(entry.item));
      const invAfter = afterDeduct.find((x) => String(x._id) === String(entry.item));
      if (!invBefore || !invAfter) throw new Error('Inventory lookup failed during verification');

      const expectedAfter = Number(invBefore.quantity) - Number(entry.quantity);
      if (!almostEqual(invAfter.quantity, expectedAfter)) {
        throw new Error(
          `Quantity mismatch for ${invAfter.name}: before=${invBefore.quantity}, deducted=${entry.quantity}, after=${invAfter.quantity}`
        );
      }
    }

    await restoreInventoryFromOrderLedger({ restaurantId: restaurant._id, inventoryDeductions: applyRes.applied });

    const afterRestore = await Inventory.find({ _id: { $in: inventoryDocs.map((x) => x._id) } }).sort({ name: 1 });
    for (const inv of afterRestore) {
      const invBefore = beforeMap.get(String(inv._id));
      if (!invBefore) continue;
      if (!almostEqual(inv.quantity, invBefore.quantity)) {
        throw new Error(`Restore mismatch for ${inv.name}: expected ${invBefore.quantity}, got ${inv.quantity}`);
      }
    }

    console.log('✅ SMOKE TEST PASS: inventory deducted and restored correctly');
    console.log(`Restaurant: ${restaurant._id}`);
    console.log(`Dish: ${dish._id} (${dish.name})`);
  } finally {
    if (cleanup) {
      const ids = inventoryDocs.map((x) => x?._id).filter(Boolean);
      if (ids.length) await Inventory.deleteMany({ _id: { $in: ids } });
      if (dish?._id) await Dish.deleteOne({ _id: dish._id });
      if (restaurant?._id) await Restaurant.deleteOne({ _id: restaurant._id });
      if (managerUser?._id) await User.deleteOne({ _id: managerUser._id });
    }

    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.error('❌ SMOKE TEST FAIL:', err?.message || err);
  process.exitCode = 1;
});
