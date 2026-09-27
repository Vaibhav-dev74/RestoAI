import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  VStack,
  HStack,
  FormControl,
  Icon,
  Circle,
  Divider,
  SimpleGrid,
  Select,
  ChakraProvider,
  chakra,
  extendTheme,
  useBreakpointValue,
  useToast,
  shouldForwardProp,
  PinInput,
  PinInputField,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart2,
  FiUsers,
  FiZap,
  FiUser,
  FiPhone,
  FiHome,
  FiChevronLeft,
} from 'react-icons/fi';
import {
  MdAnalytics,
  MdInventory,
  MdRestaurant,
  MdDashboard,
} from 'react-icons/md';
import { API_BASE_URL } from '../config/apiBaseUrl';

// ============================================
// PROFESSIONAL BLUE COLOR SCHEME & TYPOGRAPHY
// ============================================
const floatBg = keyframes`
  0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.6; }
  100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const theme = extendTheme({
  fonts: {
    heading: `'ClashDisplay', 'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'SFProDisplay', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    accent: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
      },
    },
    Input: {
      baseStyle: {
        field: {
          fontSize: '15px',
          fontWeight: '500',
        },
      },
    },
  },
});

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

// ============================================
// LEFT SIDE BRANDING COMPONENT
// ============================================
const BrandingSection = () => {
  return (
    <MotionBox
      flex="1"
      position="relative"
      overflow="hidden"
      bg="linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
      initial="hidden"
      animate="visible"
      variants={slideInLeft}
      display={{ base: 'none', lg: 'flex' }}
    >
      {/* Animated background shapes */}
      <Box position="absolute" inset="0" overflow="hidden">
        <Box
          position="absolute"
          top="-20%"
          right="-10%"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="brand.500"
          filter="blur(80px)"
          opacity="0.15"
          animation={`${floatBg} 15s ease-in-out infinite`}
        />
        <Box
          position="absolute"
          bottom="-20%"
          left="-10%"
          w="350px"
          h="350px"
          borderRadius="full"
          bg="accent.500"
          filter="blur(80px)"
          opacity="0.1"
          animation={`${floatBg} 20s ease-in-out infinite reverse`}
        />
        <Box
          position="absolute"
          top="40%"
          left="30%"
          w="200px"
          h="200px"
          borderRadius="full"
          bg="brand.400"
          filter="blur(60px)"
          opacity="0.08"
          animation={`${floatBg} 12s ease-in-out infinite`}
        />
      </Box>

      {/* Grid pattern overlay */}
      <Box
        position="absolute"
        inset="0"
        bgImage="radial-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px)"
        bgSize="40px 40px"
        pointerEvents="none"
      />

      {/* Content */}
      <VStack
        position="relative"
        zIndex="10"
        justify="space-between"
        align="flex-start"
        p={{ base: 8, xl: 12 }}
        w="full"
        h="full"
      >
        {/* Logo */}
        <MotionBox variants={itemVariants}>
          <HStack spacing={3}>
            <Circle
              size="44px"
              bgGradient="linear(135deg, brand.500, accent.500)"
              boxShadow="0 8px 20px rgba(99, 102, 241, 0.3)"
            >
              <Text fontSize="22px" fontWeight="800" color="white">
                R
              </Text>
            </Circle>
            <Heading fontSize="22px" fontWeight="700" color="white" letterSpacing="-0.5px">
              Resto<span style={{ color: '#818cf8' }}>AI</span>
            </Heading>
          </HStack>
        </MotionBox>

        {/* Main Content */}
        <MotionBox variants={containerVariants} maxW="480px">
          <VStack spacing={8} align="flex-start">
            <VStack spacing={4} align="flex-start">
              <Badge
                bg="rgba(6, 182, 212, 0.2)"
                color="accent.300"
                px={3}
                py={1.5}
                borderRadius="full"
                fontSize="11px"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="1px"
              >
                START YOUR JOURNEY
              </Badge>
              <Heading
                fontSize={{ base: '36px', xl: '48px' }}
                fontWeight="700"
                color="white"
                lineHeight="1.2"
                letterSpacing="-0.02em"
              >
                Transform Your
                <Box as="span" bgGradient="linear(135deg, brand.400, accent.400)" bgClip="text">
                  {' '}Restaurant Operations
                </Box>
              </Heading>
              <Text fontSize="16px" color="neutral.300" lineHeight="1.6">
                Join thousands of restaurants already using RestoAI to reduce waste, 
                optimize inventory, and boost profitability with AI-powered insights.
              </Text>
            </VStack>

            {/* Feature Grid */}
            <SimpleGrid columns={2} spacing={4} w="full">
              {[
                { icon: FiTrendingUp, label: '40% Less Waste', color: 'brand.400' },
                { icon: MdInventory, label: 'Smart Inventory', color: 'accent.400' },
                { icon: FiUsers, label: '98% Accuracy', color: 'brand.400' },
                { icon: FiZap, label: '14-Day Free Trial', color: 'accent.400' },
              ].map((feature, i) => (
                <MotionBox key={i} variants={itemVariants}>
                  <HStack spacing={3} p={3} borderRadius="xl" bg="rgba(255,255,255,0.03)">
                    <Circle size="32px" bg={`${feature.color}20`}>
                      <Icon as={feature.icon} color={feature.color} boxSize={4} />
                    </Circle>
                    <Text fontSize="13px" fontWeight="500" color="neutral.200">
                      {feature.label}
                    </Text>
                  </HStack>
                </MotionBox>
              ))}
            </SimpleGrid>
          </VStack>
        </MotionBox>

        {/* Stats Footer */}
        <MotionBox variants={itemVariants} w="full">
          <HStack spacing={6} pt={6} borderTop="1px solid rgba(255,255,255,0.08)">
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="28px" fontWeight="800" color="white">
                500+
              </Text>
              <Text fontSize="12px" color="neutral.400">
                Active Restaurants
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="28px" fontWeight="800" color="white">
                2min
              </Text>
              <Text fontSize="12px" color="neutral.400">
                Quick Setup
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="28px" fontWeight="800" color="white">
                24/7
              </Text>
              <Text fontSize="12px" color="neutral.400">
                Support
              </Text>
            </VStack>
          </HStack>
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

// ============================================
// RIGHT SIDE REGISTER FORM
// ============================================
const RegisterForm = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'manager', 
    restaurantName: '', 
    phone: '' 
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const API_URL = API_BASE_URL;
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const targetUrl = `${API_URL}/api/auth/register/initiate-email`;
    
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const textData = await response.text();
        throw new Error(`Server Error (${response.status}): ${textData.substring(0, 50)}...`);
      }
      
      if (response.ok && data.success) {
        setStep('otp');
        toast({
          title: 'OTP Sent',
          description: `A verification code has been sent to ${form.email}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      } else {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
    } catch (err) {
      console.error('Email OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      toast({
        title: 'Registration Failed',
        description: err.message || 'Failed to send OTP. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/auth/register/verify-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          otp: otp
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Account Created',
          description: 'Your account has been successfully created!',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
        navigate('/login');
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.message || 'OTP verification failed. Please check your code.');
      toast({
        title: 'Verification Failed',
        description: err.message || 'Invalid OTP code. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    if (error) setError('');
  };

  return (
    <MotionBox
      flex={{ base: '1', lg: '0 0 560px' }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={{ base: 6, md: 8, lg: 12 }}
      bg="white"
      minH="100vh"
      variants={slideInRight}
      initial="hidden"
      animate="visible"
    >
      <Container maxW="100%" px={0}>
        <VStack spacing={step === 'register' ? 6 : 8} w="full">
          {/* Mobile Logo */}
          <MotionBox
            display={{ base: 'flex', lg: 'none' }}
            alignItems="center"
            justifyContent="center"
            variants={itemVariants}
          >
            <HStack spacing={2}>
              <Circle size="40px" bgGradient="linear(135deg, brand.500, accent.500)">
                <Text fontWeight="800" fontSize="20px" color="white">R</Text>
              </Circle>
              <Heading fontSize="22px" fontWeight="700" letterSpacing="-0.5px">
                Resto<span style={{ color: '#6366f1' }}>AI</span>
              </Heading>
            </HStack>
          </MotionBox>

          {/* Header */}
          <MotionBox variants={itemVariants} w="full" textAlign={{ base: 'center', lg: 'left' }}>
            <Heading fontSize={{ base: '28px', md: '32px' }} fontWeight="700" color="neutral.800" letterSpacing="-0.02em">
              {step === 'register' ? 'Create Account' : 'Verify Email'}
            </Heading>
            <Text fontSize="14px" color="neutral.500" mt={2}>
              {step === 'register' 
                ? 'Start your 14-day free trial today' 
                : `Enter the 6-digit code sent to ${form.email}`}
            </Text>
          </MotionBox>

          {error && (
            <MotionBox
              variants={itemVariants}
              w="full"
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              borderRadius="12px"
              p={3}
            >
              <HStack spacing={2}>
                <Text fontSize="13px" color="red.600">
                  ⚠️ {error}
                </Text>
              </HStack>
            </MotionBox>
          )}

          {step === 'register' && (
            <MotionBox
              as="form"
              onSubmit={handleRegister}
              w="full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={4} w="full">
                {/* Name */}
                <MotionBox variants={itemVariants} w="full">
                  <FormControl>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Full Name
                    </Text>
                    <Box
                      borderRadius="14px"
                      border="1.5px solid"
                      borderColor={focusedField === 'name' ? 'brand.500' : 'neutral.200'}
                      bg={focusedField === 'name' ? 'brand.50' : 'white'}
                      transition="all 0.2s"
                      _hover={{ borderColor: focusedField === 'name' ? 'brand.500' : 'neutral.300' }}
                    >
                      <InputGroup>
                        <InputLeftElement pointerEvents="none" h="full">
                          <Icon as={FiUser} color={focusedField === 'name' ? 'brand.500' : 'neutral.400'} boxSize={5} />
                        </InputLeftElement>
                        <Input
                          name="name"
                          type="text"
                          value={form.name}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="John Doe"
                          border="none"
                          fontSize="14px"
                          fontWeight="500"
                          py={6}
                          bg="transparent"
                          _placeholder={{ color: 'neutral.400' }}
                          _focus={{ boxShadow: 'none' }}
                          required
                        />
                      </InputGroup>
                    </Box>
                  </FormControl>
                </MotionBox>

                {/* Email */}
                <MotionBox variants={itemVariants} w="full">
                  <FormControl>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Email Address
                    </Text>
                    <Box
                      borderRadius="14px"
                      border="1.5px solid"
                      borderColor={focusedField === 'email' ? 'brand.500' : 'neutral.200'}
                      bg={focusedField === 'email' ? 'brand.50' : 'white'}
                      transition="all 0.2s"
                      _hover={{ borderColor: focusedField === 'email' ? 'brand.500' : 'neutral.300' }}
                    >
                      <InputGroup>
                        <InputLeftElement pointerEvents="none" h="full">
                          <Icon as={FiMail} color={focusedField === 'email' ? 'brand.500' : 'neutral.400'} boxSize={5} />
                        </InputLeftElement>
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="name@example.com"
                          border="none"
                          fontSize="14px"
                          fontWeight="500"
                          py={6}
                          bg="transparent"
                          _placeholder={{ color: 'neutral.400' }}
                          _focus={{ boxShadow: 'none' }}
                          required
                        />
                      </InputGroup>
                    </Box>
                  </FormControl>
                </MotionBox>

                {/* Phone */}
                <MotionBox variants={itemVariants} w="full">
                  <FormControl>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Phone Number
                    </Text>
                    <Box
                      borderRadius="14px"
                      border="1.5px solid"
                      borderColor={focusedField === 'phone' ? 'brand.500' : 'neutral.200'}
                      bg={focusedField === 'phone' ? 'brand.50' : 'white'}
                      transition="all 0.2s"
                      _hover={{ borderColor: focusedField === 'phone' ? 'brand.500' : 'neutral.300' }}
                    >
                      <InputGroup>
                        <InputLeftElement pointerEvents="none" h="full">
                          <Icon as={FiPhone} color={focusedField === 'phone' ? 'brand.500' : 'neutral.400'} boxSize={5} />
                        </InputLeftElement>
                        <Input
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="+1 (555) 000-0000"
                          border="none"
                          fontSize="14px"
                          fontWeight="500"
                          py={6}
                          bg="transparent"
                          _placeholder={{ color: 'neutral.400' }}
                          _focus={{ boxShadow: 'none' }}
                          required
                        />
                      </InputGroup>
                    </Box>
                  </FormControl>
                </MotionBox>

                {/* Password */}
                <MotionBox variants={itemVariants} w="full">
                  <FormControl>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Password
                    </Text>
                    <Box
                      borderRadius="14px"
                      border="1.5px solid"
                      borderColor={focusedField === 'password' ? 'brand.500' : 'neutral.200'}
                      bg={focusedField === 'password' ? 'brand.50' : 'white'}
                      transition="all 0.2s"
                      _hover={{ borderColor: focusedField === 'password' ? 'brand.500' : 'neutral.300' }}
                    >
                      <InputGroup>
                        <InputLeftElement pointerEvents="none" h="full">
                          <Icon as={FiLock} color={focusedField === 'password' ? 'brand.500' : 'neutral.400'} boxSize={5} />
                        </InputLeftElement>
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Create a strong password"
                          border="none"
                          fontSize="14px"
                          fontWeight="500"
                          py={6}
                          bg="transparent"
                          _placeholder={{ color: 'neutral.400' }}
                          _focus={{ boxShadow: 'none' }}
                          required
                        />
                        <InputRightElement h="full" pr={3}>
                          <IconButton
                            aria-label="Toggle password"
                            icon={showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            color="neutral.400"
                            _hover={{ color: 'brand.500', bg: 'transparent' }}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </Box>
                  </FormControl>
                </MotionBox>

                {/* Role Selection */}
                <MotionBox variants={itemVariants} w="full">
                  <FormControl>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      I am a
                    </Text>
                    <Box
                      borderRadius="14px"
                      border="1.5px solid"
                      borderColor={focusedField === 'role' ? 'brand.500' : 'neutral.200'}
                      bg={focusedField === 'role' ? 'brand.50' : 'white'}
                      transition="all 0.2s"
                      _hover={{ borderColor: focusedField === 'role' ? 'brand.500' : 'neutral.300' }}
                    >
                      <Select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('role')}
                        onBlur={() => setFocusedField(null)}
                        border="none"
                        fontSize="14px"
                        fontWeight="500"
                        py={6}
                        bg="transparent"
                        _focus={{ boxShadow: 'none' }}
                        icon={<Icon as={FiChevronLeft} />}
                      >
                        <option value="manager">Restaurant Manager</option>
                        <option value="waiter">Waiter / Waitress</option>
                        <option value="vendor">Vendor / Supplier</option>
                        <option value="kitchen">Kitchen Staff</option>
                        <option value="customer">Customer</option>
                      </Select>
                    </Box>
                  </FormControl>
                </MotionBox>

                {/* Restaurant Name - Conditional */}
                {form.role === 'manager' && (
                  <MotionBox variants={itemVariants} w="full">
                    <FormControl>
                      <Text
                        fontSize="11px"
                        fontWeight="600"
                        color="neutral.600"
                        mb={2}
                        textTransform="uppercase"
                        letterSpacing="0.8px"
                      >
                        Restaurant Name
                      </Text>
                      <Box
                        borderRadius="14px"
                        border="1.5px solid"
                        borderColor={focusedField === 'restaurantName' ? 'brand.500' : 'neutral.200'}
                        bg={focusedField === 'restaurantName' ? 'brand.50' : 'white'}
                        transition="all 0.2s"
                        _hover={{ borderColor: focusedField === 'restaurantName' ? 'brand.500' : 'neutral.300' }}
                      >
                        <InputGroup>
                          <InputLeftElement pointerEvents="none" h="full">
                            <Icon as={FiHome} color={focusedField === 'restaurantName' ? 'brand.500' : 'neutral.400'} boxSize={5} />
                          </InputLeftElement>
                          <Input
                            name="restaurantName"
                            type="text"
                            value={form.restaurantName}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('restaurantName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Your Restaurant"
                            border="none"
                            fontSize="14px"
                            fontWeight="500"
                            py={6}
                            bg="transparent"
                            _placeholder={{ color: 'neutral.400' }}
                            _focus={{ boxShadow: 'none' }}
                            required
                          />
                        </InputGroup>
                      </Box>
                    </FormControl>
                  </MotionBox>
                )}

                {/* Terms */}
                <MotionBox variants={itemVariants} w="full">
                  <Text fontSize="12px" color="neutral.500" textAlign="center">
                    By creating an account, you agree to our{' '}
                    <Button variant="link" color="brand.600" fontSize="12px" fontWeight="600">
                      Terms of Service
                    </Button>
                    {' '}and{' '}
                    <Button variant="link" color="brand.600" fontSize="12px" fontWeight="600">
                      Privacy Policy
                    </Button>
                  </Text>
                </MotionBox>

                {/* Submit Button */}
                <MotionBox variants={itemVariants} w="full" pt={2}>
                  <Button
                    type="submit"
                    w="full"
                    h="52px"
                    bgGradient="linear(135deg, brand.600, brand.500)"
                    color="white"
                    fontSize="15px"
                    fontWeight="700"
                    borderRadius="14px"
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    rightIcon={!isLoading ? <FiArrowRight /> : undefined}
                    _hover={{
                      bgGradient: "linear(135deg, brand.700, brand.600)",
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(99, 102, 241, 0.25)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="all 0.2s"
                  >
                    Create Account
                  </Button>
                </MotionBox>
              </VStack>
            </MotionBox>
          )}

          {step === 'otp' && (
            <MotionBox
              as="form"
              onSubmit={handleVerifyOtp}
              w="full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <VStack spacing={6} w="full">
                {/* OTP Input */}
               {/* OTP Input - Updated with black text and proper visibility */}
<MotionBox variants={itemVariants} w="full">
  <Text
    fontSize="11px"
    fontWeight="600"
    color="neutral.800"  // Darker for better visibility
    mb={3}
    textTransform="uppercase"
    letterSpacing="0.8px"
    textAlign="center"
  >
    Enter Verification Code
  </Text>
  <HStack justify="center" spacing={3}>
    <PinInput 
      otp 
      size="lg" 
      value={otp} 
      onChange={handleOtpChange}
      placeholder=""
    >
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"  // Darker border
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"  // Black text
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
      <PinInputField 
        border="2px solid" 
        borderColor="neutral.400"
        borderRadius="12px"
        w="52px"
        h="52px"
        fontSize="20px"
        fontWeight="700"
        color="neutral.900"
        bg="white"
        _placeholder={{ color: 'neutral.400' }}
        _focus={{ 
          borderColor: 'brand.500', 
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
          color: 'neutral.900'
        }}
        _hover={{ borderColor: 'neutral.500' }}
      />
    </PinInput>
  </HStack>
</MotionBox>

                {/* Resend OTP */}
                <MotionBox variants={itemVariants} w="full">
                  <Text fontSize="13px" color="neutral.500" textAlign="center">
                    Didn't receive the code?{' '}
                    <Button
                      variant="link"
                      color="brand.600"
                      fontSize="13px"
                      fontWeight="600"
                      onClick={handleRegister}
                      isLoading={isLoading}
                    >
                      Resend OTP
                    </Button>
                  </Text>
                </MotionBox>

                {/* Verify Button */}
                <MotionBox variants={itemVariants} w="full">
                  <Button
                    type="submit"
                    w="full"
                    h="52px"
                    bgGradient="linear(135deg, accent.600, accent.500)"
                    color="white"
                    fontSize="15px"
                    fontWeight="700"
                    borderRadius="14px"
                    isLoading={isLoading}
                    loadingText="Verifying..."
                    rightIcon={!isLoading ? <FiCheckCircle /> : undefined}
                    _hover={{
                      bgGradient: "linear(135deg, accent.700, accent.600)",
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(6, 182, 212, 0.25)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="all 0.2s"
                  >
                    Verify & Complete
                  </Button>
                </MotionBox>

                {/* Back Button */}
                <MotionBox variants={itemVariants} w="full">
                  <Button
                    variant="ghost"
                    w="full"
                    h="48px"
                    color="neutral.600"
                    fontSize="14px"
                    fontWeight="500"
                    borderRadius="14px"
                    onClick={() => {
                      setStep('register');
                      setError('');
                      setOtp('');
                    }}
                    leftIcon={<Icon as={FiChevronLeft} />}
                    _hover={{ bg: 'neutral.50' }}
                  >
                    Back to Registration
                  </Button>
                </MotionBox>
              </VStack>
            </MotionBox>
          )}

          {step === 'register' && (
            <>
              {/* Divider */}
              <MotionBox variants={itemVariants} w="full">
                <Flex align="center" gap={3}>
                  <Divider borderColor="neutral.200" />
                  <Text fontSize="11px" color="neutral.400" fontWeight="500" textTransform="uppercase">Or sign up with</Text>
                  <Divider borderColor="neutral.200" />
                </Flex>
              </MotionBox>

              {/* SSO */}
              <MotionBox variants={itemVariants} w="full">
                <Button
                  w="full"
                  h="48px"
                  bg="white"
                  border="1.5px solid"
                  borderColor="neutral.200"
                  color="neutral.700"
                  fontSize="14px"
                  fontWeight="600"
                  borderRadius="14px"
                  _hover={{ bg: 'neutral.50', borderColor: 'neutral.300' }}
                >
                  <HStack spacing={3}>
                    <Text fontSize="20px">🔑</Text>
                    <Text>Continue with Google</Text>
                  </HStack>
                </Button>
              </MotionBox>
            </>
          )}

          {/* Login Link */}
          <MotionBox variants={itemVariants} w="full">
            <Text fontSize="14px" color="neutral.600" textAlign="center">
              Already have an account?{' '}
              <Button
                variant="link"
                color="brand.600"
                fontWeight="700"
                fontSize="14px"
                onClick={() => navigate('/login')}
                _hover={{ color: 'brand.700', textDecoration: 'underline' }}
              >
                Sign in
                <Icon as={FiArrowRight} ml={1} boxSize={12} />
              </Button>
            </Text>
          </MotionBox>
        </VStack>
      </Container>
    </MotionBox>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const RegisterPage = () => {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        minH="100vh"
        direction={{ base: 'column', lg: 'row' }}
        bg="white"
      >
        <BrandingSection />
        <RegisterForm />
      </Flex>
    </ChakraProvider>
  );
};

export default RegisterPage;