// routes/orderRoutes.js
import express from 'express';
import mongoose from 'mongoose';
import {
  createOrder,
  getOrders,
  getDailyProfit as calculateProfit,
  saveRecipeCost,
  updateInventory,
  createInventory,
  createBulkInventory,
  getInventory,
  deleteInventory,
  upsertInventoryByName,
  updateOrderStatus,
  createCustomerOrder,
  getCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  reorderFromPrevious
} from '../controllers/orderController.js';
import authMiddleware from '../middleware/auth.js';
import { analyzeWasteAndAdvice, inventoryWasteAlert } from '../services/geminiService.js';
import Dish from '../models/Dish.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import {
  applyInventoryDeductions,
  previewInventoryDeductions,
  restoreInventoryFromOrderLedger,
} from '../services/inventoryConsumption.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

// Auto-invalidate relevant cached GETs on POST/PUT/DELETE
router.use(redisAutoInvalidate());

/* ===============================
   🔹 SPECIFIC ROUTES FIRST
================================= */

// Create order (for restaurant staff)
router.post('/create', authMiddleware, createOrder);

// Create customer order (for customers)
router.post('/customer/create', authMiddleware, createCustomerOrder);

// Profit calculator
router.get('/profit', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), calculateProfit);

// Save recipe cost
router.post('/recipe', authMiddleware, saveRecipeCost);

// Waste analysis
router.post('/wasteanalyze', authMiddleware, analyzeWasteAndAdvice);

// Inventory alert
router.get('/inventoryalert', authMiddleware, redisCache({ ttlSeconds: 20, scope: 'user' }), inventoryWasteAlert);

// Get orders by customer ID
router.get('/customer/:customerId', authMiddleware, redisCache({ ttlSeconds: 15, scope: 'user' }), async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify that the requesting user matches the customerId
    if (req.user._id.toString() !== customerId) {
      return res.status(403).json({ error: 'Not authorized to view these orders' });
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ error: 'Invalid Customer ID' });
    }

    const orders = await Order.find({ customer: customerId })
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single customer order by ID
router.get('/customer/order/:orderId', authMiddleware, redisCache({ ttlSeconds: 15, scope: 'user' }), async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    })
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category description')
      .populate('customer', 'name email phone addresses');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching customer order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Cancel customer order
router.put('/customer/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const order = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot cancel order that is already being prepared or completed' 
      });
    }

    // Check if order was placed within last 5 minutes
    const orderTime = new Date(order.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

    if (timeDiff > 5) {
      return res.status(400).json({ 
        error: 'Orders can only be cancelled within 5 minutes of placing' 
      });
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();

    if (order.inventoryDeductedAt && !order.inventoryRestoredAt && Array.isArray(order.inventoryDeductions) && order.inventoryDeductions.length) {
      await restoreInventoryFromOrderLedger({
        restaurantId: order.restaurant || null,
        inventoryDeductions: order.inventoryDeductions,
      });
      order.inventoryRestoredAt = new Date();
    }

    await order.save();

    // Optional push updates to dashboards
    try {
      const { emitInventoryUpdate } = await import('../index.js');
      if (typeof emitInventoryUpdate === 'function') emitInventoryUpdate(await Inventory.find());
    } catch {}

    res.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order 
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});
// Add this route to orderRoutes.js

