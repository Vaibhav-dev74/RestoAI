import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  Box,
  Button,
  Grid,
  GridItem,
  Image,
  Text,
  VStack,
  HStack,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Select,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  IconButton,
  Icon,
  Flex,
  Container,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Progress,
  Avatar,
  AvatarGroup,
  Center,
  Spinner,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react'
import { 
  Receipt, 
  Plus, 
  X, 
  QrCode, 
  CreditCard, 
  Banknote,
  ScanLine,
  CheckCircle,
  ArrowLeft,
  Smartphone,
  User,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
  LayoutGrid
} from 'lucide-react'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)
const MotionCard = motion(Card)
import { useNavigate } from 'react-router-dom';
import WasteAnalysis from '../components/WasteAnalysis.jsx';
import SalesProfitAdvisor from '../components/SalesProfitAdvisor.jsx';
import UpsellSuggestions from '../components/UpsellSuggestions.jsx';
import SmartLeftoverReuse from '../components/SmartLeftoverReuse.jsx';
import InventoryWasteAlert from '../components/InventoryWasteAlert.jsx';
import InventoryManagement from './InventoryManagement.jsx';
import TraceabilitySafety from '../components/TraceabilitySafety.jsx';

import FoodSecurityGrid from '../components/FoodSecurityGrid.jsx';
import VoiceAssistant from '../components/VoiceAssistant.jsx';
import './managerdashboard.css';
import QRCode from 'react-qr-code';
import MonthlySalesGraph from '../components/MonthlySalesGraph.jsx';
import FaceAttendanceScanner from '../components/FaceAttendanceScanner';
import FaceRegistration from '../components/FaceRegistration';
import io from 'socket.io-client';
import NotificationBell from '../components/notification.jsx';

export default function ManagerDashboard() {
  const [billDrawerOpen, setBillDrawerOpen] = useState(false);
  const [selectedBillTable, setSelectedBillTable] = useState('');
  const [qr, setQr] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [highlightedInventoryItems, setHighlightedInventoryItems] = useState([]);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const highlightTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardQuery, setDashboardQuery] = useState('');
  const [dashboardChip, setDashboardChip] = useState('All');
  const [inventory, setInventory] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [showAddDish, setShowAddDish] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [addDishForm, setAddDishForm] = useState({ name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '' });
  const [addOrderForm, setAddOrderForm] = useState({ table: '', items: [] });
  const [orderItems, setOrderItems] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [dishLoading, setDishLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [dishError, setDishError] = useState('');
  const [galleryModalDish, setGalleryModalDish] = useState(null);
  const [galleryOrderQty, setGalleryOrderQty] = useState('');
  const [galleryOrderMods, setGalleryOrderMods] = useState('');
  const [galleryOrderSuccess, setGalleryOrderSuccess] = useState(false);
  const [galleryOrderError, setGalleryOrderError] = useState('');
  const [galleryOrderTableNo, setGalleryOrderTableNo] = useState('');
  const [seatedTables, setSeatedTables] = useState([]);
  const [seatedTablesLoading, setSeatedTablesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderNotification, setOrderNotification] = useState(null);
  const prevOrdersRef = useRef([]);
  const [orderNotificationProgress, setOrderNotificationProgress] = useState(0);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('disabled');
  const [testMsg, setTestMsg] = useState('');
  const [testMsgResult, setTestMsgResult] = useState('');
  const [whatsappQrUrl, setWhatsappQrUrl] = useState('');
  const [whatsappQrString, setWhatsappQrString] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [whatsappLoggedIn, setWhatsappLoggedIn] = useState(false);
  const [whatsappQrImage, setWhatsappQrImage] = useState('');
  // --- Add for KPIs ---
  const [staff, setStaff] = useState([]);
  const [wasteAlerts, setWasteAlerts] = useState([]);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [selectedStaffForFace, setSelectedStaffForFace] = useState('');
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [registeredFacesLoading, setRegisteredFacesLoading] = useState(false);
  const [registeredFacesError, setRegisteredFacesError] = useState('');
  const [managerPinDraft, setManagerPinDraft] = useState('');
  const [managerPinSaving, setManagerPinSaving] = useState(false);
  // Add these state variables
const [paymentMethod, setPaymentMethod] = useState('cash');
const [upiQrCode, setUpiQrCode] = useState('');
const [paymentStatus, setPaymentStatus] = useState('');
const [currentPayment, setCurrentPayment] = useState({ amount: 0, tableNo: '' });
const [reservations, setReservations] = useState([]);
const VITE_API_URL = API_BASE_URL;

  const fetchRegisteredFaces = async () => {
    if (!restaurantId) return;
    setRegisteredFacesLoading(true);
    setRegisteredFacesError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${VITE_API_URL}/api/attendance/faces`, { headers });
      setRegisteredFaces(res.data?.faces || []);
    } catch (err) {
      setRegisteredFaces([]);
      setRegisteredFacesError(err.response?.data?.error || err.message || 'Failed to load registered faces');
    } finally {
      setRegisteredFacesLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    if (!restaurantId) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.get(`${VITE_API_URL}/api/attendance/records/${restaurantId}`, { headers });
      await fetchRegisteredFaces();
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
    }
  };

  useEffect(() => {
    if (activePage === 'attendance' && restaurantId) {
      fetchRegisteredFaces();
      fetchAttendanceRecords();
    }
  }, [activePage, restaurantId]);

  useEffect(() => {
    if (showAddDish || showAddOrder) {
      if (!dishes.length) fetchDishes();
    }
  }, [showAddDish, showAddOrder]);

  const saveManagerPin = async () => {
    try {
      const pin = String(managerPinDraft || '').trim();
      if (!pin) {
        alert('Enter a PIN first');
        return;
      }
      setManagerPinSaving(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${VITE_API_URL}/api/auth/me/pin`, { pin }, { headers });
      alert('Manager PIN saved');
      setManagerPinDraft('');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to save PIN');
    } finally {
      setManagerPinSaving(false);
    }
  };

  const deleteRegisteredFace = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${VITE_API_URL}/api/attendance/faces/${userId}`, { headers });
      await fetchRegisteredFaces();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete face');
    }
  };
// Add this useEffect to fetch reservations
useEffect(() => {
  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log(token);
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${VITE_API_URL}/api/tables/reservations/${restaurantId}`, { headers });
      setReservations(res.data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };
  
  if (restaurantId) {
    fetchReservations();
  }
}, [restaurantId]);

