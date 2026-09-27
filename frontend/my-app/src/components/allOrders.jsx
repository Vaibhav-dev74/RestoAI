// pages/CustomerAllOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';

// Chakra UI Core imports
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Input,
  Button,
  IconButton,
  Select,
  Badge,
  Image,
  Stack,
  HStack,
  VStack,
  Avatar,
  SimpleGrid,
  Progress,
  Tag,
  Wrap,
  Spinner,
  Center,
  Circle,
  AspectRatio,
} from "@chakra-ui/react";

// Icons from lucide-react
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Search,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  Home,
  Calendar,
  RefreshCw,
  Utensils,
  ChevronDown,
  Sparkles,
  Receipt,
  CreditCard,
  Smartphone,
  Wallet,
  List,
  Grid3x3,
  IndianRupee
} from 'lucide-react';

const OrderCard = ({ order, formatDate, getStatusProgress, cardBg, borderColor, mutedColor }) => {
  const firstItem = order.items?.[0];
  const otherItemsCount = (order.items?.length || 1) - 1;
  const progress = getStatusProgress(order.status);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'yellow';
      case 'preparing': return 'blue';
      case 'served': return 'purple';
      case 'paid': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={12} />;
      case 'preparing': return <Package size={12} />;
      case 'served': return <Truck size={12} />;
      case 'paid': return <CheckCircle size={12} />;
      case 'cancelled': return <AlertCircle size={12} />;
      default: return <ShoppingBag size={12} />;
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <Wallet size={12} />;
      case 'card': return <CreditCard size={12} />;
      case 'upi': return <Smartphone size={12} />;
      case 'online': return <Receipt size={12} />;
      default: return <CreditCard size={12} />;
    }
  };

  return (
    <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        overflow="hidden"
        transition="all 0.3s"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: '2xl',
          borderColor: 'orange.200',
        }}
        h="100%"
        p={4}
      >
        {/* Restaurant Header */}
        <Box mb={4}>
          <Flex justify="space-between" align="flex-start">
            <Box flex="1" minW={0}>
              <Heading as="h3" size="sm" mb={1} noOfLines={1} className="sfpro-font">
                {order.restaurant?.name || 'Restaurant'}
              </Heading>
              <HStack spacing={1} color={mutedColor} fontSize="sm" className="sfpro-font">
                <Box as="span">{<MapPin size={12} />}</Box>
                <Text noOfLines={1}>
                  {order.restaurant?.location?.city || 'Delivery'}
                </Text>
              </HStack>
            </Box>
            <Badge
              colorScheme={getStatusColor(order.status)}
              variant="solid"
              borderRadius="full"
              px={3}
              py={1}
              fontSize="xs"
              textTransform="capitalize"
              className="sfpro-font"
            >
              <HStack spacing={1}>
                <Box as="span">{getStatusIcon(order.status)}</Box>
                <Text>{order.status}</Text>
              </HStack>
            </Badge>
          </Flex>
        </Box>

        {/* Items Preview */}
        <HStack spacing={3} mb={4}>
          <Box
            position="relative"
            w={{ base: 14, sm: 16 }}
            h={{ base: 14, sm: 16 }}
          >
            <AspectRatio ratio={1} w="100%" h="100%">
              <Image
                src={firstItem?.image || `https://source.unsplash.com/100x100/?food`}
                alt={firstItem?.name}
                borderRadius="xl"
                fallbackSrc="https://via.placeholder.com/100"
              />
            </AspectRatio>
            {otherItemsCount > 0 && (
              <Circle
                size="5"
                bg="orange.500"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                position="absolute"
                top="-2"
                right="-2"
                borderWidth="2px"
                borderColor="white"
                className="sfpro-font"
              >
                +{otherItemsCount}
              </Circle>
            )}
          </Box>
          <VStack align="start" spacing={0} flex={1} minW={0}>
            <Text fontWeight="medium" fontSize={{ base: 'sm', sm: 'md' }} noOfLines={1} className="sfpro-font">
              {firstItem?.name || 'Order Items'}
              {otherItemsCount > 0 && ` and ${otherItemsCount} more`}
            </Text>
            <Text fontSize="xs" color={mutedColor} className="sfpro-font">
              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
            </Text>
          </VStack>
        </HStack>

        {/* Progress Bar */}
        <Box display={{ base: 'none', sm: 'block' }} mb={4}>
          <HStack justify="space-between" fontSize="xs" color={mutedColor} mb={1} className="sfpro-font">
            <Text>Placed</Text>
            <Text>Prep</Text>
            <Text>Served</Text>
            <Text>Done</Text>
          </HStack>
          <Progress
            value={progress}
            size="sm"
            colorScheme="orange"
            borderRadius="full"
            bg="gray.200"
          />
        </Box>

        {/* Footer */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          w="100%"
          gap={2}
          pt={2}
          borderTopWidth="1px"
          borderColor={borderColor}
        >
          <HStack spacing={2} fontSize="xs" color={mutedColor} flexWrap="wrap" className="sfpro-font">
            <HStack spacing={1}>
              <Box as="span">{<Calendar size={12} />}</Box>
              <Text whiteSpace="nowrap">{formatDate(order.createdAt)}</Text>
            </HStack>
            <HStack spacing={1}>
              <Box as="span">{getPaymentIcon(order.paymentMethod)}</Box>
              <Text textTransform="capitalize" display={{ base: 'none', sm: 'inline' }}>
                {order.paymentMethod}
              </Text>
            </HStack>
          </HStack>
          <HStack justify="space-between" w={{ base: '100%', sm: 'auto' }}>
            <Box textAlign="right">
              <Text fontSize="xs" color={mutedColor} className="sfpro-font">Total</Text>
              <HStack spacing={0}>
                <Box as="span">{<IndianRupee size={12} />}</Box>
                <Text fontWeight="bold" color="orange.500" className="sfpro-font">
                  {order.totalAmount?.toLocaleString() || '0'}
                </Text>
              </HStack>
            </Box>
            <Box as="span">{<ChevronRight size={16} color="#A0AEC0" />}</Box>
          </HStack>
        </Flex>
      </Box>
    </Link>
  );
};

