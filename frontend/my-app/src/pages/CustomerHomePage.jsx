import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  ChakraProvider,
  Box,
  Flex,
  Grid,
  GridItem,
  Container,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  IconButton,
  Image,
  Badge,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  AvatarBadge,
  Divider,
  Stack,
  HStack,
  VStack,
  Wrap,
  WrapItem,
  Icon,
  Tooltip,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Spinner,
  useToast,
  theme as baseTheme,
  extendTheme,
  CSSReset,
  ScaleFade,
  Fade,
  SlideFade,
  ButtonGroup, // Add this line
} from '@chakra-ui/react';
import {
  MapPin,
  Search,
  Star,
  Filter,
  Map as MapIcon,
  List,
  Heart,
  Clock,
  DollarSign,
  Navigation,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Bike,
  Shield,
  Percent,
  Coffee,
  Pizza,
  Sandwich,
  IceCream,
  IndianRupee,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  Timer,
  FileText,
  Bell,
  Gift,
  Zap,
  Leaf,
  Flame,
  Crown,
  Users,
} from 'lucide-react';
import MapWithNearbyRestaurants from '../components/MapNearby';

// Custom theme with all fonts
const theme = extendTheme({
  fonts: {
    heading: '"ClashDisplay", sans-serif',
    body: '"SFProDisplay", sans-serif',
    mono: '"BetaniaPatmos", sans-serif',
  },
  fontWeights: {
    hairline: 200,
    thin: 300,
    light: 400,
    normal: 500,
    medium: 600,
    semibold: 700,
    bold: 800,
    extrabold: 900,
  },
  styles: {
    global: {
      '@font-face': [
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Extralight.otf") format("opentype")',
          fontWeight: 200,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Light.otf") format("opentype")',
          fontWeight: 300,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Regular.otf") format("opentype")',
          fontWeight: 400,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Medium.otf") format("opentype")',
          fontWeight: 500,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Semibold.otf") format("opentype")',
          fontWeight: 600,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'ClashDisplay',
          src: 'url("/fonts/ClashDisplay-Bold.otf") format("opentype")',
          fontWeight: 700,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'SFProDisplay',
          src: 'url("/fonts/SFPRODISPLAYREGULAR.OTF") format("opentype")',
          fontWeight: 400,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'SFProDisplay',
          src: 'url("/fonts/SFPRODISPLAYMEDIUM.OTF") format("opentype")',
          fontWeight: 500,
          fontStyle: 'normal',
        },
        {
          fontFamily: 'BetaniaPatmos',
          src: 'url("/fonts/BetaniaPatmosGDL-Regular.ttf") format("truetype")',
          fontWeight: 400,
          fontStyle: 'normal',
        },
      ],
      body: {
        bg: 'gray.50',
        fontFamily: 'SFProDisplay, sans-serif',
      },
    },
  },
  colors: {
    brand: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        borderRadius: 'xl',
        fontFamily: 'ClashDisplay, sans-serif',
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'ClashDisplay, sans-serif',
        fontWeight: '700',
      },
    },
    Text: {
      baseStyle: {
        fontFamily: 'SFProDisplay, sans-serif',
      },
    },
  },
});

