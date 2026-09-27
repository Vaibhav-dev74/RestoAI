import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  Box, Flex, Grid, Text, Button, Input, Select,
  Spinner, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, FormErrorMessage,
  Alert, AlertIcon, AlertDescription,
  VStack, HStack,
  extendTheme, ChakraProvider,
} from '@chakra-ui/react';

// ─── THEME (same system as TableManagement) ───────────────────────────────────
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
        ghost_red: {
          bg: '#FAEAEA', color: '#C0392B',
          _hover: { bg: '#F5DADA' },
          transition: 'all 0.15s',
        },
        ghost_green: {
          bg: '#EBF7F2', color: '#3D9970',
          _hover: { bg: '#D5EFEA' },
          transition: 'all 0.15s',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.14)', bg: 'white' },
        header: { fontFamily: `'Playfair Display', serif`, fontWeight: '600', fontSize: '19px', color: '#2C2C2C' },
        overlay: { bg: 'rgba(44,44,44,0.4)', backdropFilter: 'blur(5px)' },
      },
    },
  },
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  customer: { color: '#3D9970', bg: '#EBF7F2', label: 'Customer' },
  manager:  { color: '#C4893A', bg: '#FDF2EA', label: 'Manager'  },
  waiter:   { color: '#2980B9', bg: '#EBF5FB', label: 'Waiter'   },
  kitchen:  { color: '#8E44AD', bg: '#F5EEF8', label: 'Kitchen'  },
  vendor:   { color: '#6C757D', bg: '#F1F3F5', label: 'Vendor'   },
};

const ADDR_LABEL_COLOR = {
  Home:  { bg: '#EBF7F2', color: '#3D9970' },
  Work:  { bg: '#EBF5FB', color: '#2980B9' },
  Other: { bg: '#F4F2F5', color: '#9B8EA0' },
};

