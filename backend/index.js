import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express"; 

// Routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/order.js';
import aiRoutes from './routes/ai.js';
import tableRoutes from './routes/tables.js';
import whatsappRoutes from './routes/whatsapp.js';
import attendanceRoutes from './routes/attendance.js';
import inventoryRoutes from './routes/inventory.js';
import restaurantRoutes from './routes/restaurant.js';
import Order from './models/Order.js'; // Import Order model

import whatsappService from './services/whatsappService.js';
import { getRedisClient, redisPing } from './services/redisClient.js';
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My MERN API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:4000",
      },
    ],
  },
  apis: ["./routes/*.js"], // adjust this to your routes
};

const specs = swaggerJsdoc(options);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Optional Redis startup check (non-fatal)
(async () => {
  try {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
    if (!redisUrl) {
      console.log('ℹ️ Redis not configured (set REDIS_URL to enable caching)');
      return;
    }

    const ok = await Promise.race([
      (async () => {
        await getRedisClient();
        return redisPing();
      })(),
      new Promise((resolve) => setTimeout(() => resolve(false), 2000)),
    ]);
    if (ok) {
      console.log('✅ Redis connected (caching enabled)');
    } else {
      console.log('⚠️ Redis not reachable (caching disabled)');
    }
  } catch (err) {
    console.log('⚠️ Redis check failed (caching disabled):', err?.message || err);
  }
})();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://resto-gold-iota.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('🍽️ Restaurant Management API is running');
});

// Health check (useful for deployments / demos)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection?.readyState;
  const db = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  const whatsapp = (() => {
    try { return whatsappService.isWhatsAppEnabled() ? 'ready' : 'not-ready'; }
    catch { return 'unknown'; }
  })();

  // Fire-and-forget (don’t block health if Redis is down)
  const redisPromise = redisPing();

  Promise.resolve(redisPromise)
    .then((ok) => {
      res.json({
        status: 'ok',
        time: new Date().toISOString(),
        services: {
          db,
          whatsapp,
          redis: ok ? 'ready' : 'not-ready',
        },
      });
    })
    .catch(() => {
      res.json({
        status: 'ok',
        time: new Date().toISOString(),
        services: {
          db,
          whatsapp,
          redis: 'not-ready',
        },
      });
    });
});

// MongoDB Connection
let io; // Global io reference
let emitAnalyticsUpdate, emitInventoryUpdate, emitWasteAlert, broadcastOrder;
let urgentOrderInterval; // Store interval reference

// Function to check for urgent orders
const checkForUrgentOrders = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Find orders that are:
    // 1. Not paid or cancelled
    // 2. Created more than 10 minutes ago
    const urgentOrders = await Order.find({
      // Include legacy states for safety, but prefer canonical ones.
      status: { $in: ['pending', 'processing', 'preparing', 'ready', 'served'] },
      createdAt: { $lt: tenMinutesAgo }
    }).populate('restaurant', 'name _id');
    
    if (urgentOrders.length === 0) return;
    
    // Group by restaurant for targeted notifications
    const restaurantMap = new Map();
    urgentOrders.forEach(order => {
      if (order.restaurant && order.restaurant._id) {
        const restaurantId = order.restaurant._id.toString();
        if (!restaurantMap.has(restaurantId)) {
          restaurantMap.set(restaurantId, []);
        }
        restaurantMap.get(restaurantId).push(order);
      }
    });
    
    // Emit to specific restaurant rooms
    restaurantMap.forEach((orders, restaurantId) => {
      console.log(`🔔 Emitting ${orders.length} urgent orders for restaurant ${restaurantId}`);
      io.to(`restaurant_${restaurantId}`).emit('urgent:orders', orders);
      
      // Also emit a general urgent alert
      io.to(`restaurant_${restaurantId}`).emit('urgent:alert', {
        count: orders.length,
        orders: orders.map(o => ({
          id: o._id,
          table: o.table,
          timeElapsed: Math.floor((Date.now() - new Date(o.createdAt)) / (1000 * 60)),
          status: o.status
        }))
      });
    });
    
    // Also emit to all connected clients (for global dashboard)
    if (urgentOrders.length > 0) {
      io.emit('urgent:orders:global', {
        count: urgentOrders.length,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error checking urgent orders:', error);
  }
};

// Function to start urgent order monitoring
const startUrgentOrderMonitoring = () => {
  // Clear existing interval if any
  if (urgentOrderInterval) {
    clearInterval(urgentOrderInterval);
  }
  
  // Check every minute
  urgentOrderInterval = setInterval(checkForUrgentOrders, 60000);
  console.log('✅ Urgent order monitoring started (checking every minute)');
  
  // Also do an immediate check
  checkForUrgentOrders();
};

// Function to stop monitoring (useful for graceful shutdown)
const stopUrgentOrderMonitoring = () => {
  if (urgentOrderInterval) {
    clearInterval(urgentOrderInterval);
    console.log('🛑 Urgent order monitoring stopped');
  }
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
  const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  io = new Server(httpServer, { 
    cors: { 
      origin: '*',
      methods: ['GET', 'POST']
    } 
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    // Handle restaurant room joining
    socket.on('join:restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`Client ${socket.id} joined restaurant room: ${restaurantId}`);
      }
    });
    
    // Handle leaving restaurant room
    socket.on('leave:restaurant', (restaurantId) => {
      if (restaurantId) {
        socket.leave(`restaurant_${restaurantId}`);
        console.log(`Client ${socket.id} left restaurant room: ${restaurantId}`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  // Emit functions
  emitAnalyticsUpdate = (analytics) => {
    io.emit('analytics:update', analytics);
  };
  
  emitInventoryUpdate = (inventory) => {
    io.emit('inventory:update', inventory);
  };
  
  emitWasteAlert = (alert) => {
    io.emit('waste:alert', alert);
  };
  
  broadcastOrder = (order) => {
    io.emit('order:new', order);
    
    // Also check if this order becomes urgent immediately (for orders created close to threshold)
    setTimeout(() => {
      checkForUrgentOrders();
    }, 5000);
  };

  // Start urgent order monitoring
  startUrgentOrderMonitoring();

  // Optional: Add endpoint to manually trigger check (for testing)
  app.get('/api/admin/check-urgent', async (req, res) => {
    await checkForUrgentOrders();
    res.json({ message: 'Urgent orders check triggered' });
  });

}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopUrgentOrderMonitoring();
  if (io) {
    io.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  stopUrgentOrderMonitoring();
  if (io) {
    io.close();
  }
  process.exit(0);
});

export { 
  io, 
  emitAnalyticsUpdate, 
  emitInventoryUpdate, 
  emitWasteAlert, 
  broadcastOrder,
  checkForUrgentOrders // Export for manual triggering if needed
};