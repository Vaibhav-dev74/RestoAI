// pages/RestaurantDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Image,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  Badge,
  Card,
  CardBody,
  CardFooter,
  Stack,
  HStack,
  VStack,
  SimpleGrid,
  Grid,
  GridItem,
  Divider,
  useBreakpointValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  Wrap,
  WrapItem,
  Spinner,
  Center,
  Circle,
  AspectRatio,
  Avatar,
  AvatarGroup,
  Progress,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Tooltip,
  useToast,
  Icon,
  Fade,
  ScaleFade,
  Slide,
  SlideFade,
  Collapse,
  useColorModeValue,
  AbsoluteCenter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
} from '@chakra-ui/react';

// Icons from lucide-react
import {
  Star,
  MapPin,
  ChevronLeft,
  Heart,
  Share2,
  Info,
  IndianRupee,
  Minus,
  Plus,
  ShoppingBag,
  Percent,
  Navigation,
  Bike,
  Shield,
  Award,
  X,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Utensils,
  Flame,
  ThumbsUp,
  MessageCircle,
  Truck,
  Wallet,
  Timer,
  TrendingUp,
  Award as AwardIcon,
  Medal,
  Crown
} from 'lucide-react';

const RestaurantDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isCartOpen, onOpen: onCartOpen, onClose: onCartClose } = useDisclosure();
  const { isOpen: isAddressOpen, onOpen: onAddressOpen, onClose: onAddressClose } = useDisclosure();
  const { isOpen: isDishOpen, onOpen: onDishOpen, onClose: onDishClose } = useDisclosure();
  const { isOpen: isReviewsOpen, onToggle: onReviewsToggle } = useDisclosure();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [trendingDishes, setTrendingDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [vegFilter, setVegFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [orderType, setOrderType] = useState('delivery');
  const [dishLoading, setDishLoading] = useState(false);
  const [dishError, setDishError] = useState('');
  const [restaurantRating, setRestaurantRating] = useState(4.2);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [useDishesAsMenu, setUseDishesAsMenu] = useState(false);

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  const containerPadding = useBreakpointValue({ base: 4, md: 6, lg: 8 });
  
  // Color mode values
  const bgGradient = useColorModeValue(
    'linear(to-br, gray.50, white, gray.50)',
    'linear(to-br, gray.900, gray.800, gray.900)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  
  const VITE_API_URL = API_BASE_URL;
  const token = localStorage.getItem('token');

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchDishes();
    fetchTrendingDishes();
    fetchReviews();

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

    const savedCart = localStorage.getItem(`cart_${id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));

    if (user?.addresses && user.addresses.length > 0) {
      setDeliveryAddress(user.addresses[0].address);
    }
  }, [id, user]);
// Add this function in your component
const onCartToggle = () => {
  if (isCartOpen) {
    onCartClose();
  } else {
    onCartOpen();
  }
};
  // API: GET restaurant details
  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/restaurants/${id}`);
      
      const restaurantData = response.data.data || response.data;
      setRestaurant(restaurantData);
      
      if (restaurantData.menu && restaurantData.menu.length > 0) {
        setMenu(restaurantData.menu);
        setUseDishesAsMenu(false);
      }
    } catch (err) {
      setError('Could not fetch restaurant details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // API: GET all dishes from /api/orders/dishes
  const fetchDishes = async () => {
    setDishLoading(true);
    setDishError('');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `${VITE_API_URL}/api/orders/dishes`,
        { headers }
      );
      
      const dishesData = res.data.data || res.data;
      setDishes(dishesData);
      
      if (dishesData.length > 0) {
        const hasValidDishes = dishesData.some(dish => dish.name && dish.price);
        
        if (hasValidDishes) {
          setMenu(dishesData);
          setUseDishesAsMenu(true);
        }
      }
      
    } catch (err) {
      setDishError('Could not load dishes');
      console.error('Error fetching dishes:', err);
    } finally {
      setDishLoading(false);
    }
  };

  // API: Get trending dishes
  const fetchTrendingDishes = async () => {
    try {
      if (token) {
        const ordersRes = await axios.get(`${VITE_API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const ordersData = ordersRes.data.data || ordersRes.data;
        const dishCounts = {};
        
        ordersData.forEach(order => {
          order.items?.forEach(item => {
            dishCounts[item.name] = (dishCounts[item.name] || 0) + (item.quantity || 1);
          });
        });
        
        const trending = Object.entries(dishCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        
        setTrendingDishes(trending);
      }
    } catch (err) {
      console.error('Error fetching trending dishes:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const mockReviews = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        user: `Customer ${i + 1}`,
        rating: (4 + Math.random()).toFixed(1),
        comment: "Amazing food! Great ambiance and quick service. Will definitely visit again.",
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        likes: Math.floor(Math.random() * 50),
        avatar: `https://ui-avatars.com/api/?name=Customer+${i + 1}&background=6366f1&color=fff`,
        images: i % 4 === 0 ? ['/images/food1.jpg', '/images/food2.jpg'] : []
      }));
      setReviews(mockReviews);
      setTotalReviews(mockReviews.length);
      
      const avgRating = mockReviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / mockReviews.length;
      setRestaurantRating(avgRating.toFixed(1));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const addToCart = (item) => {
    const newCart = { ...cart };
    if (newCart[item._id]) {
      newCart[item._id].quantity += 1;
    } else {
      newCart[item._id] = {
        ...item,
        quantity: 1,
        specialInstructions: ''
      };
    }
    setCart(newCart);
    localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
    
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart`,
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right',
    });
  };

  const removeFromCart = (itemId) => {
    const newCart = { ...cart };
    if (newCart[itemId].quantity > 1) {
      newCart[itemId].quantity -= 1;
    } else {
      delete newCart[itemId];
    }
    setCart(newCart);
    localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
  };

  const updateSpecialInstructions = (itemId, instructions) => {
    const newCart = { ...cart };
    if (newCart[itemId]) {
      newCart[itemId].specialInstructions = instructions;
      setCart(newCart);
      localStorage.setItem(`cart_${id}`, JSON.stringify(newCart));
    }
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((count, item) => count + item.quantity, 0);
  };

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

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (isFavorite) {
      const newFavorites = favorites.filter(favId => favId !== id);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      toast({
        title: 'Removed from favorites',
        status: 'info',
        duration: 2000,
      });
    } else {
      favorites.push(id);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      toast({
        title: 'Added to favorites',
        status: 'success',
        duration: 2000,
      });
    }
    setIsFavorite(!isFavorite);
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to proceed to checkout',
        status: 'warning',
        duration: 3000,
      });
      navigate('/customer-login');
      return;
    }
    navigate('/checkout', { 
      state: { 
        restaurantId: id,
        restaurant,
        cart,
        total: getCartTotal(),
        itemCount: getCartItemCount()
      } 
    });
  };

  const filterMenuItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.filter(item => {
      if (searchTerm && item.name && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (vegFilter === 'veg' && item.isVeg === false) return false;
      if (vegFilter === 'non-veg' && item.isVeg === true) return false;
      
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'popular') return ((b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      return 0;
    });
  };

  const menuItems = menu.length > 0 ? menu : [];
  
  const getCategories = () => {
    if (menuItems.length === 0) return ['all'];
    
    const cats = menuItems
      .map(item => item.category || 'Uncategorized')
      .filter(category => category && typeof category === 'string');
    
    return ['all', ...new Set(cats)];
  };
  
  const categories = getCategories();

  const distance = userLocation && restaurant?.location?.coordinates
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.location.coordinates[1],
        restaurant.location.coordinates[0]
      ).toFixed(1)
    : null;

  if (loading) {
    return (
      <Center minH="100vh" bgGradient={bgGradient}>
        <VStack spacing={4}>
          <Box position="relative">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="orange.500"
              size="xl"
            />
            <AbsoluteCenter>
              <Circle size="12" bg="orange.100" opacity={0.5} />
            </AbsoluteCenter>
          </Box>
          <Text color={mutedColor} className="sfpro-font">
            Loading restaurant details...
          </Text>
        </VStack>
      </Center>
    );
  }

  if (error || !restaurant) {
    return (
      <Center minH="100vh" bgGradient={bgGradient} p={4}>
        <Card bg={cardBg} borderRadius="2xl" maxW="md" w="full">
          <CardBody textAlign="center" p={8}>
            <Circle size="20" bg="red.100" mx="auto" mb={4}>
              <Icon as={AlertCircle} boxSize={10} color="red.500" />
            </Circle>
            <Heading size="lg" mb={2} className="clash-font">
              Oops! Something went wrong
            </Heading>
            <Text color={mutedColor} mb={6} className="sfpro-font">
              {error || 'Restaurant not found'}
            </Text>
            <Button
              onClick={() => navigate('/')}
              bgGradient="linear(to-r, orange.500, pink.500)"
              color="white"
              size="lg"
              _hover={{ shadow: 'lg' }}
              className="sfpro-font"
            >
              Back to Home
            </Button>
          </CardBody>
        </Card>
      </Center>
    );
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
    >
      {/* Background decorative elements */}
      <Box position="fixed" inset={0} overflow="hidden" pointerEvents="none">
        <Circle
          size="80"
          bgGradient="linear(to-br, orange.200, pink.200)"
          opacity={0.2}
          filter="blur(60px)"
          position="absolute"
          top="-20"
          right="-20"
        />
        <Circle
          size="80"
          bgGradient="linear(to-br, blue.200, purple.200)"
          opacity={0.2}
          filter="blur(60px)"
          position="absolute"
          bottom="-20"
          left="-20"
        />
      </Box>

      {/* Header */}
      <Box
        as="header"
        position="sticky"
        top={0}
        zIndex={40}
        bg="whiteAlpha.800"
        backdropFilter="blur(10px)"
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Container maxW="1920px" px={containerPadding} py={3}>
          <Flex justify="space-between" align="center">
            <IconButton
              aria-label="Go back"
              icon={<ChevronLeft size={20} />}
              variant="ghost"
              borderRadius="xl"
              onClick={() => navigate(-1)}
            />
            
            <HStack spacing={2}>
              <IconButton
                aria-label="Add to favorites"
                icon={
                  <Heart
                    size={20}
                    fill={isFavorite ? 'currentColor' : 'none'}
                  />
                }
                variant="ghost"
                borderRadius="xl"
                colorScheme={isFavorite ? 'red' : 'gray'}
                onClick={toggleFavorite}
              />
              <IconButton
                aria-label="Share"
                icon={<Share2 size={20} />}
                variant="ghost"
                borderRadius="xl"
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box position="relative" h={{ base: 64, sm: 80, md: 96 }} overflow="hidden">
        <Image
          src={restaurant.image || restaurant.coverImage || `https://source.unsplash.com/1200x400/?restaurant,${restaurant.cuisine?.[0] || 'food'}`}
          alt={restaurant.name}
          w="100%"
          h="100%"
          objectFit="cover"
        />
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-t, blackAlpha.700, blackAlpha.300, transparent)"
        />
        
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={{ base: 4, sm: 6, md: 8 }}
        >
          <Container maxW="1920px">
            <Wrap spacing={2} mb={3}>
              {restaurant.isVeg && (
                <Tag colorScheme="green" size="sm" borderRadius="full">
                  🌱 Pure Veg
                </Tag>
              )}
              {restaurant.isPremium && (
                <Tag bgGradient="linear(to-r, amber.500, yellow.500)" color="white" size="sm" borderRadius="full">
                  ⭐ Premium
                </Tag>
              )}
              <Tag
                colorScheme={isOpen ? 'green' : 'red'}
                size="sm"
                borderRadius="full"
              >
                {isOpen ? 'Open Now' : 'Closed'}
              </Tag>
            </Wrap>
            <Heading
              as="h1"
              size={headingSize}
              color="white"
              mb={2}
              className="clash-font"
            >
              {restaurant.name}
            </Heading>
            <Text color="gray.200" className="sfpro-font">
              {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(' • ') : restaurant.cuisine || 'Various Cuisines'}
            </Text>
          </Container>
        </Box>
      </Box>

      {/* Restaurant Info Bar */}
      <Container maxW="1920px" px={containerPadding} mt={{ base: -8, md: -12 }}>
        <Card bg={cardBg} borderRadius="2xl" shadow="xl" p={{ base: 4, md: 6 }}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <HStack spacing={3}>
              <Circle size="10" bg="yellow.100">
                <Icon as={Star} boxSize={5} color="yellow.500" />
              </Circle>
              <Box>
                <Text fontSize="xs" color={mutedColor}>Rating</Text>
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  {restaurant.rating || restaurantRating} ({restaurant.totalReviews || totalReviews}+)
                </Text>
              </Box>
            </HStack>
            
            <HStack spacing={3}>
              <Circle size="10" bg="blue.100">
                <Icon as={Timer} boxSize={5} color="blue.500" />
              </Circle>
              <Box>
                <Text fontSize="xs" color={mutedColor}>Delivery Time</Text>
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  {restaurant.deliveryTime || 25}-40 min
                </Text>
              </Box>
            </HStack>
            
            <HStack spacing={3}>
              <Circle size="10" bg="green.100">
                <Icon as={IndianRupee} boxSize={5} color="green.500" />
              </Circle>
              <Box>
                <Text fontSize="xs" color={mutedColor}>Cost for two</Text>
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  ₹{restaurant.avgPrice || 300}
                </Text>
              </Box>
            </HStack>
            
            <HStack spacing={3}>
              <Circle size="10" bg="purple.100">
                <Icon as={Navigation} boxSize={5} color="purple.500" />
              </Circle>
              <Box>
                <Text fontSize="xs" color={mutedColor}>Distance</Text>
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  {distance ? `${distance} km` : 'Available'}
                </Text>
              </Box>
            </HStack>
          </SimpleGrid>
        </Card>
      </Container>

      {/* Trending Dishes Section */}
      {trendingDishes.length > 0 && (
        <Container maxW="1920px" px={containerPadding} py={8}>
          <Box
            bgGradient="linear(to-r, orange.500, pink.500)"
            borderRadius="2xl"
            shadow="xl"
            p={6}
          >
            <HStack spacing={3} mb={4}>
              <Icon as={TrendingUp} boxSize={6} color="white" />
              <Heading size="lg" color="white" className="clash-font">
                Trending Now
              </Heading>
            </HStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {trendingDishes.map((dish, index) => (
                <Box
                  key={index}
                  bg="whiteAlpha.200"
                  backdropFilter="blur(8px)"
                  borderRadius="xl"
                  p={3}
                  borderWidth="1px"
                  borderColor="whiteAlpha.300"
                >
                  <HStack spacing={2} mb={1}>
                    {index === 0 && <Icon as={Crown} boxSize={4} color="yellow.300" />}
                    {index === 1 && <Icon as={Medal} boxSize={4} color="gray.300" />}
                    {index === 2 && <Icon as={AwardIcon} boxSize={4} color="amber.600" />}
                    <Text color="white" fontWeight="medium" className="sfpro-font">
                      {dish.name}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="whiteAlpha.800" className="sfpro-font">
                    {dish.count} orders today
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </Container>
      )}

      {/* Location and Offers */}
      <Container maxW="1920px" px={containerPadding} py={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            bg={cardBg}
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            cursor="pointer"
            onClick={onAddressOpen}
            _hover={{ shadow: 'md' }}
            transition="all 0.2s"
          >
            <HStack spacing={3} align="flex-start">
              <Icon as={MapPin} boxSize={5} color="orange.500" mt={1} />
              <Box>
                <Text fontSize="xs" color={mutedColor} mb={1}>
                  Delivery Address
                </Text>
                <Text fontSize="sm" color={textColor} className="sfpro-font">
                  {deliveryAddress || 'Add delivery address'}
                </Text>
                {!deliveryAddress && (
                  <Text fontSize="xs" color="orange.500" mt={1}>
                    Click to add address
                  </Text>
                )}
              </Box>
            </HStack>
          </Box>

          <Box
            bgGradient="linear(to-r, orange.50, pink.50)"
            borderRadius="xl"
            p={4}
            borderWidth="1px"
            borderColor="orange.200"
          >
            <HStack spacing={3} align="flex-start">
              <Icon as={Percent} boxSize={5} color="orange.500" mt={1} />
              <Box flex={1}>
                <Text fontSize="xs" color={mutedColor} mb={2}>
                  Available Offers
                </Text>
                <Wrap spacing={2}>
                  <Tag colorScheme="orange" size="sm" borderRadius="full">
                    50% off up to ₹100
                  </Tag>
                  <Tag colorScheme="orange" size="sm" borderRadius="full">
                    Free delivery
                  </Tag>
                  <Tag colorScheme="orange" size="sm" borderRadius="full">
                    20% off on first order
                  </Tag>
                </Wrap>
              </Box>
            </HStack>
          </Box>
        </SimpleGrid>
      </Container>

      {/* Order Type Selection */}
      <Container maxW="1920px" px={containerPadding} pb={4}>
        <HStack
          spacing={1}
          bg="gray.100"
          p={1}
          borderRadius="xl"
          w="fit-content"
        >
          <Button
            onClick={() => setOrderType('delivery')}
            variant={orderType === 'delivery' ? 'solid' : 'ghost'}
            colorScheme={orderType === 'delivery' ? 'orange' : 'gray'}
            borderRadius="lg"
            leftIcon={<Truck size={16} />}
            size={buttonSize}
            className="sfpro-font"
          >
            Delivery
          </Button>
          <Button
            onClick={() => setOrderType('pickup')}
            variant={orderType === 'pickup' ? 'solid' : 'ghost'}
            colorScheme={orderType === 'pickup' ? 'orange' : 'gray'}
            borderRadius="lg"
            leftIcon={<Wallet size={16} />}
            size={buttonSize}
            className="sfpro-font"
          >
            Pickup
          </Button>
        </HStack>
      </Container>

      {/* Quick Info Chips */}
      <Container maxW="1920px" px={containerPadding} pb={6}>
        <Wrap spacing={3}>
          <Tag
            colorScheme="blue"
            borderRadius="xl"
            py={2}
            px={4}
            size="lg"
          >
            <HStack spacing={2}>
              <Icon as={Bike} boxSize={4} />
              <Text className="sfpro-font">Free delivery above ₹199</Text>
            </HStack>
          </Tag>
          <Tag
            colorScheme="green"
            borderRadius="xl"
            py={2}
            px={4}
            size="lg"
          >
            <HStack spacing={2}>
              <Icon as={Shield} boxSize={4} />
              <Text className="sfpro-font">Hygiene certified</Text>
            </HStack>
          </Tag>
          <Tag
            colorScheme="purple"
            borderRadius="xl"
            py={2}
            px={4}
            size="lg"
          >
            <HStack spacing={2}>
              <Icon as={Award} boxSize={4} />
              <Text className="sfpro-font">
                Popular in {restaurant.address?.city || 'your area'}
              </Text>
            </HStack>
          </Tag>
        </Wrap>
      </Container>

      {/* Menu Section */}
      <Container maxW="1920px" px={containerPadding} py={6}>
        <Card bg={cardBg} borderRadius="2xl" shadow="lg" overflow="hidden">
          {/* Menu Header with Filters */}
          <Box p={{ base: 4, md: 6 }} borderBottomWidth="1px" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <Flex
                direction={{ base: 'column', sm: 'row' }}
                justify="space-between"
                align={{ base: 'stretch', sm: 'center' }}
                gap={4}
              >
                <HStack>
                  <Heading size="lg" color={textColor} className="clash-font">
                    Our Menu
                  </Heading>
                  {dishLoading && (
                    <Spinner size="sm" color="orange.500" />
                  )}
                  {useDishesAsMenu && menuItems.length > 0 && (
                    <Tag colorScheme="green" size="sm" borderRadius="full">
                      {menuItems.length} items
                    </Tag>
                  )}
                </HStack>
                
                <Button
                  display={{ base: 'flex', md: 'none' }}
                  leftIcon={<Filter size={16} />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                >
                  Filters
                </Button>
              </Flex>

              {/* Search and Filter Bar */}
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                <InputGroup flex={1}>
                  <InputLeftElement>
                    <Icon as={Search} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search in menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="xl"
                    className="sfpro-font"
                  />
                </InputGroup>
                
                <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
                  <Box position="relative">
                    <Select
                      value={vegFilter}
                      onChange={(e) => setVegFilter(e.target.value)}
                      w="40"
                      borderRadius="xl"
                      className="sfpro-font"
                    >
                      <option value="all">All Items</option>
                      <option value="veg">Veg Only</option>
                      <option value="non-veg">Non-Veg Only</option>
                    </Select>
                  </Box>

                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    w="40"
                    borderRadius="xl"
                    className="sfpro-font"
                  >
                    <option value="popular">Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </Select>
                </HStack>
              </Stack>

              {/* Mobile Filters Panel */}
              <Collapse in={showFilters} animateOpacity>
                <Box mt={3} p={4} bg="gray.50" borderRadius="xl">
                  <VStack spacing={3}>
                    <Box w="100%">
                      <Text fontSize="sm" fontWeight="medium" mb={2} className="sfpro-font">
                        Veg/Non-Veg
                      </Text>
                      <Select
                        value={vegFilter}
                        onChange={(e) => setVegFilter(e.target.value)}
                        borderRadius="lg"
                        size="sm"
                      >
                        <option value="all">All Items</option>
                        <option value="veg">Veg Only</option>
                        <option value="non-veg">Non-Veg Only</option>
                      </Select>
                    </Box>

                    <Box w="100%">
                      <Text fontSize="sm" fontWeight="medium" mb={2} className="sfpro-font">
                        Sort By
                      </Text>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        borderRadius="lg"
                        size="sm"
                      >
                        <option value="popular">Popular</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </Select>
                    </Box>

                    <Button
                      w="100%"
                      colorScheme="orange"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </VStack>
                </Box>
              </Collapse>
            </VStack>
          </Box>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <Box borderBottomWidth="1px" borderColor={borderColor} overflowX="auto">
              <HStack spacing={0} px={6}>
                {categories.map(category => {
                  const categoryItems = menuItems.filter(item => 
                    category === 'all' ? true : (item.category || 'Uncategorized') === category
                  );
                  const filteredItems = filterMenuItems(categoryItems);
                  
                  if (filteredItems.length === 0 && category !== 'all') return null;
                  
                  return (
                    <Button
                      key={category}
                      variant="unstyled"
                      onClick={() => setSelectedCategory(category)}
                      px={4}
                      py={3}
                      borderBottomWidth="2px"
                      borderColor={selectedCategory === category ? 'orange.500' : 'transparent'}
                      color={selectedCategory === category ? 'orange.500' : mutedColor}
                      fontWeight="medium"
                      fontSize="sm"
                      whiteSpace="nowrap"
                      textTransform="capitalize"
                      className="sfpro-font"
                      _hover={{ color: textColor }}
                    >
                      {category === 'all' ? 'All Items' : category}
                    </Button>
                  );
                })}
              </HStack>
            </Box>
          )}

          {/* Menu Items */}
          <Box
            p={{ base: 4, md: 6 }}
            maxH="600px"
            overflowY="auto"
            className="custom-scrollbar"
          >
            {dishError && (
              <VStack spacing={4} py={12}>
                <Icon as={AlertCircle} boxSize={12} color="red.500" />
                <Text color="red.500" className="sfpro-font">{dishError}</Text>
              </VStack>
            )}

            {menuItems.length === 0 && !dishLoading ? (
              <VStack spacing={4} py={12}>
                <Icon as={Utensils} boxSize={12} color="gray.300" />
                <Text color={mutedColor} className="sfpro-font">
                  No menu items available
                </Text>
              </VStack>
            ) : (
              (selectedCategory === 'all' ? categories.filter(c => c !== 'all') : [selectedCategory]).map(category => {
                const categoryItems = menuItems.filter(item => 
                  (item.category || 'Uncategorized') === category
                );
                const filteredItems = filterMenuItems(categoryItems);
                
                if (filteredItems.length === 0) return null;
                
                return (
                  <Box key={category} mb={8}>
                    <Heading size="md" mb={4} textTransform="capitalize" className="clash-font">
                      {category}
                    </Heading>
                    
                    <VStack spacing={4} align="stretch">
                      {filteredItems.map(item => (
                        <Card
                          key={item._id}
                          direction={{ base: 'column', sm: 'row' }}
                          bg="gray.50"
                          borderRadius="xl"
                          overflow="hidden"
                          _hover={{ shadow: 'md' }}
                          transition="all 0.2s"
                        >
                          <Box flex={1} p={4}>
                            <Wrap spacing={2} mb={2}>
                              {item.isVeg !== undefined && (
                                <Tag
                                  size="sm"
                                  colorScheme={item.isVeg ? 'green' : 'red'}
                                  borderRadius="full"
                                >
                                  {item.isVeg ? '🌱 Veg' : '🍗 Non-Veg'}
                                </Tag>
                              )}
                              {item.spicy && (
                                <Tag size="sm" colorScheme="red" borderRadius="full">
                                  <HStack spacing={1}>
                                    <Flame size={12} />
                                    <span>Spicy</span>
                                  </HStack>
                                </Tag>
                              )}
                              {item.popular && (
                                <Tag size="sm" colorScheme="orange" borderRadius="full">
                                  <HStack spacing={1}>
                                    <ThumbsUp size={12} />
                                    <span>Popular</span>
                                  </HStack>
                                </Tag>
                              )}
                            </Wrap>
                            
                            <Heading size="md" mb={1} color={textColor} className="sfpro-font">
                              {item.name}
                            </Heading>
                            {item.description && (
                              <Text fontSize="sm" color={mutedColor} mb={2} className="sfpro-font">
                                {item.description}
                              </Text>
                            )}
                            
                            <HStack spacing={3} mb={2}>
                              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                ₹{item.price}
                              </Text>
                            </HStack>
                            
                            <Button
                              variant="link"
                              colorScheme="orange"
                              size="sm"
                              leftIcon={<Info size={14} />}
                              onClick={() => {
                                setSelectedDish(item);
                                onDishOpen();
                              }}
                              className="sfpro-font"
                            >
                              View details
                            </Button>
                          </Box>

                          <Box position="relative" p={4}>
                            <AspectRatio ratio={1} w={{ base: 'full', sm: 24 }}>
                              <Image
                                src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`}
                                alt={item.name}
                                borderRadius="xl"
                                objectFit="cover"
                                fallbackSrc="https://via.placeholder.com/200"
                              />
                            </AspectRatio>
                            
                            {cart[item._id] ? (
                              <HStack
                                position="absolute"
                                bottom={0}
                                left="50%"
                                transform="translateX(-50%)"
                                bg="white"
                                borderRadius="full"
                                shadow="lg"
                                borderWidth="1px"
                                borderColor="gray.200"
                                spacing={0}
                                p={1}
                              >
                                <IconButton
                                  aria-label="Decrease quantity"
                                  icon={<Minus size={14} />}
                                  size="xs"
                                  colorScheme="orange"
                                  borderRadius="full"
                                  onClick={() => removeFromCart(item._id)}
                                />
                                <Text fontSize="sm" fontWeight="semibold" w={8} textAlign="center">
                                  {cart[item._id].quantity}
                                </Text>
                                <IconButton
                                  aria-label="Increase quantity"
                                  icon={<Plus size={14} />}
                                  size="xs"
                                  colorScheme="orange"
                                  borderRadius="full"
                                  onClick={() => addToCart(item)}
                                />
                              </HStack>
                            ) : (
                              <Button
                                position="absolute"
                                bottom={0}
                                left="50%"
                                transform="translateX(-50%)"
                                size="xs"
                                bgGradient="linear(to-r, orange.500, pink.500)"
                                color="white"
                                borderRadius="full"
                                shadow="lg"
                                _hover={{ shadow: 'xl' }}
                                onClick={() => addToCart(item)}
                                className="sfpro-font"
                              >
                                ADD
                              </Button>
                            )}
                          </Box>
                        </Card>
                      ))}
                    </VStack>
                  </Box>
                );
              })
            )}
          </Box>
        </Card>
      </Container>

      {/* Reviews Section */}
      <Container maxW="1920px" px={containerPadding} py={6}>
        <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg" color={textColor} className="clash-font">
              Customer Reviews
            </Heading>
            <Button
              variant="link"
              colorScheme="orange"
              onClick={onReviewsToggle}
              className="sfpro-font"
            >
              {isReviewsOpen ? 'Show less' : 'View all reviews'}
            </Button>
          </Flex>

          {/* Rating Summary */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
            <Box textAlign={{ base: 'center', md: 'left' }}>
              <Text fontSize="5xl" fontWeight="bold" color={textColor} className="clash-font">
                {restaurant.rating || restaurantRating}
              </Text>
              <HStack spacing={1} justify={{ base: 'center', md: 'flex-start' }} mb={2}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Icon
                    key={star}
                    as={Star}
                    boxSize={5}
                    color={star <= Math.floor(restaurant.rating || restaurantRating) ? 'yellow.400' : 'gray.300'}
                    fill={star <= Math.floor(restaurant.rating || restaurantRating) ? 'yellow.400' : 'none'}
                  />
                ))}
              </HStack>
              <Text fontSize="sm" color={mutedColor} className="sfpro-font">
                Based on {restaurant.totalReviews || totalReviews} ratings
              </Text>
            </Box>

            <VStack spacing={2} align="stretch">
              {[5, 4, 3, 2, 1].map(rating => (
                <HStack key={rating} spacing={2} fontSize="sm">
                  <Text w={12} color={mutedColor} className="sfpro-font">{rating} star</Text>
                  <Box flex={1} h={2} bg="gray.200" borderRadius="full" overflow="hidden">
                    <Box
                      h="full"
                      bgGradient="linear(to-r, orange.400, pink.500)"
                      borderRadius="full"
                      w={`${Math.random() * 100}%`}
                    />
                  </Box>
                  <Text w={12} color={mutedColor} className="sfpro-font">
                    {Math.floor(Math.random() * 200)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </SimpleGrid>

          {/* Reviews List */}
          <Collapse in={isReviewsOpen} animateOpacity>
            <VStack spacing={4} align="stretch">
              {reviews.slice(0, 5).map(review => (
                <Card key={review.id} direction="row" bg="gray.50" borderRadius="xl" p={4}>
                  <Avatar
                    src={review.avatar}
                    name={review.user}
                    size="md"
                    mr={4}
                  />
                  <Box flex={1}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="semibold" color={textColor} className="sfpro-font">
                        {review.user}
                      </Text>
                      <HStack spacing={1}>
                        <Icon as={Star} boxSize={3} color="yellow.400" fill="yellow.400" />
                        <Text fontSize="sm" fontWeight="medium" className="sfpro-font">
                          {review.rating}
                        </Text>
                      </HStack>
                    </Flex>
                    <Text fontSize="xs" color={mutedColor} mb={2} className="sfpro-font">
                      {review.date}
                    </Text>
                    <Text fontSize="sm" color={textColor} mb={2} className="sfpro-font">
                      {review.comment}
                    </Text>
                    {review.images && review.images.length > 0 && (
                      <HStack spacing={2} mb={2}>
                        {review.images.map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            alt="Review"
                            boxSize={16}
                            borderRadius="lg"
                            objectFit="cover"
                          />
                        ))}
                      </HStack>
                    )}
                    <Button
                      variant="link"
                      colorScheme="orange"
                      size="xs"
                      leftIcon={<MessageCircle size={12} />}
                      className="sfpro-font"
                    >
                      Helpful ({review.likes})
                    </Button>
                  </Box>
                </Card>
              ))}
            </VStack>
          </Collapse>
        </Card>
      </Container>

      {/* Dish Details Modal */}
      <Modal isOpen={isDishOpen} onClose={onDishClose} size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent borderRadius="2xl">
          {selectedDish && (
            <>
              <Box position="relative">
                <Image
                  src={selectedDish.image || `https://source.unsplash.com/400x300/?food,${selectedDish.name}`}
                  alt={selectedDish.name}
                  w="100%"
                  h={48}
                  objectFit="cover"
                  borderTopRadius="2xl"
                />
                <IconButton
                  aria-label="Close"
                  icon={<X size={16} />}
                  position="absolute"
                  top={3}
                  right={3}
                  size="sm"
                  borderRadius="full"
                  bg="whiteAlpha.900"
                  _hover={{ bg: 'white' }}
                  onClick={onDishClose}
                />
              </Box>
              <ModalBody p={6}>
                <Wrap spacing={2} mb={2}>
                  {selectedDish.isVeg !== undefined && (
                    <Tag
                      colorScheme={selectedDish.isVeg ? 'green' : 'red'}
                      size="sm"
                      borderRadius="full"
                    >
                      {selectedDish.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                    </Tag>
                  )}
                  {selectedDish.spicy && (
                    <Tag colorScheme="red" size="sm" borderRadius="full">
                      🌶️ Spicy
                    </Tag>
                  )}
                </Wrap>
                
                <Heading size="lg" mb={2} color={textColor} className="clash-font">
                  {selectedDish.name}
                </Heading>
                
                {selectedDish.description && (
                  <Text color={mutedColor} mb={4} className="sfpro-font">
                    {selectedDish.description}
                  </Text>
                )}
                
                {selectedDish.ingredients && selectedDish.ingredients.length > 0 && (
                  <Box mb={4}>
                    <Text fontWeight="semibold" mb={2} className="sfpro-font">
                      Ingredients
                    </Text>
                    <Wrap spacing={2}>
                      {selectedDish.ingredients.map((ing, idx) => (
                        <Tag key={idx} size="sm" colorScheme="gray" borderRadius="full">
                          {ing}
                        </Tag>
                      ))}
                    </Wrap>
                  </Box>
                )}

                {selectedDish.dietary && selectedDish.dietary.length > 0 && (
                  <Box mb={4}>
                    <Text fontWeight="semibold" mb={2} className="sfpro-font">
                      Dietary Information
                    </Text>
                    <Wrap spacing={2}>
                      {selectedDish.dietary.map((diet, idx) => (
                        <Tag key={idx} colorScheme="green" size="sm" borderRadius="full">
                          {diet}
                        </Tag>
                      ))}
                    </Wrap>
                  </Box>
                )}

                <Flex justify="space-between" align="center" pt={4} borderTopWidth="1px">
                  <Text fontSize="2xl" fontWeight="bold" color={textColor} className="clash-font">
                    ₹{selectedDish.price}
                  </Text>
                  <Button
                    bgGradient="linear(to-r, orange.500, pink.500)"
                    color="white"
                    onClick={() => {
                      addToCart(selectedDish);
                      onDishClose();
                    }}
                    className="sfpro-font"
                  >
                    Add to Cart
                  </Button>
                </Flex>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Address Modal */}
      <Modal isOpen={isAddressOpen} onClose={onAddressClose} size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader className="clash-font">Delivery Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={3} align="stretch">
              {user?.addresses?.map((addr, idx) => (
                <Card
                  key={idx}
                  p={4}
                  borderRadius="xl"
                  cursor="pointer"
                  borderWidth="2px"
                  borderColor={deliveryAddress === addr.address ? 'orange.500' : 'transparent'}
                  bg={deliveryAddress === addr.address ? 'orange.50' : cardBg}
                  onClick={() => {
                    setDeliveryAddress(addr.address);
                    onAddressClose();
                  }}
                  _hover={{ borderColor: 'orange.300' }}
                >
                  <HStack spacing={3} align="flex-start">
                    <Icon as={MapPin} boxSize={4} color="gray.400" mt={1} />
                    <Box>
                      <Text fontSize="sm" color={textColor} className="sfpro-font">
                        {addr.address}
                      </Text>
                      <Text fontSize="xs" color={mutedColor} mt={1} className="sfpro-font">
                        {addr.type || 'Home'}
                      </Text>
                    </Box>
                  </HStack>
                </Card>
              ))}
              
              <Button
                variant="outline"
                borderStyle="dashed"
                onClick={() => {
                  navigate('/profile');
                  onAddressClose();
                }}
                className="sfpro-font"
              >
                + Add New Address
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Floating Cart */}
      <Collapse in={Object.keys(cart).length > 0} animateOpacity>
        <Box
          position="fixed"
          bottom={4}
          right={4}
          left={{ base: 4, sm: 'auto' }}
          w={{ base: 'auto', sm: 96 }}
          zIndex={50}
        >
          <Card
            borderRadius="2xl"
            shadow="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box
              p={4}
              bgGradient="linear(to-r, orange.500, pink.500)"
              color="white"
              cursor="pointer"
              onClick={onCartToggle}
            >
              <Flex justify="space-between" align="center">
                <HStack spacing={2}>
                  <Icon as={ShoppingBag} boxSize={5} />
                  <Text fontWeight="medium" className="sfpro-font">
                    {getCartItemCount()} items
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Text fontWeight="bold" className="sfpro-font">
                    ₹{getCartTotal()}
                  </Text>
                  <Icon as={isCartOpen ? ChevronDown : ChevronUp} boxSize={5} />
                </HStack>
              </Flex>
            </Box>

            <Collapse in={isCartOpen} animateOpacity>
              <Box maxH={96} overflowY="auto" p={4}>
                <VStack spacing={4} mb={4} align="stretch">
                  {Object.values(cart).map(item => (
                    <HStack key={item._id} spacing={3}>
                      <Image
                        src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`}
                        alt={item.name}
                        boxSize={16}
                        borderRadius="xl"
                        objectFit="cover"
                      />
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor} className="sfpro-font">
                          {item.name}
                        </Text>
                        <Text fontSize="xs" color={mutedColor} mb={2} className="sfpro-font">
                          ₹{item.price} x {item.quantity}
                        </Text>
                        
                        <Input
                          placeholder="Special instructions..."
                          value={item.specialInstructions}
                          onChange={(e) => updateSpecialInstructions(item._id, e.target.value)}
                          size="xs"
                          borderRadius="lg"
                          mb={2}
                          className="sfpro-font"
                        />
                        
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<Minus size={12} />}
                            size="xs"
                            borderRadius="full"
                            variant="ghost"
                            onClick={() => removeFromCart(item._id)}
                          />
                          <Text fontSize="sm" fontWeight="medium" w={6} textAlign="center">
                            {item.quantity}
                          </Text>
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<Plus size={12} />}
                            size="xs"
                            borderRadius="full"
                            colorScheme="orange"
                            onClick={() => addToCart(item)}
                          />
                        </HStack>
                      </Box>
                    </HStack>
                  ))}
                </VStack>

                <Button
                  w="full"
                  bgGradient="linear(to-r, orange.500, pink.500)"
                  color="white"
                  onClick={handleCheckout}
                  className="sfpro-font"
                >
                  Proceed to Checkout
                </Button>
              </Box>
            </Collapse>
          </Card>
        </Box>
      </Collapse>

      {/* Custom Scrollbar Styles */}
      <Box as="style">
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}
      </Box>
    </Box>
  );
};

export default RestaurantDetailsPage;