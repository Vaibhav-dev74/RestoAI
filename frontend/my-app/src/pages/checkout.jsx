// pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Textarea,
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
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  InputLeftAddon,
  InputRightAddon,
  Textarea as ChakraTextarea,
} from '@chakra-ui/react';

// Icons from lucide-react
import {
  ShoppingBag,
  MapPin,
  ChevronLeft,
  CreditCard,
  Truck,
  Wallet,
  Clock,
  Shield,
  IndianRupee,
  Plus,
  Minus,
  X,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Home,
  Building,
  Briefcase,
  Star,
  Info,
  Lock,
  Sparkles,
  Gift,
  Percent,
  Award,
  Bike,
  Utensils,
  BadgePercent,
  Loader2
} from 'lucide-react';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { restaurantId, restaurant, cart, total, itemCount } = location.state || {};

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // User and addresses
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'home',
    address: '',
    landmark: '',
    area: '',
    city: '',
    pincode: '',
    phone: '',
    instructions: ''
  });

  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [upiApps, setUpiApps] = useState([
    { id: 'gpay', name: 'Google Pay', icon: '📱' },
    { id: 'phonepe', name: 'PhonePe', icon: '📲' },
    { id: 'paytm', name: 'Paytm', icon: '💰' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🏦' }
  ]);
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // Order timing
  const [deliveryTime, setDeliveryTime] = useState('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryTimes] = useState([
    { id: 'now', label: 'Now', time: '30-40 min' },
    { id: 'later', label: 'Schedule', time: 'Pick later time' }
  ]);

  // Coupons and offers
  const [availableCoupons, setAvailableCoupons] = useState([
    {
      id: 1,
      code: 'WELCOME50',
      description: '50% off up to ₹100',
      minOrder: 199,
      validUntil: '2024-12-31',
      applicable: true
    },
    {
      id: 2,
      code: 'FIRSTORDER',
      description: 'Free delivery on first order',
      minOrder: 0,
      validUntil: '2024-12-31',
      applicable: true
    },
    {
      id: 3,
      code: 'SAVE20',
      description: '20% off on orders above ₹500',
      minOrder: 500,
      validUntil: '2024-12-31',
      applicable: total >= 500
    }
  ]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);

  // Donation option
  const [donateToCharity, setDonateToCharity] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);

  // Calculate totals
  const [subtotal, setSubtotal] = useState(total || 0);
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [packagingFee, setPackagingFee] = useState(10);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Responsive values
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const headingSize = useBreakpointValue({ base: 'lg', md: 'xl' });
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

  useEffect(() => {
    if (!restaurant || !cart || Object.keys(cart).length === 0) {
      navigate('/');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.addresses && parsedUser.addresses.length > 0) {
        setAddresses(parsedUser.addresses);
        setSelectedAddress(parsedUser.addresses[0]);
        setNewAddress(prev => ({
          ...prev,
          phone: parsedUser.phone || ''
        }));
      }
    }

    calculateTotals();
  }, [restaurant, cart, navigate]);

  useEffect(() => {
    calculateTotals();
  }, [subtotal, appliedCoupon, donateToCharity, donationAmount]);

  const calculateTotals = () => {
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.code === 'WELCOME50') {
        discountAmount = Math.min(subtotal * 0.5, 100);
      } else if (appliedCoupon.code === 'SAVE20') {
        discountAmount = subtotal * 0.2;
      }
    }

    const taxAmount = subtotal * 0.05;
    setTax(taxAmount);
    setDiscount(discountAmount);
    
    const donation = donateToCharity ? donationAmount : 0;
    const finalTotal = subtotal + deliveryFee + packagingFee + taxAmount + donation - discountAmount;
    setGrandTotal(finalTotal);
  };

  const handleApplyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      if (coupon.minOrder <= subtotal) {
        setAppliedCoupon(coupon);
        setCouponError('');
        setShowCoupons(false);
        toast({
          title: 'Coupon applied',
          description: `${coupon.code} has been applied`,
          status: 'success',
          duration: 3000,
        });
      } else {
        setCouponError(`Minimum order of ₹${coupon.minOrder} required`);
      }
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderItems = Object.values(cart).map(item => ({
        dishId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      }));

      const orderData = {
        restaurantId,
        restaurantName: restaurant?.name,
        items: orderItems,
        totalAmount: grandTotal,
        subtotal,
        deliveryFee,
        packagingFee,
        tax,
        discount,
        appliedCoupon: appliedCoupon?.code,
        deliveryAddress: selectedAddress,
        paymentMethod,
        paymentDetails: paymentMethod === 'upi' ? selectedUpiApp : cardDetails,
        deliveryTime: deliveryTime === 'now' ? 'ASAP' : scheduledTime,
        instructions: selectedAddress.instructions,
        orderType: 'delivery',
        donation: donateToCharity ? donationAmount : 0
      };

      const response = await axios.post(
        `${VITE_API_URL}/api/orders/create`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrderId(response.data.orderId || response.data._id);
      setSuccess(true);
      localStorage.removeItem(`cart_${restaurantId}`);
      
      toast({
        title: 'Order placed successfully!',
        description: 'Your order has been confirmed',
        status: 'success',
        duration: 5000,
      });

      setTimeout(() => {
        setStep(4);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to place order',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = () => {
    const addressObj = {
      id: Date.now().toString(),
      type: newAddress.type,
      address: newAddress.address,
      landmark: newAddress.landmark,
      area: newAddress.area,
      city: newAddress.city,
      pincode: newAddress.pincode,
      phone: newAddress.phone,
      instructions: newAddress.instructions,
      fullAddress: `${newAddress.address}, ${newAddress.landmark ? newAddress.landmark + ', ' : ''}${newAddress.area}, ${newAddress.city} - ${newAddress.pincode}`
    };

    setAddresses([...addresses, addressObj]);
    setSelectedAddress(addressObj);
    setShowAddressForm(false);
    setNewAddress({
      type: 'home',
      address: '',
      landmark: '',
      area: '',
      city: '',
      pincode: '',
      phone: user?.phone || '',
      instructions: ''
    });

    toast({
      title: 'Address saved',
      status: 'success',
      duration: 2000,
    });
  };

  const getAddressIcon = (type) => {
    switch(type) {
      case 'home': return Home;
      case 'work': return Briefcase;
      default: return Building;
    }
  };

  if (success) {
    return (
      <Center minH="100vh" bgGradient="linear(to-br, green.50, emerald.50)" p={4}>
        <Card bg={cardBg} borderRadius="3xl" shadow="2xl" maxW="md" w="full">
          <CardBody textAlign="center" p={8}>
            <Circle
              size="24"
              bgGradient="linear(to-br, green.400, emerald.500)"
              mx="auto"
              mb={6}
              animation="bounce 1s infinite"
            >
              <Icon as={CheckCircle} boxSize={12} color="white" />
            </Circle>
            
            <Heading size="xl" mb={2} className="clash-font">
              Order Placed! 🎉
            </Heading>
            <Text color={mutedColor} mb={6} className="sfpro-font">
              Your order has been confirmed
            </Text>
            
            <Box bg="gray.50" borderRadius="xl" p={4} mb={6} textAlign="left">
              <Text fontSize="sm" color={mutedColor} mb={2} className="sfpro-font">
                Order ID
              </Text>
              <Text fontSize="lg" fontFamily="mono" fontWeight="bold" color={textColor}>
                {orderId || 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase()}
              </Text>
            </Box>

            <VStack spacing={3} mb={6} align="stretch">
              <HStack spacing={3}>
                <Icon as={Clock} boxSize={4} color="gray.400" />
                <Text color={mutedColor} className="sfpro-font">
                  Estimated delivery: 30-40 minutes
                </Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={Truck} boxSize={4} color="gray.400" />
                <Text color={mutedColor} className="sfpro-font">
                  Delivery to: {selectedAddress?.area || 'Your address'}
                </Text>
              </HStack>
            </VStack>

            <VStack spacing={3}>
              <Button
                w="full"
                bgGradient="linear(to-r, orange.500, pink.500)"
                color="white"
                size="lg"
                onClick={() => navigate('/orders')}
                className="sfpro-font"
              >
                Track Order
              </Button>
              <Button
                w="full"
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
                className="sfpro-font"
              >
                Continue Shopping
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
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
          <HStack spacing={3}>
            <IconButton
              aria-label="Go back"
              icon={<ChevronLeft size={20} />}
              variant="ghost"
              borderRadius="xl"
              onClick={() => navigate(-1)}
            />
            <Heading size="lg" color={textColor} className="clash-font">
              Checkout
            </Heading>
          </HStack>
        </Container>
      </Box>

      {/* Progress Steps */}
      <Container maxW="1920px" px={containerPadding} py={6}>
        <Flex justify="space-between" maxW="2xl" mx="auto">
          {['Cart', 'Address', 'Payment', 'Confirm'].map((label, index) => (
            <HStack key={label} spacing={0}>
              <VStack spacing={2}>
                <Circle
                  size={10}
                  bg={step > index + 1 ? 'green.500' : step === index + 1 ? 'orange.500' : 'gray.200'}
                  color={step > index + 1 || step === index + 1 ? 'white' : 'gray.500'}
                  fontSize="sm"
                  fontWeight="semibold"
                  transform={step === index + 1 ? 'scale(1.1)' : 'none'}
                  transition="all 0.2s"
                >
                  {step > index + 1 ? <Icon as={CheckCircle} size={18} /> : index + 1}
                </Circle>
                <Text
                  fontSize="xs"
                  color={step === index + 1 ? textColor : mutedColor}
                  fontWeight={step === index + 1 ? 'medium' : 'normal'}
                  className="sfpro-font"
                >
                  {label}
                </Text>
              </VStack>
              {index < 3 && (
                <Box
                  w={{ base: 12, sm: 24 }}
                  h="0.5"
                  mx={2}
                  bg={step > index + 1 ? 'green.500' : 'gray.200'}
                />
              )}
            </HStack>
          ))}
        </Flex>
      </Container>

      <Container maxW="1920px" px={containerPadding} pb={32}>
        <Grid templateColumns={{ base: '1fr', lg: '3fr 1fr' }} gap={6}>
          {/* Main Content - Left Column */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Step 1: Cart Review */}
              {step === 1 && (
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={{ base: 4, md: 6 }}>
                  <Heading size="md" mb={4} className="clash-font">
                    <HStack spacing={2}>
                      <Icon as={ShoppingBag} color="orange.500" />
                      <Text>Your Order</Text>
                    </HStack>
                  </Heading>

                  <VStack spacing={4} maxH="96" overflowY="auto" pr={2} className="custom-scrollbar">
                    {Object.values(cart).map(item => (
                      <Card key={item._id} direction="row" bg="gray.50" borderRadius="xl" p={3}>
                        <Image
                          src={item.image || `https://source.unsplash.com/200x200/?food,${item.name}`}
                          alt={item.name}
                          boxSize={20}
                          borderRadius="xl"
                          objectFit="cover"
                        />
                        <Box flex={1} ml={4}>
                          <Flex justify="space-between" mb={1}>
                            <Text fontWeight="semibold" color={textColor} className="sfpro-font">
                              {item.name}
                            </Text>
                            <Text fontWeight="bold" color={textColor}>
                              ₹{item.price * item.quantity}
                            </Text>
                          </Flex>
                          <Text fontSize="xs" color={mutedColor} mb={2}>
                            Qty: {item.quantity}
                          </Text>
                          {item.specialInstructions && (
                            <Text fontSize="xs" color={mutedColor} bg="white" p={2} borderRadius="lg">
                              📝 {item.specialInstructions}
                            </Text>
                          )}
                        </Box>
                      </Card>
                    ))}
                  </VStack>

                  <Button
                    mt={6}
                    w="full"
                    bgGradient="linear(to-r, orange.500, pink.500)"
                    color="white"
                    size="lg"
                    onClick={() => setStep(2)}
                    className="sfpro-font"
                  >
                    Continue to Address
                  </Button>
                </Card>
              )}

              {/* Step 2: Delivery Address */}
              {step === 2 && (
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={{ base: 4, md: 6 }}>
                  <Heading size="md" mb={4} className="clash-font">
                    <HStack spacing={2}>
                      <Icon as={MapPin} color="orange.500" />
                      <Text>Delivery Address</Text>
                    </HStack>
                  </Heading>

                  {!showAddressForm ? (
                    <>
                      <VStack spacing={3} mb={4}>
                        {addresses.map(address => (
                          <Card
                            key={address.id}
                            p={4}
                            borderRadius="xl"
                            cursor="pointer"
                            borderWidth="2px"
                            borderColor={selectedAddress?.id === address.id ? 'orange.500' : 'transparent'}
                            bg={selectedAddress?.id === address.id ? 'orange.50' : 'gray.50'}
                            onClick={() => setSelectedAddress(address)}
                            _hover={{ borderColor: 'orange.300' }}
                          >
                            <Flex justify="space-between" align="start" mb={2}>
                              <HStack spacing={2}>
                                <Circle
                                  size={6}
                                  bg={selectedAddress?.id === address.id ? 'orange.500' : 'gray.200'}
                                  color={selectedAddress?.id === address.id ? 'white' : 'gray.600'}
                                >
                                  <Icon as={getAddressIcon(address.type)} boxSize={3} />
                                </Circle>
                                <Badge colorScheme="gray" borderRadius="full" textTransform="capitalize">
                                  {address.type}
                                </Badge>
                              </HStack>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit"
                                  icon={<Edit size={14} />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle edit
                                  }}
                                />
                                <IconButton
                                  aria-label="Delete"
                                  icon={<Trash2 size={14} />}
                                  size="xs"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle delete
                                  }}
                                />
                              </HStack>
                            </Flex>
                            <Text fontSize="sm" color={textColor} pl={8} className="sfpro-font">
                              {address.fullAddress || address.address}
                            </Text>
                            <Text fontSize="xs" color={mutedColor} mt={1} pl={8}>
                              📞 {address.phone}
                            </Text>
                          </Card>
                        ))}
                      </VStack>

                      <Button
                        w="full"
                        variant="outline"
                        borderStyle="dashed"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setShowAddressForm(true)}
                        mb={4}
                        className="sfpro-font"
                      >
                        Add New Address
                      </Button>

                      <Button
                        w="full"
                        bgGradient={selectedAddress ? "linear(to-r, orange.500, pink.500)" : "gray.200"}
                        color={selectedAddress ? "white" : "gray.500"}
                        size="lg"
                        onClick={() => setStep(3)}
                        isDisabled={!selectedAddress}
                        _hover={selectedAddress ? { shadow: 'lg' } : {}}
                        className="sfpro-font"
                      >
                        Continue to Payment
                      </Button>
                    </>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm" color={textColor} className="sfpro-font">
                        Add New Address
                      </Heading>
                      
                      <RadioGroup
                        value={newAddress.type}
                        onChange={(value) => setNewAddress({...newAddress, type: value})}
                      >
                        <HStack spacing={4} mb={4}>
                          {['home', 'work', 'other'].map(type => (
                            <Radio key={type} value={type} colorScheme="orange">
                              <HStack spacing={1}>
                                <Icon
                                  as={type === 'home' ? Home : type === 'work' ? Briefcase : Building}
                                  size={14}
                                />
                                <Text textTransform="capitalize" className="sfpro-font">
                                  {type}
                                </Text>
                              </HStack>
                            </Radio>
                          ))}
                        </HStack>
                      </RadioGroup>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Input
                          placeholder="Address"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                          gridColumn={{ base: 'span 1', md: 'span 2' }}
                          className="sfpro-font"
                        />
                        <Input
                          placeholder="Landmark"
                          value={newAddress.landmark}
                          onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                          className="sfpro-font"
                        />
                        <Input
                          placeholder="Area"
                          value={newAddress.area}
                          onChange={(e) => setNewAddress({...newAddress, area: e.target.value})}
                          className="sfpro-font"
                        />
                        <Input
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          className="sfpro-font"
                        />
                        <Input
                          placeholder="Pincode"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                          className="sfpro-font"
                        />
                        <Input
                          placeholder="Phone Number"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                          gridColumn={{ base: 'span 1', md: 'span 2' }}
                          className="sfpro-font"
                        />
                        <ChakraTextarea
                          placeholder="Delivery instructions (optional)"
                          value={newAddress.instructions}
                          onChange={(e) => setNewAddress({...newAddress, instructions: e.target.value})}
                          rows={2}
                          gridColumn={{ base: 'span 1', md: 'span 2' }}
                          className="sfpro-font"
                        />
                      </SimpleGrid>

                      <HStack spacing={3}>
                        <Button
                          flex={1}
                          variant="outline"
                          onClick={() => setShowAddressForm(false)}
                          className="sfpro-font"
                        >
                          Cancel
                        </Button>
                        <Button
                          flex={1}
                          bgGradient="linear(to-r, orange.500, pink.500)"
                          color="white"
                          onClick={handleSaveAddress}
                          className="sfpro-font"
                        >
                          Save Address
                        </Button>
                      </HStack>
                    </VStack>
                  )}
                </Card>
              )}

              {/* Step 3: Payment Method */}
              {step === 3 && (
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={{ base: 4, md: 6 }}>
                  <Heading size="md" mb={4} className="clash-font">
                    <HStack spacing={2}>
                      <Icon as={CreditCard} color="orange.500" />
                      <Text>Payment Method</Text>
                    </HStack>
                  </Heading>

                  <VStack spacing={4}>
                    {/* UPI Option */}
                    <Card
                      p={4}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={paymentMethod === 'online' ? 'orange.500' : 'gray.200'}
                      bg={paymentMethod === 'online' ? 'orange.50' : 'transparent'}
                      cursor="pointer"
                      onClick={() => setPaymentMethod('online')}
                      w="full"
                    >
                      <HStack spacing={3} mb={paymentMethod === 'online' ? 3 : 0}>
                        <Radio
                          value="online"
                          isChecked={paymentMethod === 'online'}
                          colorScheme="orange"
                          size="lg"
                        />
                        <Icon as={Wallet} boxSize={5} color="gray.600" />
                        <Text fontWeight="medium" className="sfpro-font">
                          UPI / Online Payment
                        </Text>
                      </HStack>

                      <Collapse in={paymentMethod === 'online'} animateOpacity>
                        <VStack pl={8} mt={3} spacing={3}>
                          <SimpleGrid columns={2} spacing={2}>
                            {upiApps.map(app => (
                              <Button
                                key={app.id}
                                variant={selectedUpiApp === app.id ? 'solid' : 'outline'}
                                colorScheme={selectedUpiApp === app.id ? 'orange' : 'gray'}
                                onClick={() => setSelectedUpiApp(app.id)}
                                h="auto"
                                py={3}
                              >
                                <VStack spacing={1}>
                                  <Text fontSize="2xl">{app.icon}</Text>
                                  <Text fontSize="xs" className="sfpro-font">
                                    {app.name}
                                  </Text>
                                </VStack>
                              </Button>
                            ))}
                          </SimpleGrid>
                          <Input
                            placeholder="Enter UPI ID"
                            className="sfpro-font"
                          />
                        </VStack>
                      </Collapse>
                    </Card>

                    {/* Card Payment */}
                    <Card
                      p={4}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={paymentMethod === 'card' ? 'orange.500' : 'gray.200'}
                      bg={paymentMethod === 'card' ? 'orange.50' : 'transparent'}
                      cursor="pointer"
                      onClick={() => setPaymentMethod('card')}
                      w="full"
                    >
                      <HStack spacing={3} mb={paymentMethod === 'card' ? 3 : 0}>
                        <Radio
                          value="card"
                          isChecked={paymentMethod === 'card'}
                          colorScheme="orange"
                          size="lg"
                        />
                        <Icon as={CreditCard} boxSize={5} color="gray.600" />
                        <Text fontWeight="medium" className="sfpro-font">
                          Credit / Debit Card
                        </Text>
                      </HStack>

                      <Collapse in={paymentMethod === 'card'} animateOpacity>
                        <VStack pl={8} mt={3} spacing={3}>
                          <Input
                            placeholder="Card Number"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                            className="sfpro-font"
                          />
                          <Input
                            placeholder="Cardholder Name"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                            className="sfpro-font"
                          />
                          <HStack spacing={3}>
                            <Input
                              placeholder="MM/YY"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                              className="sfpro-font"
                            />
                            <Input
                              type="password"
                              placeholder="CVV"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                              className="sfpro-font"
                            />
                          </HStack>
                        </VStack>
                      </Collapse>
                    </Card>

                    {/* Cash on Delivery */}
                    <Card
                      p={4}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={paymentMethod === 'cod' ? 'orange.500' : 'gray.200'}
                      bg={paymentMethod === 'cod' ? 'orange.50' : 'transparent'}
                      cursor="pointer"
                      onClick={() => setPaymentMethod('cod')}
                      w="full"
                    >
                      <HStack spacing={3} justify="space-between">
                        <HStack spacing={3}>
                          <Radio
                            value="cod"
                            isChecked={paymentMethod === 'cod'}
                            colorScheme="orange"
                            size="lg"
                          />
                          <Icon as={IndianRupee} boxSize={5} color="gray.600" />
                          <Text fontWeight="medium" className="sfpro-font">
                            Cash on Delivery
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={mutedColor} className="sfpro-font">
                          Pay when you receive
                        </Text>
                      </HStack>
                    </Card>
                  </VStack>

                  <Button
                    mt={6}
                    w="full"
                    bgGradient="linear(to-r, orange.500, pink.500)"
                    color="white"
                    size="lg"
                    onClick={() => setStep(4)}
                    className="sfpro-font"
                  >
                    Review Order
                  </Button>
                </Card>
              )}

              {/* Step 4: Order Confirmation */}
              {step === 4 && (
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={{ base: 4, md: 6 }}>
                  <Heading size="md" mb={4} className="clash-font">
                    <HStack spacing={2}>
                      <Icon as={CheckCircle} color="green.500" />
                      <Text>Review Your Order</Text>
                    </HStack>
                  </Heading>

                  {/* Delivery Details Summary */}
                  <VStack spacing={4} mb={6}>
                    <Card bg="blue.50" p={3} borderRadius="xl" w="full">
                      <HStack spacing={3} align="flex-start">
                        <Icon as={MapPin} boxSize={4} color="blue.500" mt={1} />
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={1} className="sfpro-font">
                            Delivering to
                          </Text>
                          <Text fontSize="sm" fontWeight="medium" className="sfpro-font">
                            {selectedAddress?.fullAddress || selectedAddress?.address}
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            📞 {selectedAddress?.phone}
                          </Text>
                        </Box>
                      </HStack>
                    </Card>

                    <Card bg="green.50" p={3} borderRadius="xl" w="full">
                      <HStack spacing={3} align="flex-start">
                        <Icon as={Clock} boxSize={4} color="green.500" mt={1} />
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={1} className="sfpro-font">
                            Delivery Time
                          </Text>
                          <Text fontSize="sm" fontWeight="medium" className="sfpro-font">
                            30-40 minutes
                          </Text>
                        </Box>
                      </HStack>
                    </Card>

                    <Card bg="purple.50" p={3} borderRadius="xl" w="full">
                      <HStack spacing={3} align="flex-start">
                        <Icon as={CreditCard} boxSize={4} color="purple.500" mt={1} />
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={1} className="sfpro-font">
                            Payment Method
                          </Text>
                          <Text fontSize="sm" fontWeight="medium" textTransform="capitalize" className="sfpro-font">
                            {paymentMethod === 'online' ? `UPI (${selectedUpiApp})` : 
                             paymentMethod === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                          </Text>
                        </Box>
                      </HStack>
                    </Card>
                  </VStack>

                  {/* Order Items Summary */}
                  <Box mb={6}>
                    <Text fontWeight="semibold" mb={3} className="sfpro-font">
                      Order Summary
                    </Text>
                    <VStack spacing={2} maxH="40" overflowY="auto" className="custom-scrollbar">
                      {Object.values(cart).map(item => (
                        <Flex key={item._id} justify="space-between" w="full" fontSize="sm">
                          <Text color={mutedColor} className="sfpro-font">
                            {item.quantity}x {item.name}
                          </Text>
                          <Text fontWeight="medium">₹{item.price * item.quantity}</Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>

                  {error && (
                    <Alert status="error" borderRadius="xl" mb={4}>
                      <AlertIcon />
                      <AlertDescription className="sfpro-font">{error}</AlertDescription>
                      <CloseButton position="absolute" right={2} top={2} onClick={() => setError('')} />
                    </Alert>
                  )}

                  <Button
                    w="full"
                    bgGradient="linear(to-r, green.500, emerald.500)"
                    color="white"
                    size="lg"
                    onClick={handlePlaceOrder}
                    isLoading={loading}
                    loadingText="Processing..."
                    spinner={<Loader2 className="animate-spin" />}
                    className="sfpro-font"
                  >
                    {!loading && `Place Order • ₹${grandTotal.toFixed(2)}`}
                  </Button>

                  <Text fontSize="xs" color={mutedColor} textAlign="center" mt={4} className="sfpro-font">
                    <HStack spacing={1} justify="center">
                      <Icon as={Lock} boxSize={3} />
                      <span>Your payment information is secure</span>
                    </HStack>
                  </Text>
                </Card>
              )}
            </VStack>
          </GridItem>

          {/* Right Column - Order Summary */}
          <GridItem>
            <Card bg={cardBg} borderRadius="2xl" shadow="lg" p={6} position="sticky" top={24}>
              <Heading size="md" mb={4} className="clash-font">
                Order Summary
              </Heading>

              {/* Restaurant Info */}
              <HStack spacing={3} mb={4} pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Image
                  src={restaurant?.image || 'https://source.unsplash.com/200x200/?restaurant'}
                  alt={restaurant?.name}
                  boxSize={12}
                  borderRadius="xl"
                  objectFit="cover"
                />
                <Box>
                  <Text fontWeight="semibold" color={textColor} className="sfpro-font">
                    {restaurant?.name}
                  </Text>
                  <Text fontSize="xs" color={mutedColor} className="sfpro-font">
                    {itemCount} items
                  </Text>
                </Box>
              </HStack>

              {/* Price Breakdown */}
              <VStack spacing={2} mb={4} pb={4} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex justify="space-between" w="full" fontSize="sm">
                  <Text color={mutedColor} className="sfpro-font">Subtotal</Text>
                  <Text fontWeight="medium">₹{subtotal.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between" w="full" fontSize="sm">
                  <Text color={mutedColor} className="sfpro-font">Delivery Fee</Text>
                  <Text fontWeight="medium">₹{deliveryFee}</Text>
                </Flex>
                <Flex justify="space-between" w="full" fontSize="sm">
                  <Text color={mutedColor} className="sfpro-font">Packaging Fee</Text>
                  <Text fontWeight="medium">₹{packagingFee}</Text>
                </Flex>
                <Flex justify="space-between" w="full" fontSize="sm">
                  <Text color={mutedColor} className="sfpro-font">Tax (GST)</Text>
                  <Text fontWeight="medium">₹{tax.toFixed(2)}</Text>
                </Flex>
                {discount > 0 && (
                  <Flex justify="space-between" w="full" fontSize="sm" color="green.600">
                    <Text className="sfpro-font">Discount</Text>
                    <Text>-₹{discount.toFixed(2)}</Text>
                  </Flex>
                )}
                {donateToCharity && (
                  <Flex justify="space-between" w="full" fontSize="sm" color="purple.600">
                    <Text className="sfpro-font">Donation</Text>
                    <Text>+₹{donationAmount}</Text>
                  </Flex>
                )}
              </VStack>

              {/* Coupon Section */}
              <Box mb={4}>
                <Button
                  w="full"
                  bgGradient="linear(to-r, purple.50, pink.50)"
                  borderWidth="1px"
                  borderColor="purple.200"
                  borderRadius="xl"
                  onClick={() => setShowCoupons(!showCoupons)}
                  _hover={{ shadow: 'md' }}
                >
                  <Flex justify="space-between" align="center" w="full">
                    <HStack spacing={2}>
                      <Icon as={BadgePercent} boxSize={4} color="purple.600" />
                      <Text fontSize="sm" fontWeight="medium" color="purple.600" className="sfpro-font">
                        {appliedCoupon ? `Applied: ${appliedCoupon.code}` : 'Apply Coupon'}
                      </Text>
                    </HStack>
                    <Icon
                      as={ChevronLeft}
                      boxSize={4}
                      color="purple.600"
                      transform={showCoupons ? 'rotate(-90deg)' : 'rotate(0)'}
                      transition="transform 0.2s"
                    />
                  </Flex>
                </Button>

                <Collapse in={showCoupons} animateOpacity>
                  <Box mt={3} spaceY={3}>
                    <HStack>
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        size="sm"
                        className="sfpro-font"
                      />
                      <Button
                        size="sm"
                        bgGradient="linear(to-r, orange.500, pink.500)"
                        color="white"
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    </HStack>
                    {couponError && (
                      <Text fontSize="xs" color="red.500" className="sfpro-font">
                        {couponError}
                      </Text>
                    )}

                    <VStack spacing={2}>
                      {availableCoupons.map(coupon => (
                        <Card
                          key={coupon.id}
                          p={3}
                          borderRadius="xl"
                          borderWidth="1px"
                          borderColor={coupon.applicable ? 'green.200' : 'gray.200'}
                          bg={coupon.applicable ? 'green.50' : 'gray.50'}
                          opacity={coupon.applicable ? 1 : 0.5}
                          cursor={coupon.applicable ? 'pointer' : 'not-allowed'}
                          onClick={() => {
                            if (coupon.applicable) {
                              setCouponCode(coupon.code);
                              handleApplyCoupon();
                            }
                          }}
                          w="full"
                        >
                          <HStack spacing={2} mb={1}>
                            <Icon as={Gift} boxSize={3} color={coupon.applicable ? 'green.600' : 'gray.400'} />
                            <Text fontFamily="mono" fontSize="sm" fontWeight="bold">
                              {coupon.code}
                            </Text>
                            {coupon.applicable && (
                              <Badge colorScheme="green" size="sm" ml="auto">
                                Available
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.600" className="sfpro-font">
                            {coupon.description}
                          </Text>
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Min. order: ₹{coupon.minOrder}
                          </Text>
                        </Card>
                      ))}
                    </VStack>
                  </Box>
                </Collapse>
              </Box>

              {/* Donation Option */}
              <Box mb={4} p={3} bgGradient="linear(to-r, amber.50, orange.50)" borderRadius="xl">
                <Checkbox
                  isChecked={donateToCharity}
                  onChange={(e) => setDonateToCharity(e.target.checked)}
                  colorScheme="orange"
                >
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" className="sfpro-font">
                      Donate ₹10 to charity
                    </Text>
                    <Text fontSize="xs" color="gray.500" className="sfpro-font">
                      Support local communities with every order
                    </Text>
                  </VStack>
                </Checkbox>
              </Box>

              {/* Grand Total */}
              <Flex justify="space-between" align="center" pt={4} borderTopWidth="1px" borderColor={borderColor}>
                <Text fontWeight="bold" color={textColor} className="clash-font">
                  Total
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="orange.500" className="clash-font">
                  ₹{grandTotal.toFixed(2)}
                </Text>
              </Flex>

              <Text fontSize="xs" color={mutedColor} mt={2} className="sfpro-font">
                <HStack spacing={1}>
                  <Icon as={Shield} boxSize={3} color="green.500" />
                  <span>Secure payment. Your data is protected.</span>
                </HStack>
              </Text>

              {/* Delivery Time Selection */}
              {step === 4 && (
                <Box mt={4}>
                  <Text fontSize="sm" fontWeight="medium" mb={2} className="sfpro-font">
                    Delivery Time
                  </Text>
                  <HStack spacing={2}>
                    {deliveryTimes.map(option => (
                      <Button
                        key={option.id}
                        flex={1}
                        variant={deliveryTime === option.id ? 'solid' : 'outline'}
                        colorScheme={deliveryTime === option.id ? 'orange' : 'gray'}
                        onClick={() => setDeliveryTime(option.id)}
                        size="sm"
                        h="auto"
                        py={2}
                      >
                        <VStack spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {option.label}
                          </Text>
                          <Text fontSize="xs" color={deliveryTime === option.id ? 'whiteAlpha.800' : mutedColor}>
                            {option.time}
                          </Text>
                        </VStack>
                      </Button>
                    ))}
                  </HStack>
                  {deliveryTime === 'later' && (
                    <Input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      mt={2}
                      size="sm"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                </Box>
              )}
            </Card>
          </GridItem>
        </Grid>
      </Container>

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
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </Box>
    </Box>
  );
};

export default CheckoutPage;