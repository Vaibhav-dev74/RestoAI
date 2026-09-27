import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null, // 🔑 Optional for vendor
  },

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 🔑 For tracking standalone vendor inventory
    default: null,
  },

  name: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  unit: {
    type: String,
    enum: ['kg', 'liters', 'pieces', 'gms', 'ml', 'packs'],
    default: 'pieces',
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Inventory', inventorySchema);
