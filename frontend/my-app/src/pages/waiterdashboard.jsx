import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import FaceRegistration from '../components/FaceRegistration';
import io from 'socket.io-client';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  FaUtensils, FaMicrophone, FaSignOutAlt, FaCamera,
  FaClock, FaCheckCircle, FaListAlt, FaTable, FaArrowRight,
  FaPlus, FaStar, FaSpinner, FaInbox, FaCheck, FaTag,
  FaEdit, FaTimes, FaStop, FaRedo, FaCrown, FaBolt,
  FaBell, FaChartLine, FaSearch, FaFilter
} from 'react-icons/fa';
import { GiChefToque, GiForkKnifeSpoon } from 'react-icons/gi';
import {
  ChakraProvider,
  extendTheme,
  Box, Flex, Text, Heading, Button, Input, Select,
  Table, Thead, Tbody, Tr, Th, Td, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter,
  FormControl, FormLabel, Image, Badge, Tabs, TabList,
  TabPanels, Tab, TabPanel, Grid, GridItem, Card, CardBody,
  CardHeader, Avatar, Icon, IconButton, useDisclosure,
  useToast, Skeleton, SkeletonText, Alert, AlertIcon,
  AlertTitle, AlertDescription, SimpleGrid, Stat, StatLabel,
  StatNumber, StatHelpText, StatArrow, Divider, HStack,
  VStack, Wrap, WrapItem, Spinner, Center, Container,
  Circle, Progress, Tooltip, Menu, MenuButton, MenuList,
  MenuItem, MenuDivider, Drawer, DrawerBody, DrawerHeader,
  DrawerOverlay, DrawerContent, DrawerCloseButton,
  useBreakpointValue, InputGroup, InputLeftElement,
  Tag, TagLabel, Textarea, Switch, FormHelperText,
  useColorModeValue
} from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: `'Space Grotesk', 'Plus Jakarta Sans', sans-serif`,
    body: `'Plus Jakarta Sans', 'DM Sans', sans-serif`,
  },
  colors: {
    brand: {
      50: '#E6F1FB',
      100: '#B5D4F4',
      200: '#85B7EB',
      300: '#55A0E2',
      400: '#378ADD',
      500: '#2475C8',
      600: '#185FA5',
      700: '#114A82',
      800: '#0C447C',
      900: '#042C53',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: `'Plus Jakarta Sans', sans-serif`,
        fontWeight: '600',
        borderRadius: '10px',
        letterSpacing: '0.01em',
      },
    },
    Tab: {
      baseStyle: {
        fontFamily: `'Plus Jakarta Sans', sans-serif`,
        fontWeight: '500',
      },
    },
    Badge: {
      baseStyle: {
        fontFamily: `'Plus Jakarta Sans', sans-serif`,
      },
    },
  },
  styles: {
    global: {
      '@import': `url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap')`,
      body: {
        bg: 'linear-gradient(160deg, #eef4ff 0%, #f5f0ff 50%, #eef8ff 100%)',
        color: 'gray.800',
      },
    },
  },
});

const API_URL = API_BASE_URL;
const SOCKET_URL = API_BASE_URL;

/* ─── Design tokens ─── */
const T = {
  cardBg: 'white',
  cardBorder: 'rgba(24,95,165,0.10)',
  pageBg: 'linear-gradient(160deg,#eef4ff 0%,#f5f0ff 50%,#eef8ff 100%)',
  topbarBg: 'rgba(255,255,255,0.92)',
  tabBarBg: '#f7f9ff',
  inputBg: '#f0f4ff',
  blue50: '#E6F1FB',
  blue100: '#B5D4F4',
  blue400: '#378ADD',
  blue600: '#185FA5',
  blue800: '#0C447C',
  blue900: '#042C53',
  teal50: '#E1F5EE',
  teal600: '#0F6E56',
  amber50: '#FAEEDA',
  amber600: '#BA7517',
  purple50: '#EEEDFE',
  purple600: '#534AB7',
  green50: '#EAF3DE',
  green600: '#3B6D11',
  red50: '#FCEBEB',
  red600: '#A32D2D',
};

/* ─── Status helpers ─── */
const statusMap = {
  pending:   { color: 'orange', label: 'Pending',   next: 'preparing', nextLabel: 'Preparing',  bg: T.amber50,  fg: T.amber600 },
  preparing: { color: 'blue',   label: 'Preparing', next: 'served',    nextLabel: 'Served',     bg: T.blue50,   fg: T.blue600  },
  served:    { color: 'green',  label: 'Served',     next: 'paid',      nextLabel: 'Paid',       bg: T.teal50,   fg: T.teal600  },
  paid:      { color: 'gray',   label: 'Paid',       next: null,        nextLabel: null,         bg: '#F1EFE8',  fg: '#5F5E5A'  },
};

/* ─── Fuzzy helpers ─── */
function levenshtein(a, b) {
  const an = a?.length ?? 0;
  const bn = b?.length ?? 0;
  if (!an) return bn;
  if (!bn) return an;
  const m = [];
  for (let i = 0; i <= bn; i++) m[i] = [i];
  for (let j = 0; j <= an; j++) m[0][j] = j;
  for (let i = 1; i <= bn; i++)
    for (let j = 1; j <= an; j++)
      m[i][j] = b[i - 1] === a[j - 1]
        ? m[i - 1][j - 1]
        : 1 + Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]);
  return m[bn][an];
}

function jaroWinkler(s1, s2) {
  let matches = 0, transpositions = 0;
  const s1m = Array(s1.length).fill(false);
  const s2m = Array(s2.length).fill(false);
  const win = Math.max(s1.length, s2.length) / 2 - 1;
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - win);
    const hi = Math.min(i + win + 1, s2.length);
    for (let j = lo; j < hi; j++) {
      if (!s2m[j] && s1[i] === s2[j]) { s1m[i] = s2m[j] = true; matches++; break; }
    }
  }
  if (!matches) return 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1m[i]) { while (!s2m[k]) k++; if (s1[i] !== s2[k]) transpositions++; k++; }
  }
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++; else break;
  }
  return jaro + 0.1 * prefix * (1 - jaro);
}

