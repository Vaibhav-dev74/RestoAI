import express from 'express';
import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

import sendPOEmail from '../services/sendPOEmail.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

// Auto-invalidate relevant cached GETs on POST/PUT/DELETE
router.use(redisAutoInvalidate());

// GET /api/inventory/forecast
router.get('/forecast', redisCache({ ttlSeconds: 60, scope: 'public' }), async (req, res) => {
  try {
    const items = await Inventory.find();
    const forecasts = {};
    for (const item of items) {
      // Get sales for this item from orders
      const sales = await Order.aggregate([
        { $unwind: '$items' },
        { $match: { 'items.name': item.name } },
        { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, sold: { $sum: '$items.quantity' } } },
        { $sort: { '_id.date': 1 } }
      ]);
      const salesData = sales.map(s => ({ date: s._id.date, sold: s.sold }));
      forecasts[item.name] = forecastInventory(salesData, 7);
    }
    res.json({ forecasts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/generate-po
router.post('/generate-po', async (req, res) => {
  try {
    const { threshold = 5 } = req.body; // default threshold
    const items = await Inventory.find();
    const pos = [];
    for (const item of items) {
      if (item.quantity <= threshold) {
        // Find supplier for this item
        const supplier = await Supplier.findOne({ itemsSupplied: item._id });
        if (!supplier) continue;
        // Create PO
        const po = new PurchaseOrder({
          item: item._id,
          quantity: 10, // default reorder quantity, can be improved
          supplier: supplier._id,
        });
        await po.save();
        pos.push(po);
      }
    }
    res.json({ pos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/send-po/:poId
router.post('/send-po/:poId', async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.poId).populate('item supplier');
    if (!po) return res.status(404).json({ error: 'PO not found' });
    await sendPOEmail(po);
    po.status = 'sent';
    po.sentAt = new Date();
    await po.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/inventory/alerts
router.get('/alerts', redisCache({ ttlSeconds: 60, scope: 'public' }), async (req, res) => {
  try {
    // Expiry alerts: items not updated in 30+ days
    const now = new Date();
    const expiryAlerts = await Inventory.find({
      lastUpdated: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });
    // Price alerts: items with price drop in supplier priceList (not implemented, placeholder)
    const priceAlerts = [];
    res.json({ expiryAlerts, priceAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 