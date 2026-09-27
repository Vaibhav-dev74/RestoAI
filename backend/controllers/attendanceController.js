import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Attendance from '../models/Attendance.js';
import FaceEmbedding from '../models/FaceEmbedding.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

// Helper function to run Python script
const runPythonScript = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const scriptPath = path.resolve(__dirname, '..', 'face_recognition_service.py');

    const pythonBin = process.env.FACE_PYTHON_BIN || 'python';
    // If using stdin, add --stdin flag and do not pass image as argument
    let pythonArgs = [scriptPath, command];
    let useStdin = options.useStdin || false;
    let stdinPayload = null;
    if (useStdin) {
      pythonArgs.push('--stdin');
      if (command === 'register') {
        // args: [userId, image]
        stdinPayload = JSON.stringify({ userId: args[0], image: args[1] });
      } else if (command === 'recognize') {
        // args: [image]
        stdinPayload = JSON.stringify({ image: args[0] });
      } else if (command === 'embed') {
        // args: [image]
        stdinPayload = JSON.stringify({ image: args[0] });
      }
    } else {
      pythonArgs = [scriptPath, command, ...args];
    }
    const pythonProcess = spawn(pythonBin, pythonArgs, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });
    let output = '';
    let errorOutput = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Find the last line that looks like JSON
          const lines = output.trim().split('\n');
          const lastJsonLine = lines.reverse().find(line => line.trim().startsWith('{') && line.trim().endsWith('}'));
          if (!lastJsonLine) {
            reject(new Error(`No JSON output from Python script: ${output}`));
          } else {
            const result = JSON.parse(lastJsonLine);
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        const msg = [
          `Python script failed (exit ${code})`,
          `pythonBin=${pythonBin}`,
          `script=${scriptPath}`,
          `command=${command}`,
          `stderr=${(errorOutput || '').slice(0, 4000)}`,
          `stdout=${(output || '').slice(0, 4000)}`,
        ].join(' | ');
        reject(new Error(msg));
      }
    });
    pythonProcess.on('error', (err) => {
      const msg = [
        `Failed to start Python process: ${err.message}`,
        `pythonBin=${pythonBin}`,
        `script=${scriptPath}`,
        `command=${command}`,
      ].join(' | ');
      reject(new Error(msg));
    });
    // Write to stdin if needed
    if (useStdin && stdinPayload) {
      pythonProcess.stdin.write(stdinPayload);
      pythonProcess.stdin.end();
    }
  });
};

const cosineDistance = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return Number.POSITIVE_INFINITY;
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    const ai = Number(a[i]) || 0;
    const bi = Number(b[i]) || 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return Number.POSITIVE_INFINITY;
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb));
  // Convert similarity to distance
  return 1 - cos;
};

const dayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const canActForUser = (reqUser, targetUserId) => {
  if (!reqUser?._id) return false;
  if (reqUser.role === 'manager') return true;
  return String(reqUser._id) === String(targetUserId);
};

// Register face for a user
export const registerFace = async (req, res) => {
  try {
    const { userId } = req.params;
    const { image } = req.body; // base64 image data
    
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canActForUser(req.user, userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!user.restaurant) {
      return res.status(400).json({ error: 'User is not linked to a restaurant' });
    }

    // Managers can only register faces for staff in their restaurant
    if (req.user.role === 'manager' && String(req.user.restaurant) !== String(user.restaurant)) {
      return res.status(403).json({ error: 'User does not belong to your restaurant' });
    }
    
    // Call Python script to create an embedding (no raw images stored)
    const embedResult = await runPythonScript('embed', [image], { useStdin: true });

    if (!embedResult.success || !Array.isArray(embedResult.embedding)) {
      return res.status(400).json({ error: embedResult.error || 'Failed to create face embedding' });
    }

    await FaceEmbedding.findOneAndUpdate(
      { user: user._id, restaurant: user.restaurant },
      { embedding: embedResult.embedding, modelName: embedResult.model || 'VGG-Face' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Face embedding registered successfully',
      userId,
      restaurantId: String(user.restaurant),
      model: embedResult.model || 'VGG-Face',
    });
    
  } catch (error) {
    console.error('Face registration error:', error);
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    res.status(500).json({
      error: 'Failed to register face',
      ...(isProd ? {} : { details: error?.message || String(error) }),
    });
  }
};

