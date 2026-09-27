import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  registerFace,
  clockIn,
  clockOut,
  getAttendanceRecords,
  getAttendanceSummary,
  deleteFace,
  listFaces
} from '../controllers/attendanceController.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

router.use(redisAutoInvalidate());

// Face registration (for waiters to register their face)
router.post('/faces/:userId', authMiddleware, registerFace);

// Clock in with face recognition
router.post('/clock-in/:restaurantId', authMiddleware, clockIn);

// Clock out with face recognition
router.post('/clock-out/:restaurantId', authMiddleware, clockOut);

// Get attendance records for a restaurant
router.get('/records/:restaurantId', authMiddleware, redisCache({ ttlSeconds: 20, scope: 'user' }), getAttendanceRecords);

// Get attendance summary for a restaurant
router.get('/summary/:restaurantId', authMiddleware, redisCache({ ttlSeconds: 20, scope: 'user' }), getAttendanceSummary);

// Delete registered face
router.delete('/faces/:userId', authMiddleware, deleteFace);

// List registered faces
router.get('/faces', authMiddleware, redisCache({ ttlSeconds: 30, scope: 'user' }), listFaces);

export default router; 