// ─── INPUT STYLES ─────────────────────────────────────────────────────────────
const inp = {
  h: '38px', fontSize: '13px', fontFamily: `'DM Sans', sans-serif`,
  bg: 'white', border: '1.5px solid #DEE2E6', borderRadius: '8px', color: '#2C2C2C',
  _focus: { borderColor: '#C4893A', boxShadow: '0 0 0 3px rgba(196,137,58,0.12)', bg: 'white' },
  _placeholder: { color: '#BDC3C7' },
  transition: 'all 0.15s',
};

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
  return (
    <FormControl isInvalid={!!error} mb="13px">
      <FormLabel
        fontSize="11px" fontWeight="700" color="#495057"
        textTransform="uppercase" letterSpacing="0.07em"
        mb="5px" fontFamily="'DM Sans', sans-serif"
      >
        {label}{required && <Text as="span" color="#C0392B" ml="1px">*</Text>}
      </FormLabel>
      {children}
      {error && <FormErrorMessage fontSize="11px" mt="3px">{error}</FormErrorMessage>}
    </FormControl>
  );
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, editing, inputEl }) {
  return (
    <Flex align="center" justify="space-between" py="12px"
      borderBottom="1px solid #F1F3F5"
      _last={{ borderBottom: 'none' }}>
      <Text fontSize="11px" fontWeight="700" color="#ADB5BD" textTransform="uppercase" letterSpacing="0.07em" w="80px" flexShrink={0}>
        {label}
      </Text>
      {editing ? inputEl : (
        <Text fontSize="13px" fontWeight="500" color="#2C2C2C" textAlign="right">
          {value || <Text as="span" color="#ADB5BD" fontStyle="italic">—</Text>}
        </Text>
      )}
    </Flex>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, action, children }) {
  return (
    <Box bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
      boxShadow="0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
      overflow="hidden">
      <Flex px="20px" py="13px" borderBottom="1px solid #F1F3F5" align="center" justify="space-between">
        <Text fontFamily="'Playfair Display', serif" fontSize="14px" fontWeight="600" color="#2C2C2C">
          {title}
        </Text>
        {action}
      </Flex>
      <Box px="20px" py="16px">{children}</Box>
    </Box>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function UserProfileInner() {
  const { id } = useParams?.() || {};
  const navigate = useNavigate?.() || (() => {});
  const toast = useToast();

  const VITE_API_URL = API_BASE_URL;

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: '', phone: '' });
  const [formErr, setFormErr]   = useState({});

  // Address
  const [showAddrForm, setShowAddrForm]     = useState(false);
  const [addrSaving, setAddrSaving]         = useState(false);
  const [addrErr, setAddrErr]               = useState({});
  const [newAddr, setNewAddr] = useState({ label: 'Home', address: '', city: '', state: '', zipCode: '', country: '' });

  // Restaurant location
  const [editLocation, setEditLocation]   = useState(false);
  const [locSaving, setLocSaving]         = useState(false);
  const [locErr, setLocErr]               = useState({});
  const [locForm, setLocForm] = useState({ address: '', city: '', state: '', zipCode: '', country: '', latitude: null, longitude: null });

  const deleteConfirm = useDisclosure();
  const [deletingIdx, setDeletingIdx] = useState(null);

  const ok  = (msg) => toast({ title: msg, status: 'success', duration: 3000, isClosable: true, position: 'top-right' });
  const err = (msg) => toast({ title: 'Error', description: msg, status: 'error',   duration: 4000, isClosable: true, position: 'top-right' });

  const safeParse = (val) => {
    try { return JSON.parse(val); } catch { return null; }
  };

  const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
  const sessionUser = (typeof localStorage !== 'undefined') ? safeParse(localStorage.getItem('user') || 'null') : null;
  const sessionUserId = sessionUser?._id || sessionUser?.id || null;

  const canEdit = !!(token && user?._id && sessionUserId && String(user._id) === String(sessionUserId));

  const authHeaders = () => {
    const t = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const setSessionUser = (u) => {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem('user', JSON.stringify(u)); } catch { /* ignore */ }
  };

  const normalizeUser = (u) => {
    if (!u || typeof u !== 'object') return u;
    // Ensure optional arrays exist (UI expects arrays)
    return {
      ...u,
      addresses: Array.isArray(u.addresses) ? u.addresses : [],
    };
  };

  // ── Init ──
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');

      // Prefer route param; fallback to logged-in user id
      const targetId = id || sessionUserId;
      if (!targetId) {
        setLoading(false);
        setError('No user selected. Please sign in again.');
        return;
      }

      if (!token) {
        // App generally expects authenticated access for profile.
        navigate('/customer-login');
        return;
      }

      try {
        const res = await axios.get(`${VITE_API_URL}/api/auth/${targetId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const fetched = normalizeUser(res.data);
        if (cancelled) return;
        setUser(fetched);
        setForm({ name: fetched?.name || '', phone: fetched?.phone || '' });
        if (fetched?.restaurant?.location) {
          setLocForm({
            address: fetched.restaurant.location.address || '',
            city: fetched.restaurant.location.city || '',
            state: fetched.restaurant.location.state || '',
            zipCode: fetched.restaurant.location.zipCode || '',
            country: fetched.restaurant.location.country || '',
            latitude: fetched.restaurant.location.latitude ?? null,
            longitude: fetched.restaurant.location.longitude ?? null,
          });
        } else {
          setLocForm({ address: '', city: '', state: '', zipCode: '', country: '', latitude: null, longitude: null });
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e?.response?.data?.error || e?.message || 'Failed to load profile';
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [VITE_API_URL, id, navigate, sessionUserId, token]);

  // ── Validation ──
  const validateProfile = (f) => {
    const e = {};
    if (!f.name?.trim()) e.name = 'Name is required';
    if (f.phone && !/^\+?[\d\s\-(). ]{7,18}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
    return e;
  };

  const validateAddr = (a) => {
    const e = {};
    if (!a.address?.trim()) e.address = 'Street address is required';
    if (!a.city?.trim())    e.city    = 'City is required';
    return e;
  };

  const validateLoc = (l) => {
    const e = {};
    if (!l.address?.trim()) e.address = 'Street address is required';
    if (!l.city?.trim())    e.city    = 'City is required';
    return e;
  };

  // ── Handlers ──
  const handleSave = async () => {
    if (!canEdit) {
      err('You can only edit your own profile');
      return;
    }
    const e = validateProfile(form);
    if (Object.keys(e).length) { setFormErr(e); return; }
    setSaving(true);
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/auth/${user._id}`,
        { name: form.name, phone: form.phone },
        { headers: { ...authHeaders() } }
      );
      const updated = normalizeUser(res.data);
      setUser(updated);
      if (sessionUserId && String(updated?._id) === String(sessionUserId)) {
        setSessionUser(updated);
      }
      setEditMode(false);
      setFormErr({});
      ok('Profile updated');
    } catch (e2) {
      err(e2?.response?.data?.error || 'Failed to update profile');
    }
    finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setForm({ name: user.name || '', phone: user.phone || '' });
    setFormErr({});
  };

  const handleAddAddress = async () => {
    if (!canEdit) {
      err('You can only edit your own addresses');
      return;
    }
    const e = validateAddr(newAddr);
    if (Object.keys(e).length) { setAddrErr(e); return; }
    setAddrSaving(true);
    try {
      const nextAddresses = [...(user.addresses || []), { ...newAddr }];
      const res = await axios.patch(
        `${VITE_API_URL}/api/auth/${user._id}`,
        { addresses: nextAddresses },
        { headers: { ...authHeaders() } }
      );
      const updated = normalizeUser(res.data);
      setUser(updated);
      if (sessionUserId && String(updated?._id) === String(sessionUserId)) {
        setSessionUser(updated);
      }
      setNewAddr({ label: 'Home', address: '', city: '', state: '', zipCode: '', country: '' });
      setAddrErr({});
      setShowAddrForm(false);
      ok('Address saved');
    } catch (e2) {
      err(e2?.response?.data?.error || 'Failed to add address');
    }
    finally { setAddrSaving(false); }
  };

  const handleDeleteAddress = async (index) => {
    if (!canEdit) {
      err('You can only edit your own addresses');
      deleteConfirm.onClose();
      setDeletingIdx(null);
      return;
    }
    try {
      const nextAddresses = (user.addresses || []).filter((_, i) => i !== index);
      const res = await axios.patch(
        `${VITE_API_URL}/api/auth/${user._id}`,
        { addresses: nextAddresses },
        { headers: { ...authHeaders() } }
      );
      const updated = normalizeUser(res.data);
      setUser(updated);
      if (sessionUserId && String(updated?._id) === String(sessionUserId)) {
        setSessionUser(updated);
      }
      ok('Address removed');
    } catch (e2) {
      err(e2?.response?.data?.error || 'Failed to delete address');
    }
    finally { deleteConfirm.onClose(); setDeletingIdx(null); }
  };

  const handleUpdateLocation = async () => {
    if (!canEdit) {
      err('You can only edit your own restaurant location');
      return;
    }
    const e = validateLoc(locForm);
    if (Object.keys(e).length) { setLocErr(e); return; }
    setLocSaving(true);
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/auth/${user._id}`,
        { location: { ...locForm } },
        { headers: { ...authHeaders() } }
      );
      const updated = normalizeUser(res.data);
      setUser(updated);
      if (sessionUserId && String(updated?._id) === String(sessionUserId)) {
        setSessionUser(updated);
      }
      setEditLocation(false); setLocErr({});
      ok('Restaurant location updated');
    } catch (e2) {
      err(e2?.response?.data?.error || 'Failed to update location');
    }
    finally { setLocSaving(false); }
  };

  const handleLogout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    ok('Signed out successfully');
    setTimeout(() => navigate('/customer-login'), 800);
  };

  // ── Loading ──
  if (loading) return (
    <Flex h="100vh" bg="#FAFAF8" align="center" justify="center" direction="column" gap="16px">
      <Spinner size="lg" color="#C4893A" thickness="3px" speed="0.85s" />
      <VStack gap="2px">
        <Text fontFamily="'Playfair Display', serif" fontSize="18px" fontWeight="600" color="#2C2C2C">
          Loading your profile…
        </Text>
        <Text fontSize="12px" color="#ADB5BD">Just a moment</Text>
      </VStack>
    </Flex>
  );

  if (error) return (
    <Flex h="100vh" bg="#FAFAF8" align="center" justify="center" px="24px">
      <Alert status="error" borderRadius="12px" maxW="400px" bg="#FAEAEA" border="1px solid #F1AEAD">
        <AlertIcon color="#C0392B" />
        <AlertDescription fontSize="13px" color="#922B21">{error}</AlertDescription>
      </Alert>
    </Flex>
  );

  if (!user) return null;

  const isStaff       = ['manager', 'waiter', 'kitchen', 'vendor'].includes(user.role);
  const roleCfg       = ROLE_CONFIG[user.role] || ROLE_CONFIG.customer;
  const initials      = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const joinedDate    = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <Box minH="100vh" bg="#FAFAF8" fontFamily="'DM Sans', sans-serif">
      {/* Dot grid background */}
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
          maxW="880px" mx="auto"
        >
          <Flex align="center" gap="14px">
            <Box
              as="button" w="34px" h="34px" borderRadius="9px"
              bg="#2C2C2C" display="flex" alignItems="center" justifyContent="center"
              flexShrink={0} cursor="pointer" border="none"
              _hover={{ bg: '#C4893A' }} transition="bg 0.2s"
              onClick={() => typeof window !== 'undefined' && window.history.back()}
            >
              <Text color="white" fontSize="14px" lineHeight="1">←</Text>
            </Box>
            <Box lineHeight="1.3">
              <Text fontFamily="'Playfair Display', serif" fontWeight="600" fontSize="15px" color="#2C2C2C" letterSpacing="-0.01em">
                My Profile
              </Text>
              <Text fontSize="10px" color="#ADB5BD" fontWeight="400" letterSpacing="0.02em">
                {user.email}
              </Text>
            </Box>
          </Flex>

          <Button
            variant="ghost_red"
            size="sm" h="32px" px="14px" fontSize="12px"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </Flex>
      </Box>

      {/* ── MAIN ── */}
      <Box maxW="880px" mx="auto" px={{ base: '16px', md: '32px', lg: '48px' }} py="32px" position="relative" zIndex={1}>

        {/* ── PROFILE HERO ── */}
        <Box
          bg="white" borderRadius="16px"
          border="1.5px solid #EDEDE8"
          boxShadow="0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)"
          overflow="hidden" mb="18px"
        >
          {/* Header band */}
          <Box
            h="90px" position="relative"
            style={{
              background: 'linear-gradient(135deg, #2C2C2C 0%, #4A3728 50%, #C4893A 100%)',
            }}
          >
            {/* Subtle texture */}
            <Box position="absolute" inset="0" opacity="0.06"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          </Box>

          {/* Avatar overlapping */}
          <Box px={{ base: '20px', md: '32px' }} pb="24px">
            <Flex align="flex-end" justify="space-between" mt="-36px" mb="20px" flexWrap="wrap" gap="10px">
              <Box
                w="72px" h="72px" borderRadius="14px"
                bg="#2C2C2C"
                display="flex" alignItems="center" justifyContent="center"
                border="3px solid white"
                boxShadow="0 4px 16px rgba(0,0,0,0.14)"
                flexShrink={0}
              >
                <Text
                  fontFamily="'Playfair Display', serif"
                  fontSize="22px" fontWeight="700"
                  color="white" letterSpacing="0.02em"
                  lineHeight="1"
                >
                  {initials}
                </Text>
              </Box>

              <HStack gap="8px" mt={{ base: '10px', md: '0' }}>
                {!editMode ? (
                  <Button
                    variant="outline_soft"
                    size="sm" h="32px" px="14px" fontSize="12px"
                    onClick={() => canEdit ? setEditMode(true) : err('You can only edit your own profile')}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline_soft"
                      size="sm" h="32px" px="14px" fontSize="12px"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="terracotta"
                      size="sm" h="32px" px="14px" fontSize="12px"
                      isLoading={saving}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </HStack>
            </Flex>

            {/* Name + role */}
            <Flex align="center" gap="10px" mb="16px" flexWrap="wrap">
              <Text fontFamily="'Playfair Display', serif" fontSize="22px" fontWeight="700" color="#2C2C2C" letterSpacing="-0.02em" lineHeight="1.2">
                {user.name}
              </Text>
              <Box px="9px" py="3px" borderRadius="20px" bg={roleCfg.bg}>
                <Text fontSize="11px" fontWeight="700" color={roleCfg.color} textTransform="uppercase" letterSpacing="0.07em">
                  {roleCfg.label}
                </Text>
              </Box>
            </Flex>

            {/* Info rows */}
            <Box bg="#FAFAF8" borderRadius="10px" border="1px solid #F1F3F5" px="16px" overflow="hidden">
              <InfoRow
                label="Email"
                value={user.email}
                editing={false}
              />
              <InfoRow
                label="Name"
                value={user.name}
                editing={editMode}
                inputEl={
                  <FormControl isInvalid={!!formErr.name} flex="1" maxW="280px">
                    <Input
                      {...inp} h="32px" value={form.name}
                      onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormErr(p => ({ ...p, name: '' })); }}
                      isInvalid={!!formErr.name}
                    />
                    {formErr.name && <FormErrorMessage fontSize="10px" mt="2px">{formErr.name}</FormErrorMessage>}
                  </FormControl>
                }
              />
              <InfoRow
                label="Phone"
                value={user.phone}
                editing={editMode}
                inputEl={
                  <FormControl isInvalid={!!formErr.phone} flex="1" maxW="280px">
                    <Input
                      {...inp} h="32px" value={form.phone}
                      onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setFormErr(p => ({ ...p, phone: '' })); }}
                      isInvalid={!!formErr.phone}
                    />
                    {formErr.phone && <FormErrorMessage fontSize="10px" mt="2px">{formErr.phone}</FormErrorMessage>}
                  </FormControl>
                }
              />
            </Box>
          </Box>
        </Box>

        {/* ── RESTAURANT LOCATION (staff) ── */}
        {isStaff && user.restaurant && (
          <Box mb="18px">
            <SectionCard
              title={`${user.restaurant.name}`}
              action={
                user.role === 'manager' && !editLocation ? (
                  <Button
                    variant="outline_soft"
                    size="xs" h="26px" px="12px" fontSize="11px"
                    onClick={() => canEdit ? setEditLocation(true) : err('You can only edit your own restaurant')}
                  >
                    Edit Location
                  </Button>
                ) : null
              }
            >
              {editLocation ? (
                <Box>
                  <Grid templateColumns="1fr" gap="0">
                    <Field label="Street Address" error={locErr.address} required>
                      <Input {...inp} value={locForm.address} isInvalid={!!locErr.address}
                        onChange={e => { setLocForm(p => ({ ...p, address: e.target.value })); setLocErr(p => ({ ...p, address: '' })); }}
                        placeholder="Street address" />
                    </Field>
                  </Grid>
                  <Grid templateColumns="1fr 1fr" gap="0 14px">
                    <Field label="City" error={locErr.city} required>
                      <Input {...inp} value={locForm.city} isInvalid={!!locErr.city}
                        onChange={e => { setLocForm(p => ({ ...p, city: e.target.value })); setLocErr(p => ({ ...p, city: '' })); }}
                        placeholder="City" />
                    </Field>
                    <Field label="State">
                      <Input {...inp} value={locForm.state} onChange={e => setLocForm(p => ({ ...p, state: e.target.value }))} placeholder="State" />
                    </Field>
                    <Field label="ZIP Code">
                      <Input {...inp} value={locForm.zipCode} onChange={e => setLocForm(p => ({ ...p, zipCode: e.target.value }))} placeholder="ZIP" />
                    </Field>
                    <Field label="Country">
                      <Input {...inp} value={locForm.country} onChange={e => setLocForm(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                    </Field>
                  </Grid>
                  <HStack gap="8px" mt="4px">
                    <Button variant="outline_soft" size="sm" h="34px" px="14px" fontSize="12px" flex="1" onClick={() => { setEditLocation(false); setLocErr({}); }}>Cancel</Button>
                    <Button variant="terracotta" size="sm" h="34px" px="14px" fontSize="12px" flex="1" isLoading={locSaving} onClick={handleUpdateLocation}>Save Location</Button>
                  </HStack>
                </Box>
              ) : (
                <Box>
                  {user.restaurant.location ? (
                    <Flex gap="12px" align="flex-start">
                      <Box
                        w="34px" h="34px" borderRadius="8px" bg="#FDF2EA"
                        display="flex" alignItems="center" justifyContent="center"
                        flexShrink={0} mt="1px"
                      >
                        <Text fontSize="14px">📍</Text>
                      </Box>
                      <Box>
                        <Text fontSize="13px" fontWeight="600" color="#2C2C2C">
                          {user.restaurant.location.address}
                        </Text>
                        <Text fontSize="12px" color="#6C757D" mt="2px">
                          {[user.restaurant.location.city, user.restaurant.location.state, user.restaurant.location.zipCode].filter(Boolean).join(', ')}
                          {user.restaurant.location.country ? ` · ${user.restaurant.location.country}` : ''}
                        </Text>
                        {user.restaurant.location.latitude && user.restaurant.location.longitude && (
                          <Flex align="center" gap="4px" mt="6px">
                            <Box px="7px" py="2px" bg="#F1F3F5" borderRadius="4px">
                              <Text fontSize="10px" color="#6C757D" fontWeight="500">
                                {user.restaurant.location.latitude.toFixed(4)}, {user.restaurant.location.longitude.toFixed(4)}
                              </Text>
                            </Box>
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                  ) : (
                    <Flex align="center" justify="center" direction="column" gap="4px" py="12px">
                      <Text fontSize="11px" color="#ADB5BD">No location set yet</Text>
                      {user.role === 'manager' && (
                        <Button
                          variant="outline_soft"
                          size="xs" h="24px" px="10px" fontSize="10px" mt="4px"
                          onClick={() => canEdit ? setEditLocation(true) : err('You can only edit your own restaurant')}
                        >
                          + Add Location
                        </Button>
                      )}
                    </Flex>
                  )}
                </Box>
              )}
            </SectionCard>
          </Box>
        )}

        {/* ── SAVED ADDRESSES (customer) ── */}
        {user.role === 'customer' && (
          <Box mb="18px">
            <SectionCard
              title="Saved Addresses"
              action={
                <Button
                  variant={showAddrForm ? 'outline_soft' : 'solid_dark'}
                  size="xs" h="26px" px="12px" fontSize="11px"
                  onClick={() => {
                    if (!canEdit) { err('You can only edit your own addresses'); return; }
                    setShowAddrForm(p => !p);
                    setAddrErr({});
                  }}
                >
                  {showAddrForm ? 'Cancel' : '+ Add Address'}
                </Button>
              }
            >
              {/* Add form */}
              {showAddrForm && (
                <Box
                  bg="#FAFAF8" borderRadius="10px"
                  border="1.5px solid #F1F3F5" p="16px" mb="14px"
                >
                  <Field label="Label">
                    <Select {...inp} value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))}>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Street Address" error={addrErr.address} required>
                    <Input {...inp} value={newAddr.address} isInvalid={!!addrErr.address}
                      onChange={e => { setNewAddr(p => ({ ...p, address: e.target.value })); setAddrErr(p => ({ ...p, address: '' })); }}
                      placeholder="House no., street, area" />
                  </Field>
                  <Grid templateColumns="1fr 1fr" gap="0 14px">
                    <Field label="City" error={addrErr.city} required>
                      <Input {...inp} value={newAddr.city} isInvalid={!!addrErr.city}
                        onChange={e => { setNewAddr(p => ({ ...p, city: e.target.value })); setAddrErr(p => ({ ...p, city: '' })); }}
                        placeholder="City" />
                    </Field>
                    <Field label="State">
                      <Input {...inp} value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} placeholder="State" />
                    </Field>
                    <Field label="ZIP Code">
                      <Input {...inp} value={newAddr.zipCode} onChange={e => setNewAddr(p => ({ ...p, zipCode: e.target.value }))} placeholder="ZIP" />
                    </Field>
                    <Field label="Country">
                      <Input {...inp} value={newAddr.country} onChange={e => setNewAddr(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                    </Field>
                  </Grid>
                  <Button
                    variant="solid_dark" size="sm" h="36px" w="100%" fontSize="12px" mt="2px"
                    isLoading={addrSaving} onClick={handleAddAddress}
                  >
                    Save Address
                  </Button>
                </Box>
              )}

              {/* Address list */}
              {user.addresses && user.addresses.length > 0 ? (
                <VStack gap="8px" align="stretch">
                  {user.addresses.map((addr, i) => {
                    const lCfg = ADDR_LABEL_COLOR[addr.label] || ADDR_LABEL_COLOR.Other;
                    return (
                      <Flex
                        key={i}
                        align="flex-start" justify="space-between"
                        bg="#FAFAF8" borderRadius="10px"
                        border="1px solid #F1F3F5" p="12px 14px"
                        gap="10px"
                      >
                        <Flex align="flex-start" gap="10px">
                          <Box
                            w="30px" h="30px" borderRadius="7px"
                            bg={lCfg.bg} display="flex" alignItems="center" justifyContent="center"
                            flexShrink={0} mt="1px"
                          >
                            <Text fontSize="12px">
                              {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                            </Text>
                          </Box>
                          <Box>
                            <Box px="7px" py="2px" borderRadius="4px" bg={lCfg.bg} display="inline-block" mb="4px">
                              <Text fontSize="9px" fontWeight="700" color={lCfg.color} textTransform="uppercase" letterSpacing="0.07em">
                                {addr.label}
                              </Text>
                            </Box>
                            <Text fontSize="13px" fontWeight="500" color="#2C2C2C">{addr.address}</Text>
                            <Text fontSize="11px" color="#6C757D" mt="1px">
                              {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
                              {addr.country ? ` · ${addr.country}` : ''}
                            </Text>
                          </Box>
                        </Flex>
                        <Button
                          variant="ghost_red"
                          size="xs" h="26px" px="10px" fontSize="10px"
                          flexShrink={0}
                          onClick={() => {
                            if (!canEdit) { err('You can only edit your own addresses'); return; }
                            setDeletingIdx(i);
                            deleteConfirm.onOpen();
                          }}
                        >
                          Remove
                        </Button>
                      </Flex>
                    );
                  })}
                </VStack>
              ) : !showAddrForm ? (
                <Flex align="center" justify="center" direction="column" gap="4px" py="20px">
                  <Text fontSize="20px" opacity="0.2">🏠</Text>
                  <Text fontSize="12px" color="#ADB5BD">No saved addresses yet</Text>
                </Flex>
              ) : null}
            </SectionCard>
          </Box>
        )}

        {/* ── ACCOUNT META ── */}
        <Box
          bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
          boxShadow="0 1px 3px rgba(0,0,0,0.04)"
          px="20px" py="16px" mb="18px"
        >
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr 1fr' }} gap="12px">
            {[
              { label: 'Member Since', value: joinedDate },
              { label: 'Account ID', value: user._id ? `…${user._id.slice(-8)}` : '—' },
              { label: 'Account Type', value: roleCfg.label },
            ].map(({ label, value }) => (
              <Box key={label} bg="#FAFAF8" borderRadius="8px" p="10px 14px">
                <Text fontSize="9px" fontWeight="700" color="#ADB5BD" textTransform="uppercase" letterSpacing="0.08em" mb="3px">
                  {label}
                </Text>
                <Text fontSize="12px" fontWeight="600" color="#2C2C2C">{value}</Text>
              </Box>
            ))}
          </Grid>
        </Box>

        {/* ── DANGER ZONE ── */}
        <Box
          bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
          boxShadow="0 1px 3px rgba(0,0,0,0.04)"
          px="20px" py="16px"
        >
          <Text fontSize="11px" fontWeight="700" color="#ADB5BD" textTransform="uppercase" letterSpacing="0.07em" mb="12px">
            Account
          </Text>
          <Button
            variant="ghost_red"
            size="sm" h="36px" px="16px" fontSize="12px"
            onClick={handleLogout}
          >
            Sign Out of Account
          </Button>
        </Box>

        {/* Footer */}
        <Box textAlign="center" pt="24px" pb="4px">
          <Text fontSize="10px" color="#D0CEC8" letterSpacing="0.08em">
            RESTO · USER PROFILE · {new Date().getFullYear()}
          </Text>
        </Box>
      </Box>

      {/* ── DELETE ADDRESS CONFIRM MODAL ── */}
      <Modal isOpen={deleteConfirm.isOpen} onClose={deleteConfirm.onClose} isCentered size="xs">
        <ModalOverlay />
        <ModalContent borderRadius="14px">
          <ModalHeader px="20px" pt="18px" pb="10px" borderBottom="1px solid #F1F3F5" fontSize="16px">
            Remove Address
          </ModalHeader>
          <ModalCloseButton top="14px" right="14px" />
          <ModalBody px="20px" py="14px">
            <Text fontSize="13px" color="#6C757D">
              Are you sure you want to remove this saved address? This cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter px="20px" pb="16px" pt="0" gap="7px">
            <Button variant="outline_soft" size="sm" h="32px" px="14px" fontSize="12px" onClick={deleteConfirm.onClose}>Cancel</Button>
            <Button variant="ghost_red" size="sm" h="32px" px="14px" fontSize="12px"
              onClick={() => handleDeleteAddress(deletingIdx)}>
              Yes, Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      <ChakraProvider theme={theme}>
        <UserProfileInner />
      </ChakraProvider>
    </>
  );
}