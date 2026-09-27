// models/Order.js (updated)
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null,
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // The customer who placed the order
    default: null,
  },

  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  table: {
    type: String,
    default: 'Takeaway',
  },

  items: [
    {
      dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
      name: String,
      quantity: { type: Number, default: 1 },
      modifications: [String],
      price: Number,
    }
  ],

  // Inventory deduction ledger for this order
  inventoryDeductions: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
      quantity: { type: Number, required: true },
      unit: {
        type: String,
        enum: ['kg', 'liters', 'pieces', 'gms', 'ml', 'packs'],
        required: true,
      },
    },
  ],
  inventoryDeductedAt: { type: Date, default: null },
  inventoryRestoredAt: { type: Date, default: null },

  status: {
    type: String,
    enum: ['pending', 'preparing', 'served', 'paid', 'cancelled'],
    default: 'pending',
  },

  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online'],
    default: 'cash',
  },

  totalAmount: Number,

  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },

  specialInstructions: String,

  wasteFlag: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Order', orderSchema);