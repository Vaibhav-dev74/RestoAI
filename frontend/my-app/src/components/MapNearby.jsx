import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Heading, Text, VStack, HStack, Badge,
  IconButton, Button, Spinner, useToast, Card, CardBody,
  Image, Flex, Divider, Grid, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  Input, InputGroup, InputLeftElement, Select, Slider,
  SliderTrack, SliderFilledTrack, SliderThumb, Switch,
  FormControl, FormLabel, Alert, AlertIcon, AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  MapPin, Navigation, Star, Clock, IndianRupee, Search,
  Filter, Maximize2, Locate, Users, Percent,
  Heart, RefreshCw, AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

// Free API Keys and Endpoints
const APIS = {
  // OpenStreetMap Nominatim (Free, no key required)
  nominatim: {
    url: 'https://nominatim.openstreetmap.org/search',
    format: 'json',
    limit: 50
  },
  // Geoapify (Free tier with key)
  geoapify: {
    url: 'https://api.geoapify.com/v2/places',
    key: import.meta.env.VITE_GEOAPIFY_API_KEY || 'aa5340f7ea7246bf862e89964c901398'
  },
  // OpenCage Geocoder (Free with key)
  opencage: {
    url: 'https://api.opencagedata.com/geocode/v1/json',
    key: import.meta.env.VITE_OPENCAGE_API_KEY || ''
  },
  // Foursquare (Free tier)
  foursquare: {
    url: 'https://api.foursquare.com/v3/places/search',
    key: import.meta.env.VITE_FOURSQUARE_API_KEY || ''
  }
};

// Popular Indian cities with coordinates
const POPULAR_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, state: 'Delhi' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
];

const DEFAULT_LOCATION = {
  lat: 19.265929,
  lng: 73.238978,
  name: 'Kalyan',
  state: 'Maharashtra'
};

// Load Leaflet CSS & JS dynamically
const loadLeaflet = () => new Promise((resolve, reject) => {
  if (window.L) return resolve(window.L);

  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[src*="leaflet"]')) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  } else {
    const interval = setInterval(() => {
      if (window.L) { 
        clearInterval(interval); 
        resolve(window.L); 
      }
    }, 100);
  }
});

