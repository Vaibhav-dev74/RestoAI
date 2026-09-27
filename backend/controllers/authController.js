import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Utility to sign JWT
const signToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

// Utility to debug password hashing
const debugPassword = async (plainPassword, hashedPassword) => {
  console.log('Debug password comparison:');
  console.log('Plain password length:', plainPassword.length);
  console.log('Hashed password length:', hashedPassword.length);
  console.log('Hashed password starts with:', hashedPassword.substring(0, 10));
  
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  console.log('bcrypt.compare result:', isMatch);
  
  return isMatch;
};

// In-memory store for OTPs and pending users
const otpStore = {};

// Email transporter setup (use the working method, but keep ES module syntax)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Manager Registration
 * Creates a user + their restaurant in one flow
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, restaurantName, phone, addresses } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Required fields: name, email, password, role',
      });
    }

    if (!['manager', 'waiter', 'vendor', 'kitchen', 'customer'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be "manager", "waiter", "vendor", "kitchen", or "customer"',
      });
    }

    // Additional validation for customers
    if (role === 'customer') {
      // Phone is optional but if provided, validate it
      if (phone && phone.trim() === '') {
        return res.status(400).json({ error: 'Phone number cannot be empty if provided' });
      }
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Check for existing phone if provided
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already in use' });
      }
    }

    // Create base user with all fields
    const userData = {
      name,
      email,
      password, // Plain password - will be hashed by pre-save hook
      role,
      restaurant: null,
    };

    // Add customer-specific fields
    if (role === 'customer') {
      userData.phone = phone || null;
      userData.addresses = Array.isArray(addresses) ? addresses : [];
    }

    const user = new User(userData);

    // Save early to get user._id
    await user.save();

    // If manager, create restaurant and update user
    if (role === 'manager') {
      if (!restaurantName) {
        return res.status(400).json({ error: 'restaurantName is required for managers' });
      }

      const restaurant = new Restaurant({
        name: restaurantName,
        createdBy: user._id,
      });

      await restaurant.save();

      user.restaurant = restaurant._id;
      await user.save();
    }

    // Generate JWT
    const token = signToken({ userId: user._id, role: user.role });

    // Fetch the complete user data with populated fields
    const populatedUser = await User.findById(user._id)
      .select('-password') // Exclude password from response
      .populate('restaurant', 'name');

    // Prepare response based on role
    const responseData = {
      token,
      role: user.role,
      restaurantId: user.restaurant || null,
      message: `${role} registered successfully`,
      user: populatedUser // Include full user data in response
    };

    // For customers, include additional fields
    if (role === 'customer') {
      responseData.user = {
        ...populatedUser.toObject(),
        phone: user.phone,
        addresses: user.addresses
      };
    }

    console.log(`✅ ${role} registered successfully:`, {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json(responseData);
    
  } catch (err) {
    console.error('Registration Error:', err);
    
    // Handle duplicate key errors specifically
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists. Please use a different ${field}.` 
      });
    }
    
    res.status(500).json({ error: 'User registration failed: ' + err.message });
  }
};
/**
 * Login (shared by managers, waiters, etc.)
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('restaurant', 'name');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', { 
      id: user._id, 
      role: user.role, 
      hasPassword: !!user.password 
    });

    // Simple password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', user._id);
      return res.status(400).json({ error: 'Wrong password' });
    }

    const token = signToken({ userId: user._id, role: user.role });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('Login successful for user:', user._id);

    res.json({ 
      token, 
      user: userResponse // Return full user data
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Manager → Generate QR code for waiter to join
 * Returns: token embedded with user ID (24h expiry)
 */
export const generateQRCode = async (req, res) => {
  try {
    // Fetch manager by ID from the authenticated request
    const manager = await User.findById(req.user._id);
    
    // Ensure the user is authorized as a manager
    if (!manager || manager.role !== 'manager') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Sign a JWT token valid for 24 hours
    const qrToken = signToken({ userId: req.user._id }, '24h');

    // Compose the QR join link
    const clientBaseURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const qrData = `${clientBaseURL}/join?token=${qrToken}&rid=${manager.restaurant}`;

    // Return the link as JSON
    return res.status(200).json({ qrData });
  } catch (err) {
    console.error('QR Generation Error:', err);
    return res.status(500).json({ error: 'QR generation failed' });
  }
};

/**
 * Waiter Auto-Join via scanned QR code
 */
export const joinRestaurant = async (req, res) => {
  try {
    const { rid: restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Missing restaurant ID' });
    }

    // Get waiter's token from headers
    const waiterToken = req.headers.authorization?.split(' ')[1];
    if (!waiterToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Decode waiter's token
    const decoded = jwt.verify(waiterToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if user is a waiter or kitchen
    if (user.role !== 'waiter' && user.role !== 'kitchen') {
      return res.status(403).json({ error: 'Only waiters or kitchen staff can join restaurants' });
    }

    // Check if already linked to a restaurant
    if (user.restaurant && user.restaurant.toString() !== restaurantId) {
      return res.status(409).json({ error: 'Already linked to a different restaurant' });
    }
    
    console.log('Debug - User.restaurant before join:', user.restaurant);
    console.log('Debug - restaurantId from link:', restaurantId);
    
    // Set restaurant
    user.restaurant = restaurantId;

    await user.save();

    // Fetch updated user data with populated restaurant
    const updatedUser = await User.findById(userId).populate('restaurant', 'name');

    return res.json({ 
      success: true, 
      restaurantId,
      user: updatedUser 
    });
  } catch (err) {
    console.error('Join Error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// controllers/userController.js

// Get logged-in user (include restaurant details)
// controllers/auth.js
export const getUser = async (req, res) => {
  try {
    // 🛠️ FIX: Make sure to populate the restaurant (just like this)
    const user = await User.findById(req.user._id).populate('restaurant', 'name');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

// controllers/userController.js

export const getUsers = async (req, res) => {
  try {
    const { role, restaurantId } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (restaurantId) filter.restaurant = restaurantId;

    // Scope managers to their own restaurant by default
    if (req.user?.role === 'manager') {
      const myRestaurant = req.user?.restaurant;
      if (myRestaurant) {
        // If a restaurantId is provided but doesn't match manager's restaurant, block
        if (restaurantId && String(restaurantId) !== String(myRestaurant)) {
          return res.status(403).json({ error: 'Not authorized to view users for this restaurant' });
        }
        filter.restaurant = myRestaurant;
      }
    }

    const users = await User.find(filter).select('-password').populate('restaurant', 'name');
    res.json(users);
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const initiateRegisterWithEmailOtp = async (req, res) => {
  try {
    const { email, ...userData } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check if Email configuration exists in your backend .env file!
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Missing EMAIL_USER or EMAIL_PASS in backend .env file');
      return res.status(500).json({ 
        success: false, 
        error: 'Email configuration is missing on the server. Added EMAIL_USER and EMAIL_PASS to backend .env' 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${email}:`, otp);
    
    // Store OTP and user data (expires in 5 minutes)
    otpStore[email] = { 
      otp, 
      userData, 
      expires: Date.now() + 5 * 60 * 1000 
    };
    
    // Email content (for when email is properly configured)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Registration OTP - Restaurant Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5; text-align: center;">🍽️ Restaurant Management System</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-bottom: 15px;">Your Registration OTP</h3>
            <p style="color: #6b7280; margin-bottom: 20px;">Please use the following 6-digit code to complete your registration:</p>
            <div style="background: #4f46e5; color: white; padding: 15px; border-radius: 6px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `
    };
    
    // Attempt sending 
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', email);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to your email successfully'
    });
    
  } catch (err) {
    console.error('Email OTP Error:', err);
    res.status(500).json({ 
      success: false,
      error: `Failed to send OTP email: ${err.message}` 
    });
  }
};