// Get urgent orders (orders that haven't been received within 10 minutes)
router.get('/urgent', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), async (req, res) => {
  try {
    const restaurantId = req.user.restaurant?._id || req.user.restaurant;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID not found' });
    }
    
    // Find orders that are:
    // 1. Not paid or cancelled
    // 2. Older than 10 minutes
    const urgentOrders = await Order.find({
      restaurant: restaurantId,
      // Include legacy states for safety, but prefer canonical ones.
      status: { $in: ['pending', 'processing', 'preparing', 'ready', 'served'] },
      createdAt: { 
        $lt: new Date(Date.now() - 10 * 60 * 1000) // Older than 10 minutes
      }
    })
    .populate('restaurant', 'name')
    .populate('customer', 'name email phone')
    .populate('items.dish', 'name')
    .sort({ createdAt: 1 }); // Oldest first
    
    res.json(urgentOrders);
    
  } catch (error) {
    console.error('Error fetching urgent orders:', error);
    res.status(500).json({ error: 'Failed to fetch urgent orders' });
  }
});
// Reorder from previous order
router.post('/customer/:orderId/reorder', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    // Find the previous order
    const previousOrder = await Order.findOne({ 
      _id: orderId, 
      customer: customerId 
    }).populate('restaurant');

    if (!previousOrder) {
      return res.status(404).json({ error: 'Previous order not found' });
    }

    // Check if restaurant still exists
    const restaurant = await mongoose.model('Restaurant').findById(previousOrder.restaurant._id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant no longer available' });
    }

    // Create new order with same items
    const newOrder = new Order({
      restaurant: previousOrder.restaurant._id,
      customer: customerId,
      items: previousOrder.items.map(item => ({
        dish: item.dish,
        name: item.name,
        quantity: item.quantity,
        modifications: item.modifications || [],
        price: item.price,
      })),
      totalAmount: previousOrder.totalAmount,
      deliveryAddress: previousOrder.deliveryAddress,
      paymentMethod: previousOrder.paymentMethod,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const requireRecipe = String(process.env.INVENTORY_REQUIRE_RECIPE || 'false').toLowerCase() === 'true';
    const { deductions, missing } = await previewInventoryDeductions({
      restaurantId: previousOrder.restaurant._id,
      items: newOrder.items,
    });

    if (requireRecipe && missing.length) {
      return res.status(400).json({
        error: 'Inventory recipe is not configured for one or more dishes',
        missing,
      });
    }

    const deductionResult = await applyInventoryDeductions({ restaurantId: previousOrder.restaurant._id, deductions });
    if (!deductionResult.ok) {
      return res.status(409).json({ error: deductionResult.error?.message || 'Inventory deduction failed', details: deductionResult.error });
    }

    newOrder.inventoryDeductions = deductionResult.applied || [];
    newOrder.inventoryDeductedAt = (deductionResult.applied || []).length ? new Date() : null;

    try {
      await newOrder.save();
    } catch (saveErr) {
      await restoreInventoryFromOrderLedger({
        restaurantId: previousOrder.restaurant._id,
        inventoryDeductions: deductionResult.applied || [],
      });
      throw saveErr;
    }

    try {
      const { emitInventoryUpdate } = await import('../index.js');
      if (typeof emitInventoryUpdate === 'function') emitInventoryUpdate(await Inventory.find());
    } catch {}

    // Populate for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('restaurant', 'name image location')
      .populate('customer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Error reordering:', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

/* ===============================
   🔹 INVENTORY ROUTES
================================= */

// inventory list is hit frequently (dashboards)
router.get('/inventory', authMiddleware, redisCache({ ttlSeconds: 20, scope: 'user' }), getInventory);
router.post('/createin', authMiddleware, createInventory);
router.post('/createinbulk', authMiddleware, createBulkInventory);
router.post('/inventory/upsert', authMiddleware, upsertInventoryByName);
router.put('/inventory/:id', authMiddleware, updateInventory);
router.delete('/inventory/:id', authMiddleware, deleteInventory);

/* ===============================
   🔹 DISH ROUTES
================================= */

router.get('/dishes', authMiddleware, redisCache({ ttlSeconds: 60, scope: 'user' }), async (req, res) => {
  try {
    const dishes = await Dish.find()
      .sort({ name: 1 })
      .populate('recipeItems.item', '_id name unit quantity restaurant vendorId');
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/dishes/:id/recipe', authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can edit dish recipes' });
    }

    const { id } = req.params;
    const { recipeItems } = req.body;

    if (!Array.isArray(recipeItems)) {
      return res.status(400).json({ error: 'recipeItems must be an array' });
    }

    // Validate inventory items belong to this restaurant (prevents cross-restaurant leakage)
    const restaurantId = req.user?.restaurant || null;
    if (!restaurantId) {
      return res.status(400).json({ error: 'Manager is not assigned to a restaurant' });
    }

    const itemIds = recipeItems.map((r) => r?.item).filter(Boolean);
    const invDocs = await Inventory.find({ _id: { $in: itemIds }, restaurant: restaurantId }).select('_id');
    const allowed = new Set(invDocs.map((d) => String(d._id)));

    for (const r of recipeItems) {
      if (!r?.item || !allowed.has(String(r.item))) {
        return res.status(400).json({ error: 'Recipe contains invalid inventory items for this restaurant' });
      }
      const qty = Number(r.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Each recipe item must have a positive quantity' });
      }
    }

    const dish = await Dish.findById(id);
    if (!dish) return res.status(404).json({ error: 'Dish not found' });

    dish.recipeItems = recipeItems.map((r) => ({
      item: r.item,
      quantity: Number(r.quantity),
      unit: r.unit,
    }));

    // Keep legacy ingredients[] roughly in sync for display/search
    const invNames = await Inventory.find({ _id: { $in: itemIds } }).select('name');
    dish.ingredients = invNames.map((d) => d.name);

    await dish.save();

    const populated = await Dish.findById(dish._id).populate('recipeItems.item', '_id name unit quantity restaurant vendorId');
    res.json({ message: 'Recipe updated', dish: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dishes', authMiddleware, async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    res.status(201).json(dish);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ===============================
   🔹 UPDATE ORDER STATUS
================================= */

// Change this from '/order/:id' to '/:id' to match the frontend call
router.put('/:id', authMiddleware, updateOrderStatus);

/* ===============================
   🔥 GENERIC ROUTES LAST
================================= */

// Get single order by ID (with optional customer verification)
router.get('/:orderId', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const query = { _id: orderId };

    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ error: 'Invalid Customer ID' });
      }
      query.customer = customerId;
    }

    const order = await Order.findOne(query)
      .populate('restaurant', 'name image location cuisine phone email')
      .populate('items.dish', 'name image category description')
      .populate('customer', 'name email phone')
      .populate('waiter', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If customerId is provided, verify ownership
    if (customerId && order.customer?._id.toString() !== customerId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get all orders (very last)
router.get('/', authMiddleware, redisCache({ ttlSeconds: 5, scope: 'user' }), getOrders);

export default router;