/* ─── Voice parser ─── */
const wordToNumMap = { one:'1',won:'1',two:'2',to:'2',too:'2',three:'3',four:'4',for:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10' };
const dishAliases = {
  rice:['rise','rize'],chole:['choley','chhole','sholay','chana'],dal:['daal','dahl'],
  idli:['idly','idlee'],dosa:['dosha','dhosa'],roti:['rotti','roty','rooti'],
  chapati:['chapathi','chapatti'],naan:['nan','naaan'],biryani:['biriyani','biriani'],
  chai:['tea','chaay','chay'],coffee:['cofee','kofi'],coke:['coca','coca cola'],
  paneer:['panir'],butter:['buttar'],lassi:['lasi','lassie'],
  samosa:['samose','samosas'],vada:['wada'],paratha:['parantha','parota','parotta'],
  momos:['momo'],burger:['burgar'],pizza:['piza','pitsa'],sandwich:['sandwitch'],
};
const aliasToDish = {};
Object.entries(dishAliases).forEach(([main, arr]) => {
  arr.forEach(a => { aliasToDish[a] = main; });
  aliasToDish[main] = main;
});

function parseVoiceOrder(transcript) {
  let text = transcript.toLowerCase().replace(/\s+/g, ' ').trim();
  text = text.replace(/\b(please|thank you|can i get|i'd like|may i have|could i get|give me|order for)\b/gi, '').trim();
  text = text.replace(/\b(one|won|two|to|too|three|four|for|five|six|seven|eight|nine|ten)\b/g, m => wordToNumMap[m] || m);

  const tableMatch = text.match(/(?:for|at|to|number)?\s*table\s*(\d+)/i);
  let table = tableMatch ? tableMatch[1] : '';
  if (table) text = text.replace(/(?:for|at|to|number)?\s*table\s*\w+/i, '').trim();

  const phrases = text.split(/\band\b|,|\./).map(s => s.trim()).filter(Boolean);
  const items = [];
  for (const phrase of phrases) {
    const m = phrase.match(/(\d+)\s+([\w\s]+)/) || phrase.match(/([\w\s]+)\s+(\d+)/);
    let name = phrase.trim(), qty = '1';
    if (m) { qty = m[1].match(/\d+/) ? m[1] : m[2]; name = m[2]?.match(/\d+/) ? m[1] : m[2]; }

    let bestDish = null, bestScore = 0;
    const words = name.split(' ');
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j <= words.length; j++) {
        const cand = words.slice(i, j).join(' ');
        const direct = aliasToDish[cand];
        if (direct) { bestDish = direct; bestScore = 1; }
        else {
          for (const alias in aliasToDish) {
            const jw = jaroWinkler(cand, alias);
            if (jw > bestScore) { bestScore = jw; bestDish = aliasToDish[alias]; }
          }
        }
      }
    }
    if (name) items.push({ name: bestDish || name, quantity: qty, modifications: [] });
  }

  const mods = [];
  const modRe = /(no|extra|less|without|with)\s+([\w\s]+)/gi;
  let mm;
  while ((mm = modRe.exec(transcript)) !== null) mods.push(mm[0].trim());
  if (items.length && mods.length) items[items.length - 1].modifications = mods;

  return { table, items };
}

/* ═══════════════════════════════════════════════ COMPONENT ══ */
export default function WaiterDashboard() {
  const [dishes, setDishes]                   = useState([]);
  const [orders, setOrders]                   = useState([]);
  const [restaurantId, setRestaurantId]       = useState('');
  const [seatedTables, setSeatedTables]       = useState([]);
  const [seatedTablesLoading, setSeatedTablesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading]     = useState(false);
  const [dishesLoading, setDishesLoading]     = useState(false);
  const [dishesError, setDishesError]         = useState('');
  const [menuSearch, setMenuSearch]           = useState('');

  /* Gallery modal */
  const [galleryDish, setGalleryDish]         = useState(null);
  const [galleryQty, setGalleryQty]           = useState('');
  const [galleryMods, setGalleryMods]         = useState('');
  const [galleryTable, setGalleryTable]       = useState('');
  const [gallerySuccess, setGallerySuccess]   = useState(false);
  const [galleryError, setGalleryError]       = useState('');

  /* Voice modal */
  const [voiceModal, setVoiceModal]           = useState(false);
  const [voiceParsed, setVoiceParsed]         = useState(null);
  const [voiceError, setVoiceError]           = useState('');
  const [voiceLoading, setVoiceLoading]       = useState(false);

  /* Face */
  const [showFace, setShowFace]               = useState(false);
  const [userId, setUserId]                   = useState(null);

  const navigate  = useNavigate();
  const toast     = useToast();
  const { isOpen: mobileOpen, onOpen: openMobile, onClose: closeMobile } = useDisclosure();

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  /* ── fetch helpers ── */
  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/orders`, { headers: authHeaders() });
      setOrders(res.data);
    } catch { toast({ title: 'Error fetching orders', status: 'error', duration: 3000, isClosable: true }); }
    finally { setOrdersLoading(false); }
  };

  const fetchDishes = async () => {
    setDishesLoading(true); setDishesError('');
    try {
      const res = await axios.get(`${API_URL}/api/orders/dishes`, { headers: authHeaders() });
      setDishes(res.data);
    } catch { setDishesError('Could not load dishes'); }
    finally { setDishesLoading(false); }
  };

  const fetchSeatedTables = async (restId) => {
    if (!restId) return;
    setSeatedTablesLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/tables/tables/${restId}/status`, { headers: authHeaders() });
      const occupied = (res.data?.tables || []).filter(t => t?.status === 'occupied' && t.isActive !== false);
      setSeatedTables(occupied);
    } catch { setSeatedTables([]); }
    finally { setSeatedTablesLoading(false); }
  };

  /* ── mount ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    try { setUserId(JSON.parse(atob(token.split('.')[1])).userId); } catch { navigate('/'); return; }

    fetchOrders();
    fetchDishes();

    (async () => {
      try {
        const me = await axios.get(`${API_URL}/api/auth/me`, { headers: authHeaders() });
        const rId = me.data?.user?.restaurant?._id || me.data?.user?.restaurant || '';
        setRestaurantId(rId);
        if (rId) fetchSeatedTables(rId);
      } catch (_err) {
        // ignore auth error
      }
    })();

    const socket = io(SOCKET_URL);
    socket.on('order:new', o => {
      setOrders(p => [...p, o]);
      toast({ title: `New order — Table ${o.table}`, status: 'info', duration: 4000, isClosable: true });
    });
    socket.on('order:assigned', o => setOrders(p => [...p, o]));
    socket.on('order:update', o => setOrders(p => p.map(x => x._id === o._id ? o : x)));
    return () => socket.disconnect();
  }, []);

  useEffect(() => { if (restaurantId) fetchSeatedTables(restaurantId); }, [restaurantId]);

  useEffect(() => {
    if (!voiceParsed) return;
    const unavailable = voiceParsed.items.filter(
      item => !dishes.some(d => d.name.toLowerCase().includes(item.name.toLowerCase()))
    );
    setVoiceError(unavailable.length ? `Unavailable: ${unavailable.map(u => u.name).join(', ')}` : '');
  }, [voiceParsed, dishes]);

  /* ── voice ── */
  const startVoice = () => {
    if (!browserSupportsSpeechRecognition) {
      toast({ title: 'Speech not supported', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    setVoiceModal(true); setVoiceParsed(null); setVoiceError('');
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
  };

  const stopVoice = () => {
    SpeechRecognition.stopListening();
    if (transcript?.trim().length > 2) {
      try { setVoiceParsed(parseVoiceOrder(transcript)); setVoiceError(''); }
      catch { setVoiceError('Could not parse order. Please try again.'); }
    } else {
      setVoiceError('No speech detected. Please try again.');
    }
  };

  const confirmVoice = async () => {
    setVoiceLoading(true); setVoiceError('');
    try {
      const items = [];
      for (const item of voiceParsed.items) {
        let best = null, bestScore = 1e9;
        for (const d of dishes) {
          const dist = levenshtein(item.name.toLowerCase(), d.name.toLowerCase());
          if (dist < bestScore) { bestScore = dist; best = d; }
        }
        if (best && (bestScore <= 2 || best.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(best.name.toLowerCase()))) {
          items.push({ dish: best._id, name: best.name, quantity: item.quantity, price: best.price, modifications: item.modifications });
        }
      }
      if (!voiceParsed.table || !items.length) {
        setVoiceError('Could not parse table or items. Please try again.'); setVoiceLoading(false); return;
      }
      if (seatedTables.length && !seatedTables.some(t => String(t.tableNumber) === String(voiceParsed.table))) {
        setVoiceError('Table is not currently occupied.'); setVoiceLoading(false); return;
      }
      await axios.post(`${API_URL}/api/orders/create`, { table: voiceParsed.table, items }, { headers: authHeaders() });
      setVoiceModal(false); fetchOrders();
      toast({ title: `Order placed — Table ${voiceParsed.table}`, status: 'success', duration: 3000, isClosable: true });
    } catch { setVoiceError('Failed to place order.'); }
    finally { setVoiceLoading(false); }
  };

  /* ── gallery order ── */
  const handleGalleryOrder = async (e) => {
    e.preventDefault(); setGalleryError('');
    try {
      await axios.post(`${API_URL}/api/orders/create`, {
        table: galleryTable,
        items: [{ dish: galleryDish._id, name: galleryDish.name, quantity: galleryQty, price: galleryDish.price, modifications: galleryMods ? galleryMods.split(',').map(m => m.trim()).filter(Boolean) : [] }]
      }, { headers: authHeaders() });
      setGallerySuccess(true); setGalleryQty(''); setGalleryMods(''); setGalleryTable('');
      fetchOrders();
      toast({ title: `${galleryDish.name} ordered for Table ${galleryTable}`, status: 'success', duration: 3000, isClosable: true });
      setTimeout(() => { setGallerySuccess(false); setGalleryDish(null); }, 1800);
    } catch { setGalleryError('Failed to place order'); }
  };

  /* ── status update ── */
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${id}`, { status }, { headers: authHeaders() });
      fetchOrders();
      toast({ title: `Status → ${status}`, status: 'info', duration: 2000, isClosable: true });
    } catch { toast({ title: 'Could not update status', status: 'error', duration: 2000, isClosable: true }); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
    toast({ title: 'Logged out', status: 'info', duration: 2000, isClosable: true });
  };

  const activeOrders    = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'served'  || o.status === 'paid');
  const totalRevenue    = completedOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.price * i.quantity, 0), 0);
  const filteredDishes  = dishes.filter(d => d.name.toLowerCase().includes(menuSearch.toLowerCase()));

  /* ─── shared style shortcuts ─── */
  const cardStyle = {
    bg: 'white',
    borderRadius: '18px',
    border: '0.5px solid',
    borderColor: 'rgba(24,95,165,0.10)',
    overflow: 'hidden',
  };

  return (
    <ChakraProvider theme={theme}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Box minH="100vh" background={T.pageBg}>

        {/* ══ TOP BAR ══ */}
        <Box
          as="header"
          bg={T.topbarBg}
          backdropFilter="blur(16px)"
          borderBottom="0.5px solid rgba(24,95,165,0.10)"
          position="sticky" top={0} zIndex={100}
          px={{ base: 4, md: 8 }} py={0} h="62px"
        >
          <Flex h="100%" align="center" justify="space-between">
            {/* Brand */}
            <Flex align="center" gap={3}>
              <Box
                w="36px" h="36px" bg={T.blue600}
                borderRadius="10px" display="flex" alignItems="center" justifyContent="center"
              >
                <Icon as={GiChefToque} color="white" boxSize={5} />
              </Box>
              <Box>
                <Text
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight="700" fontSize="17px" color={T.blue800}
                  letterSpacing="-0.3px" lineHeight="1"
                >
                  RestoAI 
                </Text>
              </Box>
              <Badge
                bg={T.blue50} color={T.blue600}
                fontSize="9px" fontWeight="700"
                px={2} py={1} borderRadius="full"
                border={`0.5px solid ${T.blue100}`}
                letterSpacing="0.5px"
              >
                WAITER PRO
              </Badge>
            </Flex>

            {/* Desktop actions */}
            <Flex display={{ base: 'none', md: 'flex' }} align="center" gap={2}>
              <Button
                size="sm" variant="outline"
                borderColor={T.blue100} color={T.blue600}
                _hover={{ bg: T.blue50 }}
                leftIcon={<FaCamera size={12} />}
                onClick={() => setShowFace(true)}
                borderRadius="10px" fontSize="12px" h="34px"
              >
                Register Face
              </Button>
              <Button
                size="sm" bg={T.blue600} color="white"
                _hover={{ bg: T.blue800 }}
                leftIcon={<FaMicrophone size={12} />}
                onClick={startVoice}
                borderRadius="10px" fontSize="12px" h="34px"
              >
                Voice Order
              </Button>
              <Box position="relative">
                <IconButton
                  icon={<FaBell size={14} />}
                  variant="outline" size="sm" h="34px" w="34px"
                  borderColor={T.blue100} color={T.blue600}
                  _hover={{ bg: T.blue50 }} borderRadius="10px"
                  aria-label="Notifications"
                />
                {activeOrders.length > 0 && (
                  <Circle size="8px" bg="red.500" position="absolute" top="0" right="0"
                    border="2px solid white" />
                )}
              </Box>
              <Box w="34px" h="34px" borderRadius="full" bg={T.blue600}
                display="flex" alignItems="center" justifyContent="center"
                border={`2px solid ${T.blue100}`} cursor="pointer"
              >
                <Text color="white" fontSize="11px" fontWeight="700">WA</Text>
              </Box>
              <Button
                size="sm" variant="ghost"
                color="red.500" _hover={{ bg: 'red.50' }}
                leftIcon={<FaSignOutAlt size={12} />}
                onClick={handleLogout}
                borderRadius="10px" fontSize="12px" h="34px"
              >
                Logout
              </Button>
            </Flex>

            {/* Mobile hamburger */}
            <IconButton
              display={{ base: 'flex', md: 'none' }}
              icon={<GiForkKnifeSpoon />}
              variant="ghost" onClick={openMobile}
              aria-label="Menu" color={T.blue600}
            />
          </Flex>
        </Box>

        {/* ══ MOBILE DRAWER ══ */}
        <Drawer isOpen={mobileOpen} placement="right" onClose={closeMobile}>
          <DrawerOverlay backdropFilter="blur(8px)" />
          <DrawerContent borderLeftRadius="20px">
            <DrawerCloseButton />
            <DrawerHeader
              fontFamily="'Space Grotesk', sans-serif"
              color={T.blue800} borderBottomWidth="0.5px"
            >
              Menu
            </DrawerHeader>
            <DrawerBody>
              <VStack spacing={3} mt={4}>
                {[
                  { label: 'Register Face', icon: <FaCamera />, action: () => { setShowFace(true); closeMobile(); }, bg: T.blue50, color: T.blue600 },
                  { label: 'Voice Order',   icon: <FaMicrophone />, action: () => { startVoice(); closeMobile(); }, bg: T.blue600, color: 'white' },
                  { label: 'Logout',        icon: <FaSignOutAlt />, action: () => { handleLogout(); closeMobile(); }, bg: 'red.50', color: 'red.500' },
                ].map(({ label, icon, action, bg, color }) => (
                  <Button key={label} leftIcon={icon} onClick={action} w="full"
                    bg={bg} color={color} borderRadius="10px" _hover={{ opacity: 0.9 }}>
                    {label}
                  </Button>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* ══ MAIN ══ */}
        <Container maxW="1200px" px={{ base: 4, md: 8 }} py={8}>

          {/* Greeting */}
          <Box mb={8}>
            <Heading
              fontFamily="'Space Grotesk', sans-serif"
              fontSize={{ base: '22px', md: '26px' }}
              fontWeight="700" color={T.blue900}
              letterSpacing="-0.5px"
            >
              Good afternoon, Alex 👋
            </Heading>
            <Text fontSize="13px" color="gray.400" mt={1}>
              Friday, April 10 · Lunch shift · Active since 11:00 AM
            </Text>
          </Box>

          {/* ── STATS ── */}
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4} mb={8}>
            {[
              {
                label: 'Active Orders', value: activeOrders.length,
                sub: `${orders.filter(o=>o.status==='pending').length} pending`,
                iconColor: T.blue600, iconBg: T.blue50, progress: Math.min(100, activeOrders.length * 20),
                progressColor: T.blue600, Icon: FaClock,
              },
              {
                label: 'Completed Today', value: completedOrders.length,
                sub: `From ${orders.length} total`,
                iconColor: T.teal600, iconBg: T.teal50, progress: Math.min(100, completedOrders.length * 8),
                progressColor: '#1D9E75', Icon: FaCheckCircle,
              },
              {
                label: 'Menu Items', value: dishes.length,
                sub: 'Available now',
                iconColor: T.amber600, iconBg: T.amber50, progress: 95,
                progressColor: T.amber600, Icon: FaListAlt,
              },
              {
                label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`,
                sub: `${completedOrders.length} orders`,
                iconColor: T.purple600, iconBg: T.purple50, progress: 72,
                progressColor: T.purple600, Icon: FaChartLine,
              },
            ].map(({ label, value, sub, iconColor, iconBg, progress, progressColor, Icon: Ic }) => (
              <Card key={label} {...cardStyle} p={0}>
                <CardBody p={5}>
                  <Flex justify="space-between" align="flex-start">
                    <Box flex={1}>
                      <Text fontSize="10px" fontWeight="600" color="gray.400"
                        textTransform="uppercase" letterSpacing="0.8px" mb={2}>
                        {label}
                      </Text>
                      <Text
                        fontFamily="'Space Grotesk', sans-serif"
                        fontSize={{ base: '22px', md: '28px' }}
                        fontWeight="700" color={T.blue900} lineHeight="1" mb={1}
                      >
                        {value}
                      </Text>
                      <Text fontSize="11px" color={progressColor} fontWeight="500">{sub}</Text>
                      <Box h="3px" bg={T.blue50} borderRadius="full" mt={3} overflow="hidden">
                        <Box h="100%" w={`${progress}%`} bg={progressColor} borderRadius="full"
                          transition="width 0.6s ease" />
                      </Box>
                    </Box>
                    <Box w="38px" h="38px" bg={iconBg} borderRadius="12px"
                      display="flex" alignItems="center" justifyContent="center" ml={3}>
                      <Icon as={Ic} boxSize="16px" color={iconColor} />
                    </Box>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* ── TABS ── */}
          <Box {...cardStyle}>
            <Tabs variant="unstyled" isLazy>
              <TabList
                bg={T.tabBarBg}
                borderBottom="0.5px solid rgba(24,95,165,0.08)"
                px={2} pt={2}
              >
                {[
                  { label: 'Menu Gallery',  icon: FaUtensils,     count: null             },
                  { label: 'Active Orders', icon: FaClock,        count: activeOrders.length     },
                  { label: 'Completed',     icon: FaCheckCircle,  count: completedOrders.length  },
                ].map(({ label, icon: Ic, count }) => (
                  <Tab
                    key={label}
                    fontSize="12px" fontWeight="500" color="gray.500"
                    borderRadius="10px 10px 0 0" px={5} py={3} mr={1}
                    _selected={{
                      color: T.blue600, bg: 'white',
                      fontWeight: '600',
                      borderBottom: `2px solid ${T.blue600}`,
                    }}
                    _hover={{ color: T.blue600 }}
                  >
                    <Flex align="center" gap={2}>
                      <Icon as={Ic} boxSize="12px" />
                      <Text display={{ base: 'none', sm: 'block' }}>{label}</Text>
                      {count !== null && (
                        <Badge
                          bg={count > 0 ? T.amber50 : T.blue50}
                          color={count > 0 ? T.amber600 : T.blue600}
                          fontSize="9px" fontWeight="700"
                          px={2} borderRadius="full"
                        >
                          {count}
                        </Badge>
                      )}
                    </Flex>
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                {/* ── MENU TAB ── */}
                <TabPanel p={6}>
                  <Flex justify="space-between" align="center" mb={5}>
                    <Heading fontFamily="'Space Grotesk',sans-serif" fontSize="15px" fontWeight="600" color={T.blue800}>
                      Menu Gallery
                    </Heading>
                    <Badge bg={T.blue50} color={T.blue600} px={3} py={1} borderRadius="full" fontSize="10px" fontWeight="600">
                      {dishes.length} items
                    </Badge>
                  </Flex>

                  {/* Search bar */}
                  <InputGroup mb={5} size="md">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaSearch} color="gray.400" boxSize="13px" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search menu items…"
                      value={menuSearch}
                      onChange={e => setMenuSearch(e.target.value)}
                      bg={T.inputBg} border={`0.5px solid rgba(24,95,165,0.15)`}
                      borderRadius="10px" fontSize="13px" color={T.blue900}
                      _focus={{ borderColor: T.blue400, boxShadow: `0 0 0 3px rgba(55,138,221,0.12)` }}
                      _placeholder={{ color: 'gray.400' }}
                    />
                  </InputGroup>

                  {dishesLoading ? (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                      {Array(8).fill(0).map((_, i) => (
                        <Card key={i} borderRadius="14px" overflow="hidden" border="0.5px solid rgba(24,95,165,0.08)">
                          <Skeleton h="140px" />
                          <CardBody><SkeletonText noOfLines={3} spacing={3} /></CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : dishesError ? (
                    <Alert status="error" borderRadius="12px">
                      <AlertIcon /><AlertTitle>Error</AlertTitle><AlertDescription>{dishesError}</AlertDescription>
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
                      {filteredDishes.map(dish => (
                        <Box
                          key={dish._id}
                          bg="white" borderRadius="14px"
                          border="0.5px solid rgba(24,95,165,0.10)"
                          overflow="hidden" cursor="pointer"
                          transition="all 0.2s"
                          _hover={{ transform: 'translateY(-2px)', borderColor: T.blue400, boxShadow: '0 8px 24px rgba(24,95,165,0.12)' }}
                          onClick={() => { setGalleryDish(dish); setGallerySuccess(false); setGalleryError(''); }}
                        >
                          <Box position="relative">
                            <Image
                              src={dish.image || '/images/chef3.png'}
                              alt={dish.name} h="140px" w="100%" objectFit="cover"
                              fallback={
                                <Box h="140px" bg={T.blue50} display="flex"
                                  alignItems="center" justifyContent="center">
                                  <Icon as={GiChefToque} boxSize={10} color={T.blue200} />
                                </Box>
                              }
                            />
                            <Badge
                              position="absolute" top={2} right={2}
                              bg={T.blue900} color="white"
                              fontSize="11px" fontWeight="700" px={2} py={1} borderRadius="8px"
                            >
                              ₹{dish.price}
                            </Badge>
                          </Box>
                          <Box p={3}>
                            <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600"
                              fontSize="13px" color={T.blue900} mb={1} noOfLines={1}>
                              {dish.name}
                            </Text>
                            <Text fontSize="11px" color="gray.400" noOfLines={2} mb={3} lineHeight="1.5">
                              {dish.description || 'Premium quality dish'}
                            </Text>
                            <Flex justify="space-between" align="center">
                              <Button
                                size="xs" bg={T.blue600} color="white"
                                _hover={{ bg: T.blue800 }} borderRadius="8px"
                                leftIcon={<FaPlus size={9} />} fontSize="11px"
                              >
                                Order
                              </Button>
                              <Flex align="center" gap={1}>
                                <Icon as={FaStar} color="yellow.400" boxSize="11px" />
                                <Text fontSize="11px" fontWeight="600" color="gray.500">4.8</Text>
                              </Flex>
                            </Flex>
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>

                {/* ── ACTIVE ORDERS TAB ── */}
                <TabPanel p={6}>
                  <Flex justify="space-between" align="center" mb={5}>
                    <Heading fontFamily="'Space Grotesk',sans-serif" fontSize="15px" fontWeight="600" color={T.blue800}>
                      Active Orders
                    </Heading>
                    <Badge bg={T.amber50} color={T.amber600} px={3} py={1} borderRadius="full" fontSize="10px" fontWeight="600">
                      {activeOrders.length} active
                    </Badge>
                  </Flex>

                  {ordersLoading ? (
                    <Center py={12}><Spinner size="lg" color={T.blue600} /></Center>
                  ) : activeOrders.length === 0 ? (
                    <Center py={14} flexDirection="column">
                      <Icon as={FaInbox} boxSize={12} color="gray.200" mb={3} />
                      <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600" color="gray.300">No active orders</Text>
                      <Text fontSize="12px" color="gray.300" mt={1}>New orders will appear here</Text>
                    </Center>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {[...new Set(activeOrders.map(o => o.table))].map(tableNo => {
                        const tOrders = activeOrders.filter(o => o.table === tableNo);
                        const allItems = tOrders.flatMap(o => o.items.map(i => ({ ...i, _oid: o._id })));
                        const grouped = [];
                        allItems.forEach(item => {
                          const key = `${item.name}|${(item.modifications||[]).join(',')}`;
                          const ex = grouped.find(g => g.key === key);
                          if (ex) ex.quantity += Number(item.quantity);
                          else grouped.push({ key, name: item.name, modifications: item.modifications, price: item.price, quantity: Number(item.quantity) });
                        });
                        const total = grouped.reduce((s, i) => s + i.price * i.quantity, 0);

                        return (
                          <Box key={tableNo} bg="white" borderRadius="14px"
                            border="0.5px solid rgba(24,95,165,0.10)" overflow="hidden">
                            <Flex
                              bg={T.tabBarBg}
                              borderBottom="0.5px solid rgba(24,95,165,0.08)"
                              px={4} py={3}
                              align={{ base: 'flex-start', md: 'center' }}
                              direction={{ base: 'column', md: 'row' }}
                              justify="space-between" gap={3}
                            >
                              <Badge bg={T.blue50} color={T.blue600}
                                fontSize="12px" fontWeight="700" px={3} py={2} borderRadius="8px">
                                <Flex align="center" gap={2}>
                                  <Icon as={FaTable} boxSize="11px" /> Table {tableNo}
                                </Flex>
                              </Badge>
                              <Wrap spacing={2}>
                                {tOrders.map(o => {
                                  const s = statusMap[o.status] || statusMap.pending;
                                  return (
                                    <Flex key={o._id} align="center" gap={2}>
                                      <Badge bg={s.bg} color={s.fg}
                                        fontSize="10px" fontWeight="600" px={2} py={1} borderRadius="6px">
                                        {s.label}
                                      </Badge>
                                      {s.next && (
                                        <Button size="xs" bg={T.blue600} color="white"
                                          _hover={{ bg: T.blue800 }} borderRadius="7px"
                                          rightIcon={<FaArrowRight size={9} />}
                                          onClick={() => updateStatus(o._id, s.next)}
                                          fontSize="10px"
                                        >
                                          Mark {s.nextLabel}
                                        </Button>
                                      )}
                                    </Flex>
                                  );
                                })}
                              </Wrap>
                            </Flex>
                            <Box overflowX="auto" px={4} py={3}>
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    {['Item','Qty','Modifications','Price','Subtotal'].map(h => (
                                      <Th key={h}
                                        fontSize="9px" fontWeight="600"
                                        textTransform="uppercase" letterSpacing="0.8px"
                                        color="gray.400" borderBottomColor="rgba(24,95,165,0.08)"
                                        isNumeric={['Price','Subtotal','Qty'].includes(h)}
                                      >
                                        {h}
                                      </Th>
                                    ))}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {grouped.map((item, idx) => (
                                    <Tr key={idx} _hover={{ bg: T.blue50 }}>
                                      <Td fontSize="12px" fontWeight="600" color={T.blue900} borderColor="rgba(24,95,165,0.06)">{item.name}</Td>
                                      <Td isNumeric fontSize="12px" color="gray.600" borderColor="rgba(24,95,165,0.06)">{item.quantity}</Td>
                                      <Td fontSize="11px" color="gray.400" borderColor="rgba(24,95,165,0.06)">
                                        {item.modifications?.length ? item.modifications.join(', ') : '—'}
                                      </Td>
                                      <Td isNumeric fontSize="12px" color="gray.600" borderColor="rgba(24,95,165,0.06)">₹{item.price}</Td>
                                      <Td isNumeric fontSize="12px" fontWeight="700" color={T.blue600} borderColor="rgba(24,95,165,0.06)">₹{item.price * item.quantity}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                            <Flex justify="flex-end" px={4} pb={3}>
                              <Badge bg={T.blue900} color="white"
                                fontFamily="'Space Grotesk',sans-serif"
                                fontSize="13px" fontWeight="700"
                                px={4} py={2} borderRadius="8px">
                                Total: ₹{total}
                              </Badge>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </TabPanel>

                {/* ── COMPLETED ORDERS TAB ── */}
                <TabPanel p={6}>
                  <Flex justify="space-between" align="center" mb={5}>
                    <Heading fontFamily="'Space Grotesk',sans-serif" fontSize="15px" fontWeight="600" color={T.blue800}>
                      Completed Orders
                    </Heading>
                    <Badge bg={T.teal50} color={T.teal600} px={3} py={1} borderRadius="full" fontSize="10px" fontWeight="600">
                      {completedOrders.length} done
                    </Badge>
                  </Flex>

                  {completedOrders.length === 0 ? (
                    <Center py={14} flexDirection="column">
                      <Icon as={FaCheck} boxSize={12} color="gray.200" mb={3} />
                      <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600" color="gray.300">No completed orders</Text>
                    </Center>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {completedOrders.map(order => {
                        const s = statusMap[order.status] || statusMap.paid;
                        const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        return (
                          <Box key={order._id} bg="white" borderRadius="14px"
                            border="0.5px solid rgba(24,95,165,0.10)" overflow="hidden">
                            <Flex
                              bg={T.tabBarBg}
                              borderBottom="0.5px solid rgba(24,95,165,0.08)"
                              px={4} py={3} align="center" justify="space-between"
                            >
                              <Badge bg={T.teal50} color={T.teal600}
                                fontSize="12px" fontWeight="700" px={3} py={2} borderRadius="8px">
                                <Flex align="center" gap={2}>
                                  <Icon as={FaTable} boxSize="11px" /> Table {order.table}
                                </Flex>
                              </Badge>
                              <Badge bg={s.bg} color={s.fg}
                                fontSize="10px" fontWeight="600" px={2} py={1} borderRadius="6px">
                                {s.label}
                              </Badge>
                            </Flex>
                            <Box overflowX="auto" px={4} py={3}>
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr>
                                    {['Item','Qty','Price','Subtotal'].map(h => (
                                      <Th key={h}
                                        fontSize="9px" fontWeight="600"
                                        textTransform="uppercase" letterSpacing="0.8px"
                                        color="gray.400" borderBottomColor="rgba(24,95,165,0.08)"
                                        isNumeric={['Price','Subtotal','Qty'].includes(h)}
                                      >
                                        {h}
                                      </Th>
                                    ))}
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {order.items.map((item, idx) => (
                                    <Tr key={idx} _hover={{ bg: T.teal50 }}>
                                      <Td fontSize="12px" fontWeight="600" color={T.blue900} borderColor="rgba(24,95,165,0.06)">{item.name}</Td>
                                      <Td isNumeric fontSize="12px" color="gray.600" borderColor="rgba(24,95,165,0.06)">{item.quantity}</Td>
                                      <Td isNumeric fontSize="12px" color="gray.600" borderColor="rgba(24,95,165,0.06)">₹{item.price}</Td>
                                      <Td isNumeric fontSize="12px" fontWeight="700" color={T.teal600} borderColor="rgba(24,95,165,0.06)">₹{item.price * item.quantity}</Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                            <Flex justify="flex-end" px={4} pb={3}>
                              <Badge bg={T.blue900} color="white"
                                fontFamily="'Space Grotesk',sans-serif"
                                fontSize="13px" fontWeight="700"
                                px={4} py={2} borderRadius="8px">
                                Total: ₹{total}
                              </Badge>
                            </Flex>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Container>

        {/* ══ GALLERY ORDER MODAL ══ */}
        <Modal isOpen={!!galleryDish} onClose={() => setGalleryDish(null)} size="lg" isCentered>
          <ModalOverlay backdropFilter="blur(10px)" bg="rgba(4,44,83,0.4)" />
          <ModalContent borderRadius="20px" border={`0.5px solid rgba(24,95,165,0.15)`}>
            <form onSubmit={handleGalleryOrder}>
              <ModalHeader
                fontFamily="'Space Grotesk',sans-serif"
                color={T.blue800} fontSize="16px" fontWeight="700"
                borderBottom="0.5px solid rgba(24,95,165,0.08)" pb={4}
              >
                <Flex align="center" gap={3}>
                  <Box w="32px" h="32px" bg={T.blue50} borderRadius="8px"
                    display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FaUtensils} color={T.blue600} boxSize="13px" />
                  </Box>
                  {galleryDish?.name}
                </Flex>
              </ModalHeader>
              <ModalBody py={5}>
                {galleryDish && (
                  <VStack spacing={4} align="stretch">
                    <Image
                      src={galleryDish.image || '/images/chef3.png'}
                      alt={galleryDish.name} borderRadius="12px"
                      h="180px" w="100%" objectFit="cover"
                      fallback={<Box h="180px" bg={T.blue50} borderRadius="12px"
                        display="flex" alignItems="center" justifyContent="center">
                        <Icon as={GiChefToque} boxSize={12} color={T.blue200} />
                      </Box>}
                    />
                    <Flex align="center" justify="space-between">
                      <Text fontSize="13px" color="gray.500" flex={1} noOfLines={2}>
                        {galleryDish.description || 'Premium quality dish'}
                      </Text>
                      <Badge bg={T.blue900} color="white"
                        fontFamily="'Space Grotesk',sans-serif"
                        fontSize="14px" fontWeight="700"
                        px={3} py={1} borderRadius="8px" ml={3}>
                        ₹{galleryDish.price}
                      </Badge>
                    </Flex>

                    <FormControl isRequired>
                      <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                        textTransform="uppercase" letterSpacing="0.6px">
                        Table Number
                      </FormLabel>
                      <Select
                        placeholder={seatedTablesLoading ? 'Loading…' : 'Select a seated table'}
                        value={galleryTable} onChange={e => setGalleryTable(e.target.value)}
                        borderRadius="10px" fontSize="13px" borderColor="rgba(24,95,165,0.2)"
                        _focus={{ borderColor: T.blue400 }}
                        isDisabled={seatedTablesLoading || !seatedTables.length}
                      >
                        {seatedTables.map(t => (
                          <option key={t.tableId} value={t.tableNumber}>
                            Table {t.tableNumber}{t.floor ? ` · ${t.floor}` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                        textTransform="uppercase" letterSpacing="0.6px">
                        Quantity
                      </FormLabel>
                      <Input type="number" min="1" placeholder="Enter quantity"
                        value={galleryQty} onChange={e => setGalleryQty(e.target.value)}
                        borderRadius="10px" fontSize="13px" borderColor="rgba(24,95,165,0.2)"
                        _focus={{ borderColor: T.blue400 }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                        textTransform="uppercase" letterSpacing="0.6px">
                        Modifications
                      </FormLabel>
                      <Input placeholder="Special requests, comma separated"
                        value={galleryMods} onChange={e => setGalleryMods(e.target.value)}
                        borderRadius="10px" fontSize="13px" borderColor="rgba(24,95,165,0.2)"
                        _focus={{ borderColor: T.blue400 }}
                      />
                    </FormControl>

                    {gallerySuccess && (
                      <Alert status="success" borderRadius="10px" bg={T.teal50}>
                        <AlertIcon color={T.teal600} />
                        <Text fontSize="13px" color={T.teal600} fontWeight="500">Order placed successfully!</Text>
                      </Alert>
                    )}
                    {galleryError && (
                      <Alert status="error" borderRadius="10px">
                        <AlertIcon /><Text fontSize="13px">{galleryError}</Text>
                      </Alert>
                    )}
                  </VStack>
                )}
              </ModalBody>
              <ModalFooter gap={3} borderTop="0.5px solid rgba(24,95,165,0.08)">
                <Button variant="ghost" onClick={() => setGalleryDish(null)}
                  fontSize="13px" borderRadius="10px" color="gray.500">
                  Cancel
                </Button>
                <Button type="submit" bg={T.blue600} color="white"
                  _hover={{ bg: T.blue800 }} fontSize="13px" borderRadius="10px">
                  Place Order
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>

        {/* ══ VOICE ORDER MODAL ══ */}
        <Modal
          isOpen={voiceModal}
          onClose={() => { setVoiceModal(false); SpeechRecognition.stopListening(); }}
          size="lg" isCentered
        >
          <ModalOverlay backdropFilter="blur(10px)" bg="rgba(4,44,83,0.4)" />
          <ModalContent borderRadius="20px" border={`0.5px solid rgba(24,95,165,0.15)`}>
            <ModalHeader
              fontFamily="'Space Grotesk',sans-serif"
              color={T.blue800} fontSize="16px" fontWeight="700"
              borderBottom="0.5px solid rgba(24,95,165,0.08)" pb={4}
            >
              <Flex align="center" gap={3}>
                <Box w="32px" h="32px" bg={T.blue50} borderRadius="8px"
                  display="flex" alignItems="center" justifyContent="center">
                  <Icon as={FaMicrophone} color={T.blue600} boxSize="13px" />
                </Box>
                Voice Order
                <Badge bg={T.amber50} color={T.amber600} fontSize="9px" fontWeight="700"
                  px={2} py={1} borderRadius="full" letterSpacing="0.4px">
                  <Flex align="center" gap={1}><Icon as={FaBolt} boxSize="9px" /> PREMIUM</Flex>
                </Badge>
              </Flex>
            </ModalHeader>
            <ModalBody py={6}>
              {!voiceParsed ? (
                <VStack spacing={5} align="stretch">
                  <Center>
                    <Box
                      w="80px" h="80px" borderRadius="full"
                      bg={T.blue600} display="flex" alignItems="center" justifyContent="center"
                      border={`3px solid ${T.blue100}`}
                      position="relative"
                      sx={listening ? {
                        '&::after': {
                          content: '""', position: 'absolute', inset: '-8px',
                          borderRadius: '50%', border: `2px solid ${T.blue400}`,
                          animation: 'ripple 2s ease-out infinite',
                        },
                        '@keyframes ripple': {
                          '0%': { transform: 'scale(1)', opacity: 1 },
                          '100%': { transform: 'scale(1.5)', opacity: 0 },
                        },
                      } : {}}
                    >
                      <Icon as={FaMicrophone} color="white" boxSize={8} />
                    </Box>
                  </Center>

                  {listening && (
                    <Center gap={2}>
                      <Box w="10px" h="10px" borderRadius="full" bg="red.500"
                        sx={{ animation: 'pulse 1.2s ease-in-out infinite',
                          '@keyframes pulse': { '0%,100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.4)', opacity: 0.6 } } }}
                      />
                      <Text fontSize="13px" fontWeight="500" color="red.500">Listening…</Text>
                    </Center>
                  )}

                  <Box
                    bg={T.inputBg} borderRadius="12px" p={5} minH="120px"
                    border={`0.5px dashed rgba(24,95,165,0.2)`}
                  >
                    <Text fontSize="13px" color={transcript ? T.blue900 : 'gray.400'} lineHeight="1.7">
                      {transcript || 'Your speech will appear here… Speak clearly, include table number and items.'}
                    </Text>
                  </Box>

                  <HStack spacing={3}>
                    <Button flex={1} bg={T.blue600} color="white" _hover={{ bg: T.blue800 }}
                      onClick={stopVoice} isDisabled={!transcript}
                      borderRadius="10px" fontSize="13px"
                      leftIcon={<FaStop size={11} />}>
                      Stop & Process
                    </Button>
                    <Button flex={1} variant="outline" borderColor="rgba(24,95,165,0.2)"
                      color="gray.500" onClick={() => { setVoiceModal(false); SpeechRecognition.stopListening(); }}
                      borderRadius="10px" fontSize="13px">
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <VStack spacing={5} align="stretch">
                  <Box bg={T.blue50} borderRadius="12px" p={5}
                    border={`0.5px solid ${T.blue100}`}>
                    <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600"
                      fontSize="13px" color={T.blue800} mb={3}>
                      Order Summary
                    </Text>
                    <HStack mb={2}>
                      <Text fontSize="12px" color="gray.500" w="80px">Table</Text>
                      <Badge bg={T.blue600} color="white" fontWeight="700" px={2} borderRadius="6px">
                        {voiceParsed.table || 'Not detected'}
                      </Badge>
                    </HStack>
                    <Text fontSize="12px" color="gray.500" mb={2}>Items</Text>
                    <VStack align="stretch" spacing={2}>
                      {voiceParsed.items.map((item, idx) => (
                        <Flex key={idx} align="center" gap={2}
                          bg="white" borderRadius="8px" px={3} py={2}
                          border={`0.5px solid ${T.blue100}`}>
                          <Icon as={FaCheck} color={T.teal600} boxSize="11px" />
                          <Text fontSize="12px" color={T.blue900} fontWeight="500">
                            {item.quantity}× {item.name}
                            {item.modifications?.length > 0 && (
                              <Text as="span" fontSize="11px" color="gray.400">
                                {' '}({item.modifications.join(', ')})
                              </Text>
                            )}
                          </Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>

                  {voiceError && (
                    <Alert status="error" borderRadius="10px" fontSize="12px">
                      <AlertIcon />{voiceError}
                    </Alert>
                  )}

                  <HStack spacing={3} flexWrap="wrap">
                    <Button flex={1} minW="120px" bg={T.blue600} color="white"
                      _hover={{ bg: T.blue800 }}
                      onClick={confirmVoice}
                      isDisabled={voiceLoading || !!voiceError}
                      borderRadius="10px" fontSize="13px"
                      leftIcon={voiceLoading ? <Spinner size="xs" /> : <FaCheck size={11} />}>
                      Confirm Order
                    </Button>
                    <Button flex={1} minW="100px" variant="outline"
                      borderColor="rgba(24,95,165,0.2)" color={T.blue600}
                      onClick={() => { setVoiceParsed(null); resetTranscript(); setVoiceError(''); }}
                      isDisabled={voiceLoading}
                      borderRadius="10px" fontSize="13px"
                      leftIcon={<FaRedo size={11} />}>
                      Retry
                    </Button>
                    <Button flex={1} minW="80px" variant="ghost" color="gray.400"
                      onClick={() => { setVoiceModal(false); SpeechRecognition.stopListening(); }}
                      isDisabled={voiceLoading}
                      borderRadius="10px" fontSize="13px">
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Face Registration */}
        {showFace && (
          userId ? (
            <FaceRegistration employeeId={userId} onClose={() => setShowFace(false)} />
          ) : (
            <div style={{ position: 'fixed', top: 20, left: 20, right: 20, zIndex: 9999, background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
              Could not load your user ID yet. Please wait and try again.
              <button onClick={() => setShowFace(false)} style={{ marginLeft: 12 }}>Close</button>
            </div>
          )
        )}
      </Box>
    </ChakraProvider>
  );
}