// Clock in with face recognition
export const clockIn = async (req, res) => {
  try {
    const { image, userId: bodyUserId, managerPin } = req.body;
    const { restaurantId } = req.params;

    const effectiveRestaurantId = String(restaurantId);

    // Basic restaurant access guard
    if (!req.user?.restaurant || String(req.user.restaurant) !== effectiveRestaurantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Identify which user to mark attendance for.
    // - If managerPin is provided: must also provide userId (explicit approval)
    // - If userId is provided: verify face against that user's embedding
    // - If userId is NOT provided and image is provided: identify best match from restaurant embeddings
    let targetUserId = bodyUserId ? String(bodyUserId) : null;
    let liveEmbedding = null;
    
    const startedAt = Date.now();

    if (managerPin) {
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required when using managerPin' });
      }
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Manager PIN fallback requires manager role' });
      }
      const manager = await User.findById(req.user._id).select('+pinHash');
      if (!manager?.pinHash) {
        return res.status(400).json({ error: 'Manager PIN not set' });
      }
      const ok = await manager.comparePin(managerPin);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid manager PIN' });
      }
    } else {
      if (!image) {
        return res.status(400).json({ error: 'Provide either image (face) or managerPin' });
      }

      const embedResult = await runPythonScript('embed', [image], { useStdin: true });
      if (!embedResult.success || !Array.isArray(embedResult.embedding)) {
        return res.status(400).json({ error: embedResult.error || 'Failed to create face embedding' });
      }
      liveEmbedding = embedResult.embedding;

      if (!targetUserId) {
        // Identify best match within this restaurant
        const profiles = await FaceEmbedding.find({ restaurant: effectiveRestaurantId }).select('user embedding');
        if (!profiles.length) {
          return res.status(400).json({ error: 'No registered faces for this restaurant' });
        }

        let best = { userId: null, distance: Number.POSITIVE_INFINITY };
        for (const p of profiles) {
          const d = cosineDistance(liveEmbedding, p.embedding);
          if (d < best.distance) best = { userId: String(p.user), distance: d };
        }
        const threshold = Number(process.env.FACE_COSINE_DISTANCE_THRESHOLD ?? 0.45);
        if (!(best.distance <= threshold)) {
          return res.status(400).json({ error: 'Face not recognized', code: 'FACE_NO_MATCH', distance: best.distance, threshold });
        }
        targetUserId = best.userId;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!canActForUser(req.user, targetUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify user exists and belongs to restaurant
    const user = await User.findById(targetUserId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.restaurant || user.restaurant._id.toString() !== effectiveRestaurantId) {
      return res.status(403).json({ error: 'User does not belong to this restaurant' });
    }

    // If we're using face (not PIN) and userId was specified, verify face matches that specific user
    if (!managerPin && bodyUserId) {
      const profile = await FaceEmbedding.findOne({ user: user._id, restaurant: effectiveRestaurantId });
      if (!profile) {
        return res.status(400).json({ error: 'Face not registered for this user' });
      }
      const distance = cosineDistance(liveEmbedding, profile.embedding);
      const threshold = Number(process.env.FACE_COSINE_DISTANCE_THRESHOLD ?? 0.45);
      if (!(distance <= threshold)) {
        return res.status(400).json({ error: 'Face verification failed', code: 'FACE_MISMATCH', distance, threshold });
      }
    }
    
    // Check if already clocked in today
    const { start: today, end: tomorrow } = dayRange(new Date());
    
    const existingAttendance = await Attendance.findOne({
      user: user._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (existingAttendance && existingAttendance.clockIn.time) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }
    
    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      attendance = existingAttendance;
    } else {
      attendance = new Attendance({
        user: user._id,
        restaurant: effectiveRestaurantId,
        date: new Date()
      });
    }

    if (managerPin) {
      attendance.clockIn = {
        time: new Date(),
        method: 'pin',
      };
    } else {
      // confidence: if we identified by matching all profiles, confidence is derived from best distance
      // if we verified against a known user profile, it is also derived from that distance.
      // We don't store the raw image.
      const profile = await FaceEmbedding.findOne({ user: user._id, restaurant: effectiveRestaurantId });
      if (!profile) {
        return res.status(400).json({ error: 'Face not registered for this user' });
      }
      const distance = cosineDistance(liveEmbedding, profile.embedding);
      const confidence = Math.max(0, Math.min(1, 1 - distance));
      attendance.clockIn = {
        time: new Date(),
        method: 'face',
        confidence,
      };
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Clock in successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      },
      method: attendance.clockIn.method,
      confidence: attendance.clockIn.confidence,
      clockInTime: attendance.clockIn.time,
      durationMs: Date.now() - startedAt,
    });
    
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Failed to clock in' });
  }
};

