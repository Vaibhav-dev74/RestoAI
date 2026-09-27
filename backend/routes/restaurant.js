import express from 'express';
import {
  listRestaurants,
  getRestaurantDetails,
  findNearbyRestaurants,
  searchRestaurants,
  getRestaurantMenu,
  filterByCuisine,
  getPopularRestaurants
} from '../controllers/restaurantController.js';
import authMiddleware from '../middleware/auth.js';
import { redisCache } from '../middleware/redisCache.js';

const router = express.Router();

// Public browsing endpoints can be safely cached (shared cache)
router.use(redisCache({ ttlSeconds: 120, scope: 'public' }));

// Public routes for customers to browse restaurants
router.get('/', listRestaurants);
router.get('/popular', getPopularRestaurants);
router.get('/search', searchRestaurants);
router.get('/nearby', findNearbyRestaurants); // e.g., /api/restaurants/nearby?latitude=12.97&longitude=77.59&maxDistance=5000
router.get('/cuisine', filterByCuisine); // e.g., /api/restaurants/cuisine?cuisine=Italian
router.get('/:id', getRestaurantDetails);
router.get('/:id/menu', getRestaurantMenu);

export default router;
