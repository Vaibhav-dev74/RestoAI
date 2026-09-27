import express from 'express';
import {
  loginUser,
  generateQRCode,
  getUser,
  getUsers,
  joinRestaurant,
  registerUser,
  initiateRegisterWithEmailOtp,
  verifyEmailOtpAndRegisterUser,
  getUserById,
  updateUser,
  setMyPin
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

router.use(redisAutoInvalidate());

// Manager registration
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// QR code generation for linking waiters
router.get('/generate-qr', authMiddleware, redisCache({ ttlSeconds: 5, scope: 'user' }), generateQRCode);

// Auto-join via QR code
router.get('/join', joinRestaurant);

// Cache user profile reads briefly (user-scoped)
router.get('/me', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), getUser);

// Manager PIN for attendance fallback
router.put('/me/pin', authMiddleware, requireRole('manager'), setMyPin);

router.get('/', authMiddleware, requireRole('manager'), redisCache({ ttlSeconds: 10, scope: 'user' }), getUsers);

// Email OTP registration endpoints
router.post('/register/initiate-email', initiateRegisterWithEmailOtp);
router.post('/register/verify-email-otp', verifyEmailOtpAndRegisterUser);

router.get('/:id', authMiddleware, redisCache({ ttlSeconds: 10, scope: 'user' }), getUserById);
router.patch('/:id', authMiddleware, updateUser); // Use updateUser here

router.post('/whatsapp-login', async (req, res) => {
  const { phone } = req.body;
  console.log('Received whatsapp-login request for phone:', phone); // Debug log
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const user = await User.findOne({ phone });
  if (!user) {
    console.log('User not found for phone:', phone); // Debug log
    return res.status(404).json({ error: 'User not found' });
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// PATCH /api/restaurant/:id/staff-hours
// Update staff working hours for waiter and chef
router.patch('/restaurant/:id/staff-hours', async (req, res) => {
  try {
    const { id } = req.params;
    const { staffHours } = req.body;
    if (!staffHours) return res.status(400).json({ error: 'Missing staffHours' });
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    restaurant.staffHours = staffHours;
    await restaurant.save();
    res.json({ message: 'Staff hours updated', staffHours: restaurant.staffHours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
