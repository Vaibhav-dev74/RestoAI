import Order from '../models/Order.js';
import {
  generateUpsellSuggestions,
  generateSchedule,
  optimizePricing,
  processVoiceOrder,
  processCustomerInput
} from '../services/geminiService.js';
import Inventory from '../models/Inventory.js';
import { analyzePlateImage } from '../services/visionService.js';
import fetch from 'node-fetch';

/**
 * AI Upsell Coach
 * Recommends upsell items based on recent orders.
 */
export const getUpsellSuggestions = async (req, res) => {
  try {
    const orders = await Order.find().limit(100).sort({ createdAt: -1 });
    const suggestion = await generateUpsellSuggestions(orders);
    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * AI Plate Analyzer
 * Analyzes plate images to detect food waste.
 * Expects Base64 image in req.body.imageBase64
 */
export const analyzePlate = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const result = await analyzePlateImage(imageBase64);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * AI Crowd Predictor (dummy version unless tied to times/sales)
 * Could be extended with sales data, bookings, weather, etc.
 */




// Shared crowd forecast logic
const getCrowdForecast = async () => {
  const lat = 19.0760; // Mumbai
  const lon = 72.8777;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
  );

  if (!weatherRes.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const weatherData = await weatherRes.json();
  const condition = weatherData.weather[0].main.toLowerCase();

  let forecast;
  if (condition.includes('rain')) {
    forecast = { morning: 'low', lunch: 'medium', evening: 'low' };
  } else if (condition.includes('clear')) {
    forecast = { morning: 'medium', lunch: 'high', evening: 'very high' };
  } else if (condition.includes('cloud')) {
    forecast = { morning: 'medium', lunch: 'medium', evening: 'medium' };
  } else {
    forecast = { morning: 'medium', lunch: 'medium', evening: 'medium' };
  }

  return {
    date: new Date().toDateString(),
    weather: condition,
    forecast,
  };
};

export const predictCrowd = async (req, res) => {
  try {
    const result = await getCrowdForecast();
    res.json(result);
  } catch (err) {
    console.error('Crowd prediction failed:', err.message);
    res.status(500).json({ error: 'Failed to predict crowd' });
  }
};

const menu = [
  { id: 1, name: "Spicy Chicken Noodles", tags: ["spicy", "chicken"] },
  { id: 2, name: "Light Veggie Salad", tags: ["light", "vegetarian"] },
  { id: 3, name: "Peanut Butter Sandwich", tags: ["nuts", "vegetarian"] },
  { id: 4, name: "Mild Curry with Rice", tags: ["mild", "rice"] }
];

const inventory = [
  { name: "chicken", quantity: 20, expiryDays: 3 },
  { name: "lettuce", quantity: 15, expiryDays: 1 },
  { name: "peanuts", quantity: 0, expiryDays: 0 },
  { name: "rice", quantity: 50, expiryDays: 5 }
];
export const customerallergy = async (req, res) => {
  const { customerInput } = req.body;

  if (!customerInput || typeof customerInput !== 'string') {
    return res.status(400).json({ error: "customerInput (string) is required" });
  }

  try {
    const result = await processCustomerInput(customerInput, menu, inventory);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * AI Dynamic Pricing
 * Adjusts pricing based on demand
 */
export const adjustMenuPrices = async (req, res) => {
  try {
    const { menu } = req.body;

    const { forecast, weather } = await getCrowdForecast();

    const currentHour = new Date().getHours();
    const timeSlot =
      currentHour < 11 ? 'morning' : currentHour < 16 ? 'lunch' : 'evening';

    const demandLevel = forecast[timeSlot];

    const demandFactorMap = {
      low: 0.9,
      medium: 1.0,
      high: 1.2,
      'very high': 1.4,
    };

    const demandFactor = demandFactorMap[demandLevel] || 1.0;

    const updatedMenu = await optimizePricing(menu, demandFactor);

    res.json({
      updatedMenu,
      demandFactor,
      demandLevel,
      timeSlot,
      weather,
    });
  } catch (err) {
    console.error('Price adjustment failed:', err.message);
    res.status(500).json({ error: 'Failed to adjust prices' });
  }
};

/**
 * AI Staff Scheduler
 * Recommends optimized shift plan
 */
export const createSchedule = async (req, res) => {
  try {
    const data = req.body;
    const schedule = await generateSchedule(data);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * AI Voice Order Processor
 * Converts voice text to structured order
 */
export const handleVoiceOrder = async (req, res) => {
  try {
    const { voiceText } = req.body;

    if (!voiceText) {
      return res.status(400).json({ error: 'voiceText is required' });
    }

    const structuredOrder = await processVoiceOrder(voiceText);
    res.json(structuredOrder);
  } catch (err) {
    console.error('Voice order processing error:', err.message);
    res.status(500).json({ error: 'Failed to process voice order' });
  }
};
