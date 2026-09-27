import Restaurant from '../models/Restaurant.js';

// Helper function to safely extract coordinates from restaurant object
const getRestaurantCoordinates = (restaurant) => {
  // Try different possible location structures
  let latitude = null;
  let longitude = null;

  // Case 1: location object with latitude/longitude
  if (restaurant.location) {
    latitude = restaurant.location.latitude || restaurant.location.lat;
    longitude = restaurant.location.longitude || restaurant.location.lng;
  }
  
  // Case 2: Direct latitude/longitude fields
  if (!latitude && restaurant.latitude) latitude = restaurant.latitude;
  if (!longitude && restaurant.longitude) longitude = restaurant.longitude;
  
  // Case 3: GeoJSON format with coordinates array
  if (!latitude && restaurant.coordinates && restaurant.coordinates.type === 'Point') {
    longitude = restaurant.coordinates.coordinates[0];
    latitude = restaurant.coordinates.coordinates[1];
  }
  
  // Case 4: Array format [longitude, latitude]
  if (!latitude && restaurant.loc && Array.isArray(restaurant.loc)) {
    longitude = restaurant.loc[0];
    latitude = restaurant.loc[1];
  }

  return { latitude, longitude };
};

// Helper function to calculate distance between coordinates (in meters)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

// List all restaurants with basic info
export const listRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .select('name cuisine location menu rating')
      .sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

// Get details for a single restaurant, including full menu
export const getRestaurantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id)
      .populate('createdBy', 'name email');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json(restaurant);
  } catch (err) {
    console.error('Error fetching restaurant details:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
};

// Get restaurant menu only
export const getRestaurantMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).select('name menu rating');
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({
      restaurantName: restaurant.name,
      menu: restaurant.menu
    });
  } catch (err) {
    console.error('Error fetching restaurant menu:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant menu' });
  }
};

// Find nearby restaurants based on customer's location
export const findNearbyRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, city, maxDistance = 5000 } = req.query;

    if (!latitude && !longitude && !city) {
      return res.status(400).json({ error: 'Latitude/longitude or city are required' });
    }

    // Fetch all restaurants (or filter by city if provided)
    let query = {};
    if (city) {
      query = { 'location.city': { $regex: `^${city}$`, $options: 'i' } };
    }

    const restaurants = await Restaurant.find(query)
      .select('name cuisine location menu rating address phone image offers isOpen isVeg deliveryTime avgPrice');
    
    if (!restaurants || restaurants.length === 0) {
      return res.json([]);
    }

    let nearbyRestaurants = [];
    const restaurantIds = new Set();

    // Calculate distances for restaurants with coordinates
    const userLat = latitude ? parseFloat(latitude) : null;
    const userLng = longitude ? parseFloat(longitude) : null;

    for (const restaurant of restaurants) {
      const { latitude: restLat, longitude: restLng } = getRestaurantCoordinates(restaurant);
      
      let distance = null;
      
      // Calculate distance if we have both user and restaurant coordinates
      if (userLat && userLng && restLat && restLng) {
        distance = calculateDistance(userLat, userLng, restLat, restLng);
        
        // Skip if beyond max distance
        if (distance && distance > parseFloat(maxDistance)) {
          continue;
        }
      }

      // Convert restaurant to plain object and add distance
      const restaurantObj = restaurant.toObject();
      restaurantObj.distance = distance;
      
      // Ensure location object exists with coordinates
      if (!restaurantObj.location) {
        restaurantObj.location = {};
      }
      restaurantObj.location.latitude = restLat;
      restaurantObj.location.longitude = restLng;
      
      nearbyRestaurants.push(restaurantObj);
      restaurantIds.add(restaurant._id.toString());
    }

    // Sort restaurants: those with distance first, then by distance, then by rating
    nearbyRestaurants.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    });

    res.json(nearbyRestaurants);
  } catch (err) {
    console.error('Error finding nearby restaurants:', err);
    res.status(500).json({ 
      error: 'Failed to find nearby restaurants',
      details: err.message 
    });
  }
};

// Search restaurants by name or cuisine
export const searchRestaurants = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { cuisine: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.area': { $regex: query, $options: 'i' } }
      ]
    }).select('name cuisine location menu rating address phone image offers isOpen isVeg deliveryTime avgPrice');

    res.json(restaurants);
  } catch (err) {
    console.error('Error searching restaurants:', err);
    res.status(500).json({ error: 'Failed to search restaurants' });
  }
};

// Filter restaurants by cuisine type
export const filterByCuisine = async (req, res) => {
  try {
    const { cuisine } = req.query;
    
    if (!cuisine) {
      return res.status(400).json({ error: 'Cuisine parameter is required' });
    }

    const restaurants = await Restaurant.find({
      cuisine: { $regex: cuisine, $options: 'i' }
    }).select('name cuisine location menu rating address phone image offers isOpen isVeg deliveryTime avgPrice');

    res.json(restaurants);
  } catch (err) {
    console.error('Error filtering restaurants by cuisine:', err);
    res.status(500).json({ error: 'Failed to filter restaurants' });
  }
};

// Get popular/featured restaurants
export const getPopularRestaurants = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Sort by rating and order count if available, otherwise by creation date
    const restaurants = await Restaurant.find()
      .select('name cuisine location menu rating address phone image offers isOpen isVeg deliveryTime avgPrice')
      .sort({ rating: -1, orderCount: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching popular restaurants:', err);
    res.status(500).json({ error: 'Failed to fetch popular restaurants' });
  }
};

// Add a new restaurant (for admin use)
export const addRestaurant = async (req, res) => {
  try {
    const restaurantData = req.body;
    
    // Validate required fields
    if (!restaurantData.name) {
      return res.status(400).json({ error: 'Restaurant name is required' });
    }

    // Create new restaurant
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      message: 'Restaurant added successfully',
      restaurant
    });
  } catch (err) {
    console.error('Error adding restaurant:', err);
    res.status(500).json({ error: 'Failed to add restaurant' });
  }
};

// Update restaurant information
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({
      message: 'Restaurant updated successfully',
      restaurant
    });
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

// Delete a restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    console.error('Error deleting restaurant:', err);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
};