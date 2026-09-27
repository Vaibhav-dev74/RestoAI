import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Flex, Grid, Text, Button, Input,
  Spinner, useToast,
  Alert, AlertIcon, AlertDescription,
  VStack, HStack,
  extendTheme, ChakraProvider,
} from '@chakra-ui/react';
import { API_BASE_URL } from '../config/apiBaseUrl';

// ─── THEME (same system) ──────────────────────────────────────────────────────
const theme = extendTheme({
  fonts: {
    heading: `'Playfair Display', 'Georgia', serif`,
    body:    `'DM Sans', 'Helvetica Neue', sans-serif`,
  },
  styles: {
    global: {
      'html, body': {
        bg: '#FAFAF8',
        color: '#2C2C2C',
        fontFamily: `'DM Sans', 'Helvetica Neue', sans-serif`,
      },
      '::selection': { bg: '#EAC89A', color: '#4A2A0E' },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'DM Sans', sans-serif`,
        fontWeight: '500',
        borderRadius: '8px',
        letterSpacing: '0.01em',
      },
      variants: {
        solid_dark: {
          bg: '#2C2C2C', color: 'white',
          _hover: { bg: '#1a1a1a', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
          _active: { transform: 'translateY(0)' },
          transition: 'all 0.18s ease',
        },
        terracotta: {
          bg: '#C4893A', color: 'white',
          _hover: { bg: '#A86E28', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(196,137,58,0.4)' },
          _active: { transform: 'translateY(0)' },
          transition: 'all 0.18s ease',
        },
        outline_soft: {
          bg: 'transparent', color: '#6C757D',
          border: '1.5px solid #DEE2E6',
          _hover: { bg: '#F1F3F5', borderColor: '#ADB5BD', color: '#2C2C2C' },
          transition: 'all 0.15s ease',
        },
      },
    },
  },
});

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────
const ROLE_CFG = {
  manager: { color: '#C0392B', bg: '#FAEAEA',  label: 'Manager',       icon: '👑' },
  waiter:  { color: '#2980B9', bg: '#EBF5FB',  label: 'Waiter',        icon: '🍽️' },
  kitchen: { color: '#E07B39', bg: '#FDF2EA',  label: 'Kitchen Staff', icon: '👨‍🍳' },
  vendor:  { color: '#8E44AD', bg: '#F5EEF8',  label: 'Vendor',        icon: '📦' },
};

const normalizeRestaurantId = (rest) => {
  if (!rest) return null;
  if (typeof rest === 'string') return rest;
  return rest._id || rest.id || null;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function KPICard({ icon, value, label, accent }) {
  return (
    <Box
      bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
      p="16px 20px" position="relative" overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
      transition="all 0.2s ease"
      _hover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }}
    >
      <Box position="absolute" top={0} right={0} w="60px" h="60px"
        borderRadius="0 14px 0 60px" bg={accent || '#FAF0E4'} opacity="0.55" />
      <Text fontSize="18px" lineHeight="1" mb="8px">{icon}</Text>
      <Text fontSize="24px" fontWeight="700" lineHeight="1.1" fontFamily="'Playfair Display', serif" color="#2C2C2C">{value}</Text>
      <Text fontSize="11px" fontWeight="500" color="#6C757D" mt="3px">{label}</Text>
    </Box>
  );
}

// ─── USER CARD ────────────────────────────────────────────────────────────────
function UserCard({ user, onViewProfile }) {
  const cfg = ROLE_CFG[user.role] || { color: '#6C757D', bg: '#F1F3F5', label: user.role, icon: '👤' };
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <Box
      bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
      p="16px 20px"
      boxShadow="0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
      transition="all 0.2s ease"
      _hover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)', transform: 'translateY(-2px)', borderColor: '#EDEDE8' }}
    >
      <Flex align="flex-start" justify="space-between" gap="12px">
        {/* Left: avatar + info */}
        <Flex align="flex-start" gap="12px" flex="1" minW={0}>
          {/* Avatar */}
          <Box
            w="44px" h="44px" borderRadius="11px"
            bg="#2C2C2C"
            display="flex" alignItems="center" justifyContent="center"
            flexShrink={0}
          >
            <Text
              fontFamily="'Playfair Display', serif"
              fontSize="15px" fontWeight="700" color="white" lineHeight="1"
            >
              {initials}
            </Text>
          </Box>

          {/* Name + email + role */}
          <Box flex="1" minW={0}>
            <Flex align="center" gap="7px" mb="2px" flexWrap="wrap">
              <Text
                fontSize="14px" fontWeight="600" color="#2C2C2C"
                fontFamily="'Playfair Display', serif"
                letterSpacing="-0.01em" noOfLines={1}
              >
                {user.name}
              </Text>
              <Box px="7px" py="2px" borderRadius="20px" bg={cfg.bg} flexShrink={0}>
                <Text fontSize="9px" fontWeight="700" color={cfg.color} textTransform="uppercase" letterSpacing="0.07em">
                  {cfg.icon} {cfg.label}
                </Text>
              </Box>
            </Flex>
            <Text fontSize="12px" color="#6C757D" noOfLines={1}>{user.email}</Text>
            {user.phone && (
              <Text fontSize="11px" color="#ADB5BD" mt="1px">{user.phone}</Text>
            )}
          </Box>
        </Flex>

        {/* Right: joined + action */}
        <Flex direction="column" align="flex-end" gap="8px" flexShrink={0}>
          <Box textAlign="right">
            <Text fontSize="9px" fontWeight="700" color="#ADB5BD" textTransform="uppercase" letterSpacing="0.07em">Joined</Text>
            <Text fontSize="11px" fontWeight="500" color="#6C757D" mt="1px">{joined}</Text>
          </Box>
          <Button
            variant="outline_soft"
            size="xs" h="26px" px="12px" fontSize="11px"
            onClick={() => onViewProfile(user._id)}
          >
            View Profile →
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function ManagerUsersInner() {
  const [users, setUsers]               = useState([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [search, setSearch]             = useState('');
  const navigate = useNavigate() || (() => {});
  const toast    = useToast();

  // ── Fetch ──
  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
        axios.get(`${API_BASE_URL}/api/auth`, { headers }),
      ]);

      const currentUser = meRes.data?.user;
      const currentRestaurantId = normalizeRestaurantId(currentUser?.restaurant);
      setRestaurantName(currentUser?.restaurant?.name || 'Restaurant');

      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];

      const scopedUsers = currentRestaurantId
        ? allUsers.filter(u => normalizeRestaurantId(u.restaurant) === currentRestaurantId)
        : allUsers;

      setUsers(scopedUsers);

      if (isRefresh) {
        toast({ title: 'Users refreshed', status: 'success', duration: 2000, isClosable: true, position: 'top-right' });
      }
    } catch (e) {
      console.error('Failed to load users:', e);
      const msg = e?.response?.data?.error || e?.message || 'Could not load users data. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, toast]);

  useEffect(() => { fetchUsers(false); }, [fetchUsers]);

  // ── Filter + Search ──
  const visible = users.filter(u => {
    const roleMatch = filterRole === 'all' || u.role === filterRole;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return roleMatch && searchMatch;
  });

  // ── Stats ──
  const stats = {
    total:   users.length,
    managers: users.filter(u => u.role === 'manager').length,
    waiters:  users.filter(u => u.role === 'waiter').length,
    kitchen:  users.filter(u => u.role === 'kitchen').length,
    vendors:  users.filter(u => u.role === 'vendor').length,
  };

  // ── Loading ──
  if (loading) return (
    <Flex h="100vh" bg="#FAFAF8" align="center" justify="center" direction="column" gap="16px">
      <Spinner size="lg" color="#C4893A" thickness="3px" speed="0.85s" />
      <VStack gap="2px">
        <Text fontFamily="'Playfair Display', serif" fontSize="18px" fontWeight="600" color="#2C2C2C">
          Loading team…
        </Text>
        <Text fontSize="12px" color="#ADB5BD">Fetching restaurant staff</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box minH="100vh" bg="#FAFAF8" fontFamily="'DM Sans', sans-serif">
      {/* Dot grid */}
      <Box position="fixed" inset="0" pointerEvents="none" zIndex={0}
        style={{ backgroundImage: 'radial-gradient(circle, #E0DDD8 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* ── TOPBAR ── */}
      <Box
        position="sticky" top={0} zIndex={200}
        bg="rgba(250,250,248,0.94)" backdropFilter="blur(14px) saturate(160%)"
        borderBottom="1px solid #EAEAE6"
      >
        <Flex
          align="center" justify="space-between"
          h="60px" px={{ base: '16px', md: '32px', lg: '48px' }}
          maxW="1100px" mx="auto"
        >
          <Flex align="center" gap="14px">
            <Box
              as="button" w="34px" h="34px" borderRadius="9px"
              bg="#2C2C2C" display="flex" alignItems="center" justifyContent="center"
              flexShrink={0} cursor="pointer" border="none"
              _hover={{ bg: '#C4893A' }} transition="bg 0.2s"
              onClick={() => navigate('/dashboard/manager/new')}
            >
              <Text color="white" fontSize="14px" lineHeight="1">←</Text>
            </Box>
            <Box lineHeight="1.3">
              <Text fontFamily="'Playfair Display', serif" fontWeight="600" fontSize="15px" color="#2C2C2C" letterSpacing="-0.01em">
                Team Management
              </Text>
              <Text fontSize="10px" color="#ADB5BD" fontWeight="400" letterSpacing="0.02em">
                {restaurantName} · {users.length} members
              </Text>
            </Box>
          </Flex>

          <Button
            variant="outline_soft"
            size="sm" h="32px" px="14px" fontSize="12px"
            isLoading={refreshing}
            loadingText="Refreshing"
            onClick={() => fetchUsers(true)}
          >
            ↻ Refresh
          </Button>
        </Flex>
      </Box>

      {/* ── BODY ── */}
      <Box maxW="1100px" mx="auto" px={{ base: '16px', md: '32px', lg: '48px' }} py="28px" position="relative" zIndex={1}>

        {/* Error */}
        {error && (
          <Alert status="error" borderRadius="10px" mb="18px" bg="#FAEAEA" border="1px solid #F1AEAD" py="10px">
            <AlertIcon color="#C0392B" boxSize="16px" />
            <AlertDescription fontSize="13px" color="#922B21">{error}</AlertDescription>
          </Alert>
        )}

        {/* ── KPI STRIP ── */}
        <Grid
          templateColumns={{ base: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', lg: 'repeat(5,1fr)' }}
          gap="12px" mb="24px"
        >
          <KPICard icon="👥" value={stats.total}    label="Total Staff"    accent="#FAF0E4" />
          <KPICard icon="👑" value={stats.managers}  label="Managers"      accent="#FAEAEA" />
          <KPICard icon="🍽️" value={stats.waiters}   label="Waiters"       accent="#EBF5FB" />
          <KPICard icon="👨‍🍳" value={stats.kitchen}  label="Kitchen"       accent="#FDF2EA" />
          <KPICard icon="📦" value={stats.vendors}   label="Vendors"       accent="#F5EEF8" />
        </Grid>

        {/* ── FILTERS + SEARCH ── */}
        <Box
          bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
          boxShadow="0 1px 3px rgba(0,0,0,0.04)"
          px="20px" py="14px" mb="18px"
        >
          <Flex gap="10px" align="center" flexWrap="wrap">
            {/* Search */}
            <Box position="relative" flex="1" minW="200px">
              <Box position="absolute" left="11px" top="50%" transform="translateY(-50%)" pointerEvents="none">
                <Text fontSize="13px" color="#ADB5BD">🔍</Text>
              </Box>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                pl="32px"
                h="36px" fontSize="13px" fontFamily="'DM Sans', sans-serif"
                bg="#FAFAF8" border="1.5px solid #DEE2E6" borderRadius="9px" color="#2C2C2C"
                _focus={{ borderColor: '#C4893A', boxShadow: '0 0 0 3px rgba(196,137,58,0.12)', bg: 'white' }}
                _placeholder={{ color: '#BDC3C7' }}
                transition="all 0.15s"
              />
            </Box>

            {/* Role filter — pill buttons */}
            <HStack gap="5px" flexWrap="wrap">
              {[
                { value: 'all',     label: 'All',     count: stats.total    },
                { value: 'manager', label: 'Managers',count: stats.managers },
                { value: 'waiter',  label: 'Waiters', count: stats.waiters  },
                { value: 'kitchen', label: 'Kitchen', count: stats.kitchen  },
                { value: 'vendor',  label: 'Vendors', count: stats.vendors  },
              ].map(({ value, label, count }) => (
                <Button
                  key={value}
                  size="xs" h="28px" px="11px" fontSize="11px" borderRadius="20px"
                  fontFamily="'DM Sans', sans-serif" fontWeight="500"
                  bg={filterRole === value ? '#2C2C2C' : 'transparent'}
                  color={filterRole === value ? 'white' : '#6C757D'}
                  border={filterRole === value ? 'none' : '1.5px solid #DEE2E6'}
                  _hover={filterRole === value ? {} : { bg: '#F1F3F5', color: '#2C2C2C' }}
                  onClick={() => setFilterRole(value)}
                  transition="all 0.15s"
                >
                  {label}
                  <Box
                    as="span" ml="5px" px="5px" py="1px"
                    bg={filterRole === value ? 'rgba(255,255,255,0.2)' : '#F1F3F5'}
                    borderRadius="10px"
                    fontSize="9px" fontWeight="700"
                    color={filterRole === value ? 'white' : '#ADB5BD'}
                  >
                    {count}
                  </Box>
                </Button>
              ))}
            </HStack>
          </Flex>
        </Box>

        {/* ── USER LIST ── */}
        {visible.length === 0 ? (
          <Box
            bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
            py="52px" textAlign="center"
          >
            <Text fontSize="28px" opacity="0.18" mb="8px">👤</Text>
            <Text fontSize="13px" color="#ADB5BD">
              {search ? `No users matching "${search}"` : 'No users found for this role'}
            </Text>
            {(search || filterRole !== 'all') && (
              <Button
                variant="outline_soft" size="sm" h="30px" px="14px" fontSize="12px" mt="12px"
                onClick={() => { setSearch(''); setFilterRole('all'); }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap="12px"
            mb="20px"
          >
            {visible.map(user => (
              <UserCard
                key={user._id}
                user={user}
                onViewProfile={(id) => navigate(`/profile/${id}`)}
              />
            ))}
          </Grid>
        )}

        {/* ── TIPS CARD ── */}
        <Box
          bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
          boxShadow="0 1px 3px rgba(0,0,0,0.04)"
          overflow="hidden"
        >
          <Flex px="20px" py="12px" borderBottom="1px solid #F1F3F5" align="center" gap="8px">
            <Box w="6px" h="6px" borderRadius="full" bg="#C4893A" flexShrink={0} />
            <Text fontFamily="'Playfair Display', serif" fontSize="13px" fontWeight="600" color="#2C2C2C">
              Staff Management
            </Text>
          </Flex>
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
            gap="1px" bg="#F1F3F5"
          >
            {[
              { icon: '🔗', text: 'Staff join by scanning your restaurant QR code' },
              { icon: '🔄', text: 'New members appear here once they\'ve joined' },
              { icon: '🎯', text: 'Use role filters to quickly find specific staff' },
              { icon: '👁️', text: 'Click "View Profile" to manage individual accounts' },
            ].map(({ icon, text }, i) => (
              <Box key={i} bg="white" px="18px" py="13px">
                <Flex align="flex-start" gap="10px">
                  <Text fontSize="14px" lineHeight="1" mt="1px" flexShrink={0}>{icon}</Text>
                  <Text fontSize="12px" color="#6C757D" lineHeight="1.5">{text}</Text>
                </Flex>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box textAlign="center" pt="24px" pb="4px">
          <Text fontSize="10px" color="#D0CEC8" letterSpacing="0.08em">
            RESTO · TEAM MANAGEMENT · {new Date().getFullYear()}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function ManagerUsersPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      <ChakraProvider theme={theme}>
        <ManagerUsersInner />
      </ChakraProvider>
    </>
  );
}