// Clock out with face recognition
export const clockOut = async (req, res) => {
  try {
    const { image, userId: bodyUserId, managerPin } = req.body;
    const { restaurantId } = req.params;

    const effectiveRestaurantId = String(restaurantId);

    // Basic restaurant access guard
    if (!req.user?.restaurant || String(req.user.restaurant) !== effectiveRestaurantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let targetUserId = bodyUserId ? String(bodyUserId) : null;
    let liveEmbedding = null;
    
    // Verify user exists and belongs to restaurant
    const startedAt = Date.now();

    if (managerPin) {
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required when using managerPin' });
      }
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Manager PIN fallback requires manager role' });
      }
      const manager = await User.findById(req.user._id).select('+pinHash');
      if (!manager?.pinHash) {
        return res.status(400).json({ error: 'Manager PIN not set' });
      }
      const ok = await manager.comparePin(managerPin);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid manager PIN' });
      }
    } else {
      if (!image) {
        return res.status(400).json({ error: 'Provide either image (face) or managerPin' });
      }

      const embedResult = await runPythonScript('embed', [image], { useStdin: true });
      if (!embedResult.success || !Array.isArray(embedResult.embedding)) {
        return res.status(400).json({ error: embedResult.error || 'Failed to create face embedding' });
      }
      liveEmbedding = embedResult.embedding;

      if (!targetUserId) {
        const profiles = await FaceEmbedding.find({ restaurant: effectiveRestaurantId }).select('user embedding');
        if (!profiles.length) {
          return res.status(400).json({ error: 'No registered faces for this restaurant' });
        }

        let best = { userId: null, distance: Number.POSITIVE_INFINITY };
        for (const p of profiles) {
          const d = cosineDistance(liveEmbedding, p.embedding);
          if (d < best.distance) best = { userId: String(p.user), distance: d };
        }
        const threshold = Number(process.env.FACE_COSINE_DISTANCE_THRESHOLD ?? 0.45);
        if (!(best.distance <= threshold)) {
          return res.status(400).json({ error: 'Face not recognized', code: 'FACE_NO_MATCH', distance: best.distance, threshold });
        }
        targetUserId = best.userId;
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!canActForUser(req.user, targetUserId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findById(targetUserId).populate('restaurant');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.restaurant || user.restaurant._id.toString() !== effectiveRestaurantId) {
      return res.status(403).json({ error: 'User does not belong to this restaurant' });
    }

    if (!managerPin && bodyUserId) {
      const profile = await FaceEmbedding.findOne({ user: user._id, restaurant: effectiveRestaurantId });
      if (!profile) {
        return res.status(400).json({ error: 'Face not registered for this user' });
      }
      const distance = cosineDistance(liveEmbedding, profile.embedding);
      const threshold = Number(process.env.FACE_COSINE_DISTANCE_THRESHOLD ?? 0.45);
      if (!(distance <= threshold)) {
        return res.status(400).json({ error: 'Face verification failed', code: 'FACE_MISMATCH', distance, threshold });
      }
    }
    
    // Find today's attendance record
    const { start: today, end: tomorrow } = dayRange(new Date());
    
    const attendance = await Attendance.findOne({
      user: user._id,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!attendance || !attendance.clockIn.time) {
      return res.status(400).json({ error: 'No clock in record found for today' });
    }
    
    if (attendance.clockOut && attendance.clockOut.time) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }
    
    if (managerPin) {
      attendance.clockOut = {
        time: new Date(),
        method: 'pin',
      };
    } else {
      const profile = await FaceEmbedding.findOne({ user: user._id, restaurant: effectiveRestaurantId });
      if (!profile) {
        return res.status(400).json({ error: 'Face not registered for this user' });
      }
      const distance = cosineDistance(liveEmbedding, profile.embedding);
      const confidence = Math.max(0, Math.min(1, 1 - distance));
      attendance.clockOut = {
        time: new Date(),
        method: 'face',
        confidence,
      };
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Clock out successful',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      },
      method: attendance.clockOut.method,
      confidence: attendance.clockOut.confidence,
      clockOutTime: attendance.clockOut.time,
      workingHours: attendance.workingHours,
      durationMs: Date.now() - startedAt,
    });
    
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Failed to clock out' });
  }
};

