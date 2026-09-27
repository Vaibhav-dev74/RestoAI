import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  tableId: {
    type: String,
    required: true
  },
  
  customerName: {
    type: String,
    required: true
  },
  
  customerPhone: {
    type: String,
    required: true
  },
  
  customerEmail: {
    type: String
  },
  
  partySize: {
    type: Number,
    required: true,
    min: 1
  },
  
  reservationDate: {
    type: Date,
    required: true
  },
  
  reservationTime: {
    type: String,
    required: true // Format: "HH:MM"
  },
  
  duration: {
    type: Number,
    default: 120, // minutes
    min: 30,
    max: 480
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  specialRequests: {
    type: String
  },
  
  notes: {
    type: String
  },
  
  // Payment and deposit
  depositPaid: {
    type: Boolean,
    default: false
  },
  
  depositAmount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Confirmation
  confirmedAt: {
    type: Date
  },
  
  seatedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
reservationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
reservationSchema.index({ restaurantId: 1, reservationDate: 1 });
reservationSchema.index({ tableId: 1, reservationDate: 1 });
reservationSchema.index({ status: 1 });

export default mongoose.model('Reservation', reservationSchema); 