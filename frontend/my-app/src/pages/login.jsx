import { useState, useRef, useEffect } from 'react';
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
  ChakraProvider,
  chakra,
  extendTheme,
  useBreakpointValue,
  useToast,
  shouldForwardProp,
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
} from 'react-icons/fi';
import {
  MdAnalytics,
  MdInventory,
  MdRestaurant,
  MdDashboard,
} from 'react-icons/md';

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
                bg="rgba(99, 102, 241, 0.2)"
                color="brand.300"
                px={3}
                py={1.5}
                borderRadius="full"
                fontSize="11px"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="1px"
              >
                AI-POWERED PLATFORM
              </Badge>
              <Heading
                fontSize={{ base: '36px', xl: '48px' }}
                fontWeight="700"
                color="white"
                lineHeight="1.2"
                letterSpacing="-0.02em"
              >
                Your Restaurant,
                <Box as="span" bgGradient="linear(135deg, brand.400, accent.400)" bgClip="text">
                  {' '}Intelligently Optimized
                </Box>
              </Heading>
              <Text fontSize="16px" color="neutral.300" lineHeight="1.6">
                Harness the power of AI to predict demand, reduce waste, and maximize profitability. Join the future of restaurant management.
              </Text>
            </VStack>

            {/* Feature Grid */}
            <SimpleGrid columns={2} spacing={4} w="full">
              {[
                { icon: FiTrendingUp, label: 'Predictive Analytics', color: 'brand.400' },
                { icon: MdInventory, label: 'Smart Inventory', color: 'accent.400' },
                { icon: FiUsers, label: 'Customer Insights', color: 'brand.400' },
                { icon: FiZap, label: 'Real-time Alerts', color: 'accent.400' },
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
                98%
              </Text>
              <Text fontSize="12px" color="neutral.400">
                Customer Satisfaction
              </Text>
            </VStack>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="28px" fontWeight="800" color="white">
                40%
              </Text>
              <Text fontSize="12px" color="neutral.400">
                Waste Reduction
              </Text>
            </VStack>
          </HStack>
        </MotionBox>
      </VStack>
    </MotionBox>
  );
};

// ============================================
// RIGHT SIDE LOGIN FORM
// ============================================
const LoginForm = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const API_URL = import.meta.env.VITE_API_URL;
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!API_URL) {
        throw new Error('Server URL is not configured. Set VITE_API_URL in your .env file.');
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          // ignore
        }
        if (data.user.role === 'manager') {
          const restaurantId =
            (data.user.restaurant && typeof data.user.restaurant === 'object'
              ? (data.user.restaurant._id || data.user.restaurant.id)
              : data.user.restaurant) ||
            data.user.restaurantId ||
            'new';

          navigate(`/dashboard/manager/${restaurantId}`);
        } else if (data.user.role === 'vendor') {
          navigate('/dashboard/vendor');
        } else if (data.user.role === 'kitchen') {
          navigate('/dashboard/kitchen');
        } else if (data.user.role === 'customer') {
          navigate('/restaurants');
        } else {
          navigate('/dashboard/waiter');
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);

      const toastId = 'login-error-toast';
      if (toast.isActive(toastId)) {
        toast.close(toastId);
      }
      toast({
        id: toastId,
        title: 'Authentication failed',
        description: message,
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MotionBox
      flex={{ base: '1', lg: '0 0 520px' }}
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
        <VStack spacing={8} w="full">
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
              Welcome Back
            </Heading>
            <Text fontSize="14px" color="neutral.500" mt={2}>
              Sign in to access your restaurant dashboard
            </Text>
          </MotionBox>

          {/* Form */}
          <MotionBox
            as="form"
            onSubmit={handleSubmit}
            w="full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <VStack spacing={5} w="full">
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

              {/* Password */}
              <MotionBox variants={itemVariants} w="full">
                <FormControl>
                  <Flex justify="space-between" mb={2}>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="neutral.600"
                      textTransform="uppercase"
                      letterSpacing="0.8px"
                    >
                      Password
                    </Text>
                    <Button
                      variant="link"
                      fontSize="11px"
                      color="brand.600"
                      fontWeight="600"
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      h="auto"
                      p={0}
                      _hover={{ color: 'brand.700' }}
                    >
                      Forgot Password?
                    </Button>
                  </Flex>
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
                        placeholder="Enter your password"
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

              {/* Remember Me */}
              <MotionBox variants={itemVariants} w="full">
                <HStack spacing={2}>
                  <Box
                    as="input"
                    type="checkbox"
                    id="remember"
                    w="16px"
                    h="16px"
                    borderRadius="4px"
                    border="1.5px solid"
                    borderColor="neutral.300"
                    cursor="pointer"
                    accentColor="brand.500"
                  />
                  <Text as="label" htmlFor="remember" fontSize="13px" color="neutral.600" cursor="pointer" userSelect="none">
                    Keep me signed in
                  </Text>
                </HStack>
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
                  loadingText="Signing in..."
                  rightIcon={!isLoading ? <FiArrowRight /> : undefined}
                  _hover={{
                    bgGradient: "linear(135deg, brand.700, brand.600)",
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 24px rgba(99, 102, 241, 0.25)',
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
              </MotionBox>
            </VStack>
          </MotionBox>

          {/* Divider */}
          <MotionBox variants={itemVariants} w="full">
            <Flex align="center" gap={3}>
              <Divider borderColor="neutral.200" />
              <Text fontSize="11px" color="neutral.400" fontWeight="500" textTransform="uppercase">Or continue with</Text>
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

          {/* Sign Up Link */}
          <MotionBox variants={itemVariants} w="full">
            <Text fontSize="14px" color="neutral.600" textAlign="center">
              Don't have an account?{' '}
              <Button
                variant="link"
                color="brand.600"
                fontWeight="700"
                fontSize="14px"
                onClick={() => navigate('/register')}
                _hover={{ color: 'brand.700', textDecoration: 'underline' }}
              >
                Create account
                <Icon as={FiArrowRight} ml={1} boxSize={12} />
              </Button>
            </Text>
          </MotionBox>

          {/* Demo Credentials */}
          <MotionBox
            variants={itemVariants}
            w="full"
            bg="neutral.50"
            p={4}
            borderRadius="14px"
            border="1px dashed"
            borderColor="neutral.200"
          >
            <VStack spacing={2} align="flex-start">
              <HStack spacing={2}>
                <Icon as={FiCheckCircle} color="brand.500" boxSize={14} />
                <Text fontSize="11px" fontWeight="700" color="neutral.600" textTransform="uppercase" letterSpacing="0.5px">
                  Demo Credentials
                </Text>
              </HStack>
              <VStack spacing={1} align="flex-start" pl={6}>
                <Text fontSize="12px" color="neutral.600">
                  Email: <Box as="span" fontFamily="mono" fontWeight="600" color="neutral.800">demo@restoai.com</Box>
                </Text>
                <Text fontSize="12px" color="neutral.600">
                  Password: <Box as="span" fontFamily="mono" fontWeight="600" color="neutral.800">demo123</Box>
                </Text>
              </VStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </MotionBox>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LoginPage = () => {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        minH="100vh"
        direction={{ base: 'column', lg: 'row' }}
        bg="white"
      >
        <BrandingSection />
        <LoginForm />
      </Flex>
    </ChakraProvider>
  );
};

export default LoginPage;