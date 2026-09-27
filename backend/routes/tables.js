import express from 'express';
import Restaurant from '../models/Restaurant.js';
import Reservation from '../models/Reservation.js';
import authMiddleware from '../middleware/auth.js';
import mongoose from 'mongoose';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

// Auto-invalidate relevant cached GETs on POST/PUT/DELETE
router.use(redisAutoInvalidate());

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({ message: 'Tables API is working!', timestamp: new Date().toISOString() });
});

// List all restaurants (for debugging)
router.get('/restaurants', authMiddleware, redisCache({ ttlSeconds: 30, scope: 'user' }), async (req, res) => {
  try {
    console.log('=== LIST RESTAURANTS DEBUG ===');
    console.log('User:', req.user);
    
    const restaurants = await Restaurant.find({});
    console.log('Restaurants found:', restaurants.length);
    
    const restaurantList = restaurants.map(r => ({
      id: r._id,
      name: r.name,
      createdBy: r.createdBy,
      tablesCount: r.tables.length
    }));
    
    res.json({ restaurants: restaurantList });
  } catch (error) {
    console.error('=== LIST RESTAURANTS ERROR ===');
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to list restaurants', details: error.message });
  }
});

// Get restaurant layout and tables
router.get('/layout/:restaurantId', authMiddleware, redisCache({ ttlSeconds: 30, scope: 'user' }), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Ensure layout has default values if not present
    const layout = restaurant.layout || {
      floors: 1,
      floorNames: ['Ground Floor'],
      canvasWidth: 800,
      canvasHeight: 600,
      backgroundColor: '#ffffff'
    };

    // Return tables without currentReservation (it will be calculated in status endpoint)
    const tablesWithoutReservation = (restaurant.tables || []).map(table => {
      const tableObj = table.toObject ? table.toObject() : table;
      const { currentReservation, ...tableWithoutRes } = tableObj;
      return tableWithoutRes;
    });

    res.json({
      layout: layout,
      tables: tablesWithoutReservation,
      reservationSettings: restaurant.reservationSettings || {}
    });
  } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant layout', details: error.message });
  }
});

// Update restaurant layout configuration
router.put('/layout/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    // Accept either `{ layout: {...} }` or a direct layout payload `{ floors, floorNames, ... }`
    const layout = req.body?.layout && typeof req.body.layout === 'object' ? req.body.layout : req.body;
    const reservationSettings = req.body?.reservationSettings;
    
    console.log('=== UPDATE LAYOUT DEBUG ===');
    console.log('Restaurant ID:', restaurantId);
    console.log('Received layout update:', JSON.stringify(layout, null, 2));
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Initialize layout if it doesn't exist
    if (!restaurant.layout) {
      restaurant.layout = {
        floors: 1,
        floorNames: ['Ground Floor'],
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: '#ffffff'
      };
    }

    // Update layout if provided and it's an object
    if (layout && typeof layout === 'object') {
      if (layout.floors !== undefined && !isNaN(layout.floors)) {
        restaurant.layout.floors = Number(layout.floors);
      }
      if (layout.floorNames !== undefined && Array.isArray(layout.floorNames)) {
        restaurant.layout.floorNames = layout.floorNames;
      }
      if (layout.canvasWidth !== undefined && !isNaN(layout.canvasWidth)) {
        restaurant.layout.canvasWidth = Number(layout.canvasWidth);
      }
      if (layout.canvasHeight !== undefined && !isNaN(layout.canvasHeight)) {
        restaurant.layout.canvasHeight = Number(layout.canvasHeight);
      }
      
      console.log('Updated layout:', restaurant.layout);
    }
    
    // Update reservation settings if provided
    if (reservationSettings && typeof reservationSettings === 'object') {
      if (!restaurant.reservationSettings) {
        restaurant.reservationSettings = {};
      }
      restaurant.reservationSettings = {
        ...restaurant.reservationSettings,
        ...reservationSettings
      };
    }

    // Mark as modified to ensure Mongoose saves
    restaurant.markModified('layout');
    restaurant.markModified('reservationSettings');
    
    await restaurant.save();
    
    res.json({ 
      message: 'Layout updated successfully', 
      layout: restaurant.layout,
      reservationSettings: restaurant.reservationSettings
    });
    
  } catch (error) {
    console.error('=== UPDATE LAYOUT ERROR ===');
    console.error('Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update layout', 
      details: error.message 
    });
  }
});

