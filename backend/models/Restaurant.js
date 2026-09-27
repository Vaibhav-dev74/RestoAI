import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  // Add location fields for map functionality
  address: {
    type: String,
    required: false,
    default: ''
  },
  
  location: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    },
    city: {
      type: String,
      default: ''
    },
    area: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    }
  },

  // Alternative GeoJSON format for better spatial queries
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },

  // Restaurant details
  cuisine: [{
    type: String,
    default: []
  }],
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  image: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=Restaurant'
  },
  
  phone: {
    type: String,
    default: ''
  },
  
  email: {
    type: String,
    default: ''
  },
  
  isOpen: {
    type: Boolean,
    default: true
  },
  
  isVeg: {
    type: Boolean,
    default: false
  },
  
  deliveryTime: {
    type: Number,
    default: 30
  },
  
  avgPrice: {
    type: Number,
    default: 300
  },
  
  offers: [{
    text: String,
    code: String,
    discount: Number,
    validUntil: Date
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  menu: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      category: { type: String },
      inventoryThreshold: { type: Number, default: 0 },
      allergens: [{ type: String }],
      isTopItem: { type: Boolean, default: false }
    }
  ],

  // Restaurant layout configuration
  layout: {
    floors: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    floorNames: {
      type: [String],
      default: ['Ground Floor']
    },
    canvasWidth: {
      type: Number,
      default: 800
    },
    canvasHeight: {
      type: Number,
      default: 600
    }
  },

  tables: [
    {
      tableId: { 
        type: String, 
        required: true,
        unique: true 
      },
      tableNumber: { 
        type: String, 
        required: true 
      },
      floor: {
        type: String,
        default: "Ground Floor"
      },
      floorIndex: {
        type: Number,
        default: 0
      },
      tableType: {
        type: String,
        enum: ['normal', 'vip', 'outdoor', 'private'],
        default: 'normal'
      },
      seats: { 
        type: Number, 
        required: true,
        min: 1,
        max: 20
      },
      // 2D positioning for drag and drop
      position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      },
      // Table dimensions
      width: { type: Number, default: 80 },
      height: { type: Number, default: 80 },
      // Visual styling
      color: { type: String, default: '#28a745' },
      borderColor: { type: String, default: '#1e7e34' },
      // Status management
      status: {
        type: String,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
      },
      // Current reservation/occupancy - FIXED: Make it optional with select: false
      currentReservation: {
        type: {
          reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
          customerName: { type: String },
          customerPhone: { type: String },
          partySize: { type: Number },
          reservationTime: { type: Date },
          expectedDuration: { type: Number, default: 120 },
          notes: { type: String }
        },
        required: false,
        default: undefined,
        select: true
      },
      // Table notes
      notes: { type: String },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],

  // Reservation settings
  reservationSettings: {
    maxAdvanceBooking: { type: Number, default: 30 },
    minPartySize: { type: Number, default: 1 },
    maxPartySize: { type: Number, default: 20 },
    reservationDuration: { type: Number, default: 120 },
    allowWalkIns: { type: Boolean, default: true },
    requireDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 }
  },

  // Staff working hours for waiter and chef
  staffHours: {
    waiter: {
      start: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      },
      close: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      }
    },
    chef: {
      start: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      },
      close: {
        time: { type: String, default: '' },
        period: { type: String, enum: ['AM', 'PM'], default: 'AM' }
      }
    }
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

// Create a 2dsphere index for better geospatial queries
restaurantSchema.index({ coordinates: '2dsphere' });
restaurantSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Update the updatedAt field before saving
restaurantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Restaurant', restaurantSchema);