const MapWithNearbyRestaurants = () => {
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState(DEFAULT_LOCATION);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [apiSource, setApiSource] = useState('backend'); // backend, nominatim, geoapify, foursquare, sample
  const [filters, setFilters] = useState({
    minRating: 0, 
    maxPrice: 1000, 
    vegOnly: false, 
    openNow: true, 
    cuisine: '',
  });
  const [stats, setStats] = useState({
    totalRestaurants: 0, 
    avgRating: 0, 
    avgDeliveryTime: 0, 
    restaurantsWithOffers: 0,
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) ** 2;
    return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  };

  // Initialize map
  const initMap = async (lat, lng, locationName) => {
    const L = await loadLeaflet();
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const userIcon = L.divIcon({
      html: `<div style="background:#f97316;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 2px 10px rgba(0,0,0,0.4);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      className: '',
    });
    
    userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`📍 ${locationName || 'Selected Location'}`);

    radiusCircleRef.current = L.circle([lat, lng], {
      radius: searchRadius * 1000,
      color: '#f97316', 
      fillColor: '#f97316', 
      fillOpacity: 0.08, 
      weight: 2,
    }).addTo(map);

    mapRef.current = map;
    return map;
  };

  // Update radius circle
  const updateRadiusCircle = () => {
    if (!mapRef.current || !userCoords) return;
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setRadius(searchRadius * 1000);
    }
  };

  // Add restaurant marker
  const addRestaurantMarker = (L, restaurant) => {
    if (!mapRef.current || !L) return;
    
    const lat = restaurant.location?.latitude;
    const lng = restaurant.location?.longitude;
    if (!lat || !lng) return;

    const rating = parseFloat(restaurant.rating) || 0;
    const color = rating >= 4.5 ? '#10b981' : rating >= 4 ? '#f59e0b' : '#ef4444';

    const icon = L.divIcon({
      html: `<div style="background:white;border:2px solid ${color};border-radius:8px;padding:3px 7px;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:12px;font-weight:bold;color:#1f2937;white-space:nowrap;">
        ${restaurant.isVeg ? '🌱 ' : ''}${rating}${restaurant.offers?.length > 0 ? ' 🏷️' : ''}
      </div>`,
      iconAnchor: [30, 14],
      className: '',
    });

    const marker = L.marker([lat, lng], { icon })
      .addTo(mapRef.current)
      .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.address || ''}`);

    marker.on('click', () => {
      setSelectedRestaurant(restaurant);
      onOpen();
    });

    markersRef.current.push(marker);
  };

  // --- FREE API: OpenStreetMap Nominatim (No API key required) ---
  const fetchFromNominatim = async (lat, lng) => {
    try {
      const response = await axios.get(`${APIS.nominatim.url}`, {
        params: {
          q: `restaurant near ${lat},${lng}`,
          format: APIS.nominatim.format,
          limit: APIS.nominatim.limit,
          lat: lat,
          lon: lng,
          radius: searchRadius * 1000,
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'RestaurantFinderApp/1.0'
        }
      });
      
      if (response.data && response.data.length > 0) {
        return response.data.map(place => ({
          _id: place.place_id,
          name: place.display_name.split(',')[0],
          address: place.display_name,
          location: {
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
            city: place.address?.city || place.address?.town || place.address?.village,
            state: place.address?.state
          },
          cuisine: ['Various'],
          rating: (3.5 + Math.random() * 1.5).toFixed(1),
          deliveryTime: Math.floor(20 + Math.random() * 40),
          avgPrice: Math.floor(200 + Math.random() * 800),
          image: `https://source.unsplash.com/featured/400x300/?restaurant,food`,
          isVeg: Math.random() > 0.6,
          isOpen: true,
          offers: Math.random() > 0.7 ? [{ text: 'Special offer available', code: 'SPECIAL' }] : []
        }));
      }
      return [];
    } catch (error) {
      console.warn('Nominatim API failed:', error.message);
      return [];
    }
  };

  // --- FREE API: Geoapify Places (Requires key, but has generous free tier) ---
  const fetchFromGeoapify = async (lat, lng) => {
    if (!APIS.geoapify.key || APIS.geoapify.key === 'aa5340f7ea7246bf862e89964c901398') {
      console.log('Geoapify key not configured');
      return [];
    }

    try {
      const response = await axios.get(APIS.geoapify.url, {
        params: {
          categories: 'catering.restaurant,catering.cafe',
          filter: `circle:${lng},${lat},${searchRadius * 1000}`,
          limit: 30,
          apiKey: APIS.geoapify.key
        }
      });
      
      if (response.data.features && response.data.features.length > 0) {
        return response.data.features.map(place => ({
          _id: place.properties.place_id,
          name: place.properties.name,
          address: place.properties.formatted,
          location: {
            latitude: place.geometry.coordinates[1],
            longitude: place.geometry.coordinates[0],
            city: place.properties.city,
            state: place.properties.state
          },
          cuisine: place.properties.categories?.map(c => c.split('.')[1]) || ['Restaurant'],
          rating: place.properties.rating || (3.8 + Math.random() * 1.2).toFixed(1),
          deliveryTime: Math.floor(20 + Math.random() * 40),
          avgPrice: Math.floor(250 + Math.random() * 750),
          image: `https://source.unsplash.com/400x300/?${place.properties.name.split(' ')[0]}`,
          isVeg: Math.random() > 0.7,
          isOpen: place.properties.opening_hours ? true : Math.random() > 0.2,
          offers: []
        }));
      }
      return [];
    } catch (error) {
      console.warn('Geoapify API failed:', error.message);
      return [];
    }
  };

  // --- FREE API: Foursquare Places (Free tier with 50k requests/month) ---
  const fetchFromFoursquare = async (lat, lng) => {
    if (!APIS.foursquare.key) {
      console.log('Foursquare key not configured');
      return [];
    }

    try {
      const response = await axios.get(APIS.foursquare.url, {
        params: {
          ll: `${lat},${lng}`,
          radius: searchRadius * 1000,
          limit: 30,
          categories: '13000,13003,13065', // Restaurant categories
          sort: 'relevance'
        },
        headers: {
          'Authorization': APIS.foursquare.key
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results.map(place => ({
          _id: place.fsq_id,
          name: place.name,
          address: place.location?.formatted_address || place.location?.address,
          location: {
            latitude: place.geocodes?.main?.latitude || lat + (Math.random() - 0.5) * 0.02,
            longitude: place.geocodes?.main?.longitude || lng + (Math.random() - 0.5) * 0.02,
            city: place.location?.locality,
            state: place.location?.region
          },
          cuisine: place.categories?.map(c => c.name) || ['Restaurant'],
          rating: place.rating || (3.8 + Math.random() * 1.2).toFixed(1),
          deliveryTime: Math.floor(20 + Math.random() * 40),
          avgPrice: Math.floor(200 + Math.random() * 800),
          image: place.photos?.[0]?.prefix + '200x200' + place.photos?.[0]?.suffix || 
                 `https://source.unsplash.com/400x300/?restaurant,food`,
          isVeg: Math.random() > 0.7,
          isOpen: true,
          offers: []
        }));
      }
      return [];
    } catch (error) {
      console.warn('Foursquare API failed:', error.message);
      return [];
    }
  };

  // Sample data as ultimate fallback
  const getSampleRestaurants = (lat, lng) => {
    const cuisineTypes = [
      { name: 'North Indian', veg: false, price: 450 },
      { name: 'South Indian', veg: true, price: 300 },
      { name: 'Chinese', veg: false, price: 400 },
      { name: 'Italian', veg: true, price: 600 },
      { name: 'Fast Food', veg: true, price: 350 },
      { name: 'Biryani', veg: false, price: 500 },
    ];
    
    const names = [
      'The Spice Garden', 'Pizza Paradise', 'Biryani Blues', 
      'South Indian Cafe', 'China Town', 'Urban Diner',
      'Cafe Coffee Day', 'Tandoori Nights', 'Sushi House',
      'Mediterranean Grill'
    ];
    
    return names.slice(0, 8).map((name, index) => {
      const cuisine = cuisineTypes[index % cuisineTypes.length];
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      return {
        _id: `sample_${index}`,
        name: name,
        address: `${Math.floor(100 + Math.random() * 900)} Main Road, ${selectedCity.name}`,
        location: {
          latitude: lat + latOffset,
          longitude: lng + lngOffset,
          city: selectedCity.name
        },
        cuisine: [cuisine.name],
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        deliveryTime: Math.floor(20 + Math.random() * 40),
        avgPrice: cuisine.price,
        image: `https://source.unsplash.com/400x300/?restaurant,${cuisine.name.toLowerCase()}`,
        isVeg: cuisine.veg,
        isOpen: true,
        offers: Math.random() > 0.7 ? [{ text: '20% off on first order', code: 'FIRST20' }] : []
      };
    });
  };

  // Fetch restaurants with API fallback chain
  const fetchRestaurants = async (lat, lng, locationName = '') => {
    setLoading(true);
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    let restaurants = [];
    let usedApi = '';

    // Try different APIs in sequence
    const apiAttempts = [
      { name: 'backend', fn: async () => {
        try {
          const res = await axios.get(`${VITE_API_URL}/api/restaurants/nearby`, {
            params: { latitude: lat, longitude: lng, maxDistance: searchRadius * 1000 },
            timeout: 5000
          });
          return res.data || [];
        } catch (e) { return []; }
      }},
      { name: 'foursquare', fn: () => fetchFromFoursquare(lat, lng) },
      { name: 'geoapify', fn: () => fetchFromGeoapify(lat, lng) },
      { name: 'nominatim', fn: () => fetchFromNominatim(lat, lng) },
    ];

    for (const attempt of apiAttempts) {
      try {
        const result = await attempt.fn();
        if (result && result.length > 0) {
          restaurants = result;
          usedApi = attempt.name;
          break;
        }
      } catch (error) {
        console.log(`${attempt.name} API failed, trying next...`);
      }
    }

    // If all APIs failed, use sample data
    if (restaurants.length === 0) {
      restaurants = getSampleRestaurants(lat, lng);
      usedApi = 'sample';
      toast({
        title: 'Using demo data',
        description: 'Connected to demo restaurant data',
        status: 'info',
        duration: 3000,
      });
    }

    setApiSource(usedApi);

    const processedRestaurants = restaurants.map(r => ({
      ...r,
      distance: calculateDistance(lat, lng, r.location?.latitude, r.location?.longitude) || 'N/A',
      rating: r.rating ? parseFloat(r.rating).toFixed(1) : '3.5',
      cuisine: Array.isArray(r.cuisine) ? r.cuisine : [r.cuisine],
      deliveryTime: r.deliveryTime || 30,
      avgPrice: r.avgPrice || 300,
      isVeg: r.isVeg || false,
      isOpen: r.isOpen !== undefined ? r.isOpen : true,
      offers: r.offers || [],
      image: r.image || 'https://via.placeholder.com/400x300?text=Restaurant'
    }));

    const filtered = applyFilters(processedRestaurants);
    setNearbyRestaurants(filtered);
    computeStats(filtered);

    const L = window.L;
    if (L && mapRef.current) {
      filtered.forEach(r => addRestaurantMarker(L, r));
      if (filtered.length > 0 && userMarkerRef.current) {
        const allMarkers = [userMarkerRef.current, ...markersRef.current];
        const group = L.featureGroup(allMarkers);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }

    setLoading(false);
  };

  // Apply filters
  const applyFilters = (restaurants) => {
    return restaurants
      .filter(r => {
        if (filters.minRating > 0 && parseFloat(r.rating) < filters.minRating) return false;
        if (r.avgPrice > filters.maxPrice) return false;
        if (filters.vegOnly && !r.isVeg) return false;
        if (filters.openNow && !r.isOpen) return false;
        if (filters.cuisine && !r.cuisine?.some(c => 
          c.toLowerCase().includes(filters.cuisine.toLowerCase())
        )) return false;
        return true;
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  };

  // Calculate statistics
  const computeStats = (list) => {
    const n = list.length || 1;
    setStats({
      totalRestaurants: list.length,
      avgRating: (list.reduce((s, r) => s + parseFloat(r.rating), 0) / n).toFixed(1),
      avgDeliveryTime: Math.round(list.reduce((s, r) => s + (r.deliveryTime || 30), 0) / n),
      restaurantsWithOffers: list.filter(r => r.offers?.length > 0).length,
    });
  };

  // Handle location detection
  const handleLocateMe = () => {
    setLoading(true);
    setLocationError(null);
    setLocationPermissionDenied(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      toast({
        title: 'Geolocation not supported',
        description: 'Please select a city manually',
        status: 'error',
        duration: 5000,
      });
      showCitySelection();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ latitude, longitude });
        await initMap(latitude, longitude, 'Your Location');
        await fetchRestaurants(latitude, longitude);
        setLocationError(null);
        setLocationPermissionDenied(false);
        
        toast({
          title: 'Location detected!',
          description: 'Showing restaurants near you',
          status: 'success',
          duration: 3000,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
        
        if (err.code === 1) {
          setLocationPermissionDenied(true);
          setLocationError('Location permission denied. Please select a city manually.');
          toast({
            title: 'Location access denied',
            description: 'Please select a city to see restaurants',
            status: 'warning',
            duration: 6000,
            isClosable: true,
          });
          showCitySelection();
        } else {
          setLocationError('Unable to get your location. Using default location.');
          toast({
            title: 'Location unavailable',
            description: 'Using default location',
            status: 'info',
            duration: 4000,
          });
          useDefaultLocation();
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const showCitySelection = () => {
    setShowCitySelector(true);
    setLoading(false);
  };

  const useDefaultLocation = async () => {
    const lat = DEFAULT_LOCATION.lat;
    const lng = DEFAULT_LOCATION.lng;
    setUserCoords({ latitude: lat, longitude: lng });
    setUserAddress({ city: DEFAULT_LOCATION.name, state: DEFAULT_LOCATION.state });
    await initMap(lat, lng, DEFAULT_LOCATION.name);
    await fetchRestaurants(lat, lng, DEFAULT_LOCATION.name);
  };

  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    setShowCitySelector(false);
    setLoading(true);
    setLocationPermissionDenied(false);
    
    const lat = city.lat;
    const lng = city.lng;
    
    setUserCoords({ latitude: lat, longitude: lng });
    setUserAddress({ city: city.name, state: city.state });
    await initMap(lat, lng, city.name);
    await fetchRestaurants(lat, lng, city.name);
    
    toast({
      title: `Location set to ${city.name}`,
      description: `Showing restaurants in ${city.name}`,
      status: 'success',
      duration: 3000,
    });
  };

  // Update radius when changed
  useEffect(() => {
    if (userCoords) {
      updateRadiusCircle();
      fetchRestaurants(userCoords.latitude, userCoords.longitude);
    }
  }, [searchRadius]);

  // Initial load
  useEffect(() => {
    handleLocateMe();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // City Selector Modal
  const CitySelectorModal = () => (
    <Modal isOpen={showCitySelector} onClose={() => setShowCitySelector(false)} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="2xl" maxW="600px">
        <ModalHeader fontSize="xl">Select Your City</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Location access required</AlertTitle>
                <AlertDescription fontSize="xs">
                  Please select a city to see restaurants near you
                </AlertDescription>
              </Box>
            </Alert>
            
            <Text fontWeight="semibold" fontSize="sm" mt={2}>Popular Cities</Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
              {POPULAR_CITIES.map((city) => (
                <Button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  variant="outline"
                  colorScheme="orange"
                  size="md"
                  justifyContent="flex-start"
                  leftIcon={<MapPin size={16} />}
                  py={6}
                >
                  <Box textAlign="left">
                    <Text fontWeight="medium">{city.name}</Text>
                    <Text fontSize="xs" color="gray.500">{city.state}</Text>
                  </Box>
                </Button>
              ))}
            </Grid>
            
            <Divider my={2} />
            
            <Button
              colorScheme="orange"
              variant="ghost"
              onClick={() => {
                setShowCitySelector(false);
                useDefaultLocation();
              }}
            >
              Use Default Location (Kalyan)
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Restaurant Modal
  const RestaurantModal = () => {
    if (!selectedRestaurant) return null;
    const r = selectedRestaurant;
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>{r.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Image 
                src={r.image} 
                alt={r.name} 
                borderRadius="xl" 
                h="200px" 
                objectFit="cover"
                fallbackSrc="https://via.placeholder.com/400x200?text=Restaurant" 
              />
              <Text color="gray.500" fontSize="sm">{r.address}</Text>
              <Flex justify="space-between" align="center">
                <HStack spacing={2} flexWrap="wrap">
                  {r.cuisine?.map((c, i) => (
                    <Badge key={i} colorScheme="orange" borderRadius="full" px={3} py={1}>
                      {c}
                    </Badge>
                  ))}
                </HStack>
                <Badge fontSize="lg" px={3} py={1} borderRadius="lg" bg="green.50" color="green.700">
                  {r.rating} ★
                </Badge>
              </Flex>
              <Divider />
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Delivery Time</Text>
                  <HStack>
                    <Clock size={16} />
                    <Text fontWeight="bold">{r.deliveryTime} min</Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Avg Price</Text>
                  <HStack>
                    <IndianRupee size={16} />
                    <Text fontWeight="bold">₹{r.avgPrice}</Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Distance</Text>
                  <HStack>
                    <Navigation size={16} />
                    <Text fontWeight="bold">{r.distance} km</Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Status</Text>
                  <Badge colorScheme={r.isOpen ? 'green' : 'red'}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </Box>
              </Grid>
              {r.offers?.length > 0 && (
                <Box>
                  <Heading size="sm" mb={2}>Offers</Heading>
                  {r.offers.map((o, i) => (
                    <Box key={i} bg="orange.50" p={3} borderRadius="lg">
                      <Flex justify="space-between">
                        <Text fontWeight="semibold" color="orange.600">{o.text}</Text>
                        <Badge colorScheme="orange">Code: {o.code}</Badge>
                      </Flex>
                    </Box>
                  ))}
                </Box>
              )}
              <HStack spacing={3} pt={2}>
                <Button 
                  flex={1} 
                  colorScheme="orange" 
                  leftIcon={<Navigation size={16} />}
                  onClick={() => window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${r.location?.latitude},${r.location?.longitude}`,
                    '_blank'
                  )}
                  borderRadius="xl"
                >
                  Directions
                </Button>
                <IconButton 
                  icon={<Heart size={16} />} 
                  borderRadius="xl" 
                  aria-label="Favourite" 
                />
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // Stat Card
  const StatCard = ({ icon, label, value }) => (
    <HStack 
      spacing={2} 
      bg="white" 
      px={3} 
      py={2} 
      borderRadius="xl" 
      boxShadow="sm" 
      borderWidth={1} 
      borderColor="gray.100"
    >
      <Box color="orange.500">{icon}</Box>
      <Box>
        <Text fontSize="xs" color="gray.500">{label}</Text>
        <Text fontWeight="bold" fontSize="sm">{value}</Text>
      </Box>
    </HStack>
  );

  if (loading && !showCitySelector) {
    return (
      <VStack spacing={4} py={20}>
        <Spinner size="xl" color="orange.500" thickness="4px" />
        <Text color="gray.600">Finding restaurants near you...</Text>
      </VStack>
    );
  }

  return (
    <Container maxW="7xl" py={4}>
      {/* API Source Indicator */}
      {apiSource !== 'backend' && apiSource !== 'sample' && (
        <Alert status="info" mb={4} borderRadius="xl" size="sm">
          <AlertIcon />
          <AlertDescription fontSize="xs">
            Using {apiSource} API for restaurant data
          </AlertDescription>
        </Alert>
      )}

      {/* Location Permission Alert */}
      {locationPermissionDenied && (
        <Alert status="warning" mb={4} borderRadius="xl">
          <AlertCircle size={16} />
          <AlertTitle ml={2} mr={2} fontSize="sm">Location Access Denied</AlertTitle>
          <AlertDescription fontSize="sm">
            Please select a city to see restaurants
          </AlertDescription>
          <Button 
            size="sm" 
            ml="auto" 
            colorScheme="orange" 
            onClick={() => setShowCitySelector(true)}
          >
            Select City
          </Button>
        </Alert>
      )}

      {/* Header */}
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'stretch', md: 'center' }} 
        mb={4} 
        gap={4}
      >
        <HStack spacing={4}>
          <Box p={3} bgGradient="linear(to-br, orange.500, pink.500)" borderRadius="xl" boxShadow="lg">
            <MapPin size={24} color="white" />
          </Box>
          <Box>
            <Heading size="lg">Restaurants Near You</Heading>
            <Text color="gray.500" fontSize="sm">
              {userAddress?.city || selectedCity.name}
              {userAddress?.state && `, ${userAddress.state}`}
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2} flexWrap="wrap">
          <StatCard icon={<Users size={20} />} label="Found" value={stats.totalRestaurants} />
          <StatCard icon={<Star size={20} />} label="Avg Rating" value={stats.avgRating} />
          <StatCard icon={<Clock size={20} />} label="Avg Time" value={`${stats.avgDeliveryTime} min`} />
          <StatCard icon={<Percent size={20} />} label="With Offers" value={stats.restaurantsWithOffers} />
        </HStack>
      </Flex>

      {/* Search & Filter Bar */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={3} mb={4} p={4} bg="white" borderRadius="2xl" boxShadow="sm">
        <InputGroup flex={1}>
          <InputLeftElement>
            <Search size={18} color="#718096" />
          </InputLeftElement>
          <Input 
            placeholder="Search restaurants, cuisines..."
            value={filters.cuisine} 
            onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
            borderRadius="xl" 
            borderColor="gray.200" 
          />
        </InputGroup>
        <HStack spacing={2}>
          <Select 
            w="150px" 
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })} 
            borderRadius="xl"
          >
            <option value={0}>Any Rating</option>
            <option value={4.5}>4.5+ ★</option>
            <option value={4}>4.0+ ★</option>
            <option value={3.5}>3.5+ ★</option>
          </Select>
          <IconButton 
            icon={<Filter size={18} />} 
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'solid' : 'outline'} 
            colorScheme="orange" 
            borderRadius="xl" 
            aria-label="Filters" 
          />
          <IconButton 
            icon={<Locate size={18} />} 
            onClick={handleLocateMe}
            variant="outline" 
            borderRadius="xl" 
            aria-label="Locate Me" 
            colorScheme="orange" 
          />
          <IconButton 
            icon={<RefreshCw size={18} />}
            onClick={() => userCoords && fetchRestaurants(userCoords.latitude, userCoords.longitude)}
            variant="outline" 
            borderRadius="xl" 
            aria-label="Refresh" 
          />
          <IconButton
            icon={<Maximize2 size={18} />} 
            onClick={() => {
              if (!document.fullscreenElement) {
                mapContainerRef.current?.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            variant="outline" 
            borderRadius="xl" 
            aria-label="Fullscreen" 
          />
        </HStack>
      </Flex>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <MotionBox 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} 
            overflow="hidden" 
            mb={4}
          >
            <Box p={4} bg="white" borderRadius="2xl" boxShadow="sm">
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="sm">Filter Options</Heading>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    colorScheme="orange"
                    onClick={() => setFilters({ 
                      minRating: 0, 
                      maxPrice: 1000, 
                      vegOnly: false, 
                      openNow: true, 
                      cuisine: '' 
                    })}
                  >
                    Reset All
                  </Button>
                </Flex>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Radius: {searchRadius}km</FormLabel>
                    <Slider 
                      min={1} 
                      max={15} 
                      step={0.5} 
                      value={searchRadius} 
                      onChange={setSearchRadius} 
                      colorScheme="orange"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Max Price: ₹{filters.maxPrice}</FormLabel>
                    <Slider 
                      min={100} 
                      max={2000} 
                      step={50} 
                      value={filters.maxPrice}
                      onChange={(val) => setFilters({ ...filters, maxPrice: val })} 
                      colorScheme="orange"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                </Grid>
                <HStack spacing={8}>
                  <FormControl display="flex" alignItems="center" w="auto">
                    <Switch 
                      id="veg" 
                      isChecked={filters.vegOnly} 
                      onChange={e => setFilters({ ...filters, vegOnly: e.target.checked })} 
                      colorScheme="green" 
                      mr={2} 
                    />
                    <FormLabel htmlFor="veg" mb={0} fontSize="sm">Pure Veg Only</FormLabel>
                  </FormControl>
                  <FormControl display="flex" alignItems="center" w="auto">
                    <Switch 
                      id="open" 
                      isChecked={filters.openNow} 
                      onChange={e => setFilters({ ...filters, openNow: e.target.checked })} 
                      colorScheme="green" 
                      mr={2} 
                    />
                    <FormLabel htmlFor="open" mb={0} fontSize="sm">Open Now</FormLabel>
                  </FormControl>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Map */}
      <Box 
        ref={mapContainerRef} 
        h={{ base: '380px', md: '480px' }} 
        w="100%"
        borderRadius="2xl" 
        overflow="hidden" 
        boxShadow="xl" 
        borderWidth={1}
        borderColor="gray.200" 
        bg="gray.100" 
        mb={6} 
      />

      {/* Restaurant Grid */}
      {nearbyRestaurants.length > 0 && (
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">
              Restaurants Near {userAddress?.city || selectedCity.name}
            </Heading>
            <Text fontSize="sm" color="gray.500">{nearbyRestaurants.length} found</Text>
          </Flex>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
            {nearbyRestaurants.map((r) => (
              <Card 
                key={r._id} 
                borderRadius="xl" 
                overflow="hidden" 
                cursor="pointer"
                _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                transition="all 0.2s" 
                onClick={() => { 
                  setSelectedRestaurant(r); 
                  onOpen(); 
                }}
              >
                <Box position="relative" h="140px">
                  <Image 
                    src={r.image} 
                    alt={r.name} 
                    w="100%" 
                    h="100%" 
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/400x140?text=Restaurant" 
                  />
                  <Badge 
                    position="absolute" 
                    top={2} 
                    left={2} 
                    bg="whiteAlpha.900"
                    backdropFilter="blur(4px)" 
                    borderRadius="full" 
                    px={2} 
                    py={1}
                    display="flex" 
                    alignItems="center" 
                    gap={1}
                  >
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text fontSize="xs" fontWeight="bold">{r.rating}</Text>
                  </Badge>
                  {r.isVeg && (
                    <Badge 
                      position="absolute" 
                      top={2} 
                      right={2} 
                      bg="green.500" 
                      color="white" 
                      fontSize="xs" 
                      px={2} 
                      borderRadius="full"
                    >
                      🌱 Pure Veg
                    </Badge>
                  )}
                </Box>
                <CardBody p={3}>
                  <Heading size="sm" mb={1} noOfLines={1}>{r.name}</Heading>
                  <Text fontSize="xs" color="gray.500" mb={2} noOfLines={1}>
                    {r.cuisine?.join(' • ')}
                  </Text>
                  <HStack spacing={3} fontSize="xs" color="gray.600">
                    <HStack spacing={1}>
                      <Clock size={12} />
                      <Text>{r.deliveryTime} min</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <IndianRupee size={12} />
                      <Text>₹{r.avgPrice}</Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Navigation size={12} />
                      <Text>{r.distance} km</Text>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Box>
      )}

      {nearbyRestaurants.length === 0 && !loading && (
        <Box textAlign="center" py={16} bg="white" borderRadius="2xl" boxShadow="sm">
          <Text fontSize="xl" mb={2}>🍽️ No restaurants found</Text>
          <Text color="gray.500" mb={4}>Try increasing the search radius or changing filters.</Text>
          <Button colorScheme="orange" leftIcon={<RefreshCw size={16} />} onClick={handleLocateMe}>
            Retry
          </Button>
        </Box>
      )}

      <RestaurantModal />
      <CitySelectorModal />
    </Container>
  );
};

export default MapWithNearbyRestaurants;