// --- Floors CRUD (explicit endpoints) ---
// Create a floor
router.post('/floors/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (!restaurant.layout) {
      restaurant.layout = { floors: 1, floorNames: ['Ground Floor'], canvasWidth: 800, canvasHeight: 600 };
    }

    const existing = Array.isArray(restaurant.layout.floorNames) ? restaurant.layout.floorNames : [];
    if (existing.some((n) => String(n).trim().toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: 'Floor already exists' });
    }

    restaurant.layout.floorNames = [...existing, name];
    restaurant.layout.floors = restaurant.layout.floorNames.length;
    restaurant.markModified('layout');
    await restaurant.save();

    res.status(201).json({ message: 'Floor created', layout: restaurant.layout });
  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({ error: 'Failed to create floor', details: error.message });
  }
});

// Delete a floor (by index). Requires no tables on that floor.
router.delete('/floors/:restaurantId/:floorIndex', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, floorIndex } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const idx = Number(floorIndex);
    if (!Number.isInteger(idx) || idx < 0) {
      return res.status(400).json({ error: 'floorIndex must be a non-negative integer' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (!restaurant.layout) {
      restaurant.layout = { floors: 1, floorNames: ['Ground Floor'], canvasWidth: 800, canvasHeight: 600 };
    }

    const names = Array.isArray(restaurant.layout.floorNames) ? restaurant.layout.floorNames : [];
    if (names.length <= 1) return res.status(400).json({ error: 'Cannot delete the only floor' });
    if (idx >= names.length) return res.status(400).json({ error: 'Floor index out of range' });

    const hasTables = (restaurant.tables || []).some((t) => Number(t.floorIndex) === idx);
    if (hasTables) {
      return res.status(400).json({ error: 'Move or delete tables on this floor first' });
    }

    // Remove the floor name
    const nextNames = names.filter((_, i) => i !== idx);
    restaurant.layout.floorNames = nextNames;
    restaurant.layout.floors = nextNames.length;

    // Reindex tables above the removed floor (keep consistent if floors were removed)
    if (Array.isArray(restaurant.tables) && restaurant.tables.length) {
      restaurant.tables = restaurant.tables.map((t) => {
        const tIdx = Number(t.floorIndex ?? 0);
        if (!Number.isFinite(tIdx)) return t;
        if (tIdx > idx) {
          const newIndex = tIdx - 1;
          const newFloor = nextNames[newIndex] || t.floor;
          const plain = typeof t?.toObject === 'function' ? t.toObject() : t;
          return { ...plain, floorIndex: newIndex, floor: newFloor };
        }
        return t;
      });
      restaurant.markModified('tables');
    }

    restaurant.markModified('layout');
    await restaurant.save();
    res.json({ message: 'Floor deleted', layout: restaurant.layout });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ error: 'Failed to delete floor', details: error.message });
  }
});