const OrderListItem = ({ order, formatDate, getStatusProgress, cardBg, borderColor, textColor, mutedColor }) => {
  const progress = getStatusProgress(order.status);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'yellow';
      case 'preparing': return 'blue';
      case 'served': return 'purple';
      case 'paid': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={12} />;
      case 'preparing': return <Package size={12} />;
      case 'served': return <Truck size={12} />;
      case 'paid': return <CheckCircle size={12} />;
      case 'cancelled': return <AlertCircle size={12} />;
      default: return <ShoppingBag size={12} />;
    }
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'cash': return <Wallet size={12} />;
      case 'card': return <CreditCard size={12} />;
      case 'upi': return <Smartphone size={12} />;
      case 'online': return <Receipt size={12} />;
      default: return <CreditCard size={12} />;
    }
  };

  return (
    <Link to={`/order/${order._id}`} style={{ textDecoration: 'none' }}>
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        _hover={{ boxShadow: 'xl', borderColor: 'orange.200' }}
        transition="all 0.3s"
        p={{ base: 4, md: 6 }}
      >
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          spacing={4}
          align={{ base: 'stretch', lg: 'flex-start' }}
        >
          <HStack spacing={4} flex={1} align="flex-start">
            {/* Restaurant Image */}
            <AspectRatio ratio={1} w={{ base: 14, md: 16 }} flexShrink={0}>
              <Image
                src={order.restaurant?.image || `https://source.unsplash.com/100x100/?restaurant`}
                alt={order.restaurant?.name}
                borderRadius="xl"
                fallbackSrc="https://via.placeholder.com/100"
              />
            </AspectRatio>

            <VStack align="start" spacing={2} flex={1} minW={0}>
              <HStack spacing={2} wrap="wrap">
                <Heading size="sm" noOfLines={1} className="sfpro-font">
                  {order.restaurant?.name || 'Restaurant'}
                </Heading>
                <Badge
                  colorScheme={getStatusColor(order.status)}
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                  className="sfpro-font"
                >
                  <HStack spacing={1}>
                    <Box as="span">{getStatusIcon(order.status)}</Box>
                    <Text>{order.status}</Text>
                  </HStack>
                </Badge>
              </HStack>

              <HStack spacing={4} fontSize="sm" color={mutedColor} wrap="wrap" className="sfpro-font">
                <HStack spacing={1}>
                  <Box as="span">{<Calendar size={12} />}</Box>
                  <Text whiteSpace="nowrap">{formatDate(order.createdAt)}</Text>
                </HStack>
                <HStack spacing={1}>
                  <Box as="span">{<MapPin size={12} />}</Box>
                  <Text noOfLines={1}>{order.restaurant?.location?.city || 'Delivery'}</Text>
                </HStack>
                <HStack spacing={1}>
                  <Box as="span">{getPaymentIcon(order.paymentMethod)}</Box>
                  <Text textTransform="capitalize">{order.paymentMethod}</Text>
                </HStack>
              </HStack>

              {/* Items Preview */}
              <Wrap spacing={2}>
                {order.items?.slice(0, 3).map((item, idx) => (
                  <Tag key={idx} size="sm" variant="subtle" colorScheme="gray" className="sfpro-font">
                    {item.quantity}x {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}
                  </Tag>
                ))}
                {(order.items?.length || 0) > 3 && (
                  <Tag size="sm" variant="subtle" colorScheme="gray" className="sfpro-font">
                    +{order.items.length - 3} more
                  </Tag>
                )}
              </Wrap>
            </VStack>
          </HStack>

          <Box textAlign={{ base: 'left', lg: 'right' }} minW={{ lg: '120px' }}>
            <Heading size="md" color={textColor} className="sfpro-font">
              <HStack spacing={0} justify={{ base: 'flex-start', lg: 'flex-end' }}>
                <Box as="span">{<IndianRupee size={14} />}</Box>
                <Text>{order.totalAmount?.toLocaleString() || '0'}</Text>
              </HStack>
            </Heading>
            <Text fontSize="sm" color={mutedColor} className="sfpro-font">Total Amount</Text>
          </Box>
        </Stack>

        {/* Progress Bar */}
        <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" fontSize="xs" color={mutedColor} mb={1} className="sfpro-font">
            <Text color={order.status !== 'cancelled' ? 'orange.500' : ''}>Placed</Text>
            <Text color={order.status === 'preparing' || order.status === 'served' || order.status === 'paid' ? 'orange.500' : ''}>Prep</Text>
            <Text color={order.status === 'served' || order.status === 'paid' ? 'orange.500' : ''}>Served</Text>
            <Text color={order.status === 'paid' ? 'green.500' : ''}>Done</Text>
          </HStack>
          <Progress
            value={order.status === 'cancelled' ? 100 : progress}
            size="sm"
            colorScheme={order.status === 'cancelled' ? 'red' : 'orange'}
            borderRadius="full"
            bg="gray.200"
          />
        </Box>
      </Box>
    </Link>
  );
};