// Get attendance records for a restaurant
export const getAttendanceRecords = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, userId } = req.query;
    
    let query = { restaurant: restaurantId };
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDate };
    }
    
    if (userId) {
      query.user = userId;
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('user', 'name role')
      .sort({ date: -1, 'clockIn.time': -1 });
    
    res.json({
      success: true,
      records: attendanceRecords
    });
    
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
};

// Get attendance summary for a restaurant
export const getAttendanceSummary = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;
    
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const attendanceRecords = await Attendance.find({
      restaurant: restaurantId,
      date: { $gte: queryDate, $lt: nextDate }
    }).populate('user', 'name role');
    
    const summary = {
      totalStaff: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.clockIn && r.clockIn.time).length,
      absent: attendanceRecords.filter(r => !r.clockIn || !r.clockIn.time).length,
      clockedOut: attendanceRecords.filter(r => r.clockOut && r.clockOut.time).length,
      stillWorking: attendanceRecords.filter(r => r.clockIn && r.clockIn.time && (!r.clockOut || !r.clockOut.time)).length,
      totalWorkingHours: attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0)
    };
    
    res.json({
      success: true,
      summary,
      records: attendanceRecords
    });
    
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({ error: 'Failed to get attendance summary' });
  }
};

// Delete registered face
export const deleteFace = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!canActForUser(req.user, userId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await FaceEmbedding.deleteOne({ user: user._id, restaurant: user.restaurant });

    res.json({
      success: true,
      message: 'Face embedding deleted successfully',
      userId,
    });
    
  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({ error: 'Failed to delete face' });
  }
};

// List registered faces
export const listFaces = async (req, res) => {
  try {
    // Managers can list embeddings for their restaurant; others list only themselves
    if (req.user.role === 'manager') {
      const faces = await FaceEmbedding.find({ restaurant: req.user.restaurant })
        .select('user restaurant modelName createdAt updatedAt')
        .populate('user', 'name role')
        .sort({ updatedAt: -1 });
      return res.json({ success: true, faces });
    }

    const face = await FaceEmbedding.findOne({ restaurant: req.user.restaurant, user: req.user._id })
      .select('user restaurant modelName createdAt updatedAt');
    return res.json({ success: true, faces: face ? [face] : [] });
    
  } catch (error) {
    console.error('List faces error:', error);
    res.status(500).json({ error: 'Failed to list faces' });
  }
}; 