// Load only seated tables (computed as status === 'occupied') for order placement
useEffect(() => {
  const fetchSeatedTables = async () => {
    if (!restaurantId) return;
    setSeatedTablesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${VITE_API_URL}/api/tables/tables/${restaurantId}/status`, { headers });
      const tables = res.data?.tables || [];
      const occupied = tables.filter(t => t && t.isActive !== false && t.status === 'occupied');
      setSeatedTables(occupied);
    } catch (err) {
      console.error('Error fetching seated tables:', err);
      setSeatedTables([]);
    } finally {
      setSeatedTablesLoading(false);
    }
  };

  fetchSeatedTables();
}, [restaurantId, VITE_API_URL]);
// Generate Real UPI Payment Link and QR Code
const generateRealUPIPayment = (amount, tableNo, orderIds = []) => {
  const upiId = 'priyanshugupta007007@okaxis';
  const payeeName = 'Priyanshu Gupta';
  const restaurant = restaurantName || 'RestoPOS AI';
  
  // Create a clean, professional message for GPay
  const transactionNote = `Bill Payment - ${restaurant} - Table ${tableNo} - \u20B9${amount}`;
  
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  
  return {
    upiUrl,
    qrCodeUrl,
    upiId,
    payeeName,
    transactionNote
  };
};

// Handle Real UPI Payment
const handleRealUPIPayment = (orderIds, totalAmount, tableNo) => {
  // Generate UPI payment details
  const upiPayment = generateRealUPIPayment(totalAmount, tableNo);
  setUpiQrCode(upiPayment.qrCodeUrl);
  setCurrentPayment({ amount: totalAmount, tableNo, orderIds });
  setPaymentStatus('waiting');
};

// Confirm UPI Payment (Manual confirmation)
const confirmUPIPayment = async () => {
  try {
    setPaymentStatus('processing');
    
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Mark orders as paid
    for (const id of currentPayment.orderIds) {
      await axios.put(`${VITE_API_URL}/api/orders/${id}`, 
        { status: 'paid', paymentMethod: 'upi' }, 
        { headers }
      );
    }

    // Refresh orders
    fetchOrders();
    
    setPaymentStatus('success');
    alert(`✅ Payment of \u20B9${currentPayment.amount} received via UPI!`);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setPaymentStatus('');
      setUpiQrCode('');
      setCurrentPayment({ amount: 0, tableNo: '', orderIds: [] });
    }, 2000);

  } catch (error) {
    setPaymentStatus('failed');
    alert('❌ Failed to update payment status');
  }
};

// Open UPI App directly
const openUPIApp = (amount, tableNo) => {
  const upiPayment = generateRealUPIPayment(amount, tableNo);
  
  // Try to open UPI app
  window.location.href = upiPayment.upiUrl;
  
  // Fallback: Show instructions
  setTimeout(() => {
    alert(`If UPI app didn't open automatically:
    
1. Open your UPI app (GPay, PhonePe, Paytm, etc.)
2. Send \u20B9${amount} to: priyanshugupta007007@okaxis
3. Add note: "Table ${tableNo} Bill"
4. Come back here and click "Payment Done"`);
  }, 1000);
};

  // Set highlight for multiple items (persistent until changed or reload)
  const setHighlight = (items) => {
    // Accepts array or string
    if (typeof items === 'string') {
      items = items.split(',').map(i => i.trim()).filter(Boolean);
    }
    setHighlightedInventoryItems(items);
    setInventoryRefreshKey(k => k + 1);
  };

  // Helper: merge orders by _id
  function mergeOrders(existing, incoming) {
    const map = new Map();
    existing.forEach(o => map.set(o._id, o));
    incoming.forEach(o => map.set(o._id, { ...map.get(o._id), ...o }));
    return Array.from(map.values());
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        let qrRes, userRes, usersRes, wasteAlertRes;
        try {
          qrRes = await axios.get(`${VITE_API_URL}/api/auth/generate-qr`, { headers });
        } catch (err) {
          console.error('QR API failed:', err);
          alert('Could not load dashboard data: QR API failed - ' + (err.response?.data?.error || err.message));
          return;
        }
        try {
          userRes = await axios.get(`${VITE_API_URL}/api/auth/me`, { headers });
        } catch (err) {
          console.error('User API failed:', err);
          alert('Could not load dashboard data: User API failed - ' + (err.response?.data?.error || err.message));
          return;
        }
        try {
          usersRes = await axios.get(`${VITE_API_URL}/api/auth/`, { headers });
        } catch (err) {
          console.error('Users API failed:', err);
          alert('Could not load dashboard data: Users API failed - ' + (err.response?.data?.error || err.message));
          return;
        }
        try {
          wasteAlertRes = await axios.get(`${VITE_API_URL}/api/orders/inventoryalert`, { headers });
        } catch (err) {
          console.error('Waste Alert API failed:', err);
          alert('Could not load dashboard data: Waste Alert API failed - ' + (err.response?.data?.error || err.message));
          return;
        }
        setQr(qrRes.data.qrData);
        setRestaurantName(userRes.data.user?.restaurant?.name || 'No Restaurant');
        setRestaurantId(userRes.data.user?.restaurant?._id || '');
        setManagerId(userRes.data.user?._id);
        // Staff: filter users for this restaurant and staff roles
        const currentUser = userRes.data.user;
        const allUsers = usersRes.data;
        const restaurantUsers = allUsers.filter(user => user.restaurant && user.restaurant._id === currentUser.restaurant._id);
        // Only count staff (not manager/vendor)
        const staffRoles = ['waiter', 'kitchen'];
        setStaff(restaurantUsers.filter(u => staffRoles.includes(u.role)));
        // Waste Alerts
        setWasteAlerts(wasteAlertRes.data.alerts || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        alert('Could not load dashboard data: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // WebSocket integration
    const socket = io(VITE_API_URL);
    socket.on('order:new', (order) => {
      console.log('[WS] Received order:new', order);
      setOrders(prev => {
        // Only add if not already present
        if (prev.some(o => o._id === order._id)) return prev;
        return [...prev, order];
      });
    });
    socket.on('order:update', (updatedOrder) => {
      setOrders(prev => prev.map(order => order._id === updatedOrder._id ? updatedOrder : order));
    });
    socket.on('alert:new', (alert) => {
      setWasteAlerts(prev => [...prev, alert]);
    });
    socket.on('notification', (notification) => {
      // You can add notification handling logic here
      // e.g., show a notification or update notification state
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleViewQR = () => {
    navigate('/manager/qr', { state: { qrData: qr, restaurantName } });
  };

  const handleViewUsers = () => {
    navigate('/manager/users', { state: { restaurantName } });
  };

  const handleInventoryManagement = () => {
    navigate('/inventory');
  };

  const handleTableManagement = () => {
    navigate('/tables');
  };

  const handlePageChange = (page) => {
    setActivePage(page);
  };

  const handleViewProfile = () => {
    if (managerId) navigate(`/profile/${managerId}`);
  };

  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      color: '#007bff' 
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ), 
      color: '#28a745' 
    },
    { 
      id: 'orderstatus', 
      label: 'Order Status', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
      ), 
      color: '#6366f1' 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ), 
      color: '#fd7e14' 
    },
    { 
      id: 'attendance', 
      label: 'Staff Attendance', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ), 
      color: '#6f42c1' 
    },
    { 
      id: 'tables', 
      label: 'Tables & Reservations', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
      ), 
      color: '#17a2b8' 
    },

   
  ];

  // Fetch inventory for voice assistant
  const getInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.get(`${VITE_API_URL}/api/orders/inventory`, { headers });
      setInventory(response.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => { getInventory(); }, []);

  // Voice assistant command handler
  const handleVoiceCommand = async (text, { intent, entity, tab, highlight, botText, payload }) => {
    // New intents from VoiceAssistant.jsx
    if (intent === 'whatsapp_enable') {
      await handleEnableWhatsapp();
      return;
    }
    if (intent === 'whatsapp_disable') {
      await handleDisableWhatsapp();
      return;
    }
    if (intent === 'whatsapp_logout') {
      await handleLogoutWhatsapp();
      return;
    }
    if (intent === 'whatsapp_qr') {
      await fetchWhatsappQr();
      return;
    }

    if (intent === 'upsert_inventory') {
      try {
        const name = payload?.name || entity;
        const quantity = payload?.quantity;
        const unit = payload?.unit;
        if (!name || quantity === null || quantity === undefined || Number.isNaN(Number(quantity))) {
          alert('Voice inventory format: add inventory <item> <quantity> <unit>');
          return;
        }

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.post(
          `${VITE_API_URL}/api/orders/inventory/upsert`,
          { name, quantity: Number(quantity), ...(unit ? { unit } : {}) },
          { headers }
        );
        await getInventory();
        setActivePage('inventory');
        setHighlight([String(name).trim().toLowerCase()]);
        if (window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utter = new window.SpeechSynthesisUtterance(`Inventory updated: ${name}.`);
          utter.lang = 'en-IN';
          window.speechSynthesis.speak(utter);
        }
      } catch (err) {
        alert('Failed to update inventory: ' + (err.response?.data?.error || err.message));
      }
      return;
    }

    if (intent === 'set_table_status') {
      try {
        const tableName = payload?.tableName;
        const floor = payload?.floor; // already normalized in VoiceAssistant
        const desiredStatus = payload?.desiredStatus; // seated|confirmed|completed|cancelled|available

        if (!restaurantId) {
          alert('Restaurant not loaded yet.');
          return;
        }
        if (!tableName || !desiredStatus) {
          alert('Voice format: set table <name> on <floor> to seated/available/completed');
          return;
        }

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const debugVoiceTables = localStorage.getItem('debugVoiceTables') === '1';
        const parseTimeToHoursMinutes = (timeValue) => {
          if (timeValue === null || timeValue === undefined) return null;
          const raw = String(timeValue).trim();
          if (!raw) return null;

          const normalized = raw
            .replace(/\./g, ':')
            .replace(/\s+/g, ' ')
            .trim();

          const match = normalized.match(/^\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?\s*(am|pm)?\s*$/i);
          if (!match) return null;

          let hours = parseInt(match[1], 10);
          let minutes = match[2] !== undefined ? parseInt(match[2], 10) : 0;
          const meridiem = match[3] ? match[3].toLowerCase() : null;

          if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
          if (minutes < 0 || minutes > 59) return null;

          if (meridiem) {
            if (hours === 12) hours = 0;
            if (meridiem === 'pm') hours += 12;
          }
          if (hours < 0 || hours > 23) return null;
          return { hours, minutes };
        };

        if (debugVoiceTables) {
          console.debug('[voice:set_table_status] input', { restaurantId, tableName, floor, desiredStatus });
        }

        // Get current table statuses (includes currentReservation)
        const statusRes = await axios.get(
          `${VITE_API_URL}/api/tables/tables/${restaurantId}/status`,
          { headers }
        );
        const tables = statusRes.data?.tables || [];
        const reservations = statusRes.data?.reservations || [];

        const normalize = (s) => String(s || '').trim().toLowerCase();
        const normalizeKey = (s) => normalize(s).replace(/[^a-z0-9]/g, '');
        const targetName = normalizeKey(tableName);
        const targetFloor = normalize(floor);

        const matchTable = tables.find(t => {
          const tn = normalizeKey(t.tableNumber);
          const tf = normalize(t.floor);
          if (tn !== targetName) return false;
          if (targetFloor && tf !== targetFloor) return false;
          return true;
        });

        if (debugVoiceTables) {
          console.debug('[voice:set_table_status] matchTable', matchTable);
          console.debug(
            '[voice:set_table_status] reservations(sample)',
            (reservations || []).slice(0, 10).map(r => ({
              id: r._id,
              tableId: r.tableId,
              tableNumber: r.tableNumber,
              reservationTime: r.reservationTime,
              reservationDate: r.reservationDate,
              status: r.status
            }))
          );
        }

        if (!matchTable) {
          alert(`Table not found: ${tableName}${floor ? ` on ${floor}` : ''}`);
          return;
        }

        const findReservationIdForTable = () => {
          const direct = matchTable.currentReservation?.reservationId;
          if (direct) return direct;

          // Fallback: pick nearest upcoming/active pending/confirmed reservation for this table
          const now = new Date();
          const candidates = reservations
            .filter(r => {
              const rid = normalizeKey(r.tableId);
              const rAlt = normalizeKey(r.tableNumber || r.table || r.tableName);
              const tableId = normalizeKey(matchTable.tableId);
              const tableNumber = normalizeKey(matchTable.tableNumber);
              return rid === tableId || rid === tableNumber || rAlt === tableId || rAlt === tableNumber;
            })
            .filter(r => {
              const s = normalize(r.status);
              return s === 'pending' || s === 'confirmed' || s === 'seated';
            })
            .map(r => {
              const dt = new Date(r.reservationDate);
              const parsed = parseTimeToHoursMinutes(r.reservationTime);
              if (!parsed) {
                if (debugVoiceTables) {
                  console.debug('[voice:set_table_status] unparseable time; skipping', {
                    id: r._id,
                    tableId: r.tableId,
                    reservationTime: r.reservationTime
                  });
                }
                return null;
              }
              dt.setHours(parsed.hours, parsed.minutes, 0, 0);
              return { r, dt };
            })
            .filter(Boolean)
            .sort((a, b) => a.dt - b.dt);

          // Prefer a seated reservation if present
          const seated = candidates.find(x => normalize(x.r.status) === 'seated');
          if (seated) return seated.r._id;

          // Otherwise nearest upcoming
          const upcoming = candidates.find(x => x.dt >= now);
          if (upcoming) return upcoming.r._id;

          // Otherwise oldest
          return candidates[0]?.r?._id;
        };

        // Reservation-driven statuses
        const reservationStatuses = new Set(['seated', 'confirmed', 'completed', 'cancelled']);

        if (desiredStatus === 'available') {
          // First: if there is an active seated reservation, complete it.
          const resId = findReservationIdForTable();
          if (resId) {
            await axios.put(
              `${VITE_API_URL}/api/tables/reservations/${resId}/status`,
              { status: 'completed' },
              { headers }
            );
          }
          // Always set the stored table status to available too.
          await axios.put(
            `${VITE_API_URL}/api/tables/tables/${restaurantId}/${matchTable.tableId}`,
            { status: 'available' },
            { headers }
          );
        } else if (reservationStatuses.has(desiredStatus)) {
          const resId = findReservationIdForTable();
          if (!resId) {
            alert('No active reservation found for this table.');
            return;
          }
          await axios.put(
            `${VITE_API_URL}/api/tables/reservations/${resId}/status`,
            { status: desiredStatus },
            { headers }
          );
        } else {
          // Direct table statuses (cleaning/maintenance/etc.)
          await axios.put(
            `${VITE_API_URL}/api/tables/tables/${restaurantId}/${matchTable.tableId}`,
            { status: desiredStatus },
            { headers }
          );
        }

        if (window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utter = new window.SpeechSynthesisUtterance(`Table ${tableName} updated.`);
          utter.lang = 'en-IN';
          window.speechSynthesis.speak(utter);
        }
      } catch (err) {
        alert('Failed to update table status: ' + (err.response?.data?.error || err.message));
      }
      return;
    }

    if (intent === 'delete_inventory' && entity) {
      await getInventory(); // Ensure inventory is up to date
      const item = inventory.find(i => i.name.toLowerCase() === entity.toLowerCase());
      if (item) {
        try {
          const token = localStorage.getItem('token');
          const headers = { Authorization: `Bearer ${token}` };
          await axios.delete(`${VITE_API_URL}/api/orders/inventory/${item._id}`, { headers });
          alert(`Deleted ${entity} from inventory.`);
          setHighlight([]); // Clear highlights after delete
          getInventory();
          if (window && window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            const utter = new window.SpeechSynthesisUtterance(`${entity} has been deleted from inventory.`);
            utter.lang = 'en-IN';
            window.speechSynthesis.speak(utter);
          }
        } catch (err) {
          alert('Failed to delete item: ' + err.message);
        }
      } else {
        alert(`Item \"${entity}\" not found in inventory.`);
      }
    }
    // Use new structure: { intent, entity, tab, highlight, botText }
    if (tab) {
      setActivePage(tab);
      if (tab === 'inventory') {
        const inventoryNames = inventory.map(item => item.name.trim().toLowerCase());
        let highlights = [];
        if (highlight) {
          let highlightWords = highlight.split(/,| and /i).map(i => i.trim().toLowerCase()).filter(Boolean);
          highlights = inventoryNames.filter(invName => highlightWords.some(h => invName.includes(h) || h.includes(invName)));
        }
        const cmd = text.toLowerCase();
        const commandHighlights = inventoryNames.filter(invName => cmd.includes(invName));
        highlights = Array.from(new Set([...highlights, ...commandHighlights]));
        if (highlights.length > 0) {
          setHighlight(highlights);
        }
        if (window && window.speechSynthesis) {
          let msg = '';
          if (highlights.length > 0) {
            const now = new Date();
            const responses = highlights.map(hName => {
              const item = inventory.find(i => i.name.trim().toLowerCase() === hName);
              if (!item) return null;
              let line = `${item.name}: ${item.quantity} ${item.unit}, last updated on ${new Date(item.lastUpdated).toLocaleDateString()}`;
              if (item.expiryDate) {
                const expiry = new Date(item.expiryDate);
                const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) {
                  line += `. Warning: expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (on ${expiry.toLocaleDateString()})`;
                }
              }
              return line;
            }).filter(Boolean);
            msg = responses.join('. ');
          } else {
            msg = `No, none of those items are available in inventory.`;
          }
          const utter = new window.SpeechSynthesisUtterance(msg);
          utter.lang = 'en-IN';
          window.speechSynthesis.speak(utter);
        }
      }
    }
    // Fallback: old logic
    else {
      const cmd = text.toLowerCase();
      if (cmd.includes('inventory')) {
        setActivePage('inventory');
        const inventoryNames = inventory.map(item => item.name.trim().toLowerCase());
        const highlights = inventoryNames.filter(invName => cmd.includes(invName));
        if (highlights.length > 0) {
          setHighlight(highlights);
        }
        if (window && window.speechSynthesis) {
          let msg = '';
          if (highlights.length > 0) {
            const now = new Date();
            const responses = highlights.map(hName => {
              const item = inventory.find(i => i.name.trim().toLowerCase() === hName);
              if (!item) return null;
              let line = `${item.name}: ${item.quantity} ${item.unit}, last updated on ${new Date(item.lastUpdated).toLocaleDateString()}`;
              if (item.expiryDate) {
                const expiry = new Date(item.expiryDate);
                const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3) {
                  line += `. Warning: expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (on ${expiry.toLocaleDateString()})`;
                }
              }
              return line;
            }).filter(Boolean);
            msg = responses.join('. ');
          } else {
            msg = `No, none of those items are available in inventory.`;
          }
          const utter = new window.SpeechSynthesisUtterance(msg);
          utter.lang = 'en-IN';
          window.speechSynthesis.speak(utter);
        }
       } else if (cmd.includes('orders')) {
        setActivePage('orders');
      } else if (cmd.includes('kitchen')) {
        setActivePage('kitchen');
      } else if (cmd.includes('attendance')) {
        setActivePage('attendance');
      } else if (cmd.includes('bills')) {
        setActivePage('bills');
      } else if (cmd.includes('tables')) {
        setActivePage('tables');
      } else if (cmd.includes('dashboard')) {
        setActivePage('dashboard');
      }
    }
  };
  const filteredDishes = dishes.filter((dish) =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Fetch orders and dishes
  useEffect(() => {
    if (activePage === 'orders') {
      fetchOrders();
      fetchDishes();
    }
  }, [activePage]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${VITE_API_URL}/api/orders`, { headers });
      setOrders(prev => mergeOrders(prev, res.data));
    } catch (err) {
      // handle error
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDishes = async (search = '') => {
    setDishLoading(true);
    setDishError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
  
      const res = await axios.get(
        `${VITE_API_URL}/api/orders/dishes${search ? `?search=${encodeURIComponent(search)}` : ''}`,
        { headers }
      );
      setDishes(res.data);
    } catch (err) {
      setDishError('Could not load dishes');
    } finally {
      setDishLoading(false);
    }
  };
  
  // Trigger search when typing (or on debounce)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchDishes(value);
  };

  const formatApiError = (err, fallback) => {
    const data = err?.response?.data;
    if (data?.error) {
      if (Array.isArray(data.missing) && data.missing.length) {
        const first = data.missing[0];
        const dishName = first?.name ? ` (${first.name})` : '';
        const reason = first?.reason ? `: ${first.reason}` : '';
        return `${data.error}${dishName}${reason}`;
      }
      return String(data.error);
    }
    return fallback || err?.message || 'Request failed';
  };
  // Add Dish Modal logic
  const handleAddDish = async (e) => {
    e.preventDefault();
    setDishLoading(true);
    setDishError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...addDishForm,
        ingredients: addDishForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        dietary: addDishForm.dietary.split(',').map(i => i.trim()).filter(Boolean),
        price: parseFloat(addDishForm.price)
      };
      await axios.post(`${VITE_API_URL}/api/orders/dishes`, payload, { headers });
      setShowAddDish(false);
      setAddDishForm({ name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '' });
      fetchDishes();
    } catch (err) {
      setDishError(formatApiError(err, 'Failed to add dish'));
    } finally {
      setDishLoading(false);
    }
  };

  // Add Order Modal logic
  const handleAddOrder = async (e) => {
    e.preventDefault();
    setOrderLoading(true);
    setOrderError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const items = orderItems.map(item => ({
        dish: item.dishId,
        name: dishes.find(d => d._id === item.dishId)?.name || '',
        quantity: item.quantity,
        price: dishes.find(d => d._id === item.dishId)?.price || 0,
        modifications: item.modifications ? item.modifications.split(',').map(m => m.trim()).filter(Boolean) : []
      }));
      await axios.post(`${VITE_API_URL}/api/orders/create`, {
        table: addOrderForm.table,
        items
      }, { headers });
      setShowAddOrder(false);
      setAddOrderForm({ table: '', items: [] });
      setOrderItems([]);
      fetchOrders();
    } catch (err) {
      setOrderError(formatApiError(err, 'Failed to add order'));
    } finally {
      setOrderLoading(false);
    }
  };

  // Add/Remove items in order modal
  const handleAddOrderItem = () => {
    setOrderItems([...orderItems, { dishId: '', quantity: 1, modifications: '' }]);
  };
  const handleRemoveOrderItem = (idx) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };
  const handleOrderItemChange = (idx, field, value) => {
    setOrderItems(orderItems.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // Dish gallery logic
  const handleGalleryOrder = async (e) => {
    e.preventDefault();
    setGalleryOrderError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        table: galleryOrderTableNo,
        items: [
          {
            dish: galleryModalDish._id,
            name: galleryModalDish.name,
            quantity: galleryOrderQty,
            price: galleryModalDish.price,
            modifications: galleryOrderMods ? galleryOrderMods.split(',').map(m => m.trim()).filter(Boolean) : []
          }
        ]
      };
      await axios.post(`${VITE_API_URL}/api/orders/create`, payload, { headers });
      setGalleryOrderSuccess(true);
      setGalleryOrderQty('');
      setGalleryOrderMods('');
      setGalleryOrderTableNo('');
      fetchOrders();
      setTimeout(() => {
        setGalleryOrderSuccess(false);
        setGalleryModalDish(null);
      }, 900);
    } catch (err) {
      setGalleryOrderError(formatApiError(err, 'Failed to place order'));
    }
  };

  // --- Artistic Toggle Slider for Orders/Kitchen ---
  const renderArtisticToggleSlider = () => {
    if (!["orders", "kitchen", "orderstatus"].includes(activePage)) return null;
    const navItems = [
      { id: "orders", label: "Orders", icon: (
        // Clipboard/List icon
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="#6366f1" strokeWidth="2.2" fill="#fff"/>
          <rect x="8" y="2" width="8" height="4" rx="2" stroke="#6366f1" strokeWidth="2.2" fill="#818cf8"/>
          <line x1="8" y1="10" x2="16" y2="10" stroke="#6366f1" strokeWidth="2"/>
          <line x1="8" y1="14" x2="16" y2="14" stroke="#6366f1" strokeWidth="2"/>
        </svg>
      ) },
      { id: "kitchen", label: "Kitchen", icon: (
        // Chef Hat icon
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" fill="#fbbf24" stroke="#fd7e14" strokeWidth="2.2"/>
          <ellipse cx="12" cy="9" rx="7" ry="5" fill="#fff" stroke="#fd7e14" strokeWidth="2.2"/>
          <line x1="9" y1="21" x2="9" y2="17" stroke="#fd7e14" strokeWidth="2"/>
          <line x1="15" y1="21" x2="15" y2="17" stroke="#fd7e14" strokeWidth="2"/>
        </svg>
      ) },
      { id: "orderstatus", label: "Order Status", icon: (
        // Clock/Status icon
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" fill="#fff" stroke="#a78bfa" strokeWidth="2.2"/>
          <path d="M12 7v5l3 3" stroke="#f472b6" strokeWidth="2.2"/>
        </svg>
      ) },
    ];
    const activeIdx = navItems.findIndex(item => item.id === activePage);
    return (
      <div className="artistic-toggle-slider-wrap">
        <div className="artistic-toggle-slider">
          <div className="artistic-toggle-indicator" style={{ left: `calc(${activeIdx * 33.333}% + 4px)` }} />
          {navItems.map((item, idx) => (
            <button
              key={item.id}
              className={`artistic-toggle-btn${activePage === item.id ? " active" : ""}`}
              title={item.label}
              onClick={() => setActivePage(item.id)}
              style={{ outline: "none" }}
            >
              {item.icon}
            </button>
          ))}
        </div>
        <style>{`
          .artistic-toggle-slider-wrap {
            width: 100%;
            display: flex;
            justify-content: center;
            margin: 0 0 32px 0;
            z-index: 1200;
          }
          .artistic-toggle-slider {
            position: relative;
            display: flex;
            flex-direction: row;
            background: linear-gradient(120deg, rgba(255,255,255,0.32) 0%, rgba(224,231,255,0.44) 100%);
            border-radius: 32px;
            box-shadow: 0 8px 40px #6366f122, 0 2px 12px #818cf822;
            padding: 4px;
            min-width: 260px;
            max-width: 420px;
            width: 100%;
            backdrop-filter: blur(24px) saturate(1.3);
            justify-content: space-between;
            align-items: center;
            height: 62px;
          }
          .artistic-toggle-indicator {
            position: absolute;
            top: 4px;
            width: calc(33.333% - 8px);
            height: 54px;
            background: linear-gradient(120deg, #a78bfa 0%, #f472b6 100%);
            border-radius: 24px;
            box-shadow: 0 4px 32px #818cf199, 0 0 0 8px #fbbf2444, 0 0 16px 2px #fff3;
            transition: left 0.55s cubic-bezier(.77,0,.18,1), background 0.28s;
            z-index: 1;
          }
          .artistic-toggle-btn {
            background: none;
            border: none;
            border-radius: 24px;
            width: 33.333%;
            height: 46px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: color 0.18s, background 0.18s, transform 0.18s;
            cursor: pointer;
            color: #232946;
            font-size: 22px;
            margin: 0;
            position: relative;
            z-index: 2;
            font-family: 'Sora', 'DM Sans', sans-serif;
          }
          .artistic-toggle-btn.active {
            color: #fff;
            font-weight: 700;
            transform: scale(1.08);
          }
          .artistic-toggle-btn:hover:not(.active) {
            color: #6366f1;
            background: rgba(224,231,255,0.18);
            transform: scale(1.04);
          }
          .artistic-toggle-btn svg {
            display: block;
            width: 36px;
            height: 36px;
            margin-bottom: 0;
          }
          .artistic-toggle-label {
            display: none;
          }
          @media (max-width: 700px) {
            .artistic-toggle-slider-wrap {
              margin-bottom: 18px;
            }
            .artistic-toggle-slider {
              min-width: 0;
              max-width: 98vw;
              height: 44px;
            }
            .artistic-toggle-indicator {
              height: 36px;
              top: 4px;
            }
            .artistic-toggle-btn {
              height: 36px;
              font-size: 18px;
            }
          }
        `}</style>
      </div>
    );
  };

  // Add after fetchOrders and fetchDishes
  const handlePayment = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${VITE_API_URL}/api/orders/${orderId}`, { status: 'paid' }, { headers });
      fetchOrders();
      setSelectedBillTable('');
    } catch (err) {
      // Optionally handle error
    }
  };

  // Notification effect: detect new orders
  useEffect(() => {
    if (orders && prevOrdersRef.current.length > 0) {
      // Find new orders by _id
      const prevIds = new Set(prevOrdersRef.current.map(o => o._id));
      const newOrders = orders.filter(o => !prevIds.has(o._id));
      if (newOrders.length > 0) {
        const newOrder = newOrders[0];
        setOrderNotification({
          waiter: newOrder.waiter?.name || 'Waiter',
          waiterImage: newOrder.waiter?.image || '',
          table: newOrder.table,
          dishes: newOrder.items.map(i => i.name).join(', '),
          dishImage: (newOrder.items[0] && dishes.find(d => d.name === newOrder.items[0].name)?.image) || '',
        });
        setOrderNotificationProgress(0);
        if (window.orderNotificationTimeout) clearTimeout(window.orderNotificationTimeout);
        window.orderNotificationTimeout = setTimeout(() => setOrderNotification(null), 10000);
      }
    }
    prevOrdersRef.current = orders;
  }, [orders, dishes]);

  // Battery animation effect
  useEffect(() => {
    if (orderNotification) {
      setOrderNotificationProgress(0);
      let start = Date.now();
      let frame;
      function animate() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / 10000, 1);
        setOrderNotificationProgress(progress);
        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        }
      }
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    } else {
      setOrderNotificationProgress(0);
    }
  }, [orderNotification]);

  // Poll for new orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
      fetchDishes();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // WhatsApp enable/disable handlers
  const handleEnableWhatsapp = async () => {
    setWhatsappLoading(true);
    setWhatsappError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${VITE_API_URL}/api/whatsapp/enable?reset=true`, {}, { headers });
      setWhatsappEnabled(true);
      setWhatsappStatus('enabled');
      setWhatsappLoggedIn(false);
      if (res.data && res.data.qr) {
        setWhatsappQrString(res.data.qr);
      } else {
        setWhatsappQrString('');
      }
      if (res.data && res.data.qrImageUrl) {
        setWhatsappQrUrl(res.data.qrImageUrl);
        // Render immediately (UI uses whatsappQrImage)
        setWhatsappQrImage(res.data.qrImageUrl);
      } else {
        setWhatsappQrUrl('');
        setWhatsappQrImage('');
      }
    } catch (err) {
      setWhatsappStatus('error');
      setWhatsappQrString('');
      setWhatsappQrUrl('');
      setWhatsappQrImage('');
      const backendError = err.response?.data?.error || err.message;
      const backendCode = err.response?.data?.code;
      setWhatsappError(backendError + (backendCode ? ` (Code: ${backendCode})` : ''));
      alert('Failed to enable WhatsApp bot: ' + backendError + (backendCode ? ` (Code: ${backendCode})` : ''));
    } finally {
      setWhatsappLoading(false);
    }
  };
  const handleDisableWhatsapp = async () => {
    setWhatsappLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${VITE_API_URL}/api/whatsapp/disable`, {}, { headers });
      setWhatsappEnabled(false);
      setWhatsappStatus('disabled');
      setWhatsappLoggedIn(false);
      setWhatsappQrString('');
      setWhatsappQrUrl('');
      setWhatsappQrImage('');
    } catch (err) {
      setWhatsappStatus('error');
      alert('Failed to disable WhatsApp bot.');
    } finally {
      setWhatsappLoading(false);
    }
  };
  const handleSendTestMsg = async () => {
    setTestMsgResult('');
    try {
      if (!whatsappPhone || !testMsg) return setTestMsgResult('Enter phone and message');
      const jid = whatsappPhone.includes('@') ? whatsappPhone : whatsappPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${VITE_API_URL}/api/whatsapp/send-message`, { jid, text: testMsg }, { headers });
      setTestMsgResult('Message sent!');
    } catch (err) {
      setTestMsgResult('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCheckWhatsappStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${VITE_API_URL}/api/whatsapp/qr`, { headers });
      if (res.data.status === 'ready') {
        setWhatsappLoggedIn(true);
      } else {
        setWhatsappLoggedIn(false);
      }
    } catch (err) {
      setWhatsappLoggedIn(false);
    }
  };

  const handleLogoutWhatsapp = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${VITE_API_URL}/api/whatsapp/logout`, {}, { headers });
      setWhatsappLoggedIn(false);
      setWhatsappQrString('');
      setWhatsappQrUrl('');
      setWhatsappQrImage('');
      alert('Logged out from WhatsApp. Please scan the new QR code to log in again.');
    } catch (err) {
      alert('Failed to logout WhatsApp bot.');
    }
  };

  const fetchWhatsappQr = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${VITE_API_URL}/api/whatsapp/qr`, { headers });
      if (res.data.status === 'ready') {
        setWhatsappLoggedIn(true);
        setWhatsappQrImage('');
      } else if (res.data.qrImage) {
        setWhatsappLoggedIn(false);
        setWhatsappQrImage(res.data.qrImage);
      } else {
        setWhatsappLoggedIn(false);
        setWhatsappQrImage('');
      }
    } catch (err) {
      setWhatsappLoggedIn(false);
      setWhatsappQrImage('');
    }
  };

  useEffect(() => {
    fetchWhatsappQr();
    const interval = setInterval(fetchWhatsappQr, 5000); // Poll every 5s for QR/login status
    return () => clearInterval(interval);
  }, []);

  const todaysSales = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (loading) {
    return (
      <Center minH="100vh" bg="#FAFAF8" flexDir="column" gap={4}>
        <Spinner thickness="3px" speed="0.8s" color="blackAlpha.800" size="lg" />
        <Text color="blackAlpha.600" fontWeight={600}>
          Loading dashboard...
        </Text>
      </Center>
    );
  }

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard': {
        const getTrendingDishes = () => {
          const dishCounts = new Map();

          (orders || []).forEach((order) => {
            (order?.items || []).forEach((item) => {
              const dishName = String(item?.name || 'Unknown');
              const qty = Number(item?.quantity || 0);
              dishCounts.set(dishName, (dishCounts.get(dishName) || 0) + qty);
            });
          });

          return Array.from(dishCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        };

        const trendingDishes = getTrendingDishes();
        const query = dashboardQuery.trim().toLowerCase();
        const visibleTrending = query
          ? trendingDishes.filter((d) => d.name.toLowerCase().includes(query))
          : trendingDishes;

        const now = new Date();
        const filteredOrders = (orders || []).filter((o) => {
          if (!o?.createdAt || dashboardChip === 'All') return true;
          const createdAt = new Date(o.createdAt);
          if (dashboardChip === 'Today') return createdAt.toDateString() === now.toDateString();
          if (dashboardChip === 'This Week') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            return createdAt >= sevenDaysAgo;
          }
          if (dashboardChip === 'Alerts') return true;
          return true;
        });

        const recentOrders = [...filteredOrders]
          .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
          .slice(0, 6);

        const kpis = [
          {
            label: "Today's Sales",
            value: `INR ${Number(todaysSales || 0).toLocaleString('en-IN')}`,
            icon: DollarSign,
            hint: 'Gross',
          },
          { label: 'Orders', value: String(orders?.length || 0), icon: ClipboardList, hint: 'Total' },
          {
            label: 'Occupied Tables',
            value: String(seatedTables?.length || 0),
            icon: LayoutGrid,
            hint: 'Now',
          },
          { label: 'Staff', value: String(staff?.length || 0), icon: Users, hint: 'Roster' },
          {
            label: 'Waste Alerts',
            value: String(wasteAlerts?.length || 0),
            icon: AlertTriangle,
            hint: 'Open',
          },
        ];

        const dashboardCards = [
          {
            title: 'Monthly Sales',
            icon: TrendingUp,
            content: <MonthlySalesGraph orders={orders} />,
          },
          {
            title: 'Waste Analysis',
            icon: AlertTriangle,
            content: <WasteAnalysis restaurantId={restaurantId} userRole="manager" />,
          },
          {
            title: 'Sales & Profit Advisor',
            icon: DollarSign,
            content: <SalesProfitAdvisor restaurantId={restaurantId} userRole="manager" orders={orders} />,
          },
         
          {
            title: 'Upsell Suggestions',
            icon: ArrowUpRight,
            content: <UpsellSuggestions restaurantId={restaurantId} userRole="manager" orders={orders} />,
          },
          {
            title: 'Smart Leftover Reuse',
            icon: Sparkles,
            content: <SmartLeftoverReuse restaurantId={restaurantId} userRole="manager" />,
          },
          {
            title: 'Inventory Waste Alerts',
            icon: AlertTriangle,
            content: <InventoryWasteAlert restaurantId={restaurantId} userRole="manager" />,
          },
        ];

        return (
          <Box minH="100vh" bgGradient="linear(to-br, brand.beige, white)" w="full">
            <Box
              position="sticky"
              top="0"
              zIndex={20}
              backdropFilter="blur(12px)"
              bg="brand.beige"
              bgOpacity={0.88}
              borderBottom="1px solid"
              borderColor="blackAlpha.200"
            >
              <Container maxW="7xl" py={{ base: 4, md: 5 }}>
                <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
                  <Box>
                    <Heading size={{ base: 'md', md: 'lg' }} fontWeight={600}>
                      Manager Dashboard
                    </Heading>
                    <Text color="brand.muted" fontSize="sm" fontWeight={600}>
                      {restaurantName ? (
                        <>
                          <Text as="span" color="terracotta.600" fontWeight={800}>
                            {restaurantName}
                          </Text>
                          <Text as="span"> • Overview</Text>
                        </>
                      ) : (
                        'Overview'
                      )}
                    </Text>
                  </Box>

                  <HStack spacing={3} flexWrap="wrap">
                    {restaurantId ? <NotificationBell restaurantId={restaurantId} inline /> : null}
                    <Button
                      variant="softOutline"
                      leftIcon={<User size={18} />}
                      onClick={handleViewProfile}
                      isDisabled={!managerId}
                    >
                      Profile
                    </Button>
                    <Button variant="softOutline" leftIcon={<Users size={18} />} onClick={() => navigate('/manager/users')}>
                      Users
                    </Button>
                    <Button variant="softOutline" leftIcon={<QrCode size={18} />} onClick={() => navigate('/manager/qr')}>
                      QR
                    </Button>
                    <Button variant="dark" leftIcon={<Plus size={18} />} onClick={() => setShowAddDish(true)}>
                      Add dish
                    </Button>
                    <Button variant="terracotta" leftIcon={<Receipt size={18} />} onClick={() => setShowAddOrder(true)}>
                      New order
                    </Button>
                  </HStack>
                </Flex>
              </Container>
            </Box>

            <Container maxW="7xl" py={{ base: 6, md: 8 }}>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                {kpis.map((kpi) => (
                  <Card key={kpi.label}>
                    <CardBody>
                      <HStack spacing={4} align="flex-start">
                        <Center
                          boxSize="44px"
                          borderRadius="12px"
                          bg="blackAlpha.50"
                          borderWidth="1px"
                          borderColor="blackAlpha.100"
                          flexShrink={0}
                        >
                          <Icon as={kpi.icon} boxSize="18px" color="terracotta.600" />
                        </Center>
                        <Box flex="1">
                          <Text fontSize="sm" color="brand.muted" fontWeight={700}>
                            {kpi.label}
                          </Text>
                          <HStack spacing={2} align="baseline" mt={1}>
                            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight={800}>
                              {kpi.value}
                            </Text>
                            <Text fontSize="sm" color="brand.muted" fontWeight={600}>
                              {kpi.hint}
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>

              <Card mt={6}>
                <CardBody>
                  <Flex gap={4} align="center" flexWrap="wrap">
                    <InputGroup maxW={{ base: 'full', md: '360px' }}>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={Search} color="terracotta.600" boxSize="18px" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search dishes, orders, insights..."
                        value={dashboardQuery}
                        onChange={(e) => setDashboardQuery(e.target.value)}
                        pl="42px"
                      />
                    </InputGroup>

                    <HStack spacing={2} flexWrap="wrap">
                      {['All', 'Today', 'This Week', 'Alerts'].map((chip) => {
                        const isActive = dashboardChip === chip;
                        return (
                          <Button
                            key={chip}
                            variant={isActive ? 'dark' : 'pill'}
                            size="sm"
                            onClick={() => setDashboardChip(chip)}
                          >
                            {chip}
                          </Button>
                        );
                      })}
                    </HStack>

                    <Flex flex="1" />

                    <Button variant="terracotta" leftIcon={<TrendingUp size={18} />}>
                      View report
                    </Button>
                  </Flex>
                </CardBody>
              </Card>

              <SimpleGrid mt={6} columns={{ base: 1, lg: 2 }} spacing={5}>
                <Card>
                  <CardBody>
                    <Flex align="center" justify="space-between" gap={3} mb={4} flexWrap="wrap">
                      <Box>
                        <Heading size="md">Trending dishes</Heading>
                        <Text color="brand.muted" fontSize="sm" fontWeight={600}>
                          Based on order frequency
                        </Text>
                      </Box>
                      <Badge
                        bg="blackAlpha.50"
                        color="terracotta.600"
                        borderRadius="999px"
                        px={3}
                        py={1}
                        borderWidth="1px"
                        borderColor="blackAlpha.200"
                      >
                        Top {visibleTrending.length}
                      </Badge>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                      {visibleTrending.length ? (
                        visibleTrending.map((dish) => (
                          <Box
                            key={dish.name}
                            bg="white"
                            borderWidth="1px"
                            borderColor="blackAlpha.100"
                            borderRadius="14px"
                            p={3}
                            transition="all 150ms"
                            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                          >
                            <HStack spacing={3} align="center">
                              <Center
                                boxSize="36px"
                                borderRadius="12px"
                                bg="blackAlpha.50"
                                borderWidth="1px"
                                borderColor="blackAlpha.100"
                                flexShrink={0}
                              >
                                <Icon as={Sparkles} boxSize="16px" color="brand.ink" />
                              </Center>
                              <Box flex="1" minW={0}>
                                <Text fontWeight={800} noOfLines={1}>
                                  {dish.name}
                                </Text>
                                <Text fontSize="sm" color="brand.muted" fontWeight={600}>
                                  {dish.count} ordered
                                </Text>
                              </Box>
                              <Icon as={ArrowUpRight} boxSize="16px" color="blackAlpha.500" />
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Text color="brand.muted" fontWeight={600}>
                          No matching dishes.
                        </Text>
                      )}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Flex align="center" justify="space-between" gap={3} mb={4} flexWrap="wrap">
                      <Box>
                        <Heading size="md">Recent orders</Heading>
                        <Text color="brand.muted" fontSize="sm" fontWeight={600}>
                          {dashboardChip === 'All' ? 'Latest activity' : `Filtered: ${dashboardChip}`}
                        </Text>
                      </Box>
                      <Badge bg="blackAlpha.50" color="brand.ink" borderRadius="999px" px={3} py={1}>
                        {recentOrders.length}
                      </Badge>
                    </Flex>

                    <VStack align="stretch" spacing={3}>
                      {recentOrders.length ? (
                        recentOrders.map((o) => {
                          const key = o?._id || o?.id || `${o?.createdAt || ''}-${o?.tableNo || o?.table || ''}`;
                          const itemsPreview = (o?.items || [])
                            .map((it) => it?.name)
                            .filter(Boolean)
                            .slice(0, 3)
                            .join(', ');

                          return (
                            <Box
                              key={key}
                              bg="white"
                              borderWidth="1px"
                              borderColor="blackAlpha.100"
                              borderRadius="14px"
                              p={3}
                              transition="all 150ms"
                              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                            >
                              <Flex align="center" gap={3} flexWrap="wrap">
                                <Badge bg="blackAlpha.50" color="brand.ink" borderRadius="999px" px={3} py={1}>
                                  Table {o?.tableNo || o?.table || '—'}
                                </Badge>
                                <Text fontWeight={800}>INR {Number(o?.totalAmount || 0).toLocaleString('en-IN')}</Text>
                                <Text color="brand.muted" fontSize="sm" fontWeight={600}>
                                  {o?.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                                </Text>
                                <Flex flex="1" />
                                <Badge bg="blackAlpha.100" color="blackAlpha.800" borderRadius="999px" px={3} py={1}>
                                  {String(o?.status || 'placed')}
                                </Badge>
                              </Flex>
                              <Text mt={1} color="brand.muted" fontSize="sm" fontWeight={600} noOfLines={1}>
                                {itemsPreview || '—'}
                              </Text>
                            </Box>
                          );
                        })
                      ) : (
                        <Text color="brand.muted" fontWeight={600}>
                          No orders yet.
                        </Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              <Box mt={8}>
                <Heading size="md">Workspace</Heading>
                <Text color="brand.muted" fontSize="sm" fontWeight={600} mt={1} mb={4}>
                  Tools and insights in a card-based layout
                </Text>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                  {dashboardCards.map((c) => (
                    <Card key={c.title}>
                      <CardBody>
                        <HStack spacing={3} mb={4}>
                          <Center
                            boxSize="36px"
                            borderRadius="12px"
                            bg="blackAlpha.50"
                            borderWidth="1px"
                            borderColor="blackAlpha.100"
                            flexShrink={0}
                          >
                            <Icon as={c.icon} boxSize="16px" color="brand.ink" />
                          </Center>
                          <Box>
                            <Text fontSize="xs" color="brand.muted" fontWeight={800} letterSpacing="0.08em">
                              DASHBOARD
                            </Text>
                            <Heading size="sm" fontWeight={700}>
                              {c.title}
                            </Heading>
                          </Box>
                        </HStack>
                        <Box>{c.content}</Box>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            </Container>
          </Box>
        );
      }

      case 'orders':
  return (
    <Box 
      minH="100vh" 
      w="full" 
      bgGradient="linear(120deg, #f8fafc 0%, #e0e7ff 100%)"
      position="relative"
      pb={10}
    >
      {/* Bill Drawer Button */}
      <IconButton
        icon={<Receipt />}
        position="fixed"
        top={8}
        right={8}
        zIndex={1202}
        bgGradient="linear(90deg, #6366f1, #f472b6)"
        color="white"
        rounded="full"
        size="lg"
        px={8}
        py={6}
        fontSize="lg"
        fontWeight="bold"
        fontFamily="Sora"
        boxShadow="lg"
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: 'xl',
          bgGradient: "linear(90deg, #818cf8, #f472b6)"
        }}
        onClick={() => setBillDrawerOpen(true)}
      >
        Bill
      </IconButton>

      {/* Add Dish Button */}
      <Container maxW="1400px" centerContent>
        <Button
          leftIcon={<Plus />}
          onClick={() => setShowAddDish(true)}
          bgGradient="linear(90deg, #6366f1, #818cf8)"
          color="white"
          rounded="full"
          size="lg"
          px={8}
          py={6}
          fontSize="lg"
          fontWeight="semibold"
          fontFamily="Sora"
          boxShadow="md"
          mt={20}
          _hover={{
            bgGradient: "linear(90deg, #818cf8, #6366f1)",
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: 'xl'
          }}
          transition="all 0.2s"
        >
          Add New Dish
        </Button>

        {/* Dish Gallery Grid */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
          spacing={6} 
          w="full" 
          mt={8}
          px={4}
        >
          {dishes.map(dish => (
            <MotionCard
              key={dish._id}
              overflow="hidden"
              cursor="pointer"
              onClick={() => setGalleryModalDish(dish)}
              borderRadius="2xl"
              bg="white"
              boxShadow="lg"
              _hover={{ 
                boxShadow: '2xl',
                transform: 'translateY(-4px)'
              }}
              transition="all 0.3s"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Box position="relative" h="280px">
                <Image
                  src={dish.image || '/images/chef3.png'}
                  alt={dish.name}
                  objectFit="cover"
                  w="full"
                  h="full"
                />
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  bgGradient="linear(to-t, rgba(30,32,48,0.95), transparent)"
                  p={4}
                  color="white"
                >
                  <Text 
                    fontSize="xl" 
                    fontWeight="bold" 
                    fontFamily="Sora"
                    noOfLines={1}
                    textShadow="0 2px 8px rgba(0,0,0,0.3)"
                  >
                    {dish.name}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color="gray.200"
                    noOfLines={1}
                  >
                    {dish.description}
                  </Text>
                  <Text 
                    fontSize="lg" 
                    fontWeight="bold" 
                    color="yellow.300"
                    textShadow="0 2px 8px rgba(0,0,0,0.3)"
                  >
                    {'\u20B9'} {dish.price}
                  </Text>
                </Box>
              </Box>
            </MotionCard>
          ))}
        </SimpleGrid>
      </Container>

      {/* Bill Drawer */}
      <Drawer
        isOpen={billDrawerOpen}
        placement="right"
        onClose={() => {
          setBillDrawerOpen(false)
          setPaymentMethod('cash')
          setUpiQrCode('')
          setPaymentStatus('')
        }}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent
          borderLeftRadius="2xl"
          boxShadow="-8px 0 32px rgba(99, 102, 241, 0.1)"
        >
          <DrawerCloseButton />
          <DrawerHeader 
            borderBottomWidth="1px" 
            borderColor="gray.200"
            fontSize="xl"
            fontFamily="Sora"
          >
            {paymentStatus === 'waiting' ? 'UPI Payment' : 'Bill & Payment'}
          </DrawerHeader>

          <DrawerBody>
            {paymentStatus === 'waiting' && upiQrCode ? (
              <VStack spacing={6} align="stretch">
                <Center>
                  <Box
                    bg="green.50"
                    p={6}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="green.400"
                  >
                    <Image 
                      src={upiQrCode} 
                      alt="UPI QR Code" 
                      boxSize="250px"
                      borderRadius="lg"
                    />
                  </Box>
                </Center>

                <Box
                  bgGradient="linear(135deg, #22c55e, #10b981)"
                  color="white"
                  p={4}
                  borderRadius="xl"
                >
                  <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                    {'\u20B9'} {currentPayment.amount}
                  </Text>
                  <Text textAlign="center" fontSize="sm" opacity={0.9}>
                    Table {currentPayment.tableNo} • {restaurantName}
                  </Text>
                </Box>

                <Box
                  bg="green.50"
                  p={4}
                  borderRadius="lg"
                  border="2px dashed"
                  borderColor="green.400"
                >
                  <Text fontSize="xs" color="gray.600">Send to UPI ID:</Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.600" fontFamily="mono">
                    priyanshugupta007007@okaxis
                  </Text>
                  <Text fontSize="sm" color="gray.600">Priyanshu Gupta</Text>
                </Box>

                <VStack spacing={3}>
                  <Button
                    leftIcon={<Smartphone />}
                    bgGradient="linear(135deg, #4285f4, #34a853)"
                    color="white"
                    size="lg"
                    w="full"
                    onClick={() => openUPIApp(currentPayment.amount, currentPayment.tableNo)}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  >
                    Open UPI App
                  </Button>

                  <Button
                    leftIcon={<CheckCircle />}
                    bgGradient="linear(135deg, #22c55e, #10b981)"
                    color="white"
                    size="lg"
                    w="full"
                    onClick={confirmUPIPayment}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  >
                    I've Made the Payment
                  </Button>

                  <Button
                    leftIcon={<ArrowLeft />}
                    variant="outline"
                    w="full"
                    onClick={() => {
                      setUpiQrCode('')
                      setPaymentStatus('')
                    }}
                  >
                    Back to Payment Methods
                  </Button>
                </VStack>

                <Box
                  bg="orange.50"
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="orange.300"
                >
                  <Text fontSize="sm" color="orange.800">
                    💡 <strong>How to pay:</strong><br/>
                    1. Scan QR code with any UPI app<br/>
                    2. Or click "Open UPI App"<br/>
                    3. Or manually send to the UPI ID above<br/>
                    4. Click "I've Made the Payment" when done
                  </Text>
                </Box>
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* Payment Method Selection */}
                <Box>
                  <Text fontWeight="bold" mb={3} fontSize="lg">Payment Method</Text>
                  <SimpleGrid columns={3} spacing={3}>
                    <Button
                      leftIcon={<Banknote />}
                      variant={paymentMethod === 'cash' ? 'solid' : 'outline'}
                      colorScheme="green"
                      onClick={() => setPaymentMethod('cash')}
                      size="sm"
                    >
                      Cash
                    </Button>
                    <Button
                      leftIcon={<QrCode />}
                      variant={paymentMethod === 'upi' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      onClick={() => setPaymentMethod('upi')}
                      size="sm"
                    >
                      UPI
                    </Button>
                    <Button
                      leftIcon={<CreditCard />}
                      variant={paymentMethod === 'card' ? 'solid' : 'outline'}
                      colorScheme="purple"
                      onClick={() => setPaymentMethod('card')}
                      size="sm"
                    >
                      Card
                    </Button>
                  </SimpleGrid>
                </Box>

                {/* Table Selection */}
                {orders.filter(o => o.status === 'pending').length > 0 && (
                  <HStack spacing={2} overflowX="auto" pb={2}>
                    {[...new Set(orders.filter(o => o.status === 'pending').map(o => o.table))].map(tableNo => (
                      <Button
                        key={tableNo}
                        variant={selectedBillTable === tableNo ? 'solid' : 'outline'}
                        colorScheme={selectedBillTable === tableNo ? 'purple' : 'gray'}
                        onClick={() => setSelectedBillTable(tableNo)}
                        size="sm"
                        rounded="full"
                      >
                        Table {tableNo}
                      </Button>
                    ))}
                  </HStack>
                )}

                {/* Orders Display */}
                {orders.filter(o => o.status === 'pending').length === 0 ? (
                  <Center py={10}>
                    <Text color="gray.500">No items in bill yet.</Text>
                  </Center>
                ) : (
                  (() => {
                    const pendingOrders = orders.filter(o => 
                      o.status === 'pending' && 
                      (!selectedBillTable || o.table === selectedBillTable)
                    )
                    const tables = [...new Set(pendingOrders.map(o => o.table))]
                    
                    if (tables.length === 0) {
                      return (
                        <Center py={10}>
                          <Text color="gray.500">No items in bill yet.</Text>
                        </Center>
                      )
                    }
                    
                    return tables.map(tableNo => {
                      const tableOrders = pendingOrders.filter(o => o.table === tableNo)
                      let allItems = []
                      tableOrders.forEach(order => {
                        order.items.forEach(item => {
                          allItems.push({ ...item, _orderId: order._id })
                        })
                      })

                      const groupedItems = []
                      allItems.forEach(item => {
                        const key = item.name + '|' + (item.modifications ? item.modifications.join(',') : '')
                        const existing = groupedItems.find(i => i.key === key)
                        if (existing) {
                          existing.quantity += Number(item.quantity)
                        } else {
                          groupedItems.push({
                            key,
                            name: item.name,
                            modifications: item.modifications,
                            price: item.price,
                            quantity: Number(item.quantity)
                          })
                        }
                      })

                      const total = groupedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
                      const orderIds = tableOrders.map(o => o._id)

                      return (
                        <Box
                          key={tableNo}
                          bg="gray.50"
                          p={4}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          <Text fontWeight="bold" color="purple.500" fontSize="lg" mb={3}>
                            Table {tableNo}
                          </Text>
                          
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Item</Th>
                                <Th isNumeric>Qty</Th>
                                <Th isNumeric>Price</Th>
                                <Th isNumeric>Total</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {groupedItems.map((item, idx) => (
                                <Tr key={idx}>
                                  <Td>
                                    <Text fontWeight="semibold">{item.name}</Text>
                                    {item.modifications && item.modifications.length > 0 && (
                                      <Text fontSize="xs" color="gray.600" fontStyle="italic">
                                        {item.modifications.join(', ')}
                                      </Text>
                                    )}
                                  </Td>
                                  <Td isNumeric>{item.quantity}</Td>
                                  <Td isNumeric>{'\u20B9'} {item.price}</Td>
                                  <Td isNumeric fontWeight="bold">{'\u20B9'} {item.price * item.quantity}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                          
                          <Divider my={3} />
                          
                          <Text fontSize="xl" fontWeight="bold" textAlign="right" color="orange.400">
                            Total: {'\u20B9'} {total}
                          </Text>

                          <Button
                            mt={4}
                            w="full"
                            size="lg"
                            colorScheme={paymentMethod === 'upi' ? 'green' : paymentMethod === 'card' ? 'purple' : 'blue'}
                            onClick={async () => {
                              if (paymentMethod === 'upi') {
                                handleRealUPIPayment(orderIds, total, tableNo)
                              } else {
                                for (const id of orderIds) {
                                  await handlePayment(id)
                                }
                                alert(`✅ Payment of \u20B9${total} received via ${paymentMethod.toUpperCase()}!`)
                              }
                            }}
                          >
                            {paymentMethod === 'upi' ? `Pay \u20B9${total} via UPI` :
                             paymentMethod === 'card' ? `Process Card Payment - \u20B9${total}` :
                             `Confirm Cash Payment - \u20B9${total}`}
                          </Button>
                        </Box>
                      )
                    })
                  })()
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Order Modal */}
      <Modal 
        isOpen={!!galleryModalDish} 
        onClose={() => setGalleryModalDish(null)}
        isCentered
        motionPreset="scale"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl">
          <ModalCloseButton />
          <ModalBody p={6}>
            {galleryModalDish && (
              <VStack spacing={4}>
                <Image
                  src={galleryModalDish.image || '/images/chef3.png'}
                  alt={galleryModalDish.name}
                  borderRadius="xl"
                  boxShadow="lg"
                  maxH="200px"
                  objectFit="cover"
                />
                
                <Box w="full">
                  <Text fontSize="xl" fontWeight="bold" fontFamily="Sora">
                    {galleryModalDish.name}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    {galleryModalDish.description}
                  </Text>
                  <Text color="orange.400" fontWeight="bold" fontSize="lg" mt={1}>
                    {'\u20B9'} {galleryModalDish.price}
                  </Text>
                </Box>

                <form onSubmit={handleGalleryOrder} style={{ width: '100%' }}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Select Table</FormLabel>
                      <Select
                        value={galleryOrderTableNo}
                        onChange={(e) => setGalleryOrderTableNo(e.target.value)}
                        placeholder={seatedTablesLoading ? 'Loading tables...' : 'Select a seated table'}
                        isDisabled={seatedTablesLoading || seatedTables.length === 0}
                      >
                        {seatedTables.map(t => (
                          <option key={t.tableId} value={t.tableNumber}>
                            Table {t.tableNumber}{t.floor ? ` • ${t.floor}` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput min={1} value={galleryOrderQty}>
                        <NumberInputField
                          onChange={(e) => setGalleryOrderQty(e.target.value)}
                        />
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Modifications</FormLabel>
                      <Input
                        value={galleryOrderMods}
                        onChange={(e) => setGalleryOrderMods(e.target.value)}
                        placeholder="e.g., No onions, extra spicy"
                      />
                    </FormControl>

                    {galleryOrderSuccess && (
                      <Text color="green.500" fontWeight="bold">
                        Order placed successfully!
                      </Text>
                    )}
                    
                    {galleryOrderError && (
                      <Text color="red.500">
                        {galleryOrderError}
                      </Text>
                    )}

                    <HStack spacing={3} w="full" justify="flex-end">
                      <Button variant="ghost" onClick={() => setGalleryModalDish(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        bgGradient="linear(90deg, #6366f1, #818cf8)"
                        color="white"
                        _hover={{
                          bgGradient: "linear(90deg, #818cf8, #6366f1)",
                        }}
                      >
                        Place Order
                      </Button>
                    </HStack>
                  </VStack>
                </form>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Order Notification Toast */}
      {orderNotification && (
        <MotionBox
          position="fixed"
          top={8}
          right={8}
          zIndex={2000}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
        >
          <Card
            overflow="hidden"
            bg="white"
            boxShadow="2xl"
            borderRadius="2xl"
            minW="300px"
          >
            <Progress
              value={orderNotificationProgress * 100}
              size="xs"
              colorScheme="green"
              position="absolute"
              top={0}
              left={0}
              right={0}
            />
            <CardBody>
              <HStack spacing={4}>
                {orderNotification.waiterImage && (
                  <Avatar
                    src={orderNotification.waiterImage}
                    name={orderNotification.waiter}
                    size="md"
                    border="2px solid"
                    borderColor="green.400"
                  />
                )}
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="bold" color="green.700">
                    Waiter: {orderNotification.waiter}
                  </Text>
                  <Badge colorScheme="green">
                    Table {orderNotification.table}
                  </Badge>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Order: {orderNotification.dishes}
                  </Text>
                </VStack>
                {orderNotification.dishImage && (
                  <Image
                    src={orderNotification.dishImage}
                    alt="Dish"
                    boxSize="50px"
                    borderRadius="lg"
                    border="2px solid"
                    borderColor="yellow.400"
                    objectFit="cover"
                  />
                )}
              </HStack>
            </CardBody>
          </Card>
        </MotionBox>
      )}
    </Box>
  )
      case 'inventory':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>📦 Inventory Management</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Manage your restaurant's inventory, track stock levels, and monitor usage.
            </p>
            <button 
              onClick={handleInventoryManagement}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#fd7e14', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Open Inventory Management
            </button>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Inventory Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Add, edit, and delete inventory items</li>
                <li>Bulk import with voice/text input support</li>
                <li>Track stock levels and set alerts</li>
                <li>Monitor usage patterns and trends</li>
                <li>Generate inventory reports</li>
              </ul>
            </div>
          </div>
        );

      case 'kitchen':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>👨‍🍳 Kitchen Management</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Monitor kitchen operations, manage food preparation, and track cooking times.
            </p>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Kitchen Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Real-time order queue management</li>
                <li>Track cooking times and preparation status</li>
                <li>Manage kitchen staff assignments</li>
                <li>Monitor food quality and consistency</li>
                <li>Kitchen performance analytics</li>
              </ul>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <h2 style={{ marginBottom: '10px', color: '#495057' }}>👥 Staff Attendance</h2>
                <p style={{ color: '#6c757d', margin: 0 }}>
                  Track staff attendance using facial recognition technology.
                </p>
              </div>
              <button 
                onClick={() => setShowFaceScanner(true)}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: '#6f42c1', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(111, 66, 193, 0.3)'
                }}
              >
                📸 Scan Face for Attendance
              </button>
            </div>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Track staff attendance, manage schedules, and monitor work hours.
            </p>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Attendance Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Clock in/out functionality for staff</li>
                <li>Track working hours and overtime</li>
                <li>Manage staff schedules and shifts</li>
                <li>Generate attendance reports</li>
                <li>Monitor staff performance metrics</li>
              </ul>
            </div>
            {showFaceScanner && (
              <FaceAttendanceScanner
                restaurantId={restaurantId}
                staff={staff}
                onSuccess={() => {
                  fetchAttendanceRecords();
                }}
                onClose={() => setShowFaceScanner(false)}
              />
            )}
          </div>
        );

      case 'bills':
        return (
          <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>�� Bill Management</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Generate bills, process payments, and manage financial transactions.
            </p>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: 24 }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Order Log</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8 }}>
                <thead>
                  <tr>
                    <th style={{color:'#232946'}}>Order ID</th>
                    <th style={{color:'#232946'}}>Table</th>
                    <th style={{color:'#232946'}}>Items</th>
                    <th style={{color:'#232946'}}>Total</th>
                    <th style={{color:'#232946'}}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center',color:'#888'}}>No orders yet.</td></tr> : orders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-5)}</td>
                      <td>{order.table}</td>
                      <td>{order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
                      <td>{'\u20B9'} {order.totalAmount}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: 24 }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Bill Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>Generate itemized bills for customers</li>
                <li>Process multiple payment methods</li>
                <li>Track daily, weekly, and monthly revenue</li>
                <li>Generate financial reports and analytics</li>
                <li>Manage discounts and promotions</li>
              </ul>
            </div>
          </div>
        );

      case 'tables':
        return (
          <div style={{ 
            padding: '30px', 
            backgroundColor: 'white', 
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#495057' }}>🪑 Tables & Reservations</h2>
            <p style={{ color: '#6c757d', marginBottom: '20px' }}>
              Manage table layouts, handle reservations, and optimize seating arrangements.
            </p>
            <button 
              onClick={handleTableManagement}
              style={{ 
                padding: '12px 24px', 
                backgroundColor: '#17a2b8', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              Open Table Management
            </button>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#495057' }}>Table Management Features</h3>
              <ul style={{ color: '#6c757d', lineHeight: '1.6' }}>
                <li>2D drag-and-drop table layout designer</li>
                <li>Multi-floor restaurant management</li>
                <li>Real-time table status tracking (available/occupied/reserved)</li>
                <li>Reservation management with customer details</li>
                <li>Table type customization (normal, VIP, outdoor, private)</li>
                <li>Seating capacity and party size management</li>
                <li>Visual status indicators with color coding</li>
              </ul>
            </div>
          </div>
        );

     
      case 'orderstatus':
        return (
          <div className="orderstatus-artistic-bg">
            <h2 className="orderstatus-artistic-title">Order Status</h2>
            {ordersLoading ? (
              <div className="orderstatus-artistic-loading">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="orderstatus-artistic-empty">No orders yet.</div>
            ) : (
              <div className="orderstatus-artistic-table-list">
                {[...new Set(orders.map(o => o.table))].map(tableNo => (
                  <div key={tableNo} className="orderstatus-artistic-table-card">
                    <div className="orderstatus-artistic-table-header">
                      <span className="orderstatus-artistic-table-label">Table {tableNo}</span>
                    </div>
                    <ul className="orderstatus-artistic-order-list">
                      {orders.filter(o => o.table === tableNo).map(order => (
                        <li key={order._id} className="orderstatus-artistic-order-item">
                          <span className="orderstatus-artistic-order-id">Order #{order._id.slice(-5)}</span>
                          <span className={`orderstatus-artistic-badge ${order.status==='paid'?'paid':'pending'}`}>{order.status==='paid'?'Paid':'Pending'}</span>
                          <ul className="orderstatus-artistic-items-list">
                            {order.items.map((item, i) => (
                              <li key={i} className="orderstatus-artistic-item-row">
                                <span className="orderstatus-artistic-item-name">{item.name}</span>
                                <span className="orderstatus-artistic-item-qty">x{item.quantity}</span>
                                {item.modifications && item.modifications.length > 0 && <span className="orderstatus-artistic-item-mods">{item.modifications.join(', ')}</span>}
                                <span className="orderstatus-artistic-item-price">{'\u20B9'} {item.price * item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="orderstatus-artistic-total">Total: {'\u20B9'} {order.totalAmount}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;700&display=swap');
              .orderstatus-artistic-bg {
                min-height: 100vh;
                width: 100vw;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                justify-content: flex-start;
                background: linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%);
                position: relative;
                overflow-x: hidden;
                font-family: 'DM Sans', sans-serif;
              }
              .orderstatus-artistic-bg:before {
                content: '';
                position: absolute;
                top: -120px; left: -120px; width: 520px; height: 380px;
                background: radial-gradient(circle at 30% 30%, #a78bfa 0%, #f472b6 100%);
                opacity: 0.13;
                filter: blur(12px);
                z-index: 0;
              }
              .orderstatus-artistic-bg:after {
                content: '';
                position: absolute;
                bottom: -100px; right: -100px; width: 520px; height: 380px;
                background: radial-gradient(circle at 70% 70%, #fbbf24 0%, #818cf8 100%);
                opacity: 0.11;
                filter: blur(16px);
                z-index: 0;
              }
              .orderstatus-artistic-title {
                font-family: 'Sora', sans-serif;
                font-weight: 700;
                font-size: 2.5rem;
                color: #232946;
                margin: 0 0 32px 0;
                padding: 48px 0 0 0;
                text-align: center;
                letter-spacing: 0.01em;
                z-index: 2;
                text-shadow: 0 2px 24px #818cf855;
              }
              .orderstatus-artistic-loading, .orderstatus-artistic-empty {
                color: #888;
                font-size: 1.18rem;
                text-align: center;
                margin-top: 60px;
                z-index: 2;
              }
              .orderstatus-artistic-table-list {
                display: flex;
                flex-direction: column;
                gap: 38px;
                width: 100vw;
                max-width: 100vw;
                padding: 0 0 60px 0;
                z-index: 2;
              }
              .orderstatus-artistic-table-card {
                background: rgba(255,255,255,0.92);
                border-radius: 32px 18px 32px 18px;
                box-shadow: 0 8px 40px #6366f122, 0 2px 12px #818cf822;
                padding: 36px 32px 28px 32px;
                border: 1.5px solid #e0e7ff;
                margin: 0;
                width: 100vw;
                max-width: 100vw;
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px) saturate(1.2);
                transition: box-shadow 0.2s, transform 0.2s;
              }
              .orderstatus-artistic-table-card:hover {
                box-shadow: 0 12px 48px #818cf822, 0 1.5px 8px #fbbf2422;
                transform: translateY(-4px) scale(1.02);
              }              .orderstatus-artistic-table-header {
                display: flex;
                align-items: center;
                gap: 18px;
                margin-bottom: 18px;
              }
              .orderstatus-artistic-table-label {
                font-weight: 700;
                font-size: 1.35rem;
                color: #6366f1;
                font-family: 'Sora', sans-serif;
                letter-spacing: 0.01em;
                text-shadow: 0 2px 24px #818cf855;
              }
              .orderstatus-artistic-order-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 22px;
              }
              .orderstatus-artistic-order-item {
                background: rgba(224,231,255,0.44);
                border-radius: 18px;
                box-shadow: 0 2px 12px #6366f122;
                padding: 18px 18px 14px 18px;
                border: 1px solid #e0e7ff;
                margin-bottom: 0;
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .orderstatus-artistic-order-id {
                font-weight: 600;
                font-size: 1.08rem;
                color: #232946;
                font-family: 'Sora', sans-serif;
                margin-bottom: 2px;
              }
              .orderstatus-artistic-badge {
                font-weight: 700;
                margin-left: 12px;
                padding: 4px 18px;
                border-radius: 16px;
                font-size: 1.01rem;
                vertical-align: middle;
                background: linear-gradient(90deg,#818cf8,#f472b6);
                color: #fff;
                box-shadow: 0 2px 12px #818cf144;
                display: inline-block;
                animation: badgePulse 1.8s infinite alternate cubic-bezier(.77,0,.18,1);
                letter-spacing: 0.01em;
                border: none;
                transition: background 0.18s, color 0.18s;
              }
              .orderstatus-artistic-badge.paid {
                background: linear-gradient(90deg,#22c55e,#a7f3d0);
                color: #fff;
                animation: badgePulsePaid 2.2s infinite alternate cubic-bezier(.77,0,.18,1);
              }
              .orderstatus-artistic-badge.pending {
                background: linear-gradient(90deg,#fbbf24,#f472b6);
                color: #fff;
                animation: badgePulsePending 1.2s infinite alternate cubic-bezier(.77,0,.18,1);
              }
              @keyframes badgePulse {
                0% { box-shadow: 0 2px 12px #818cf144; }
                100% { box-shadow: 0 4px 24px #f472b644; }
              }
              @keyframes badgePulsePaid {
                0% { box-shadow: 0 2px 12px #22c55e44; }
                100% { box-shadow: 0 4px 24px #a7f3d044; }
              }
              @keyframes badgePulsePending {
                0% { box-shadow: 0 2px 12px #fbbf2444; }
                100% { box-shadow: 0 4px 24px #f472b644; }
              }
              .orderstatus-artistic-items-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 6px;
              }
              .orderstatus-artistic-item-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 10px;
                font-size: 1.01rem;
                font-family: 'DM Sans', sans-serif;
              }
              .orderstatus-artistic-item-name {
                font-weight: 600;
                color: #232946;
              }
              .orderstatus-artistic-item-qty {
                color: #6366f1;
                font-weight: 700;
                margin-left: 2px;
              }
              .orderstatus-artistic-item-mods {
                color: #888;
                font-size: 0.98rem;
                font-style: italic;
                margin-left: 2px;
              }
              .orderstatus-artistic-item-price {
                color: #fbbf24;
                font-weight: 700;
                margin-left: 8px;
              }
              .orderstatus-artistic-total {
                color: #fbbf24;
                font-weight: 700;
                margin-top: 8px;
                font-size: 1.09rem;
                text-align: right;
              }
              @media (max-width: 900px) {
                .orderstatus-artistic-table-card {
                  padding: 18px 6px 14px 6px;
                  border-radius: 18px;
                }
                .orderstatus-artistic-title {
                  font-size: 1.5rem;
                  padding-top: 24px;
                }
              }
              @media (max-width: 600px) {
                .orderstatus-artistic-table-header {
                  font-size: 1.05rem;
                  padding: 10px 6px 8px 6px;
                }
                .orderstatus-artistic-order-list {
                  gap: 10px;
                }
                .orderstatus-artistic-order-item {
                  padding: 10px 4px 8px 4px;
                  border-radius: 10px;
                }
              }
            `}</style>
          </div>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      flexDirection: 'row',
    }}>
      {/* Sidebar */}
      <div className="manager-sidebar">
        {/* Header */}
        <div className="manager-sidebar-header">
          {!sidebarCollapsed && (
            <h3 className="manager-sidebar-title">{restaurantName}</h3>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="manager-sidebar-collapse"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        {/* Navigation Items */}
        <nav className="manager-sidebar-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.id}
              className={`manager-sidebar-item${activePage === item.id ? ' manager-sidebar-item-active' : ''}`}
              onClick={() => handlePageChange(item.id)}
            >
              <span className="manager-sidebar-icon">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="manager-sidebar-label">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
        {/* Logout Button */}
        <div className="manager-sidebar-logout-wrap">
          <button
            onClick={handleLogout}
            className="manager-sidebar-logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div
        className="main-content"
        style={{
          marginLeft: sidebarCollapsed ? '60px' : '180px',
          flex: 1,
          transition: 'margin-left 0.3s ease',
          padding: activePage === 'tables' || activePage === 'inventory' || activePage === 'dashboard' ? 0 : '20px',
          minHeight: '100vh',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Notification Popup (always visible on all pages) */}
        {orderNotification && (
          <div style={{
            position: 'fixed',
            top: 32,
            right: 32,
            zIndex: 2000,
            borderRadius: 16,
            boxShadow: '0 4px 24px #22c55e22',
            padding: '18px 28px 18px 18px',
            display: 'flex',
            alignItems: 'center',
            minWidth: 240,
            maxWidth: 320,
            border: 'none',
            fontFamily: 'Sora, DM Sans, sans-serif',
            animation: 'fadeInPop 0.4s',
            transition: 'all 0.2s',
            overflow: 'hidden',
            background: '#fff',
            boxSizing: 'border-box',
          }}>
            {/* Battery effect: animated green fill as background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${Math.round(orderNotificationProgress * 100)}%`,
              background: 'linear-gradient(90deg,#e0fce6 0%,#22c55e 100%)',
              borderRadius: 16,
              zIndex: 0,
              transition: 'width 0.2s',
              pointerEvents: 'none',
            }} />
            {orderNotification.waiterImage && (
              <img src={orderNotification.waiterImage} alt="Waiter" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 14, border: '2px solid #fff', boxShadow: '0 1px 6px #22c55e33', zIndex: 1 }} />
            )}
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ fontWeight: 700, color: '#134e1e', fontSize: 16, marginBottom: 2, letterSpacing: 0.2 }}>Waiter: {orderNotification.waiter}</div>
            <div style={{ color: '#065f46', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Table <span style={{color:'#22c55e'}}>{orderNotification.table}</span></div>
            <div style={{ color: '#232946', fontSize: 13, margin: '2px 0 0 0', fontWeight: 600 }}>Order: <span style={{color:'#065f46'}}>{orderNotification.dishes}</span></div>
            </div>
            {orderNotification.dishImage && (
              <img src={orderNotification.dishImage} alt="Dish" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', marginLeft: 10, border: '2px solid #fbbf24', boxShadow: '0 1px 6px #fbbf2433', zIndex: 1 }} />
            )}
            <style>{`
              @keyframes fadeInPop {
                0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
          </div>
        )}
        {/* Artistic Toggle Slider for Orders/Kitchen */}
        {renderArtisticToggleSlider()}
        {/* Page Header */}
        {activePage !== 'tables' && activePage !== 'inventory' && activePage !== 'dashboard' && activePage !== 'orders' && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '10px',
            border: '1px solid #dee2e6',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: '0 0 5px 0', color: '#495057' }}>
                  {sidebarItems.find(item => item.id === activePage)?.label}
                </h1>
                <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
                  {restaurantName} - Manager Dashboard
                </p>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: sidebarItems.find(item => item.id === activePage)?.color || '#007bff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}>
                <div style={{ transform: 'scale(0.8)' }}>
                  {sidebarItems.find(item => item.id === activePage)?.icon}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Page Content */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          {activePage === 'inventory' ? <InventoryManagement highlightedItem={highlightedInventoryItems} refreshKey={inventoryRefreshKey} /> : renderPageContent()}
        </div>
        {/* WhatsApp Integration Toggle */}
        <div style={{ marginTop: 24, marginBottom: 18, background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #6366f122', padding: 24, minWidth: 320, maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#232946', marginBottom: 6 }}>WhatsApp Integration</div>
          <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleEnableWhatsapp}
              disabled={whatsappLoading}
              style={{
                background: whatsappLoading ? '#a5b4fc' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: whatsappLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {whatsappLoading ? 'Enabling…' : 'Enable WhatsApp'}
            </button>
            <button
              onClick={handleDisableWhatsapp}
              disabled={whatsappLoading}
              style={{
                background: whatsappLoading ? '#e5e7eb' : '#111827',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 15,
                cursor: whatsappLoading ? 'not-allowed' : 'pointer'
              }}
            >
              Disable
            </button>
          </div>
          {whatsappLoggedIn ? (
            <>
              <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 8 }}>Logged in</div>
              <button onClick={handleLogoutWhatsapp} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Logout WhatsApp</button>
            </>
          ) : (
            <>
              {whatsappQrImage && (
                <div style={{ margin: '12px 0', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: 6 }}>Scan this QR with WhatsApp:</div>
                  <img src={whatsappQrImage} alt="WhatsApp QR" style={{ width: 220, height: 220, borderRadius: 16, border: '2px solid #6366f1', background: '#fff' }} />
                  <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device</div>
                </div>
              )}
              <button onClick={handleLogoutWhatsapp} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 12 }}>Logout WhatsApp</button>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <input type="text" placeholder="Your WhatsApp phone (91xxxxxxxxxx)" value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1.5px solid #e0e7ff', fontSize: 15 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <input type="text" placeholder="Test message" value={testMsg} onChange={e => setTestMsg(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1.5px solid #e0e7ff', fontSize: 15 }} />
            <button onClick={handleSendTestMsg} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Send Test</button>
          </div>
          {testMsgResult && <div style={{ color: testMsgResult.startsWith('Failed') ? '#dc2626' : '#22c55e', fontWeight: 600 }}>{testMsgResult}</div>}
          <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Click Enable to generate a QR code. Scan with your WhatsApp app. Use your phone number above for test messages.<br />For group/announcement/chat features, ask the bot in WhatsApp after enabling.</div>
        </div>
      </div>
      {/* Voice Assistant Floating Button */}
      {/* Urgent orders notification bell (fixed) */}
      {restaurantId ? <NotificationBell restaurantId={restaurantId} /> : null}

      {/* Global Add Dish Modal */}
      <Modal isOpen={showAddDish} onClose={() => setShowAddDish(false)} size="lg" motionPreset="scale">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="16px" borderWidth="1px" borderColor="blackAlpha.200">
          <ModalHeader fontWeight={700}>Add dish</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Dish name</FormLabel>
                <Input value={addDishForm.name} onChange={(e) => setAddDishForm({ ...addDishForm, name: e.target.value })} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea value={addDishForm.description} onChange={(e) => setAddDishForm({ ...addDishForm, description: e.target.value })} rows={3} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Ingredients (comma-separated)</FormLabel>
                <Input value={addDishForm.ingredients} onChange={(e) => setAddDishForm({ ...addDishForm, ingredients: e.target.value })} />
              </FormControl>

              <HStack spacing={4} align="start">
                <FormControl isRequired>
                  <FormLabel>Price</FormLabel>
                  <NumberInput min={0} precision={2}>
                    <NumberInputField value={addDishForm.price} onChange={(e) => setAddDishForm({ ...addDishForm, price: e.target.value })} />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Category</FormLabel>
                  <Input value={addDishForm.category} onChange={(e) => setAddDishForm({ ...addDishForm, category: e.target.value })} />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Dietary info (comma-separated)</FormLabel>
                <Input value={addDishForm.dietary} onChange={(e) => setAddDishForm({ ...addDishForm, dietary: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel>Image URL</FormLabel>
                <Input value={addDishForm.image} onChange={(e) => setAddDishForm({ ...addDishForm, image: e.target.value })} />
              </FormControl>

              {dishError ? (
                <Text color="red.500" fontSize="sm">
                  {dishError}
                </Text>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="softOutline" mr={3} onClick={() => setShowAddDish(false)}>
              Cancel
            </Button>
            <Button variant="terracotta" isLoading={dishLoading} onClick={handleAddDish}>
              Add dish
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Global New Order Modal */}
      <Modal isOpen={showAddOrder} onClose={() => setShowAddOrder(false)} size="xl" motionPreset="scale">
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="16px" borderWidth="1px" borderColor="blackAlpha.200">
          <ModalHeader fontWeight={700}>New order</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Table</FormLabel>
                <Input value={addOrderForm.table} onChange={(e) => setAddOrderForm({ ...addOrderForm, table: e.target.value })} />
              </FormControl>

              <HStack justify="space-between">
                <Text fontWeight={700}>Items</Text>
                <Button variant="softOutline" size="sm" onClick={handleAddOrderItem}>
                  Add item
                </Button>
              </HStack>

              <VStack spacing={3} align="stretch">
                {orderItems.map((item, idx) => (
                  <Card key={idx} borderWidth="1px" borderColor="blackAlpha.200" borderRadius="14px">
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                        <FormControl isRequired>
                          <FormLabel>Dish</FormLabel>
                          <Select
                            placeholder={dishLoading ? 'Loading dishes…' : 'Select dish'}
                            value={item.dishId}
                            onChange={(e) => handleOrderItemChange(idx, 'dishId', e.target.value)}
                          >
                            {dishes.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Qty</FormLabel>
                          <NumberInput min={1} value={item.quantity} onChange={(v) => handleOrderItemChange(idx, 'quantity', Number(v))}>
                            <NumberInputField />
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Modifications</FormLabel>
                          <Input
                            placeholder="e.g., less spicy, no onion"
                            value={item.modifications}
                            onChange={(e) => handleOrderItemChange(idx, 'modifications', e.target.value)}
                          />
                        </FormControl>
                      </SimpleGrid>

                      <HStack justify="flex-end" mt={3}>
                        <Button variant="softOutline" size="sm" onClick={() => handleRemoveOrderItem(idx)}>
                          Remove
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>

              {orderError ? (
                <Text color="red.500" fontSize="sm">
                  {orderError}
                </Text>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="softOutline" mr={3} onClick={() => setShowAddOrder(false)}>
              Cancel
            </Button>
            <Button variant="dark" isLoading={orderLoading} onClick={handleAddOrder}>
              Create order
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VoiceAssistant onCommand={handleVoiceCommand} />
      <style>{`
        @media (max-width: 900px) {
          .main-content {
            margin-left: 60px !important;
          }
        }
        @media (max-width: 600px) {
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            min-height: calc(100vh - 60px) !important;
          }
          .manager-sidebar {
            position: fixed !important;
            left: 0 !important;
            bottom: 0 !important;
            top: auto !important;
            width: 100vw !important;
            height: 60px !important;
            min-width: 0 !important;
            max-height: 60px !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2000 !important;
            border-radius: 0 !important;
            box-shadow: 0 -2px 16px #b91c1c33 !important;
          }
        }
      `}</style>
    </div>
  );
} 
