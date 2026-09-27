import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  date: {
    type: Date,
    default: Date.now
  },
  
  clockIn: {
    time: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['face', 'pin', 'manual', 'qr'],
      default: 'face'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    image: {
      type: String, // base64 image data
      required: false
    }
  },
  
  clockOut: {
    time: {
      type: Date,
      required: false
    },
    method: {
      type: String,
      enum: ['face', 'pin', 'manual', 'qr'],
      default: 'face'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    image: {
      type: String, // base64 image data
      required: false
    }
  },
  
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'early_departure'],
    default: 'present'
  },
  
  workingHours: {
    type: Number, // in minutes
    default: 0
  },
  
  notes: {
    type: String,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate working hours when clock out is set
attendanceSchema.pre('save', function(next) {
  if (this.clockOut && this.clockOut.time && this.clockIn && this.clockIn.time) {
    const diffMs = this.clockOut.time - this.clockIn.time;
    this.workingHours = Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Index for efficient queries
attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ restaurant: 1, date: 1 });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema); 