const CustomerHomePage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(60);
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [popularCuisines, setPopularCuisines] = useState([]);
  const [featuredCollections, setFeaturedCollections] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [offerRestaurants, setOfferRestaurants] = useState([]);
  const [vegFilter, setVegFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(1000);
  
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  const { isOpen: isSortOpen, onOpen: onSortOpen, onClose: onSortClose } = useDisclosure();
  
  const VITE_API_URL = API_BASE_URL;

  // Food categories for quick filters
  const foodCategories = [
    { id: 'pizza', name: 'Pizza', icon: '🍕', color: 'orange' },
    { id: 'burger', name: 'Burger', icon: '🍔', color: 'blue' },
    { id: 'biryani', name: 'Biryani', icon: '🍛', color: 'red' },
    { id: 'north-indian', name: 'North Indian', icon: '🍲', color: 'purple' },
    { id: 'south-indian', name: 'South Indian', icon: '🥘', color: 'green' },
    { id: 'chinese', name: 'Chinese', icon: '🥡', color: 'pink' },
    { id: 'desserts', name: 'Desserts', icon: '🍰', color: 'amber' },
    { id: 'beverages', name: 'Beverages', icon: '🥤', color: 'indigo' },
  ];

  // New: Trending dishes
  const trendingDishes = [
    { id: 1, name: 'Butter Chicken', orders: '2.5k+ orders', image: 'https://source.unsplash.com/100x100/?butter-chicken' },
    { id: 2, name: 'Margherita Pizza', orders: '3k+ orders', image: 'https://source.unsplash.com/100x100/?pizza' },
    { id: 3, name: 'Hyderabadi Biryani', orders: '5k+ orders', image: 'https://source.unsplash.com/100x100/?biryani' },
    { id: 4, name: 'Paneer Tikka', orders: '1.8k+ orders', image: 'https://source.unsplash.com/100x100/?paneer' },
  ];

  // New: Popular brands
  const popularBrands = [
    { id: 1, name: 'McDonald\'s', discount: '50% off', logo: 'https://source.unsplash.com/100x100/?mcdonalds' },
    { id: 2, name: 'Domino\'s', discount: '40% off', logo: 'https://source.unsplash.com/100x100/?dominos' },
    { id: 3, name: 'KFC', discount: '60% off', logo: 'https://source.unsplash.com/100x100/?kfc' },
    { id: 4, name: 'Burger King', discount: '50% off', logo: 'https://source.unsplash.com/100x100/?burger-king' },
  ];

  // New: Exclusive offers
  const exclusiveOffers = [
    { id: 1, title: 'Weekend Special', discount: '60% off', code: 'WEEKEND60', validity: 'Valid on weekends' },
    { id: 2, title: 'First Order', discount: '50% off', code: 'FIRST50', validity: 'Valid for new users' },
    { id: 3, title: 'Bank Offer', discount: '30% off', code: 'BANK30', validity: 'Valid on HDFC cards' },
    { id: 4, title: 'Free Delivery', discount: '₹0 delivery', code: 'FREEDEL', validity: 'On orders above ₹199' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (userData.addresses && userData.addresses.length > 0) {
        setSelectedCity(userData.addresses[0].city || '');
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const restaurantsRes = await axios.get(`${VITE_API_URL}/api/restaurants`);
      setRestaurants(restaurantsRes.data);
      setFilteredRestaurants(restaurantsRes.data);

      const uniqueCities = [...new Set(
        restaurantsRes.data
          .map(r => r.location?.city)
          .filter(city => city)
      )];
      setCities(uniqueCities);

      if (user?.addresses?.[0]?.city && uniqueCities.includes(user.addresses[0].city)) {
        setSelectedCity(user.addresses[0].city);
      }

      const cuisineCount = {};
      restaurantsRes.data.forEach(restaurant => {
        if (restaurant.cuisine) {
          restaurant.cuisine.forEach(cuisine => {
            cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
          });
        }
      });
      
      const sortedCuisines = Object.entries(cuisineCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([cuisine]) => cuisine);
      
      setPopularCuisines(sortedCuisines);

      const topRated = [...restaurantsRes.data]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);
      setTopRestaurants(topRated);

      const withOffers = restaurantsRes.data
        .filter((_, index) => index % 3 === 0)
        .slice(0, 6);
      setOfferRestaurants(withOffers);

      setFeaturedCollections([
        { id: 1, name: 'Trending Now', icon: '🔥', color: 'orange' },
        { id: 2, name: 'New Arrivals', icon: '🆕', color: 'blue' },
        { id: 3, name: 'Best Offers', icon: '🏷️', color: 'red' },
        { id: 4, name: 'Quick Delivery', icon: '⚡', color: 'purple' },
        { id: 5, name: 'Pure Veg', icon: '🌱', color: 'green' },
        { id: 6, name: 'Premium', icon: '👑', color: 'amber' },
      ]);

    } catch (err) {
      setError('Could not fetch restaurants. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyRestaurants = async () => {
    if (!userLocation && !selectedCity) {
      toast({
        title: 'Location required',
        description: 'Please enable location or select a city to find nearby restaurants',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      const params = {
        maxDistance: 5000
      };

      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }
      
      if (selectedCity) {
        params.city = selectedCity;
      }

      const response = await axios.get(`${VITE_API_URL}/api/restaurants/nearby`, { params });
      setNearbyRestaurants(response.data);
      setFilteredRestaurants(response.data);
    } catch (err) {
      console.error('Error fetching nearby restaurants:', err);
      setFilteredRestaurants(restaurants);
    } finally {
      setLoading(false);
    }
  };

  const applyAllFilters = () => {
    let result = [...restaurants];

    if (selectedCity) {
      result = result.filter(r => 
        r.location?.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (searchTerm) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cuisine?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCuisine) {
      result = result.filter(r => 
        r.cuisine?.some(c => c.toLowerCase().includes(selectedCuisine.toLowerCase()))
      );
    }

    if (ratingFilter > 0) {
      result = result.filter(r => (r.rating || 0) >= ratingFilter);
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'low') {
        result = result.filter(r => (r.avgPrice || 200) <= 300);
      } else if (priceFilter === 'medium') {
        result = result.filter(r => (r.avgPrice || 200) > 300 && (r.avgPrice || 200) <= 600);
      } else if (priceFilter === 'high') {
        result = result.filter(r => (r.avgPrice || 200) > 600);
      }
    }

    if (vegFilter === 'veg') {
      result = result.filter(r => r.isVeg === true);
    } else if (vegFilter === 'non-veg') {
      result = result.filter(r => r.isVeg === false);
    }

    result = result.filter(r => (r.avgPrice || 200) <= maxPrice);

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => (a.avgPrice || 0) - (b.avgPrice || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0));
    } else if (sortBy === 'delivery-time') {
      result.sort((a, b) => (a.deliveryTime || 30) - (b.deliveryTime || 30));
    }

    setFilteredRestaurants(result);
  };

  useEffect(() => {
    applyAllFilters();
  }, [searchTerm, selectedCuisine, ratingFilter, priceFilter, sortBy, selectedCity, vegFilter, maxPrice, restaurants]);

  useEffect(() => {
    if (activeTab === 'nearby') {
      fetchNearbyRestaurants();
    } else if (activeTab === 'all') {
      setFilteredRestaurants(restaurants);
    } else if (activeTab === 'offers') {
      setFilteredRestaurants(offerRestaurants);
    } else if (activeTab === 'top-rated') {
      setFilteredRestaurants(topRestaurants);
    }
  }, [activeTab]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const RestaurantCard = ({ restaurant }) => {
    const distance = userLocation && restaurant.location?.latitude && restaurant.location?.longitude
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.location.latitude,
          restaurant.location.longitude
        ).toFixed(1)
      : null;

    const offers = [
      { text: '50% off up to ₹100', code: 'WELCOME50' },
      { text: 'Free delivery', code: 'FREEDEL' },
      { text: '20% off on first order', code: 'FIRST20' },
    ];
    const randomOffer = offers[Math.floor(Math.random() * offers.length)];

    return (
      <Link to={`/restaurant/${restaurant._id}`}>
        <Card
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="lg"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: '2xl',
            transition: 'all 0.3s',
          }}
          cursor="pointer"
        >
          <Box position="relative" h="200px">
            <Image
              src={restaurant.image || `https://source.unsplash.com/400x300/?food,${restaurant.cuisine?.[0] || 'restaurant'}`}
              alt={restaurant.name}
              w="100%"
              h="100%"
              objectFit="cover"
              transition="transform 0.5s"
              _groupHover={{ transform: 'scale(1.1)' }}
            />
            
            {/* Badges */}
            <HStack position="absolute" top={3} left={3} spacing={2}>
              <Badge
                bg="whiteAlpha.900"
                backdropFilter="blur(4px)"
                px={2}
                py={1}
                borderRadius="lg"
                boxShadow="md"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Icon as={() => <Star size={14} />} color="yellow.400" fill="yellow.400" />
                <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                  {restaurant.rating || (4 + Math.random()).toFixed(1)}
                </Text>
              </Badge>
              
              {distance && (
                <Badge
                  bg="whiteAlpha.900"
                  backdropFilter="blur(4px)"
                  px={2}
                  py={1}
                  borderRadius="lg"
                  boxShadow="md"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={() => <Navigation size={12} />} color="gray.600" />
                  <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                    {distance} km
                  </Text>
                </Badge>
              )}
            </HStack>

            {/* Favorite Button */}
            <IconButton
              icon={<Heart size={16} />}
              position="absolute"
              top={3}
              right={3}
              size="sm"
              bg="whiteAlpha.900"
              backdropFilter="blur(4px)"
              borderRadius="full"
              _hover={{ bg: 'red.50', color: 'red.500' }}
              onClick={(e) => {
                e.preventDefault();
              }}
              aria-label="Add to favorites"
            />

            {/* Pure Veg Badge */}
            {restaurant.isVeg && (
              <Badge
                position="absolute"
                bottom={3}
                left={3}
                bg="green.500"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="lg"
                boxShadow="lg"
              >
                🌱 Pure Veg
              </Badge>
            )}

            {/* Offer Badge */}
            <Badge
              position="absolute"
              bottom={3}
              right={3}
              bgGradient="linear(to-r, orange.500, pink.500)"
              color="white"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="lg"
              boxShadow="lg"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <Icon as={() => <Percent size={12} />} />
              {randomOffer.text}
            </Badge>
          </Box>

          <CardBody p={4}>
            <Heading as="h3" size="md" mb={1} color="gray.800">
              {restaurant.name}
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={2}>
              {restaurant.cuisine?.join(', ') || 'Various Cuisines'}
            </Text>
            
            <HStack spacing={3} mb={2}>
              <HStack spacing={1}>
                <Icon as={() => <Clock size={14} />} color="gray.400" />
                <Text fontSize="sm" color="gray.600">
                  {(restaurant.deliveryTime || 25) + Math.floor(Math.random() * 15)}-{(restaurant.deliveryTime || 25) + 15 + Math.floor(Math.random() * 15)} min
                </Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={() => <IndianRupee size={14} />} color="gray.400" />
                <Text fontSize="sm" color="gray.600">
                  ₹{(restaurant.avgPrice || 200)} for two
                </Text>
              </HStack>
            </HStack>

            {restaurant.location?.area && (
              <HStack spacing={1}>
                <Icon as={() => <MapPin size={12} />} color="gray.400" />
                <Text fontSize="xs" color="gray.400">
                  {restaurant.location.area}
                </Text>
              </HStack>
            )}
          </CardBody>
        </Card>
      </Link>
    );
  };

  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Box minH="100vh" bg="gray.50" position="relative">
        {/* Artistic Background Elements */}
        <Box
          position="fixed"
          inset={0}
          overflow="hidden"
          pointerEvents="none"
          zIndex={0}
        >
          <Box
            position="absolute"
            top="-40px"
            right="-40px"
            w="80"
            h="80"
            bgGradient="linear(to-br, orange.200, pink.200)"
            opacity={0.2}
            borderRadius="full"
            filter="blur(60px)"
            animation="pulse 4s infinite"
          />
          <Box
            position="absolute"
            bottom="-40px"
            left="-40px"
            w="80"
            h="80"
            bgGradient="linear(to-br, blue.200, purple.200)"
            opacity={0.2}
            borderRadius="full"
            filter="blur(60px)"
            animation="pulse 4s infinite"
            animationdelay="1s"
          />
        </Box>

        {/* Header */}
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex={50}
          bg="whiteAlpha.800"
          backdropFilter="blur(8px)"
          borderBottomWidth={1}
          borderColor="gray.200"
        >
          <Container maxW="7xl" py={3}>
            <Flex align="center" justify="space-between" gap={4}>
              {/* Logo */}
              <Link to="/">
                <Heading
                  as="span"
                  size="lg"
                  bgGradient="linear(to-r, gray.900, gray.700)"
                  bgClip="text"
                  fontFamily="ClashDisplay"
                >
                  Food<span style={{ color: '#f97316' }}>Delight</span>
                </Heading>
              </Link>

              {/* Location Selector */}
              <HStack
                display={{ base: 'none', md: 'flex' }}
                spacing={2}
                bg="gray.50"
                px={3}
                py={2}
                borderRadius="xl"
                borderWidth={1}
                borderColor="gray.200"
              >
                <Icon as={() => <MapPin size={18} />} color="orange.500" />
                <Select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  variant="unstyled"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  icon={<ChevronDown size={16} />}
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </Select>
              </HStack>

              {/* Search Bar */}
              <Flex flex={1} maxW="2xl" align="center" gap={2}>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={() => <Search size={18} />} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder="Search for restaurants, cuisines, or dishes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="xl"
                    borderColor="gray.200"
                    _focus={{
                      borderColor: 'orange.300',
                      boxShadow: '0 0 0 3px rgba(251, 146, 60, 0.1)',
                    }}
                  />
                  {searchTerm && (
                    <InputRightElement>
                      <IconButton
                        icon={<X size={16} />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
                <IconButton
                  icon={<SlidersHorizontal size={20} />}
                  onClick={onFilterOpen}
                  variant={showFilters ? 'solid' : 'outline'}
                  colorScheme={showFilters ? 'orange' : 'gray'}
                  borderRadius="xl"
                  aria-label="Open filters"
                />
              </Flex>

              {/* User Menu */}
              <HStack spacing={3}>
                {user ? (
                  <Link to={`/profile/${user._id}`}>
                    <Avatar
                      name={user.name}
                      src={user.avatar}
                      size="md"
                      borderWidth={2}
                      borderColor="orange.400"
                    >
                      <AvatarBadge boxSize="1.25em" bg="green.500" />
                    </Avatar>
                  </Link>
                ) : (
                  <>
                    <Button
                      as={Link}
                      to="/customer-login"
                      variant="ghost"
                      display={{ base: 'none', sm: 'inline-flex' }}
                    >
                      Login
                    </Button>
                    <Button
                      as={Link}
                      to="/customer-register"
                      colorScheme="orange"
                      bgGradient="linear(to-r, gray.900, gray.800)"
                      _hover={{
                        bgGradient: 'linear(to-r, gray.800, gray.700)',
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </HStack>
            </Flex>

            {/* Mobile Location Selector */}
            <HStack
              display={{ base: 'flex', md: 'none' }}
              mt={3}
              spacing={2}
              bg="gray.50"
              px={3}
              py={2}
              borderRadius="xl"
              borderWidth={1}
              borderColor="gray.200"
            >
              <Icon as={() => <MapPin size={18} />} color="orange.500" />
              <Select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                variant="unstyled"
                fontSize="sm"
                fontWeight="medium"
                color="gray.700"
                flex={1}
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </Select>
            </HStack>
          </Container>
        </Box>

        {/* Filters Drawer */}
        <Drawer isOpen={isFilterOpen} placement="right" onClose={onFilterClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader fontFamily="ClashDisplay">Filter Restaurants</DrawerHeader>

            <DrawerBody>
              <VStack spacing={6} align="stretch">
                {/* Sort By */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Sort By
                  </Heading>
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    {['relevance', 'rating', 'delivery-time', 'price-low', 'price-high'].map(option => (
                      <Button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          onSortClose();
                        }}
                        size="sm"
                        variant={sortBy === option ? 'solid' : 'ghost'}
                        colorScheme={sortBy === option ? 'orange' : 'gray'}
                        borderRadius="xl"
                        textTransform="capitalize"
                      >
                        {option.replace('-', ' ')}
                      </Button>
                    ))}
                  </Grid>
                </Box>

                {/* Cuisines */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Cuisines
                  </Heading>
                  <Wrap spacing={2}>
                    {popularCuisines.map(cuisine => (
                      <WrapItem key={cuisine}>
                        <Button
                          size="sm"
                          variant={selectedCuisine === cuisine ? 'solid' : 'ghost'}
                          colorScheme={selectedCuisine === cuisine ? 'orange' : 'gray'}
                          borderRadius="full"
                          onClick={() => filterByCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                        >
                          {cuisine}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>

                {/* Rating */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Rating
                  </Heading>
                  <HStack spacing={2}>
                    {[4.5, 4.0, 3.5, 3.0].map(rating => (
                      <Button
                        key={rating}
                        onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
                        flex={1}
                        size="sm"
                        variant={ratingFilter === rating ? 'solid' : 'ghost'}
                        colorScheme={ratingFilter === rating ? 'orange' : 'gray'}
                        borderRadius="xl"
                        leftIcon={<Star size={14} />}
                      >
                        {rating}+
                      </Button>
                    ))}
                  </HStack>
                </Box>

                {/* Price Range */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Price Range
                  </Heading>
                  <VStack spacing={2}>
                    {['low', 'medium', 'high'].map(price => (
                      <Button
                        key={price}
                        onClick={() => setPriceFilter(priceFilter === price ? 'all' : price)}
                        w="100%"
                        size="sm"
                        variant={priceFilter === price ? 'solid' : 'ghost'}
                        colorScheme={priceFilter === price ? 'orange' : 'gray'}
                        borderRadius="xl"
                        justifyContent="space-between"
                      >
                        <Text textTransform="capitalize">{price}</Text>
                        <Text fontSize="xs" opacity={0.75}>
                          {price === 'low' && 'Under ₹300'}
                          {price === 'medium' && '₹300 - ₹600'}
                          {price === 'high' && 'Above ₹600'}
                        </Text>
                      </Button>
                    ))}
                  </VStack>
                </Box>

                {/* Dietary Preferences */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Dietary Preferences
                  </Heading>
                  <HStack spacing={2}>
                    {['veg', 'non-veg'].map(type => (
                      <Button
                        key={type}
                        onClick={() => setVegFilter(vegFilter === type ? 'all' : type)}
                        flex={1}
                        size="sm"
                        variant={vegFilter === type ? 'solid' : 'ghost'}
                        colorScheme={
                          vegFilter === type 
                            ? type === 'veg' ? 'green' : 'red'
                            : 'gray'
                        }
                        borderRadius="xl"
                      >
                        {type === 'veg' ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                      </Button>
                    ))}
                  </HStack>
                </Box>

                {/* Max Price Slider */}
                <Box>
                  <Heading as="h4" size="sm" mb={3} fontWeight="semibold">
                    Maximum Price (for two)
                  </Heading>
                  <Box>
                    <Slider
                      min={100}
                      max={2000}
                      step={100}
                      value={maxPrice}
                      onChange={(val) => setMaxPrice(val)}
                      colorScheme="orange"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb boxSize={6}>
                        <Box color="orange.500" as="span">₹</Box>
                      </SliderThumb>
                    </Slider>
                    <Flex justify="space-between" mt={2}>
                      <Text fontSize="xs" color="gray.500">₹100</Text>
                      <Text fontSize="sm" fontWeight="medium" color="orange.500">₹{maxPrice}</Text>
                      <Text fontSize="xs" color="gray.500">₹2000</Text>
                    </Flex>
                  </Box>
                </Box>

                {/* Clear Filters */}
                <Button
                  onClick={() => {
                    setSelectedCuisine('');
                    setRatingFilter(0);
                    setPriceFilter('all');
                    setSortBy('relevance');
                    setVegFilter('all');
                    setMaxPrice(1000);
                  }}
                  variant="outline"
                  colorScheme="orange"
                  borderWidth={2}
                  borderRadius="xl"
                  mt={4}
                >
                  Clear All Filters
                </Button>
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* New Section: Trending Dishes */}
        <Container maxW="7xl" py={8}>
          <SlideFade in={true} offsetY="20px">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
                Trending Dishes 🔥
              </Heading>
              <Button
                rightIcon={<ChevronRight size={16} />}
                variant="ghost"
                colorScheme="orange"
                size="sm"
              >
                View all
              </Button>
            </Flex>

            <Grid
              templateColumns={{
                base: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              }}
              gap={4}
            >
              {trendingDishes.map((dish, index) => (
                <ScaleFade key={dish.id} in={true} delay={index * 0.1}>
                  <Card
                    borderRadius="xl"
                    overflow="hidden"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      h="120px"
                      objectFit="cover"
                    />
                    <CardBody p={3}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {dish.name}
                      </Text>
                      <HStack mt={1} spacing={1}>
                        <Icon as={() => <Flame size={12} />} color="orange.500" />
                        <Text fontSize="xs" color="gray.500">
                          {dish.orders}
                        </Text>
                      </HStack>
                    </CardBody>
                  </Card>
                </ScaleFade>
              ))}
            </Grid>
          </SlideFade>
        </Container>

        {/* New Section: Popular Brands */}
        <Container maxW="7xl" py={4}>
          <Fade in={true}>
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
                Popular Brands 🏪
              </Heading>
              <Button
                rightIcon={<ChevronRight size={16} />}
                variant="ghost"
                colorScheme="orange"
                size="sm"
              >
                View all
              </Button>
            </Flex>

            <Grid
              templateColumns={{
                base: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              }}
              gap={4}
            >
              {popularBrands.map((brand, index) => (
                <ScaleFade key={brand.id} in={true} delay={index * 0.1}>
                  <Card
                    borderRadius="xl"
                    bgGradient="linear(to-br, orange.50, red.50)"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <CardBody p={4}>
                      <HStack spacing={4}>
                        <Avatar
                          src={brand.logo}
                          name={brand.name}
                          size="lg"
                          borderRadius="xl"
                        />
                        <Box>
                          <Text fontWeight="bold">{brand.name}</Text>
                          <Badge colorScheme="green" mt={1}>
                            {brand.discount}
                          </Badge>
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                </ScaleFade>
              ))}
            </Grid>
          </Fade>
        </Container>

        {/* New Section: Exclusive Offers */}
        <Container maxW="7xl" py={4}>
          <SlideFade in={true} offsetY="20px">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
                Exclusive Offers 🎁
              </Heading>
              <Button
                rightIcon={<ChevronRight size={16} />}
                variant="ghost"
                colorScheme="orange"
                size="sm"
              >
                View all
              </Button>
            </Flex>

            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={4}
            >
              {exclusiveOffers.map((offer, index) => (
                <ScaleFade key={offer.id} in={true} delay={index * 0.1}>
                  <Card
                    borderRadius="xl"
                    bgGradient="linear(to-r, purple.500, pink.500)"
                    color="white"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <CardBody>
                      <Icon as={() => <Gift size={24} />} mb={3} />
                      <Text fontSize="lg" fontWeight="bold" mb={1}>
                        {offer.title}
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" mb={2}>
                        {offer.discount}
                      </Text>
                      <Badge bg="whiteAlpha.300" color="white" mb={2}>
                        Code: {offer.code}
                      </Badge>
                      <Text fontSize="xs" opacity={0.8}>
                        {offer.validity}
                      </Text>
                    </CardBody>
                  </Card>
                </ScaleFade>
              ))}
            </Grid>
          </SlideFade>
        </Container>

        {/* Food Categories */}
        <Container maxW="7xl" py={4}>
          <Fade in={true}>
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
                What's on your mind?
              </Heading>
            </Flex>

            <Grid
              templateColumns={{
                base: 'repeat(4, 1fr)',
                md: 'repeat(8, 1fr)',
              }}
              gap={3}
            >
              {foodCategories.map((category, index) => (
                <ScaleFade key={category.id} in={true} delay={index * 0.05}>
                  <VStack
                    as="button"
                    onClick={() => filterByCuisine(category.name)}
                    spacing={2}
                    p={3}
                    borderRadius="2xl"
                    _hover={{ bg: 'white', boxShadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    <Box
                      w="12"
                      h="12"
                      bg={`${category.color}.100`}
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="2xl"
                      _groupHover={{ transform: 'scale(1.1)' }}
                    >
                      {category.icon}
                    </Box>
                    <Text fontSize="xs" fontWeight="medium" color="gray.600">
                      {category.name}
                    </Text>
                  </VStack>
                </ScaleFade>
              ))}
            </Grid>
          </Fade>
        </Container>

        {/* Featured Collections */}
        <Container maxW="7xl" py={4}>
          <Fade in={true}>
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
                Featured Collections
              </Heading>
              <Button
                as={Link}
                to="/collections"
                rightIcon={<ChevronRight size={16} />}
                variant="ghost"
                colorScheme="orange"
                size="sm"
              >
                View all
              </Button>
            </Flex>

            <Grid
              templateColumns={{
                base: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              }}
              gap={4}
            >
              {featuredCollections.map((collection, index) => (
                <ScaleFade key={collection.id} in={true} delay={index * 0.1}>
                  <Card
                    borderRadius="2xl"
                    textAlign="center"
                    _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <CardBody>
                      <Box
                        w="12"
                        h="12"
                        mx="auto"
                        mb={3}
                        bg={`${collection.color}.100`}
                        borderRadius="xl"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="2xl"
                      >
                        {collection.icon}
                      </Box>
                      <Heading as="h3" size="sm" mb={1}>
                        {collection.name}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        Discover new favorites
                      </Text>
                    </CardBody>
                  </Card>
                </ScaleFade>
              ))}
            </Grid>
          </Fade>
        </Container>

        {/* New Section: Quick Stats */}
      {/* New Section: Quick Stats */}
<Container maxW="7xl" py={4}>
  <Grid
    templateColumns={{
      base: 'repeat(2, 1fr)',
      md: 'repeat(4, 1fr)',
    }}
    gap={4}
  >
    <StatCard
      icon={<Zap size={24} />}
      label="Quick Delivery"
      value="30 min"
      change="15%"
      increase={true}
    />
    <StatCard
      icon={<Crown size={24} />}
      label="Premium Spots"
      value="50+"
      change="10"
      increase={true}
    />
    <StatCard
      icon={<Users size={24} />}
      label="Happy Customers"
      value="10k+"
      change="25%"
      increase={true}
    />
    <StatCard
      icon={<Leaf size={24} />}
      label="Pure Veg"
      value="100+"
      change="5"
      increase={true}
    />
  </Grid>
</Container>

        {/* Tabs and Controls */}
        <Container maxW="7xl" py={4}>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            justify="space-between"
            gap={4}
          >
            {/* Tabs */}
            <Tabs
              variant="soft-rounded"
              colorScheme="orange"
              onChange={(index) => {
                const tabs = ['all', 'nearby', 'top-rated', 'offers'];
                setActiveTab(tabs[index]);
              }}
            >
              <TabList bg="gray.100" p={1} borderRadius="xl">
                <Tab borderRadius="lg">All</Tab>
                <Tab borderRadius="lg">Nearby</Tab>
                <Tab borderRadius="lg">Top Rated</Tab>
                <Tab borderRadius="lg">Offers</Tab>
              </TabList>
            </Tabs>

            {/* Sort and View */}
            <HStack spacing={3}>
              {/* Sort Dropdown */}
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDown size={16} />}
                  leftIcon={<Sparkles size={16} />}
                  variant="outline"
                  borderRadius="xl"
                >
                  Sort by: {sortBy.replace('-', ' ')}
                </MenuButton>
                <MenuList>
                  {['relevance', 'rating', 'delivery-time', 'price-low', 'price-high'].map(option => (
                    <MenuItem
                      key={option}
                      onClick={() => setSortBy(option)}
                      textTransform="capitalize"
                    >
                      {option.replace('-', ' ')}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              {/* View Toggle */}
              <ButtonGroup isAttached variant="outline" borderRadius="xl">
                <IconButton
                  icon={
                    <Grid templateColumns="repeat(2, 1fr)" gap="1px" w={5} h={5}>
                      <Box w={2} h={2} bg={viewMode === 'grid' ? 'orange.500' : 'gray.400'} borderRadius="sm" />
                      <Box w={2} h={2} bg={viewMode === 'grid' ? 'orange.500' : 'gray.400'} borderRadius="sm" />
                      <Box w={2} h={2} bg={viewMode === 'grid' ? 'orange.500' : 'gray.400'} borderRadius="sm" />
                      <Box w={2} h={2} bg={viewMode === 'grid' ? 'orange.500' : 'gray.400'} borderRadius="sm" />
                    </Grid>
                  }
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'grid' ? 'orange' : 'gray'}
                  aria-label="Grid view"
                />
                <IconButton
                  icon={<List size={20} />}
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'list' ? 'orange' : 'gray'}
                  aria-label="List view"
                />
              </ButtonGroup>
            </HStack>
          </Flex>
        </Container>
        <Container maxW="7xl" py={8}>
  <MapWithNearbyRestaurants
    userLocation={userLocation}
    apiKey="aa5340f7ea7246bf862e89964c901398"
  />
</Container>

        {/* Main Content */}
        <Container maxW="7xl" py={8}>
          {/* Results Header */}
          <Flex justify="space-between" align="center" mb={6}>
            <Heading as="h2" size="lg" fontFamily="ClashDisplay" color="gray.800">
              {activeTab === 'all' && 'All Restaurants'}
              {activeTab === 'nearby' && 'Restaurants Near You'}
              {activeTab === 'top-rated' && 'Top Rated Restaurants'}
              {activeTab === 'offers' && 'Best Offers For You'}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
              {selectedCity && ` in ${selectedCity}`}
            </Text>
          </Flex>

          {/* Loading State */}
          {loading && (
            <VStack spacing={4} py={20}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="orange.500"
                size="xl"
              />
              <Text color="gray.600" animation="pulse 2s infinite">
                Finding the best restaurants for you...
              </Text>
            </VStack>
          )}

          {/* Error State */}
          {error && (
            <Alert status="error" borderRadius="2xl" p={8}>
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <Grid
                  templateColumns={{
                    base: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                    xl: 'repeat(4, 1fr)',
                  }}
                  gap={6}
                >
                  {filteredRestaurants.map(restaurant => (
                    <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                  ))}
                </Grid>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <VStack spacing={4} align="stretch">
                  {filteredRestaurants.map(restaurant => {
                    const distance = userLocation && restaurant.location?.latitude && restaurant.location?.longitude
                      ? calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          restaurant.location.latitude,
                          restaurant.location.longitude
                        ).toFixed(1)
                      : null;

                    return (
                      <Link to={`/restaurant/${restaurant._id}`} key={restaurant._id}>
                        <Card
                          direction={{ base: 'column', sm: 'row' }}
                          overflow="hidden"
                          borderRadius="2xl"
                          boxShadow="lg"
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl' }}
                          transition="all 0.2s"
                        >
                          <Image
                            objectFit="cover"
                            maxW={{ base: '100%', sm: '200px' }}
                            src={restaurant.image || `https://source.unsplash.com/200x200/?food,${restaurant.cuisine?.[0]}`}
                            alt={restaurant.name}
                          />

                          <Box flex="1" p={6}>
                            <Flex justify="space-between" align="start" mb={2}>
                              <Box>
                                <Heading as="h3" size="md" mb={1}>
                                  {restaurant.name}
                                </Heading>
                                <Text fontSize="sm" color="gray.500">
                                  {restaurant.cuisine?.join(' • ')} • ₹{(restaurant.avgPrice || 200)} for two
                                </Text>
                              </Box>
                              <Badge
                                bg="green.50"
                                px={2}
                                py={1}
                                borderRadius="lg"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                <Icon as={() => <Star size={14} />} color="yellow.400" fill="yellow.400" />
                                <Text fontWeight="semibold">{restaurant.rating || (4 + Math.random()).toFixed(1)}</Text>
                              </Badge>
                            </Flex>

                            {/* Info Row */}
                            <Wrap spacingX={4} spacingY={2} mb={4}>
                              <HStack spacing={1}>
                                <Icon as={() => <Timer size={16} />} color="gray.400" />
                                <Text fontSize="sm" color="gray.600">
                                  {(restaurant.deliveryTime || 25) + Math.floor(Math.random() * 15)}-{(restaurant.deliveryTime || 25) + 15 + Math.floor(Math.random() * 15)} min
                                </Text>
                              </HStack>
                              {distance && (
                                <HStack spacing={1}>
                                  <Icon as={() => <Navigation size={16} />} color="gray.400" />
                                  <Text fontSize="sm" color="gray.600">
                                    {distance} km
                                  </Text>
                                </HStack>
                              )}
                              {restaurant.location?.area && (
                                <HStack spacing={1}>
                                  <Icon as={() => <MapPin size={16} />} color="gray.400" />
                                  <Text fontSize="sm" color="gray.600">
                                    {restaurant.location.area}
                                  </Text>
                                </HStack>
                              )}
                            </Wrap>

                            {/* Offers */}
                            <Badge
                              bg="orange.50"
                              color="orange.500"
                              px={3}
                              py={2}
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              gap={2}
                              w="fit-content"
                            >
                              <Percent size={16} />
                              <Text fontSize="sm">50% off up to ₹100 • Free delivery • 20% off on first order</Text>
                            </Badge>
                          </Box>

                          {/* Arrow */}
                          <Flex
                            display={{ base: 'none', sm: 'flex' }}
                            align="center"
                            pr={6}
                          >
                            <Icon as={() => <ChevronRight size={24} />} color="gray.400" />
                          </Flex>
                        </Card>
                      </Link>
                    );
                  })}
                </VStack>
              )}

              {/* Empty State */}
              {filteredRestaurants.length === 0 && (
                <VStack spacing={4} py={20}>
                  <Box
                    w="24"
                    h="24"
                    bg="gray.100"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={() => <Search size={32} />} color="gray.400" />
                  </Box>
                  <Heading as="h3" size="md" color="gray.800">
                    No restaurants found
                  </Heading>
                  <Text color="gray.500">Try adjusting your filters or search terms</Text>
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCuisine('');
                      setRatingFilter(0);
                      setPriceFilter('all');
                      setActiveTab('all');
                      setVegFilter('all');
                      setMaxPrice(1000);
                    }}
                    colorScheme="orange"
                    bgGradient="linear(to-r, orange.500, pink.500)"
                    _hover={{
                      bgGradient: 'linear(to-r, orange.600, pink.600)',
                    }}
                    mt={4}
                  >
                    Reset Filters
                  </Button>
                </VStack>
              )}
            </>
          )}
        </Container>

        {/* New Section: Why Choose Us */}
        <Box bg="white" py={16} mt={20}>
          <Container maxW="7xl">
            <VStack spacing={12}>
              <Heading
                as="h2"
                size="xl"
                fontFamily="ClashDisplay"
                textAlign="center"
                bgGradient="linear(to-r, orange.500, pink.500)"
                bgClip="text"
              >
                Why Choose Resto?
              </Heading>

              <Grid
                templateColumns={{
                  base: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                }}
                gap={8}
              >
                <FeatureCard
                  icon={<Bike size={32} />}
                  title="Lightning Fast Delivery"
                  description="Get your food delivered in 30 minutes or less"
                />
                <FeatureCard
                  icon={<Shield size={32} />}
                  title="Quality Assured"
                  description="We ensure the highest quality and hygiene standards"
                />
                <FeatureCard
                  icon={<Award size={32} />}
                  title="Best Restaurants"
                  description="Curated selection of top-rated restaurants"
                />
                <FeatureCard
                  icon={<Percent size={32} />}
                  title="Great Offers"
                  description="Exclusive deals and discounts every day"
                />
              </Grid>
            </VStack>
          </Container>
        </Box>

        {/* Footer */}
        <Box bg="gray.900" color="white" py={12}>
          <Container maxW="7xl">
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={8}
            >
              <Box>
                <Heading as="h4" size="md" mb={4} fontFamily="ClashDisplay">
                  About FoodDelight
                </Heading>
                <VStack align="start" spacing={2}>
                  {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                    <Link key={item} to={`/${item.toLowerCase().replace(' ', '-')}`}>
                      <Text color="gray.400" _hover={{ color: 'white' }}>
                        {item}
                      </Text>
                    </Link>
                  ))}
                </VStack>
              </Box>
              <Box>
                <Heading as="h4" size="md" mb={4} fontFamily="ClashDisplay">
                  For Restaurants
                </Heading>
                <VStack align="start" spacing={2}>
                  {['Partner With Us', 'Apps For Business'].map(item => (
                    <Link key={item} to={`/${item.toLowerCase().replace(' ', '-')}`}>
                      <Text color="gray.400" _hover={{ color: 'white' }}>
                        {item}
                      </Text>
                    </Link>
                  ))}
                </VStack>
              </Box>
              <Box>
                <Heading as="h4" size="md" mb={4} fontFamily="ClashDisplay">
                  Learn More
                </Heading>
                <VStack align="start" spacing={2}>
                  {['Privacy', 'Security', 'Terms', 'Sitemap'].map(item => (
                    <Link key={item} to={`/${item.toLowerCase()}`}>
                      <Text color="gray.400" _hover={{ color: 'white' }}>
                        {item}
                      </Text>
                    </Link>
                  ))}
                </VStack>
              </Box>
              <Box>
                <Heading as="h4" size="md" mb={4} fontFamily="ClashDisplay">
                  Contact Us
                </Heading>
                <VStack align="start" spacing={2}>
                  {['Help & Support', 'Partner Support'].map(item => (
                    <Link key={item} to={`/${item.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}>
                      <Text color="gray.400" _hover={{ color: 'white' }}>
                        {item}
                      </Text>
                    </Link>
                  ))}
                </VStack>
              </Box>
            </Grid>
            <Divider borderColor="gray.800" my={8} />
            <Text textAlign="center" color="gray.400">
              &copy; 2024 FoodDelight. All rights reserved.
            </Text>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, change, increase }) => (
  <Card borderRadius="xl" bg="white" boxShadow="sm">
    <CardBody>
      <HStack spacing={4}>
        <Box
          w="12"
          h="12"
          bg="orange.100"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="orange.500"
        >
          {icon}
        </Box>
        <Stat>
          <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
            {label}
          </StatLabel>
          <StatNumber fontSize="xl" fontWeight="bold" color="gray.800">
            {value}
          </StatNumber>
          <StatHelpText fontSize="xs" mb={0} display="flex" alignItems="center">
            <StatArrow type={increase ? 'increase' : 'decrease'} />
            {change}
          </StatHelpText>
        </Stat>
      </HStack>
    </CardBody>
  </Card>
);

const FeatureCard = ({ icon, title, description }) => (
  <VStack
    p={6}
    bg="gray.50"
    borderRadius="2xl"
    textAlign="center"
    spacing={4}
    _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
    transition="all 0.2s"
  >
    <Box
      w="16"
      h="16"
      bg="orange.100"
      borderRadius="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="orange.500"
    >
      {icon}
    </Box>
    <Heading as="h3" size="md" fontFamily="ClashDisplay">
      {title}
    </Heading>
    <Text color="gray.600" fontSize="sm">
      {description}
    </Text>
  </VStack>
);

export default CustomerHomePage;