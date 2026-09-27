import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values, but unique if provided
  },

  password: {
    type: String,
    required: true
  },

  // Optional PIN for fast approvals (e.g., manager PIN fallback).
  // Store only the hash.
  pinHash: {
    type: String,
    default: null,
    select: false
  },

  role: {
    type: String,
    enum: ['manager', 'waiter', 'kitchen', 'customer', 'vendor'],
    default: 'customer'
  },

  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  

  table: {
    type: String,
    default: null
  },

  addresses: [
    {
      label: { type: String, default: 'Home' }, // e.g., 'Home', 'Work'
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison
userSchema.methods.comparePassword = async function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.comparePin = async function (inputPin) {
  if (!this.pinHash) return false;
  return bcrypt.compare(String(inputPin), this.pinHash);
};

export default mongoose.model('User', userSchema);