export const verifyEmailOtpAndRegisterUser = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const record = otpStore[email];
    
    if (!record) {
      return res.status(400).json({ error: 'No OTP request found for this email' });
    }
    
    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }
    
    // OTP is valid, now create the user
    const { name, email: userEmail, password, role, restaurantName, phone, addresses } = record.userData;
    
    // Use the email from the request body since userData has it as 'email' not nested
    const finalEmail = userEmail || email;
    
    // Check for existing user
    const existingUser = await User.findOne({ email: finalEmail });
    if (existingUser) {
      delete otpStore[email];
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create user with all fields
    const user = new User({
      name: name,
      email: finalEmail,
      password: password, // Will be hashed by pre-save hook
      role: role,
      phone: phone,
      restaurant: null,
      addresses: addresses || []
    });

    await user.save();

    // If manager, create restaurant
    if (role === 'manager' && restaurantName) {
      const restaurant = new Restaurant({
        name: restaurantName,
        createdBy: user._id,
      });
      await restaurant.save();
      user.restaurant = restaurant._id;
      await user.save();
    }

    // Clean up OTP
    delete otpStore[email];

    // Generate JWT
    const token = signToken({ userId: user._id, role: user.role });

    res.status(201).json({
      success: true,
      token,
      role: user.role,
      restaurantId: user.restaurant || null,
      message: `${role} registered successfully`,
    });
    
  } catch (err) {
    console.error('Email OTP Verification Error:', err);
    res.status(500).json({ error: 'OTP verification failed', details: err.message });
  }
};