// Add a new table
router.post('/tables/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const {
      tableNumber,
      seats,
      position,
      floor,
      floorIndex,
      tableType,
      width,
      height,
      color,
      borderColor,
      notes
    } = req.body;

    // Validate required fields
    if (!tableNumber) {
      return res.status(400).json({ error: 'tableNumber is required' });
    }
    
    if (seats === undefined || seats === null) {
      return res.status(400).json({ error: 'seats is required' });
    }

    const seatsNum = Number(seats);
    if (!Number.isFinite(seatsNum) || seatsNum < 1) {
      return res.status(400).json({ error: 'seats must be a number greater than 0' });
    }
    
    if (!position) {
      return res.status(400).json({ error: 'position is required' });
    }
    
    const xNum = Number(position.x);
    const yNum = Number(position.y);
    if (!Number.isFinite(xNum) || !Number.isFinite(yNum)) {
      return res.status(400).json({ error: 'position must have x and y coordinates as numbers' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Check for duplicate table number on same floor
    const targetFloor = floor || 'Ground Floor';
    const existingTable = restaurant.tables.find(
      t => t.tableNumber === tableNumber && t.floor === targetFloor
    );
    
    if (existingTable) {
      return res.status(400).json({ 
        error: `A table with number ${tableNumber} already exists on ${targetFloor}` 
      });
    }

    // Generate unique table ID
    const tableId = `T${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new table object WITHOUT currentReservation
    const newTable = {
      tableId,
      tableNumber: String(tableNumber),
      floor: targetFloor,
      floorIndex: floorIndex !== undefined ? Number(floorIndex) : 0,
      tableType: tableType || 'normal',
      seats: seatsNum,
      position: {
        x: xNum,
        y: yNum
      },
      width: width ? Number(width) : 80,
      height: height ? Number(height) : 80,
      color: color || '#28a745',
      borderColor: borderColor || '#1e7e34',
      status: 'available',
      isActive: true,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    restaurant.tables.push(newTable);
    await restaurant.save();

    res.status(201).json({ 
      message: 'Table added successfully', 
      table: newTable 
    });
    
  } catch (error) {
    console.error('Error adding table:', error);
    res.status(500).json({ 
      error: 'Failed to add table', 
      details: error.message 
    });
  }
});

// Update table - FIXED: Remove currentReservation handling
router.put('/tables/:restaurantId/:tableId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    
    console.log('=== UPDATE TABLE DEBUG ===');
    console.log('Restaurant ID:', restaurantId);
    console.log('Table ID:', tableId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const updateData = req.body;
    
    // Find restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Find table index
    const tableIndex = restaurant.tables.findIndex(table => table.tableId === tableId);
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }

    console.log('Table found at index:', tableIndex);
    
    // Get the original table as a plain object
    const originalTable = restaurant.tables[tableIndex].toObject();
    
    // Create updated table object - start with original (without currentReservation)
    const updatedTable = {
      tableId: originalTable.tableId,
      tableNumber: originalTable.tableNumber,
      floor: originalTable.floor,
      floorIndex: originalTable.floorIndex,
      tableType: originalTable.tableType,
      seats: originalTable.seats,
      position: originalTable.position,
      width: originalTable.width,
      height: originalTable.height,
      color: originalTable.color,
      borderColor: originalTable.borderColor,
      status: originalTable.status,
      notes: originalTable.notes,
      isActive: originalTable.isActive,
      createdAt: originalTable.createdAt,
      updatedAt: new Date()
    };
    
    // Update only the fields that are provided
    if (updateData.tableNumber !== undefined) {
      updatedTable.tableNumber = String(updateData.tableNumber);
    }
    if (updateData.floor !== undefined) {
      updatedTable.floor = updateData.floor;
    }
    if (updateData.floorIndex !== undefined) {
      updatedTable.floorIndex = Number(updateData.floorIndex);
    }
    if (updateData.tableType !== undefined) {
      updatedTable.tableType = updateData.tableType;
    }
    if (updateData.seats !== undefined) {
      updatedTable.seats = Number(updateData.seats);
    }
    if (updateData.position !== undefined) {
      if (updateData.position.x !== undefined && updateData.position.y !== undefined) {
        updatedTable.position = {
          x: Number(updateData.position.x),
          y: Number(updateData.position.y)
        };
      }
    }
    if (updateData.width !== undefined) {
      updatedTable.width = Number(updateData.width);
    }
    if (updateData.height !== undefined) {
      updatedTable.height = Number(updateData.height);
    }
    if (updateData.color !== undefined) {
      updatedTable.color = updateData.color;
    }
    if (updateData.borderColor !== undefined) {
      updatedTable.borderColor = updateData.borderColor;
    }
    if (updateData.notes !== undefined) {
      updatedTable.notes = updateData.notes;
    }
    if (updateData.status !== undefined) {
      updatedTable.status = updateData.status;
    }

    console.log('Updated table data:', {
      tableId: updatedTable.tableId,
      tableNumber: updatedTable.tableNumber,
      status: updatedTable.status,
      position: updatedTable.position
    });
    
    // Update the table in the array
    restaurant.tables[tableIndex] = updatedTable;
    
    // Mark as modified to ensure Mongoose saves
    restaurant.markModified('tables');
    
    // Save the restaurant
    await restaurant.save();
    console.log('Restaurant saved successfully');
    
    // Return the updated table
    const savedTable = restaurant.tables[tableIndex].toObject();
    const { currentReservation, ...tableWithoutRes } = savedTable;
    res.json({ 
      message: 'Table updated successfully', 
      table: tableWithoutRes 
    });
    
  } catch (error) {
    console.error('=== UPDATE TABLE ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update table', 
      details: error.message 
    });
  }
});

// Delete table
router.delete('/tables/:restaurantId/:tableId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const tableIndex = restaurant.tables.findIndex(table => table.tableId === tableId);
    if (tableIndex === -1) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table has active reservations
    const activeReservations = await Reservation.find({
      tableId,
      status: { $in: ['pending', 'confirmed', 'seated'] }
    });

    if (activeReservations.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active reservations' });
    }

    restaurant.tables.splice(tableIndex, 1);
    await restaurant.save();

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// Get table status and reservations - FIXED DYNAMIC STATUS CALCULATION
router.get('/tables/:restaurantId/status', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }

    const parseTimeToHoursMinutes = (timeValue) => {
      if (timeValue === null || timeValue === undefined) return null;
      const raw = String(timeValue).trim();
      if (!raw) return null;

      // Normalize common variants: "19.30" -> "19:30", "7pm" -> "7 pm"
      const normalized = raw
        .replace(/\./g, ':')
        .replace(/\s+/g, ' ')
        .trim();

      const match = normalized.match(/^\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?\s*(am|pm)?\s*$/i);
      if (!match) return null;

      let hours = parseInt(match[1], 10);
      let minutes = match[2] !== undefined ? parseInt(match[2], 10) : 0;
      const meridiem = match[3] ? match[3].toLowerCase() : null;

      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      if (minutes < 0 || minutes > 59) return null;

      if (meridiem) {
        // 12am -> 0h, 12pm -> 12h
        if (hours === 12) hours = 0;
        if (meridiem === 'pm') hours += 12;
      }

      if (hours < 0 || hours > 23) return null;
      return { hours, minutes };
    };

    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get reservations for the selected date - include ALL statuses
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      restaurantId: restaurantId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const debug = req.query.debug === '1';
    const debugTable = String(req.query.debugTable || '').trim().toLowerCase();
    if (debug) {
      console.log('=== TABLE STATUS DEBUG ===', {
        restaurantId,
        queryDate: queryDate.toISOString(),
        isToday: queryDate.toDateString() === new Date().toDateString(),
        reservationCount: reservations.length,
        debugTable: debugTable || null
      });
      console.log(
        'Reservations(sample):',
        reservations.slice(0, 10).map(r => ({
          id: String(r._id),
          tableId: r.tableId,
          reservationTime: r.reservationTime,
          status: r.status,
          reservationDate: r.reservationDate
        }))
      );
    }

    // Get current time for checking active reservations
    const currentTime = new Date();
    const isToday = queryDate.toDateString() === new Date().toDateString();

    // Calculate table status dynamically based on reservations for the selected date
    const tablesWithStatus = restaurant.tables.map(table => {
      // Find all reservations for this table on the selected date
      // NOTE: Some older/frontends may store Reservation.tableId as the visible table number
      // (e.g., "gh9") instead of the internal tableId (e.g., "T123...").
      // Be tolerant so status + voice actions can still work.
      const tableReservations = reservations.filter(res => {
        const resTableId = res?.tableId;
        const resAlt = res?.tableNumber || res?.table || res?.tableName;
        return (
          resTableId === table.tableId ||
          resTableId === table.tableNumber ||
          resAlt === table.tableId ||
          resAlt === table.tableNumber
        );
      });
      
      // Base status comes from the table itself (so voice/manual updates like
      // 'cleaning' can be reflected when there is no reservation overriding it).
      let status = (typeof table.status === 'string' && table.status.trim()) ? table.status : 'available';
      let currentReservation = null;

      // Check for seated reservations first (highest priority)
      const seatedReservation = tableReservations.find(res => String(res.status || '').toLowerCase() === 'seated');
      if (seatedReservation && isToday) {
        status = 'occupied';
        currentReservation = {
          reservationId: seatedReservation._id,
          customerName: seatedReservation.customerName,
          customerPhone: seatedReservation.customerPhone,
          partySize: seatedReservation.partySize,
          reservationTime: seatedReservation.reservationTime,
          expectedDuration: seatedReservation.duration,
          notes: seatedReservation.specialRequests
        };
      } 
      // Check for active reservation (current time within reservation time)
      else if (isToday) {
        for (const reservation of tableReservations) {
          // Only consider pending or confirmed reservations for active time check
          const resStatus = String(reservation.status || '').toLowerCase();
          if (resStatus === 'pending' || resStatus === 'confirmed') {
            const reservationDateTime = new Date(reservation.reservationDate);
            const parsed = parseTimeToHoursMinutes(reservation.reservationTime);
            if (!parsed) {
              if (debug && (!debugTable || String(table.tableNumber || '').toLowerCase() === debugTable)) {
                console.log('Unparseable reservationTime; skipping active check', {
                  tableNumber: table.tableNumber,
                  reservationId: String(reservation._id),
                  reservationTime: reservation.reservationTime
                });
              }
              continue;
            }
            reservationDateTime.setHours(parsed.hours, parsed.minutes, 0, 0);
            
            const endTime = new Date(reservationDateTime.getTime() + reservation.duration * 60000);
            
            if (currentTime >= reservationDateTime && currentTime <= endTime) {
              status = 'reserved';
              currentReservation = {
                reservationId: reservation._id,
                customerName: reservation.customerName,
                customerPhone: reservation.customerPhone,
                partySize: reservation.partySize,
                reservationTime: reservation.reservationTime,
                expectedDuration: reservation.duration,
                notes: reservation.specialRequests
              };
              break;
            }
          }
        }

        // If it's today and there is an upcoming pending/confirmed reservation later,
        // expose the nearest upcoming one so UIs (and voice commands) can act on it.
        if (!currentReservation) {
          const upcoming = tableReservations
            .filter(res => {
              const s = String(res.status || '').toLowerCase();
              return s === 'pending' || s === 'confirmed';
            })
            .map(res => {
              const dt = new Date(res.reservationDate);
              const parsed = parseTimeToHoursMinutes(res.reservationTime);
              if (!parsed) {
                if (debug && (!debugTable || String(table.tableNumber || '').toLowerCase() === debugTable)) {
                  console.log('Unparseable reservationTime; skipping upcoming', {
                    tableNumber: table.tableNumber,
                    reservationId: String(res._id),
                    reservationTime: res.reservationTime
                  });
                }
                return null;
              }
              dt.setHours(parsed.hours, parsed.minutes, 0, 0);
              return { res, dt };
            })
            .filter(Boolean)
            .filter(x => x.dt >= currentTime)
            .sort((a, b) => a.dt - b.dt);

          if (upcoming.length > 0) {
            status = 'reserved';
            const reservation = upcoming[0].res;
            currentReservation = {
              reservationId: reservation._id,
              customerName: reservation.customerName,
              customerPhone: reservation.customerPhone,
              partySize: reservation.partySize,
              reservationTime: reservation.reservationTime,
              expectedDuration: reservation.duration,
              notes: reservation.specialRequests
            };
          }
        }
      }
      
      // For future dates, check for any pending/confirmed reservations
      if (!isToday && status === 'available') {
        const futureReservation = tableReservations.find(res => {
          const s = String(res.status || '').toLowerCase();
          return s === 'pending' || s === 'confirmed' || s === 'seated';
        });
        if (futureReservation) {
          status = 'reserved';
          currentReservation = {
            reservationId: futureReservation._id,
            customerName: futureReservation.customerName,
            customerPhone: futureReservation.customerPhone,
            partySize: futureReservation.partySize,
            reservationTime: futureReservation.reservationTime,
            expectedDuration: futureReservation.duration,
            notes: futureReservation.specialRequests
          };
        }
      }

      const tableObj = table.toObject();
      const { currentReservation: _, ...tableWithoutRes } = tableObj;

      return {
        ...tableWithoutRes,
        status,
        currentReservation
      };
    });

    // Filter reservations to show in the list (only active ones for the selected date)
    const activeReservations = reservations.filter(res => {
      const s = String(res.status || '').toLowerCase();
      return s !== 'cancelled' && s !== 'completed';
    });

    res.json({ tables: tablesWithStatus, reservations: activeReservations });
  } catch (error) {
    console.error('Error fetching table status:', error);
    res.status(500).json({ error: 'Failed to fetch table status', details: error.message });
  }
});

// Create reservation
router.post('/reservations/:restaurantId', authMiddleware, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    const {
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate,
      reservationTime,
      duration,
      specialRequests,
      notes
    } = req.body;

    // Validate required fields
    if (!tableId) return res.status(400).json({ error: 'Missing tableId' });
    if (!customerName) return res.status(400).json({ error: 'Missing customerName' });
    if (!customerPhone) return res.status(400).json({ error: 'Missing customerPhone' });
    if (!partySize) return res.status(400).json({ error: 'Missing partySize' });
    if (!reservationDate) return res.status(400).json({ error: 'Missing reservationDate' });
    if (!reservationTime) return res.status(400).json({ error: 'Missing reservationTime' });

    const reservationDateTime = new Date(reservationDate);
    if (isNaN(reservationDateTime.getTime())) {
      return res.status(400).json({ error: 'Invalid reservationDate' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const table = restaurant.tables.find(t => t.tableId === tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (partySize > table.seats) {
      return res.status(400).json({ error: 'Party size exceeds table capacity' });
    }

    const endTime = new Date(reservationDateTime.getTime() + (duration || 120) * 60000);
    const startOfDay = new Date(reservationDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reservationDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Check for conflicting reservations on the same date and time
    const conflictingReservations = await Reservation.find({
      tableId,
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed', 'seated'] }
    });

    const hasConflict = conflictingReservations.some(existingReservation => {
      const existingStart = new Date(existingReservation.reservationDate);
      const [existingHours, existingMinutes] = existingReservation.reservationTime.split(':');
      existingStart.setHours(parseInt(existingHours), parseInt(existingMinutes), 0, 0);
      const existingEnd = new Date(existingStart.getTime() + existingReservation.duration * 60000);
      return (reservationDateTime < existingEnd && endTime > existingStart);
    });

    if (hasConflict) {
      return res.status(400).json({ error: 'Table is not available for the selected time' });
    }

    // Create reservation
    const reservation = new Reservation({
      restaurantId: restaurantId,
      tableId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      reservationDate: reservationDateTime,
      reservationTime,
      duration: duration || 120,
      specialRequests,
      notes
    });

    await reservation.save();

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
});

// Get reservations
router.get('/reservations/:restaurantId', authMiddleware, redisCache({ ttlSeconds: 15, scope: 'user' }), async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID format' });
    }
    
    const { date, status } = req.query;
    let query = { restaurantId: restaurantId };
    
    if (date) {
      const queryDate = new Date(date);
      query.reservationDate = {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999))
      };
    }
    
    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query).sort({ reservationDate: 1, reservationTime: 1 });
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Update reservation status
router.put('/reservations/:reservationId/status', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ error: 'Invalid reservation ID format' });
    }
    
    const { status } = req.body;
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    reservation.status = status;
    
    if (status === 'confirmed' && !reservation.confirmedAt) {
      reservation.confirmedAt = new Date();
    } else if (status === 'seated' && !reservation.seatedAt) {
      reservation.seatedAt = new Date();
    } else if (status === 'completed' && !reservation.completedAt) {
      reservation.completedAt = new Date();
    } else if (status === 'cancelled') {
      reservation.cancelledAt = new Date();
    }

    await reservation.save();

    res.json({ message: 'Reservation status updated successfully', reservation });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

export default router;