const StatsCard = ({ label, value, color, cardBg, textColor, mutedColor }) => {
  return (
    <Box 
      bg={cardBg} 
      borderLeftWidth="4px" 
      borderLeftColor={color}
      borderRadius="lg"
      p={4}
      boxShadow="sm"
    >
      <Text fontSize="sm" color={mutedColor} className="sfpro-font">{label}</Text>
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={textColor} className="clash-font">
        {value}
      </Text>
    </Box>
  );
};

const CustomerAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    served: 0,
    paid: 0,
    cancelled: 0,
    totalSpent: 0
  });

  const navigate = useNavigate();
  const VITE_API_URL = API_BASE_URL;

  // Static values
  const buttonSize = 'md';
  const headingSize = 'lg';
  const containerPadding = 4;
  
  // Static colors
  const bgGradient = 'linear(to-br, gray.50, white, gray.50)';
  const cardBg = 'white';
  const borderColor = 'gray.100';
  const textColor = 'gray.800';
  const mutedColor = 'gray.600';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserOrders(userData._id);
    } else {
      navigate('/customer-login');
    }
  }, []);

  const fetchUserOrders = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(
        `${VITE_API_URL}/api/orders/customer/${userId}`,
        { headers }
      );

      setOrders(response.data);
      setFilteredOrders(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      preparing: ordersData.filter(o => o.status === 'preparing').length,
      served: ordersData.filter(o => o.status === 'served').length,
      paid: ordersData.filter(o => o.status === 'paid').length,
      cancelled: ordersData.filter(o => o.status === 'cancelled').length,
      totalSpent: ordersData
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
    setStats(stats);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'today') {
          return orderDate >= today;
        } else if (dateFilter === 'week') {
          return orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          return orderDate >= monthAgo;
        }
        return true;
      });
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, dateFilter, sortBy, orders]);

  const getStatusProgress = (status) => {
    const steps = ['pending', 'preparing', 'served', 'paid'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? (currentIndex + 1) * 25 : 0;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Box
      minH="100vh"
      w="100%"
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
    >
      {/* Artistic Background Elements */}
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
        zIndex={50}
        bg="whiteAlpha.800"
        backdropFilter="blur(10px)"
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <Container maxW="1920px" px={containerPadding} py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Link to="/">
                <HStack spacing={2}>
                  <Circle
                    size={{ base: 8, md: 10 }}
                    bgGradient="linear(to-r, orange.500, pink.500)"
                  >
                    <Box as="span">{<Utensils size={16} color="white" />}</Box>
                  </Circle>
                  <Heading size={{ base: 'md', md: 'lg' }} className="clash-font">
                    My<Text as="span" color="orange.500" className="clash-font">Orders</Text>
                  </Heading>
                </HStack>
              </Link>
            </HStack>

            {/* Stats Pills - Tablet and up */}
            <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
              <Box bg="orange.50" px={4} py={2} borderRadius="xl">
                <Text fontSize="sm" color={mutedColor} className="sfpro-font">
                  Total Orders:{' '}
                  <Text as="span" fontWeight="bold" color="orange.500" className="sfpro-font">
                    {stats.total}
                  </Text>
                </Text>
              </Box>
              <Box bg="green.50" px={4} py={2} borderRadius="xl">
                <Text fontSize="sm" color={mutedColor} className="sfpro-font">
                  Total Spent:{' '}
                  <Text as="span" fontWeight="bold" color="green.500" className="sfpro-font">
                    ₹{stats.totalSpent.toLocaleString()}
                  </Text>
                </Text>
              </Box>
            </HStack>

            {/* User Menu */}
            {user && (
              <Link to={`/profile/${user._id}`}>
                <HStack spacing={2}>
                  <Avatar
                    size={{ base: 'sm', md: 'md' }}
                    name={user.name}
                    src={user.avatar}
                    bgGradient="linear(to-r, orange.400, pink.500)"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="transform 0.2s"
                  />
                  <Text
                    display={{ base: 'none', lg: 'block' }}
                    fontWeight="medium"
                    color={mutedColor}
                    className="sfpro-font"
                  >
                    {user.name}
                  </Text>
                </HStack>
              </Link>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="1920px" px={containerPadding} py={{ base: 4, md: 8 }}>
        {/* Welcome Section */}
        <VStack align="start" spacing={2} mb={{ base: 6, md: 8 }}>
          <Heading size={headingSize} color={textColor} className="clash-font">
            Your Orders
          </Heading>
          <Text fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} color={mutedColor} className="sfpro-font">
            Track and manage all your food orders in one place.
          </Text>
        </VStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} spacing={{ base: 2, md: 4, lg: 6 }} mb={{ base: 6, md: 8 }}>
          <StatsCard label="Total Orders" value={stats.total} color="orange.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
          <StatsCard label="Pending" value={stats.pending} color="yellow.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
          <StatsCard label="Preparing" value={stats.preparing} color="blue.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
          <StatsCard label="Served" value={stats.served} color="purple.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
          <StatsCard label="Completed" value={stats.paid} color="green.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
          <StatsCard label="Cancelled" value={stats.cancelled} color="red.500" cardBg={cardBg} textColor={textColor} mutedColor={mutedColor} />
        </SimpleGrid>

        {/* Search and Filters */}
        <Box bg={cardBg} borderRadius="2xl" boxShadow="lg" p={{ base: 4, md: 6, lg: 8 }} mb={{ base: 6, md: 8 }}>
          <Stack direction={{ base: 'column', lg: 'row' }} spacing={4}>
            {/* Search Bar */}
            <Box position="relative" flex={1}>
              <Input
                placeholder="Search orders by restaurant, item or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
                size={buttonSize}
                pl={10}
                pr={searchTerm ? 10 : 4}
                width="100%"
                className="sfpro-font"
              />
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                <Box as="span">{<Search size={16} />}</Box>
              </Box>
              {searchTerm && (
                <Box position="absolute" right={3} top="50%" transform="translateY(-50%)">
                  <Button
                    aria-label="Clear search"
                    size="xs"
                    variant="ghost"
                    onClick={() => setSearchTerm('')}
                    p={1}
                    minW="auto"
                  >
                    <Box as="span">{<X size={16} />}</Box>
                  </Button>
                </Box>
              )}
            </Box>

            {/* Filter Buttons */}
            <HStack spacing={2}>
              {/* Mobile Filter Toggle */}
              <Button
                display={{ base: 'flex', lg: 'none' }}
                leftIcon={<Filter size={16} />}
                variant="outline"
                onClick={() => setIsFilterOpen(true)}
                size={buttonSize}
                className="sfpro-font"
              >
                Filters
              </Button>

              {/* Desktop Filters */}
              <Button
                display={{ base: 'none', lg: 'flex' }}
                leftIcon={<Filter size={18} />}
                variant={showFilters ? 'solid' : 'outline'}
                colorScheme="orange"
                onClick={() => setShowFilters(!showFilters)}
                size={buttonSize}
                className="sfpro-font"
              >
                Advanced Filters
              </Button>

              {/* Sort Select */}
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                size={buttonSize}
                width="auto"
                minW="150px"
                className="sfpro-font"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </Select>

              {/* View Toggle */}
              <HStack spacing={1}>
                <Button
                  aria-label="Grid view"
                  variant={viewMode === 'grid' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'grid' ? 'orange' : 'gray'}
                  onClick={() => setViewMode('grid')}
                  size={buttonSize}
                  p={2}
                >
                  <Box as="span">{<Grid3x3 size={16} />}</Box>
                </Button>
                <Button
                  aria-label="List view"
                  variant={viewMode === 'list' ? 'solid' : 'outline'}
                  colorScheme={viewMode === 'list' ? 'orange' : 'gray'}
                  onClick={() => setViewMode('list')}
                  size={buttonSize}
                  p={2}
                >
                  <Box as="span">{<List size={16} />}</Box>
                </Button>
              </HStack>
            </HStack>
          </Stack>

          {/* Mobile Filters Drawer */}
          {isFilterOpen && (
            <Box
              position="fixed"
              bottom={0}
              left={0}
              right={0}
              bg={cardBg}
              borderTopRadius="2xl"
              boxShadow="lg"
              zIndex={1000}
              p={4}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" className="clash-font">Filter Orders</Heading>
                <Button
                  aria-label="Close drawer"
                  onClick={() => setIsFilterOpen(false)}
                  variant="ghost"
                  size="sm"
                  p={1}
                >
                  <Box as="span">{<X size={20} />}</Box>
                </Button>
              </Flex>
              <VStack spacing={4}>
                <Box w="100%">
                  <Text fontWeight="medium" mb={2} className="sfpro-font">Order Status</Text>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="sfpro-font"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="served">Served</option>
                    <option value="paid">Paid/Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Box>

                <Box w="100%">
                  <Text fontWeight="medium" mb={2} className="sfpro-font">Date Range</Text>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="sfpro-font"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </Select>
                </Box>

                <Button
                  w="100%"
                  colorScheme="orange"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                    setSearchTerm('');
                    setIsFilterOpen(false);
                  }}
                  className="sfpro-font"
                >
                  Clear All Filters
                </Button>
              </VStack>
            </Box>
          )}

          {/* Desktop Filters Panel */}
          {showFilters && (
            <Box mt={6} pt={6} borderTopWidth="1px" borderColor={borderColor}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box>
                  <Text fontWeight="medium" mb={2} className="sfpro-font">Order Status</Text>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="sfpro-font"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="served">Served</option>
                    <option value="paid">Paid/Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2} className="sfpro-font">Date Range</Text>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="sfpro-font"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last 12 Months</option>
                  </Select>
                </Box>

                <Flex align="flex-end">
                  <Button
                    w="100%"
                    colorScheme="orange"
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('all');
                      setSearchTerm('');
                    }}
                    className="sfpro-font"
                  >
                    Clear All Filters
                  </Button>
                </Flex>
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* Orders Display */}
        {loading ? (
          <Center py={{ base: 12, md: 20, lg: 32 }}>
            <VStack spacing={4}>
              <Spinner size="xl" color="orange.500" />
              <Text color={mutedColor} className="sfpro-font">Loading your delicious orders...</Text>
            </VStack>
          </Center>
        ) : error ? (
          <Box
            bg="red.50"
            borderWidth="1px"
            borderColor="red.200"
            borderRadius="2xl"
            p={{ base: 8, md: 12 }}
            textAlign="center"
          >
            <Box display="flex" justifyContent="center" mb={4}>
              <Box as="span">{<AlertCircle size={32} color="red.500" />}</Box>
            </Box>
            <Text mt={4} mb={1} fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="red.700" className="clash-font">
              Error Loading Orders
            </Text>
            <Text maxWidth="sm" mb={4} color="red.600" mx="auto" className="sfpro-font">
              {error}
            </Text>
            <Button
              leftIcon={<RefreshCw size={16} />}
              colorScheme="red"
              onClick={() => fetchUserOrders(user?._id)}
              className="sfpro-font"
            >
              Try Again
            </Button>
          </Box>
        ) : filteredOrders.length === 0 ? (
          <Box bg={cardBg} borderRadius="2xl" boxShadow="lg" p={{ base: 8, md: 12, lg: 16 }}>
            <VStack spacing={4} textAlign="center">
              <Circle size={{ base: 16, md: 24, lg: 32 }} bg="orange.100">
                <Box as="span">{<ShoppingBag size={32} color="#F97316" />}</Box>
              </Circle>
              <Heading size={{ base: 'md', md: 'lg' }} color={textColor} className="clash-font">
                No orders found
              </Heading>
              <Text color={mutedColor} fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} className="sfpro-font">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? "Try adjusting your filters to see more orders"
                  : "You haven't placed any orders yet. Time to satisfy your cravings!"}
              </Text>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? (
                <Button
                  colorScheme="orange"
                  onClick={() => {
                    setStatusFilter('all');
                    setDateFilter('all');
                    setSearchTerm('');
                  }}
                  className="sfpro-font"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  as={Link}
                  to="/"
                  leftIcon={<Home size={16} />}
                  bgGradient="linear(to-r, orange.500, pink.500)"
                  color="white"
                  _hover={{ boxShadow: 'lg' }}
                  className="sfpro-font"
                >
                  Browse Restaurants
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <>
            {/* Results Summary */}
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontSize="sm" color={mutedColor} className="sfpro-font">
                Showing <Text as="span" fontWeight="medium" color={textColor} className="sfpro-font">{filteredOrders.length}</Text>{' '}
                {filteredOrders.length === 1 ? 'order' : 'orders'}
              </Text>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="orange"
                leftIcon={<RefreshCw size={14} />}
                onClick={() => fetchUserOrders(user?._id)}
                className="sfpro-font"
              >
                Refresh
              </Button>
            </Flex>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={{ base: 3, md: 4, lg: 6 }}>
                {filteredOrders.map(order => (
                  <OrderCard key={order._id} order={order} formatDate={formatDate} getStatusProgress={getStatusProgress} cardBg={cardBg} borderColor={borderColor} mutedColor={mutedColor} />
                ))}
              </SimpleGrid>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <VStack spacing={4} align="stretch">
                {filteredOrders.map(order => (
                  <OrderListItem key={order._id} order={order} formatDate={formatDate} getStatusProgress={getStatusProgress} cardBg={cardBg} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor} />
                ))}
              </VStack>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default CustomerAllOrders;