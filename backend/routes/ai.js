import express from 'express';
import {
  getUpsellSuggestions,
  analyzePlate,
  predictCrowd,
  adjustMenuPrices,
  handleVoiceOrder,
  customerallergy,
  createSchedule
} from '../controllers/aiController.js';
import { 
  inventoryWasteAlert, 
  salesProfitAdvisor, 
  slowHourAnalyzer, 
  smartLeftoverReuse,
  analyzeWasteAndAdvice
} from '../services/geminiService.js';
import authMiddleware from '../middleware/auth.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';

const router = express.Router();

router.use(redisAutoInvalidate());

// AI upsell suggestions
router.get('/upsell', authMiddleware, redisCache({ ttlSeconds: 30, scope: 'user' }), getUpsellSuggestions);

// AI plate analysis
router.post('/plate', authMiddleware, analyzePlate);

// AI crowd prediction
router.get('/crowd', authMiddleware, redisCache({ ttlSeconds: 30, scope: 'user' }), predictCrowd);

// Adjust menu prices
router.post('/adjust-prices', authMiddleware, adjustMenuPrices);

// Voice order processing
router.post('/voice-order', handleVoiceOrder);

// Inventory waste alerts
router.post('/inventory-waste-alert', authMiddleware, inventoryWasteAlert);

// Customer allergy analysis
router.post('/allergy', authMiddleware, customerallergy);

// Smart leftover reuse
router.post('/smartwaste', authMiddleware, smartLeftoverReuse);

// Slow hour analyzer
router.post('/slowhour', authMiddleware, slowHourAnalyzer);

// Sales profit advisor - Both routes for compatibility
router.post('/sales-profit-advisor', authMiddleware, salesProfitAdvisor);
router.post('/salesprofit', authMiddleware, salesProfitAdvisor);

// Waste analysis - Direct route
router.post('/waste-analysis', authMiddleware, analyzeWasteAndAdvice);

// Schedule creation
router.post('/schedule', authMiddleware, createSchedule);

export default router;