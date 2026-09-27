import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const API = process.env.SMOKE_API_URL || 'http://localhost:4000';

const unique = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const withRetry = async (fn, { attempts = 10, delayMs = 400 } = {}) => {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = err?.code;
      const isConnRefused = code === 'ECONNREFUSED' || code === 'ECONNRESET';
      if (!isConnRefused || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
};

async function main() {
  const runId = unique();
  const managerEmail = `smoke_manager_${runId}@example.com`;
  const staffEmail = `smoke_staff_${runId}@example.com`;
  const password = 'SmokeTest!123';
  const pin = '1234';

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in backend/.env to run this smoke test');
  }

  await mongoose.connect(process.env.MONGO_URI);

  let restaurant;
  let manager;
  let staff;

  try {
    // Create manager + restaurant (mimic auth/register behavior)
    manager = await User.create({
      name: 'Smoke Manager',
      email: managerEmail,
      password,
      role: 'manager',
      restaurant: null,
    });

    restaurant = await Restaurant.create({
      name: `Smoke Resto ${runId}`,
      createdBy: manager._id,
      tables: [
        {
          tableId: `smoke_${runId}`,
          tableNumber: 'SMOKE-1',
          seats: 1,
          position: { x: 0, y: 0 },
        },
      ],
    });

    manager.restaurant = restaurant._id;
    await manager.save();

    staff = await User.create({
      name: 'Smoke Staff',
      email: staffEmail,
      password,
      role: 'waiter',
      restaurant: restaurant._id,
    });

    // Login to get JWT
    const loginRes = await withRetry(() => axios.post(`${API}/api/auth/login`, {
      email: managerEmail,
      password,
    }));
    const token = loginRes.data?.token;
    if (!token) throw new Error('Login did not return token');

    const headers = { Authorization: `Bearer ${token}` };

    // Set manager PIN
    await withRetry(() => axios.put(
      `${API}/api/auth/me/pin`,
      { pin },
      { headers }
    ));

    // Clock-in staff using manager PIN fallback
    const clockInRes = await withRetry(() => axios.post(
      `${API}/api/attendance/clock-in/${restaurant._id}`,
      { userId: String(staff._id), managerPin: pin },
      { headers }
    ));

    if (!clockInRes.data?.success) throw new Error('Clock-in failed');
    if (clockInRes.data?.method !== 'pin') throw new Error(`Expected method=pin, got ${clockInRes.data?.method}`);

    // Clock-out staff using manager PIN fallback
    const clockOutRes = await withRetry(() => axios.post(
      `${API}/api/attendance/clock-out/${restaurant._id}`,
      { userId: String(staff._id), managerPin: pin },
      { headers }
    ));

    if (!clockOutRes.data?.success) throw new Error('Clock-out failed');
    if (clockOutRes.data?.method !== 'pin') throw new Error(`Expected method=pin, got ${clockOutRes.data?.method}`);

    // Fetch records for today
    const recordsRes = await withRetry(() => axios.get(
      `${API}/api/attendance/records/${restaurant._id}`,
      { headers }
    ));
    if (!recordsRes.data?.success) throw new Error('Fetch records failed');

    console.log('✅ SMOKE TEST PASS: Manager PIN fallback clock-in/out works');
    console.log('restaurantId:', String(restaurant._id));
    console.log('staffId:', String(staff._id));
  } finally {
    // Cleanup created records
    try {
      if (restaurant?._id) {
        await Attendance.deleteMany({ restaurant: restaurant._id });
        await User.deleteMany({ restaurant: restaurant._id });
        await Restaurant.deleteOne({ _id: restaurant._id });
      }
      if (manager?._id) {
        await User.deleteOne({ _id: manager._id });
      }
    } catch {
      // ignore cleanup failures
    }
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ SMOKE TEST FAIL:', err?.response?.data || err?.message || err);
  process.exit(1);
});