// In authController.js
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Authorization: user can view their own profile; managers can view users in their restaurant
    const requesterId = req.user?._id;
    const requesterRole = req.user?.role;
    const requesterRestaurant = req.user?.restaurant;

    if (!requesterId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(id).select('-password').populate('restaurant');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSelf = String(user._id) === String(requesterId);
    const isManagerSameRestaurant =
      requesterRole === 'manager' &&
      requesterRestaurant &&
      user.restaurant &&
      String(user.restaurant?._id || user.restaurant) === String(requesterRestaurant);

    if (!isSelf && !isManagerSameRestaurant) {
      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Ensure the logged-in user can only update their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      phone, 
      addresses, // Expecting an array of addresses for customers
      location,  // Expecting a location object for managers
      restaurant: restaurantName // Renamed for clarity
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Authorization check: User can only update their own profile
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }

    // Update basic user fields
    user.name = name || user.name;
    user.phone = phone || user.phone;

    // Handle address updates specifically for customers
    if (user.role === 'customer' && Array.isArray(addresses)) {
      user.addresses = addresses;
    }

    // Handle restaurant-specific updates only for managers
    if (user.role === 'manager' && user.restaurant) {
      const restaurantDoc = await Restaurant.findById(user.restaurant);
      if (restaurantDoc) {
        // Update restaurant name if provided
        if (restaurantName) {
          restaurantDoc.name = restaurantName;
        }
        
        // Update restaurant location if provided
        if (location) {
          restaurantDoc.location = {
            ...(restaurantDoc.location || {}),
            ...location
          };
        }
        
        await restaurantDoc.save();
      }
    }

    // Save the updated user
    await user.save();

    // Return updated user with populated data
    const updatedUser = await User.findById(id).populate('restaurant');
    res.json(updatedUser);
    
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Set (or reset) the current manager's PIN.
 * Stores only a bcrypt hash.
 */
export const setMyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Only managers can set a manager PIN' });
    }

    if (pin === undefined || pin === null) {
      return res.status(400).json({ error: 'pin is required' });
    }

    const pinStr = String(pin).trim();
    if (pinStr.length < 4 || pinStr.length > 12) {
      return res.status(400).json({ error: 'PIN must be 4 to 12 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(pinStr, salt);

    await User.findByIdAndUpdate(req.user._id, { pinHash }, { new: false });

    return res.json({ success: true, message: 'Manager PIN updated' });
  } catch (err) {
    console.error('Set PIN error:', err);
    return res.status(500).json({ error: 'Failed to set PIN' });
  }
};