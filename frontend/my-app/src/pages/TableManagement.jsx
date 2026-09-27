import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  Box, Flex, Grid, GridItem, Text, Heading, Button, IconButton,
  Input, Select, Textarea, Spinner, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, FormErrorMessage, FormHelperText,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Alert, AlertIcon, AlertDescription, CloseButton,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  VStack, HStack,
  extendTheme, ChakraProvider, Divider,
} from '@chakra-ui/react';

// ─── THEME ────────────────────────────────────────────────────────────────────
const theme = extendTheme({
  fonts: {
    heading: `'Playfair Display', 'Georgia', serif`,
    body:    `'DM Sans', 'Helvetica Neue', sans-serif`,
  },
  styles: {
    global: {
      'html, body': { bg: '#FAFAF8', color: '#2C2C2C', fontFamily: `'DM Sans', 'Helvetica Neue', sans-serif` },
      '::selection': { bg: '#EAC89A', color: '#4A2A0E' },
      '@import': "url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap')",
    },
  },
  components: {
    Button: {
      baseStyle: { fontFamily: `'DM Sans', sans-serif`, fontWeight: '500', borderRadius: '8px', letterSpacing: '0.01em' },
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
          bg: 'transparent', color: '#6C757D', border: '1.5px solid #DEE2E6',
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
        header: { fontFamily: `'Playfair Display', serif`, fontWeight: '600', fontSize: '19px', color: '#2C2C2C', pb: '0' },
        overlay: { bg: 'rgba(44,44,44,0.4)', backdropFilter: 'blur(5px)' },
      },
    },
  },
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  available:   { bg: '#EBF7F2', border: '#3D9970', text: '#2A7A5A', dot: '#3D9970', label: 'Available'   },
  occupied:    { bg: '#FAEAEA', border: '#C0392B', text: '#922B21', dot: '#C0392B', label: 'Occupied'    },
  reserved:    { bg: '#FDF2EA', border: '#E07B39', text: '#B85E28', dot: '#E07B39', label: 'Reserved'    },
  maintenance: { bg: '#F4F2F5', border: '#9B8EA0', text: '#6B5E72', dot: '#9B8EA0', label: 'Maintenance' },
};

const RES_STATUS_CFG = {
  pending:   { color: '#E07B39', bg: '#FDF2EA' },
  confirmed: { color: '#3D9970', bg: '#EBF7F2' },
  seated:    { color: '#2980B9', bg: '#EBF5FB' },
  completed: { color: '#6C757D', bg: '#F1F3F5' },
  cancelled: { color: '#C0392B', bg: '#FAEAEA' },
  'no-show': { color: '#9B8EA0', bg: '#F4F2F5' },
};

const TABLE_TYPE_ICON = { normal: '⬜', vip: '⭐', outdoor: '🌿', private: '🔒' };

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_TABLES = [
  { tableId: 't1', tableNumber: 'T1', tableType: 'normal',  seats: 4, width: 88,  height: 88,  floor: 'Ground Floor', floorIndex: 0, position: { x: 50,  y: 50  }, status: 'available',   notes: '' },
  { tableId: 't2', tableNumber: 'T2', tableType: 'vip',     seats: 6, width: 110, height: 90,  floor: 'Ground Floor', floorIndex: 0, position: { x: 200, y: 50  }, status: 'occupied',    notes: 'Window seat', currentReservation: { reservationId: 'r1', customerName: 'Arjun Mehta', customerPhone: '+91 98765 43210', partySize: 4, reservationTime: '19:00', expectedDuration: 90, notes: '' } },
  { tableId: 't3', tableNumber: 'T3', tableType: 'normal',  seats: 2, width: 72,  height: 72,  floor: 'Ground Floor', floorIndex: 0, position: { x: 370, y: 55  }, status: 'reserved',    notes: '' },
  { tableId: 't4', tableNumber: 'T4', tableType: 'private', seats: 8, width: 128, height: 98,  floor: 'Ground Floor', floorIndex: 0, position: { x: 55,  y: 210 }, status: 'available',   notes: 'Private dining room' },
  { tableId: 't5', tableNumber: 'T5', tableType: 'outdoor', seats: 4, width: 88,  height: 88,  floor: 'Ground Floor', floorIndex: 0, position: { x: 250, y: 210 }, status: 'maintenance', notes: 'Chair repair' },
  { tableId: 't6', tableNumber: 'B1', tableType: 'normal',  seats: 4, width: 88,  height: 88,  floor: 'Terrace',      floorIndex: 1, position: { x: 70,  y: 70  }, status: 'available',   notes: '' },
  { tableId: 't7', tableNumber: 'B2', tableType: 'vip',     seats: 6, width: 110, height: 88,  floor: 'Terrace',      floorIndex: 1, position: { x: 240, y: 70  }, status: 'reserved',    notes: '' },
];

const MOCK_RESERVATIONS = [
  { _id: 'r1', tableId: 't2', customerName: 'Arjun Mehta',  customerPhone: '+91 98765 43210', customerEmail: 'arjun@mail.com', partySize: 4, reservationDate: new Date().toISOString().split('T')[0], reservationTime: '19:00', duration: 90,  status: 'seated',    specialRequests: 'Window table preferred' },
  { _id: 'r2', tableId: 't3', customerName: 'Priya Sharma', customerPhone: '+91 99001 12233', customerEmail: 'priya@mail.com', partySize: 2, reservationDate: new Date().toISOString().split('T')[0], reservationTime: '20:30', duration: 60,  status: 'confirmed', specialRequests: '' },
  { _id: 'r3', tableId: 't7', customerName: 'Rohan Kapoor', customerPhone: '+91 88776 55443', customerEmail: '',              partySize: 5, reservationDate: new Date().toISOString().split('T')[0], reservationTime: '21:00', duration: 120, status: 'pending',   specialRequests: 'Birthday — cake arrangement needed' },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.available;
  return (
    <Flex align="center" gap="6px" display="inline-flex">
      <Box w="7px" h="7px" borderRadius="full" bg={cfg.dot} flexShrink={0} />
      <Text fontSize="12px" fontWeight="500" color={cfg.text} fontFamily="'DM Sans', sans-serif">
        {cfg.label}
      </Text>
    </Flex>
  );
}

function ResBadge({ status }) {
  const cfg = RES_STATUS_CFG[status] || RES_STATUS_CFG.pending;
  return (
    <Box px="9px" py="3px" borderRadius="20px" bg={cfg.bg} display="inline-block">
      <Text fontSize="10px" fontWeight="700" color={cfg.color} textTransform="uppercase" letterSpacing="0.07em">
        {status}
      </Text>
    </Box>
  );
}

function KPICard({ icon, value, label, sub, accent }) {
  return (
    <Box
      bg="white" borderRadius="14px" border="1.5px solid #F1F3F5"
      p="18px 22px" position="relative" overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
      transition="all 0.2s ease"
      _hover={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }}
    >
      <Box position="absolute" top={0} right={0} w="72px" h="72px"
        borderRadius="0 14px 0 72px" bg={accent || '#FAF0E4'} opacity="0.55" />
      <Flex align="flex-start" gap="12px">
        <Text fontSize="20px" lineHeight="1" mt="3px">{icon}</Text>
        <Box>
          <Text fontSize="26px" fontWeight="700" lineHeight="1.1" fontFamily="'Playfair Display', serif" color="#2C2C2C">{value}</Text>
          <Text fontSize="12px" fontWeight="500" color="#6C757D" mt="3px">{label}</Text>
          {sub && <Text fontSize="11px" color="#ADB5BD" mt="2px">{sub}</Text>}
        </Box>
      </Flex>
    </Box>
  );
}

function FieldRow({ label, error, required, helper, children }) {
  return (
    <FormControl isInvalid={!!error} mb="14px">
      <FormLabel fontSize="11px" fontWeight="700" color="#495057" textTransform="uppercase" letterSpacing="0.07em" mb="5px" fontFamily="'DM Sans', sans-serif">
        {label}{required && <Text as="span" color="#C0392B" ml="1px">*</Text>}
      </FormLabel>
      {children}
      {error && <FormErrorMessage fontSize="11px" mt="3px">{error}</FormErrorMessage>}
      {helper && !error && <FormHelperText fontSize="10px" color="#ADB5BD" mt="3px">{helper}</FormHelperText>}
    </FormControl>
  );
}

const inputStyles = {
  h: '38px', fontSize: '13px', fontFamily: `'DM Sans', sans-serif`,
  bg: 'white', border: '1.5px solid #DEE2E6', borderRadius: '8px', color: '#2C2C2C',
  _focus: { borderColor: '#C4893A', boxShadow: '0 0 0 3px rgba(196,137,58,0.12)', bg: 'white' },
  _placeholder: { color: '#BDC3C7' },
  transition: 'all 0.15s',
};

const textareaStyles = {
  fontSize: '13px', fontFamily: `'DM Sans', sans-serif`,
  bg: 'white', border: '1.5px solid #DEE2E6', borderRadius: '8px', color: '#2C2C2C',
  _focus: { borderColor: '#C4893A', boxShadow: '0 0 0 3px rgba(196,137,58,0.12)', bg: 'white' },
  _placeholder: { color: '#BDC3C7' },
};

const numFieldStyles = {
  h: '38px', fontSize: '13px', fontFamily: `'DM Sans', sans-serif`,
  border: '1.5px solid #DEE2E6', borderRadius: '8px',
  _focus: { borderColor: '#C4893A', boxShadow: '0 0 0 3px rgba(196,137,58,0.12)' },
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function TableManagementInner() {
  const API_URL = API_BASE_URL;
  const toast = useToast();
  const navigate = useNavigate();

  // Core state
  const [restaurantId, setRestaurantId] = useState(null);
  const [layout, setLayout]   = useState({ floors: 2, floorNames: ['Ground Floor', 'Terrace'], canvasWidth: 760, canvasHeight: 460 });
  const [tables, setTables]   = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const initialSelectedDateRef = useRef(selectedDate);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState('');

  // Drag
  const [isDragging, setIsDragging]         = useState(false);
  const [draggedTable, setDraggedTable]     = useState(null);
  const [isEditMode, setIsEditMode]         = useState(false);
  const [editingTableId, setEditingTableId] = useState(null);
  const [hasUnsaved, setHasUnsaved]         = useState(false);
  const [savingLayout, setSavingLayout]     = useState(false);

  // Selected panel
  const [selectedTable, setSelectedTable] = useState(null);
  const [editPos, setEditPos]             = useState({ x: 0, y: 0 });

  // Modals
  const addModal   = useDisclosure();
  const editModal  = useDisclosure();
  const resModal   = useDisclosure();
  const floorModal = useDisclosure();

  // Forms
  const blankTable = { tableNumber: '', tableType: 'normal', seats: 4, width: 88, height: 88, notes: '' };
  const blankRes   = { customerName: '', customerPhone: '', customerEmail: '', partySize: 2, reservationDate: new Date().toISOString().split('T')[0], reservationTime: '19:00', duration: 120, specialRequests: '' };

  const [tableForm, setTableForm]       = useState(blankTable);
  const [tableFormErr, setTableFormErr] = useState({});
  const [editTableForm, setEditTableForm] = useState(blankTable);
  const [editTableErr, setEditTableErr]   = useState({});
  const [tableLoading, setTableLoading]   = useState(false);

  const [resForm, setResForm]       = useState(blankRes);
  const [resFormErr, setResFormErr] = useState({});
  const [resLoading, setResLoading] = useState(false);

  const [newFloorName, setNewFloorName] = useState('');
  const [floorErr, setFloorErr]         = useState('');

  const canvasRef = useRef(null);

  // Stats
  const stats = {
    total:        tables.length,
    available:    tables.filter(t => t.status === 'available').length,
    occupied:     tables.filter(t => t.status === 'occupied').length,
    reserved:     tables.filter(t => t.status === 'reserved').length,
    totalSeats:   tables.reduce((s, t) => s + (t.seats || 0), 0),
    reservations: reservations.length,
  };

  const ok = useCallback(
    (msg) => toast({ title: msg, status: 'success', duration: 3000, isClosable: true, position: 'top-right' }),
    [toast]
  );
  const err = useCallback(
    (msg) => toast({ title: 'Error', description: msg, status: 'error', duration: 4000, isClosable: true, position: 'top-right' }),
    [toast]
  );

  const getAuthConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please sign in to continue.');
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const getErrMsg = useCallback((e, fallback) => {
    return (
      e?.response?.data?.error ||
      e?.response?.data?.message ||
      e?.message ||
      fallback ||
      'Something went wrong.'
    );
  }, []);

  const syncSelectedTable = useCallback((nextTables) => {
    setSelectedTable((prev) => {
      if (!prev?.tableId) return prev;
      return nextTables.find((t) => t.tableId === prev.tableId) || null;
    });
  }, []);

  const loadFromApi = useCallback(async ({ restaurantId: rid, date }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please sign in to continue.');
    }
    const headers = { Authorization: `Bearer ${token}` };

    const [layoutRes, statusRes] = await Promise.all([
      axios.get(`${API_URL}/api/tables/layout/${rid}`, { headers }),
      axios.get(`${API_URL}/api/tables/tables/${rid}/status`, { headers, params: { date } }),
    ]);

    const nextLayout = layoutRes?.data?.layout;
    if (nextLayout) {
      setLayout((prev) => ({
        ...prev,
        ...nextLayout,
        floorNames: Array.isArray(nextLayout.floorNames) && nextLayout.floorNames.length ? nextLayout.floorNames : prev.floorNames,
      }));
    }

    const nextTables = statusRes?.data?.tables || layoutRes?.data?.tables || [];
    const nextReservations = statusRes?.data?.reservations || [];

    setTables(nextTables);
    setReservations(nextReservations);
    syncSelectedTable(nextTables);
  }, [API_URL, syncSelectedTable]);

  // ── Init (dynamic fetch) ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setGlobalError('');
      setLoading(true);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          const message = 'Please sign in to manage tables.';
          if (!cancelled) {
            setGlobalError(message);
            setLoading(false);
          }
          err(message);
          navigate('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        // Get restaurantId from the authenticated user
        const meRes = await axios.get(`${API_URL}/api/auth/me`, { headers });
        const rid =
          meRes?.data?.user?.restaurant?._id ||
          meRes?.data?.user?.restaurantId ||
          meRes?.data?.restaurantId ||
          '';

        const initDate = initialSelectedDateRef.current;

        if (!rid) {
          // Fallback: pick the first restaurant (debug endpoint)
          const restaurantsRes = await axios.get(`${API_URL}/api/tables/restaurants`, { headers });
          const fallbackRid = restaurantsRes?.data?.restaurants?.[0]?.id || '';
          if (!fallbackRid) {
            throw new Error('No restaurant found for this account.');
          }
          if (!cancelled) setRestaurantId(fallbackRid);
          if (!cancelled) await loadFromApi({ restaurantId: fallbackRid, date: initDate });
        } else {
          if (!cancelled) setRestaurantId(rid);
          if (!cancelled) await loadFromApi({ restaurantId: rid, date: initDate });
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        const message = e?.response?.data?.error || e?.message || 'Failed to load tables.';
        if (!cancelled) {
          setGlobalError(message);
          setTables([]);
          setReservations([]);
          setLoading(false);
        }
        err(message);
        if (String(message).toLowerCase().includes('sign in')) {
          navigate('/login');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [API_URL, err, loadFromApi, navigate]);

  // Refresh status/reservations when date changes
  useEffect(() => {
    if (!restaurantId || loading) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        await loadFromApi({ restaurantId, date: selectedDate });
      } catch (e) {
        const message = e?.response?.data?.error || e?.message || 'Failed to refresh table status.';
        if (!cancelled) err(message);
      }
    };

    refresh();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, selectedDate, loading, loadFromApi, err]);

  // ── Validation ──
  const validateTable = (f, excludeId) => {
    const e = {};
    if (!f.tableNumber?.trim()) e.tableNumber = 'Table number is required';
    else if (tables.some(t => t.tableNumber === f.tableNumber.trim() && t.tableId !== excludeId)) e.tableNumber = 'Table number already exists';
    if (!f.seats || f.seats < 1) e.seats = 'At least 1 seat required';
    if (f.seats > 20) e.seats = 'Maximum 20 seats';
    if (f.width < 40 || f.width > 200) e.width = '40–200 px allowed';
    if (f.height < 40 || f.height > 200) e.height = '40–200 px allowed';
    return e;
  };

  const validateRes = (f) => {
    const e = {};
    if (!f.customerName?.trim()) e.customerName = 'Guest name is required';
    if (!f.customerPhone?.trim()) e.customerPhone = 'Phone is required';
    else if (!/^\+?[\d\s\-(). ]{7,18}$/.test(f.customerPhone.trim())) e.customerPhone = 'Enter a valid phone number';
    if (f.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.customerEmail)) e.customerEmail = 'Invalid email address';
    if (!f.partySize || f.partySize < 1) e.partySize = 'At least 1 guest';
    if (selectedTable && f.partySize > selectedTable.seats) e.partySize = `Exceeds table capacity (${selectedTable.seats})`;
    if (!f.reservationDate) e.reservationDate = 'Date required';
    if (!f.reservationTime) e.reservationTime = 'Time required';
    return e;
  };

  // ── Handlers ──
  const handleAddTable = async () => {
    const e = validateTable(tableForm, null);
    if (Object.keys(e).length) { setTableFormErr(e); return; }
    setTableLoading(true);
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      const cfg = getAuthConfig();
      const payload = {
        tableNumber: tableForm.tableNumber.trim(),
        tableType: tableForm.tableType,
        seats: Number(tableForm.seats),
        width: Number(tableForm.width),
        height: Number(tableForm.height),
        notes: tableForm.notes || '',
        floor: layout.floorNames[currentFloor],
        floorIndex: currentFloor,
        position: { x: 100, y: 100 },
      };
      await axios.post(`${API_URL}/api/tables/tables/${restaurantId}`, payload, cfg);

      await loadFromApi({ restaurantId, date: selectedDate });
      setTableForm(blankTable); setTableFormErr({});
      addModal.onClose(); ok(`Table ${payload.tableNumber} added`);
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to add table'));
    }
    finally { setTableLoading(false); }
  };

  const handleEditTable = async () => {
    const e = validateTable(editTableForm, selectedTable?.tableId);
    if (Object.keys(e).length) { setEditTableErr(e); return; }
    setTableLoading(true);
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      if (!selectedTable?.tableId) throw new Error('No table selected.');
      const cfg = getAuthConfig();
      const payload = {
        tableNumber: editTableForm.tableNumber.trim(),
        tableType: editTableForm.tableType,
        seats: Number(editTableForm.seats),
        width: Number(editTableForm.width),
        height: Number(editTableForm.height),
        notes: editTableForm.notes || '',
      };
      await axios.put(`${API_URL}/api/tables/tables/${restaurantId}/${selectedTable.tableId}`, payload, cfg);

      await loadFromApi({ restaurantId, date: selectedDate });
      editModal.onClose(); ok('Table updated');
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to update table'));
    }
    finally { setTableLoading(false); }
  };

  const handleDeleteTable = async (tableId, ev) => {
    ev?.stopPropagation();
    if (!window.confirm('Delete this table? This cannot be undone.')) return;
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      const cfg = getAuthConfig();
      await axios.delete(`${API_URL}/api/tables/tables/${restaurantId}/${tableId}`, cfg);

      await loadFromApi({ restaurantId, date: selectedDate });
      ok('Table deleted');
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to delete table'));
    }
  };

  const handleCreateRes = async () => {
    const e = validateRes(resForm);
    if (Object.keys(e).length) { setResFormErr(e); return; }
    setResLoading(true);
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      if (!selectedTable?.tableId) throw new Error('Please select a table first.');
      const cfg = getAuthConfig();
      const payload = {
        tableId: selectedTable.tableId,
        customerName: resForm.customerName?.trim(),
        customerPhone: resForm.customerPhone?.trim(),
        customerEmail: resForm.customerEmail?.trim() || '',
        partySize: Number(resForm.partySize),
        reservationDate: resForm.reservationDate,
        reservationTime: resForm.reservationTime,
        duration: Number(resForm.duration),
        specialRequests: resForm.specialRequests || '',
      };
      await axios.post(`${API_URL}/api/tables/reservations/${restaurantId}`, payload, cfg);

      await loadFromApi({ restaurantId, date: selectedDate });
      setResForm(blankRes); setResFormErr({});
      resModal.onClose(); ok(`Reservation for ${resForm.customerName} confirmed`);
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to create reservation'));
    }
    finally { setResLoading(false); }
  };

  const handleResStatus = async (id, status) => {
    try {
      const cfg = getAuthConfig();
      await axios.put(`${API_URL}/api/tables/reservations/${id}/status`, { status }, cfg);

      if (restaurantId) {
        await loadFromApi({ restaurantId, date: selectedDate });
      }
    } catch (ex) {
      err(getErrMsg(ex, 'Could not update status'));
    }
  };

  const handleSavePos = async () => {
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      if (!editingTableId) throw new Error('No table is being edited.');
      const t = tables.find(x => x.tableId === editingTableId);
      if (!t) throw new Error('Table not found.');
      const cfg = getAuthConfig();
      const payload = {
        position: t.position || { x: 0, y: 0 },
        floorIndex: t.floorIndex,
        floor: t.floor || layout.floorNames[t.floorIndex] || layout.floorNames[currentFloor],
      };
      await axios.put(`${API_URL}/api/tables/tables/${restaurantId}/${editingTableId}`, payload, cfg);

      await loadFromApi({ restaurantId, date: selectedDate });
      setHasUnsaved(false); setIsEditMode(false); setEditingTableId(null);
      ok('Position saved');
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to save position'));
    }
  };

  const handleSaveLayout = async () => {
    setSavingLayout(true);
    try {
      if (!restaurantId) throw new Error('Restaurant not loaded yet.');
      const cfg = getAuthConfig();
      const payload = {
        layout: {
          floors: Number(layout.floors),
          floorNames: layout.floorNames,
          canvasWidth: Number(layout.canvasWidth),
          canvasHeight: Number(layout.canvasHeight),
        },
      };
      await axios.put(`${API_URL}/api/tables/layout/${restaurantId}`, payload, cfg);

      // If there is a pending position edit, persist it too
      if (hasUnsaved && editingTableId) {
        const t = tables.find(x => x.tableId === editingTableId);
        if (t) {
          await axios.put(
            `${API_URL}/api/tables/tables/${restaurantId}/${editingTableId}`,
            {
              position: t.position || { x: 0, y: 0 },
              floorIndex: t.floorIndex,
              floor: t.floor || layout.floorNames[t.floorIndex] || layout.floorNames[currentFloor],
            },
            cfg
          );
        }
      }

      await loadFromApi({ restaurantId, date: selectedDate });
      setHasUnsaved(false);
      ok('Layout saved');
    } catch (ex) {
      err(getErrMsg(ex, 'Failed to save layout'));
    }
    finally { setSavingLayout(false); }
  };

  const handleAddFloor = () => {
    if (!newFloorName.trim()) { setFloorErr('Floor name is required'); return; }
    if (layout.floorNames.includes(newFloorName.trim())) { setFloorErr('Floor already exists'); return; }
    setLayout(p => ({ ...p, floorNames: [...p.floorNames, newFloorName.trim()], floors: p.floors + 1 }));
    setHasUnsaved(true);
    setNewFloorName(''); setFloorErr(''); ok(`"${newFloorName.trim()}" added`);
  };

  const handleRemoveFloor = (i) => {
    if (layout.floorNames.length === 1) { err('Cannot remove the only floor'); return; }
    const count = tables.filter(t => t.floorIndex === i).length;
    if (count) { err(`Move or delete ${count} table(s) first`); return; }
    if (!window.confirm(`Remove "${layout.floorNames[i]}"?`)) return;
    const names = layout.floorNames.filter((_, idx) => idx !== i);
    setLayout(p => ({ ...p, floorNames: names, floors: names.length }));
    if (currentFloor >= names.length) setCurrentFloor(names.length - 1);
    setHasUnsaved(true);
    ok('Floor removed');
  };

  // ── Drag ──
  const onMouseDown = (ev, table) => {
    if (ev.target.closest('[data-no-drag]')) return;
    if (!isEditMode || editingTableId !== table.tableId) return;
    ev.preventDefault();
    setIsDragging(true); setDraggedTable(table);
  };

  const onMouseMove = useCallback((ev) => {
    if (!isDragging || !draggedTable) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(ev.clientX - rect.left - draggedTable.width / 2, layout.canvasWidth - draggedTable.width)));
    const y = Math.round(Math.max(0, Math.min(ev.clientY - rect.top - draggedTable.height / 2, layout.canvasHeight - draggedTable.height)));
    setTables(p => p.map(t => t.tableId === draggedTable.tableId ? { ...t, position: { x, y } } : t));
    setEditPos({ x, y }); setHasUnsaved(true);
  }, [isDragging, draggedTable, layout.canvasWidth, layout.canvasHeight]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false); setDraggedTable(null);
  }, []);

  const onTableClick = (table) => {
    if (isDragging) return;
    setSelectedTable(table); setEditPos(table.position || { x: 0, y: 0 });
  };

  const onPosChange = (axis, val) => {
    const v = parseInt(val) || 0;
    const pos = { ...editPos, [axis]: v };
    setEditPos(pos);
    setTables(p => p.map(t => t.tableId === selectedTable?.tableId ? { ...t, position: pos } : t));
    setHasUnsaved(true);
  };

  const floorTables = tables.filter(t => t.floorIndex === currentFloor);

  // ── Loading ──
  if (loading) return (
    <Flex h="100vh" bg="#FAFAF8" align="center" justify="center" direction="column" gap="16px">
      <Spinner size="lg" color="#C4893A" thickness="3px" speed="0.85s" />
      <VStack gap="2px">
        <Text fontFamily="'Playfair Display', serif" fontSize="18px" fontWeight="600" color="#2C2C2C">Setting the table…</Text>
        <Text fontSize="12px" color="#ADB5BD">Loading your floor plan</Text>
      </VStack>
    </Flex>
  );

  return (
    <Box minH="100vh" bg="#FAFAF8">
      {/* Background pattern */}
      <Box position="fixed" inset="0" pointerEvents="none" zIndex={0} opacity="1"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #E8E8E4 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      {/* ── TOPBAR ── */}
      <Box
        position="sticky" top={0} zIndex={200}
        bg="rgba(250,250,248,0.94)" backdropFilter="blur(14px) saturate(160%)"
        borderBottom="1px solid #EAEAE6"
      >
        <Flex
          align="center" justify="space-between"
          h="60px" px={{ base: '16px', md: '32px', lg: '48px' }}
          maxW="1440px" mx="auto"
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
                Tables & Reservations
              </Text>
              <Text fontSize="10px" color="#ADB5BD" fontWeight="400" letterSpacing="0.02em">
                {layout.floorNames[currentFloor]} · {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </Box>
          </Flex>

          <HStack gap="8px" display={{ base: 'none', md: 'flex' }}>
            {hasUnsaved && (
              <Button variant="terracotta" size="sm" h="32px" px="14px" fontSize="12px"
                isLoading={savingLayout} onClick={handleSaveLayout}>
                Save Layout
              </Button>
            )}
            <Button variant="outline_soft" size="sm" h="32px" px="14px" fontSize="12px" onClick={floorModal.onOpen}>
              Floors
            </Button>
            <Button variant="solid_dark" size="sm" h="32px" px="16px" fontSize="12px"
              onClick={() => { setTableForm(blankTable); setTableFormErr({}); addModal.onOpen(); }}>
              + Add Table
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* ── BODY ── */}
      <Box maxW="1440px" mx="auto" px={{ base: '16px', md: '32px', lg: '48px' }} py="28px" position="relative" zIndex={1}>

        {/* Global error */}
        {globalError && (
          <Alert status="error" borderRadius="10px" mb="18px" bg="#FAEAEA" border="1px solid #F1AEAD" py="10px">
            <AlertIcon color="#C0392B" boxSize="16px" />
            <AlertDescription fontSize="13px" color="#922B21">{globalError}</AlertDescription>
            <CloseButton position="absolute" right="8px" top="8px" size="sm" onClick={() => setGlobalError('')} />
          </Alert>
        )}

        {/* ── KPI CARDS ── */}
        <Grid
          templateColumns={{ base: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', lg: 'repeat(5,1fr)' }}
          gap="12px" mb="24px"
        >
          <KPICard icon="▤" value={stats.total}        label="Total Tables"   sub={`${stats.totalSeats} total seats`} accent="#FAF0E4" />
          <KPICard icon="◎" value={stats.available}    label="Available"      sub={`${stats.total ? Math.round(stats.available/stats.total*100) : 0}% of floor`} accent="#EBF7F2" />
          <KPICard icon="◈" value={stats.occupied}     label="Occupied"       sub="In use right now" accent="#FAEAEA" />
          <KPICard icon="◇" value={stats.reserved}     label="Reserved"       sub="Upcoming seatings" accent="#FDF2EA" />
          <KPICard icon="≡" value={stats.reservations} label="Reservations"   sub="Selected date" accent="#EBF5FB" />
        </Grid>

        {/* ── CONTROLS ── */}
        <Flex gap="10px" mb="20px" align="center" wrap="wrap">
          {/* Floor switcher */}
          <HStack
            bg="white" borderRadius="10px" border="1.5px solid #EDEDE8"
            p="3px" spacing="1px"
          >
            {layout.floorNames.map((name, i) => (
              <Button
                key={i} size="sm" h="28px" px="14px" fontSize="12px"
                borderRadius="7px" border="none" fontFamily="'DM Sans', sans-serif"
                bg={currentFloor === i ? '#2C2C2C' : 'transparent'}
                color={currentFloor === i ? 'white' : '#6C757D'}
                fontWeight={currentFloor === i ? '600' : '400'}
                _hover={currentFloor === i ? {} : { bg: '#F1F3F5', color: '#2C2C2C' }}
                onClick={() => setCurrentFloor(i)}
                transition="all 0.15s"
              >
                {name}
              </Button>
            ))}
          </HStack>

          {/* Date */}
          <Input
            type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            {...inputStyles} w="155px"
          />

          {/* Legend */}
          <Flex gap="12px" align="center" ml="auto" display={{ base: 'none', md: 'flex' }} flexWrap="wrap">
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <Flex key={k} align="center" gap="5px">
                <Box w="6px" h="6px" borderRadius="full" bg={v.dot} />
                <Text fontSize="11px" color="#ADB5BD">{v.label}</Text>
              </Flex>
            ))}
          </Flex>
        </Flex>

        {/* ── CANVAS + DETAILS ── */}
        <Grid
          templateColumns={selectedTable ? { base: '1fr', xl: '1fr 320px' } : '1fr'}
          gap="18px" mb="20px" alignItems="start"
        >
          {/* Canvas card */}
          <Box bg="white" borderRadius="16px" border="1.5px solid #EDEDE8"
            boxShadow="0 2px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)" overflow="hidden">
            <Flex px="20px" py="12px" borderBottom="1px solid #F1F3F5" align="center" justify="space-between">
              <HStack gap="8px">
                <Text fontFamily="'Playfair Display', serif" fontSize="14px" fontWeight="600" color="#2C2C2C">
                  {layout.floorNames[currentFloor]}
                </Text>
                <Box px="7px" py="1px" bg="#F1F3F5" borderRadius="4px">
                  <Text fontSize="10px" color="#6C757D" fontWeight="600">{floorTables.length} tables</Text>
                </Box>
              </HStack>
              {isEditMode && (
                <HStack gap="6px">
                  <Button variant="terracotta" size="xs" h="26px" px="12px" fontSize="11px" onClick={handleSavePos}>
                    Save Position
                  </Button>
                  <Button variant="outline_soft" size="xs" h="26px" px="12px" fontSize="11px"
                    onClick={() => { setIsEditMode(false); setEditingTableId(null); setHasUnsaved(false); }}>
                    Cancel
                  </Button>
                </HStack>
              )}
            </Flex>

            <Box p="14px" overflowX="auto">
              <Box
                ref={canvasRef}
                position="relative"
                w={`${layout.canvasWidth}px`} h={`${layout.canvasHeight}px`}
                bg="#F8F9FA" borderRadius="10px" border="1.5px dashed #DEE2E6"
                mx="auto" maxW="100%"
                onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                cursor={isEditMode ? 'crosshair' : 'default'}
                style={{ backgroundImage: 'radial-gradient(circle, #D8DCE0 1px, transparent 1px)', backgroundSize: '26px 26px' }}
              >
                {floorTables.map((table) => {
                  const isEditing  = isEditMode && editingTableId === table.tableId;
                  const isSelected = selectedTable?.tableId === table.tableId;
                  const cfg = STATUS_CFG[table.status] || STATUS_CFG.available;

                  return (
                    <Box
                      key={table.tableId}
                      position="absolute"
                      left={`${table.position?.x || 0}px`}
                      top={`${table.position?.y || 0}px`}
                      w={`${table.width || 88}px`}
                      h={`${table.height || 88}px`}
                      bg={isEditing ? '#FFF3CD' : cfg.bg}
                      border={`2px solid ${isEditing ? '#F0A500' : isSelected ? '#2C2C2C' : cfg.border}`}
                      borderRadius="10px"
                      cursor={isEditing ? 'grab' : 'pointer'}
                      userSelect="none"
                      display="flex" flexDirection="column" alignItems="center" justifyContent="center"
                      boxShadow={isSelected
                        ? '0 0 0 3px rgba(44,44,44,0.14), 0 4px 16px rgba(0,0,0,0.1)'
                        : isEditing
                        ? '0 0 0 3px rgba(240,165,0,0.2), 0 4px 12px rgba(0,0,0,0.07)'
                        : '0 1px 4px rgba(0,0,0,0.06)'}
                      transition="box-shadow 0.15s, border-color 0.15s"
                      _hover={{ boxShadow: '0 4px 18px rgba(0,0,0,0.1)', zIndex: 10 }}
                      zIndex={isSelected || isEditing ? 20 : 1}
                      onMouseDown={ev => onMouseDown(ev, table)}
                      onClick={() => onTableClick(table)}
                    >
                      {/* Delete dot */}
                      {isSelected && (
                        <Box data-no-drag position="absolute" top="-8px" right="-8px"
                          w="17px" h="17px" bg="#C0392B" borderRadius="full"
                          display="flex" alignItems="center" justifyContent="center"
                          cursor="pointer" zIndex={30}
                          boxShadow="0 1px 4px rgba(0,0,0,0.2)"
                          onClick={ev => handleDeleteTable(table.tableId, ev)}
                        >
                          <Text fontSize="10px" color="white" fontWeight="700" lineHeight="1">×</Text>
                        </Box>
                      )}

                      <Text fontSize="16px" lineHeight="1" mb="2px">{TABLE_TYPE_ICON[table.tableType] || '⬜'}</Text>
                      <Text fontSize="13px" fontWeight="700" color="#2C2C2C" fontFamily="'DM Sans', sans-serif" letterSpacing="-0.01em" lineHeight="1.2">{table.tableNumber}</Text>
                      <Text fontSize="10px" color={cfg.text} fontWeight="500" mt="1px">{table.seats}p</Text>
                      <Box position="absolute" bottom="5px" left="50%" transform="translateX(-50%)" w="5px" h="5px" borderRadius="full" bg={cfg.dot} />
                    </Box>
                  );
                })}

                {floorTables.length === 0 && (
                  <Flex position="absolute" inset="0" align="center" justify="center" direction="column" gap="6px">
                    <Text fontSize="26px" opacity="0.2">⬜</Text>
                    <Text fontSize="13px" color="#ADB5BD">No tables on this floor</Text>
                    <Button variant="outline_soft" size="sm" h="28px" px="12px" fontSize="11px" mt="4px"
                      onClick={() => { setTableForm(blankTable); setTableFormErr({}); addModal.onOpen(); }}>
                      + Add First Table
                    </Button>
                  </Flex>
                )}
              </Box>
            </Box>
          </Box>

          {/* ── DETAILS PANEL ── */}
          {selectedTable && (
            <Box bg="white" borderRadius="16px" border="1.5px solid #EDEDE8"
              boxShadow="0 2px 6px rgba(0,0,0,0.04)" overflow="hidden" alignSelf="start">
              <Flex px="18px" py="12px" borderBottom="1px solid #F1F3F5" align="center" justify="space-between">
                <HStack gap="7px">
                  <Text fontSize="15px">{TABLE_TYPE_ICON[selectedTable.tableType]}</Text>
                  <Text fontFamily="'Playfair Display', serif" fontSize="14px" fontWeight="600" color="#2C2C2C">
                    Table {selectedTable.tableNumber}
                  </Text>
                </HStack>
                <Box as="button" onClick={() => setSelectedTable(null)} w="24px" h="24px" borderRadius="6px"
                  display="flex" alignItems="center" justifyContent="center"
                  _hover={{ bg: '#F1F3F5' }} transition="bg 0.15s" cursor="pointer" border="none" bg="transparent">
                  <Text fontSize="15px" color="#ADB5BD" lineHeight="1">×</Text>
                </Box>
              </Flex>

              <Box px="18px" py="14px">
                {/* Status row */}
                <Flex justify="space-between" align="center" mb="14px">
                  <StatusDot status={selectedTable.status} />
                  <Box px="8px" py="2px" bg="#F1F3F5" borderRadius="5px">
                    <Text fontSize="10px" color="#6C757D" fontWeight="600" textTransform="capitalize">{selectedTable.tableType}</Text>
                  </Box>
                </Flex>

                {/* Info grid */}
                <Grid templateColumns="1fr 1fr" gap="8px" mb="14px">
                  {[['Seats', selectedTable.seats], ['Floor', selectedTable.floor], ['W', `${selectedTable.width}px`], ['H', `${selectedTable.height}px`]].map(([l, v]) => (
                    <Box key={l} bg="#FAFAF8" borderRadius="7px" p="9px 11px">
                      <Text fontSize="9px" color="#ADB5BD" fontWeight="700" textTransform="uppercase" letterSpacing="0.07em">{l}</Text>
                      <Text fontSize="13px" fontWeight="600" color="#2C2C2C" mt="1px">{v}</Text>
                    </Box>
                  ))}
                </Grid>

                {selectedTable.notes && (
                  <Box bg="#FAF0E4" borderRadius="7px" p="9px 11px" mb="14px">
                    <Text fontSize="11px" color="#A86E28" fontWeight="500">{selectedTable.notes}</Text>
                  </Box>
                )}

                {/* Current reservation */}
                {selectedTable.currentReservation && (
                  <Box mb="14px" bg="#F8F9FA" borderRadius="9px" p="11px" border="1px solid #F1F3F5">
                    <Text fontSize="10px" fontWeight="700" color="#6C757D" textTransform="uppercase" letterSpacing="0.07em" mb="7px">Active Booking</Text>
                    <Text fontSize="13px" fontWeight="600" color="#2C2C2C">{selectedTable.currentReservation.customerName}</Text>
                    <Text fontSize="11px" color="#6C757D" mt="1px">{selectedTable.currentReservation.customerPhone} · Party of {selectedTable.currentReservation.partySize}</Text>
                    <Text fontSize="11px" color="#6C757D">{selectedTable.currentReservation.reservationTime} · {selectedTable.currentReservation.expectedDuration} min</Text>
                    <HStack mt="9px" gap="5px">
                      <Button variant="ghost_green" size="xs" h="24px" px="9px" fontSize="10px" borderRadius="5px"
                        onClick={async () => { await handleResStatus(selectedTable.currentReservation.reservationId, 'completed'); setSelectedTable(p => ({ ...p, status: 'available', currentReservation: null })); }}>
                        Complete
                      </Button>
                      <Button variant="ghost_red" size="xs" h="24px" px="9px" fontSize="10px" borderRadius="5px"
                        onClick={async () => { await handleResStatus(selectedTable.currentReservation.reservationId, 'cancelled'); setSelectedTable(p => ({ ...p, status: 'available', currentReservation: null })); }}>
                        Cancel
                      </Button>
                    </HStack>
                  </Box>
                )}

                {/* Position editor */}
                <Box mb="14px">
                  <Text fontSize="10px" fontWeight="700" color="#6C757D" textTransform="uppercase" letterSpacing="0.07em" mb="7px">Position</Text>
                  <Grid templateColumns="1fr 1fr" gap="6px">
                    {[['X', 'x', layout.canvasWidth], ['Y', 'y', layout.canvasHeight]].map(([label, axis, max]) => (
                      <Box key={axis}>
                        <Text fontSize="9px" color="#ADB5BD" mb="3px">{label}</Text>
                        <Input type="number" value={editPos[axis]} size="sm" h="30px" fontSize="12px"
                          bg="#FAFAF8" border="1.5px solid #DEE2E6" borderRadius="7px"
                          _focus={{ borderColor: '#C4893A', boxShadow: '0 0 0 2px rgba(196,137,58,0.1)' }}
                          onChange={e => onPosChange(axis, e.target.value)} min={0} max={max} />
                      </Box>
                    ))}
                  </Grid>
                  <HStack mt="7px" gap="5px">
                    {!isEditMode ? (
                      <Button variant="outline_soft" size="xs" h="26px" px="10px" fontSize="10px"
                        onClick={() => { setIsEditMode(true); setEditingTableId(selectedTable.tableId); setHasUnsaved(true); }}>
                        ✥ Drag to Reposition
                      </Button>
                    ) : (
                      <>
                        <Button variant="terracotta" size="xs" h="26px" px="10px" fontSize="10px" onClick={handleSavePos}>Save</Button>
                        <Button variant="outline_soft" size="xs" h="26px" px="10px" fontSize="10px" onClick={() => { setIsEditMode(false); setEditingTableId(null); }}>Cancel</Button>
                      </>
                    )}
                  </HStack>
                  {isEditMode && editingTableId === selectedTable.tableId && (
                    <Text fontSize="10px" color="#ADB5BD" mt="5px">Drag the highlighted table on the canvas</Text>
                  )}
                </Box>

                <Divider borderColor="#F1F3F5" mb="12px" />

                {/* Action buttons */}
                <VStack gap="6px" align="stretch">
                  <Button variant="outline_soft" size="sm" h="34px" fontSize="12px"
                    onClick={() => { setEditTableForm({ tableNumber: selectedTable.tableNumber, tableType: selectedTable.tableType, seats: selectedTable.seats, width: selectedTable.width, height: selectedTable.height, notes: selectedTable.notes || '' }); setEditTableErr({}); editModal.onOpen(); }}>
                    Edit Table Details
                  </Button>
                  <Button
                    variant={selectedTable.status === 'available' ? 'solid_dark' : 'outline_soft'}
                    size="sm" h="34px" fontSize="12px"
                    isDisabled={selectedTable.status !== 'available'}
                    onClick={() => { setResForm(blankRes); setResFormErr({}); resModal.onOpen(); }}
                    title={selectedTable.status !== 'available' ? `Table is ${selectedTable.status}` : ''}
                  >
                    {selectedTable.status === 'available' ? '+ Make Reservation' : `Table is ${selectedTable.status}`}
                  </Button>
                </VStack>
              </Box>
            </Box>
          )}
        </Grid>

        {/* ── RESERVATIONS TABLE ── */}
        <Box bg="white" borderRadius="16px" border="1.5px solid #EDEDE8"
          boxShadow="0 2px 6px rgba(0,0,0,0.04)" overflow="hidden">
          <Flex px="22px" py="14px" borderBottom="1px solid #F1F3F5" align="center" justify="space-between">
            <HStack gap="8px">
              <Text fontFamily="'Playfair Display', serif" fontSize="14px" fontWeight="600" color="#2C2C2C">Reservations</Text>
              <Box px="7px" py="1px" bg="#F1F3F5" borderRadius="4px">
                <Text fontSize="10px" color="#6C757D" fontWeight="600">{reservations.length}</Text>
              </Box>
            </HStack>
            <Text fontSize="11px" color="#ADB5BD">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </Flex>

          {reservations.length === 0 ? (
            <Flex align="center" justify="center" direction="column" gap="8px" py="44px">
              <Text fontSize="22px" opacity="0.2">📋</Text>
              <Text fontSize="13px" color="#ADB5BD">No reservations for this date</Text>
            </Flex>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr bg="#FAFAF8">
                    {['Table', 'Guest', 'Time', 'Party', 'Duration', 'Status', 'Update'].map(h => (
                      <Th key={h} py="9px" px={{ base: '12px', md: '18px' }}
                        fontSize="9px" fontWeight="700" color="#ADB5BD" letterSpacing="0.08em"
                        textTransform="uppercase" fontFamily="'DM Sans', sans-serif"
                        borderBottom="1px solid #F1F3F5">
                        {h}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {reservations.map((res) => {
                    const tNum = tables.find(t => t.tableId === res.tableId)?.tableNumber || res.tableId;
                    return (
                      <Tr key={res._id} _hover={{ bg: '#FAFAF8' }} transition="bg 0.1s" borderBottom="1px solid #F8F8F6">
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Box display="inline-block" px="8px" py="2px" bg="#F1F3F5" borderRadius="5px">
                            <Text fontSize="11px" fontWeight="700" color="#2C2C2C">{tNum}</Text>
                          </Box>
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Text fontSize="13px" fontWeight="500" color="#2C2C2C">{res.customerName}</Text>
                          <Text fontSize="10px" color="#ADB5BD" mt="1px">{res.customerPhone}</Text>
                          {res.specialRequests && (
                            <Text fontSize="10px" color="#C4893A" mt="2px" maxW="160px" noOfLines={1}>
                              ✦ {res.specialRequests}
                            </Text>
                          )}
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Text fontSize="12px" fontWeight="500" color="#2C2C2C">{res.reservationTime}</Text>
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Text fontSize="12px" color="#495057">{res.partySize}</Text>
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Text fontSize="12px" color="#495057">{res.duration}m</Text>
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <ResBadge status={res.status} />
                        </Td>
                        <Td px={{ base: '12px', md: '18px' }} py="11px">
                          <Select
                            value={res.status}
                            onChange={e => handleResStatus(res._id, e.target.value)}
                            size="xs" h="26px" w="106px" fontSize="11px"
                            bg="white" border="1.5px solid #DEE2E6" borderRadius="6px"
                            fontFamily="'DM Sans', sans-serif" cursor="pointer"
                            _focus={{ borderColor: '#C4893A', boxShadow: '0 0 0 2px rgba(196,137,58,0.1)' }}
                          >
                            {['pending','confirmed','seated','completed','cancelled','no-show'].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                            ))}
                          </Select>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Footer */}
        <Box textAlign="center" pt="28px" pb="8px">
          <Text fontSize="10px" color="#D0CEC8" letterSpacing="0.08em">RESTO · TABLE MANAGEMENT · {new Date().getFullYear()}</Text>
        </Box>
      </Box>

      {/* ════════ MODALS ════════ */}

      {/* FLOOR MODAL */}
      <Modal isOpen={floorModal.isOpen} onClose={floorModal.onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader px="22px" pt="20px" pb="12px" borderBottom="1px solid #F1F3F5">Manage Floors</ModalHeader>
          <ModalCloseButton top="16px" right="16px" />
          <ModalBody px="22px" py="18px">
            <VStack gap="6px" align="stretch" mb="16px">
              {layout.floorNames.map((name, i) => (
                <Flex key={i} align="center" justify="space-between" bg="#FAFAF8" borderRadius="8px" px="12px" py="9px" border="1px solid #F1F3F5">
                  <HStack gap="7px">
                    <Box w="20px" h="20px" bg="#F1F3F5" borderRadius="4px" display="flex" alignItems="center" justifyContent="center">
                      <Text fontSize="10px" fontWeight="700" color="#6C757D">{i + 1}</Text>
                    </Box>
                    <Text fontSize="13px" fontWeight="500" color="#2C2C2C">{name}</Text>
                    <Text fontSize="10px" color="#ADB5BD">· {tables.filter(t => t.floorIndex === i).length} tables</Text>
                  </HStack>
                  {layout.floorNames.length > 1 && (
                    <Button size="xs" h="22px" px="8px" fontSize="10px" variant="ghost_red" borderRadius="5px" onClick={() => handleRemoveFloor(i)}>
                      Remove
                    </Button>
                  )}
                </Flex>
              ))}
            </VStack>
            <Divider borderColor="#F1F3F5" mb="14px" />
            <FieldRow label="New Floor Name" error={floorErr}>
              <Input {...inputStyles} value={newFloorName} onChange={e => { setNewFloorName(e.target.value); setFloorErr(''); }}
                placeholder="e.g., Mezzanine, Rooftop, Basement"
                onKeyDown={e => e.key === 'Enter' && handleAddFloor()} />
            </FieldRow>
          </ModalBody>
          <ModalFooter px="22px" pb="18px" pt="0" gap="7px">
            <Button variant="outline_soft" size="sm" h="34px" px="16px" fontSize="12px" onClick={floorModal.onClose}>Close</Button>
            <Button variant="solid_dark" size="sm" h="34px" px="16px" fontSize="12px" onClick={handleAddFloor}>Add Floor</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ADD TABLE MODAL */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader px="22px" pt="20px" pb="12px" borderBottom="1px solid #F1F3F5">
            New Table — {layout.floorNames[currentFloor]}
          </ModalHeader>
          <ModalCloseButton top="16px" right="16px" />
          <ModalBody px="22px" py="18px">
            <Grid templateColumns="1fr 1fr" gap="0 16px">
              <GridItem>
                <FieldRow label="Table Number" error={tableFormErr.tableNumber} required>
                  <Input {...inputStyles} value={tableForm.tableNumber}
                    onChange={e => { setTableForm(p => ({ ...p, tableNumber: e.target.value })); setTableFormErr(p => ({ ...p, tableNumber: '' })); }}
                    placeholder="T1, VIP-2, Patio-1"
                    isInvalid={!!tableFormErr.tableNumber} />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Table Type">
                  <Select {...inputStyles} value={tableForm.tableType} onChange={e => setTableForm(p => ({ ...p, tableType: e.target.value }))}>
                    <option value="normal">Normal</option>
                    <option value="vip">VIP</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="private">Private</option>
                  </Select>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Seats" error={tableFormErr.seats} required>
                  <NumberInput min={1} max={20} value={tableForm.seats}
                    onChange={(_, v) => { setTableForm(p => ({ ...p, seats: v || 1 })); setTableFormErr(p => ({ ...p, seats: '' })); }}>
                    <NumberInputField {...numFieldStyles} isInvalid={!!tableFormErr.seats} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Width (px)" error={tableFormErr.width} helper="40–200">
                  <NumberInput min={40} max={200} value={tableForm.width} onChange={(_, v) => setTableForm(p => ({ ...p, width: v || 88 }))}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Height (px)" error={tableFormErr.height} helper="40–200">
                  <NumberInput min={40} max={200} value={tableForm.height} onChange={(_, v) => setTableForm(p => ({ ...p, height: v || 88 }))}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem colSpan={2}>
                <FieldRow label="Notes" helper="Accessibility info, position notes, etc.">
                  <Textarea {...textareaStyles} value={tableForm.notes} onChange={e => setTableForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" rows={2} resize="none" />
                </FieldRow>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter px="22px" pb="18px" pt="0" gap="7px">
            <Button variant="outline_soft" size="sm" h="34px" px="16px" fontSize="12px" onClick={addModal.onClose}>Cancel</Button>
            <Button variant="solid_dark" size="sm" h="34px" px="16px" fontSize="12px" isLoading={tableLoading} onClick={handleAddTable}>Add Table</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* EDIT TABLE MODAL */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader px="22px" pt="20px" pb="12px" borderBottom="1px solid #F1F3F5">
            Edit Table {selectedTable?.tableNumber}
          </ModalHeader>
          <ModalCloseButton top="16px" right="16px" />
          <ModalBody px="22px" py="18px">
            <Grid templateColumns="1fr 1fr" gap="0 16px">
              <GridItem>
                <FieldRow label="Table Number" error={editTableErr.tableNumber} required>
                  <Input {...inputStyles} value={editTableForm.tableNumber} isInvalid={!!editTableErr.tableNumber}
                    onChange={e => { setEditTableForm(p => ({ ...p, tableNumber: e.target.value })); setEditTableErr(p => ({ ...p, tableNumber: '' })); }} />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Table Type">
                  <Select {...inputStyles} value={editTableForm.tableType} onChange={e => setEditTableForm(p => ({ ...p, tableType: e.target.value }))}>
                    <option value="normal">Normal</option><option value="vip">VIP</option><option value="outdoor">Outdoor</option><option value="private">Private</option>
                  </Select>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Seats" error={editTableErr.seats} required>
                  <NumberInput min={1} max={20} value={editTableForm.seats} onChange={(_, v) => { setEditTableForm(p => ({ ...p, seats: v || 1 })); setEditTableErr(p => ({ ...p, seats: '' })); }}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Width (px)">
                  <NumberInput min={40} max={200} value={editTableForm.width} onChange={(_, v) => setEditTableForm(p => ({ ...p, width: v || 88 }))}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Height (px)">
                  <NumberInput min={40} max={200} value={editTableForm.height} onChange={(_, v) => setEditTableForm(p => ({ ...p, height: v || 88 }))}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem colSpan={2}>
                <FieldRow label="Notes">
                  <Textarea {...textareaStyles} value={editTableForm.notes} onChange={e => setEditTableForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" rows={2} resize="none" />
                </FieldRow>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter px="22px" pb="18px" pt="0" gap="7px">
            <Button variant="outline_soft" size="sm" h="34px" px="16px" fontSize="12px" onClick={editModal.onClose}>Cancel</Button>
            <Button variant="solid_dark" size="sm" h="34px" px="16px" fontSize="12px" isLoading={tableLoading} onClick={handleEditTable}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* RESERVATION MODAL */}
      <Modal isOpen={resModal.isOpen} onClose={resModal.onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent borderRadius="16px">
          <ModalHeader px="22px" pt="20px" pb="12px" borderBottom="1px solid #F1F3F5">
            New Reservation · Table {selectedTable?.tableNumber}
          </ModalHeader>
          <ModalCloseButton top="16px" right="16px" />
          <ModalBody px="22px" py="18px">
            <Grid templateColumns="1fr 1fr" gap="0 16px">
              <GridItem colSpan={2}>
                <FieldRow label="Guest Name" error={resFormErr.customerName} required>
                  <Input {...inputStyles} value={resForm.customerName} isInvalid={!!resFormErr.customerName}
                    onChange={e => { setResForm(p => ({ ...p, customerName: e.target.value })); setResFormErr(p => ({ ...p, customerName: '' })); }}
                    placeholder="Full name" />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Phone" error={resFormErr.customerPhone} required>
                  <Input {...inputStyles} value={resForm.customerPhone} isInvalid={!!resFormErr.customerPhone}
                    onChange={e => { setResForm(p => ({ ...p, customerPhone: e.target.value })); setResFormErr(p => ({ ...p, customerPhone: '' })); }}
                    placeholder="+91 98765 43210" />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Email" error={resFormErr.customerEmail}>
                  <Input {...inputStyles} type="email" value={resForm.customerEmail} isInvalid={!!resFormErr.customerEmail}
                    onChange={e => { setResForm(p => ({ ...p, customerEmail: e.target.value })); setResFormErr(p => ({ ...p, customerEmail: '' })); }}
                    placeholder="guest@email.com" />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Party Size" error={resFormErr.partySize} required helper={selectedTable ? `Max capacity: ${selectedTable.seats}` : ''}>
                  <NumberInput min={1} max={selectedTable?.seats || 20} value={resForm.partySize}
                    onChange={(_, v) => { setResForm(p => ({ ...p, partySize: v || 1 })); setResFormErr(p => ({ ...p, partySize: '' })); }}>
                    <NumberInputField {...numFieldStyles} isInvalid={!!resFormErr.partySize} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Duration (min)">
                  <NumberInput min={30} max={480} step={15} value={resForm.duration} onChange={(_, v) => setResForm(p => ({ ...p, duration: v || 60 }))}>
                    <NumberInputField {...numFieldStyles} />
                    <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                  </NumberInput>
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Date" error={resFormErr.reservationDate} required>
                  <Input {...inputStyles} type="date" value={resForm.reservationDate} isInvalid={!!resFormErr.reservationDate}
                    onChange={e => { setResForm(p => ({ ...p, reservationDate: e.target.value })); setResFormErr(p => ({ ...p, reservationDate: '' })); }} />
                </FieldRow>
              </GridItem>
              <GridItem>
                <FieldRow label="Time" error={resFormErr.reservationTime} required>
                  <Input {...inputStyles} type="time" value={resForm.reservationTime} isInvalid={!!resFormErr.reservationTime}
                    onChange={e => { setResForm(p => ({ ...p, reservationTime: e.target.value })); setResFormErr(p => ({ ...p, reservationTime: '' })); }} />
                </FieldRow>
              </GridItem>
              <GridItem colSpan={2}>
                <FieldRow label="Special Requests">
                  <Textarea {...textareaStyles} value={resForm.specialRequests}
                    onChange={e => setResForm(p => ({ ...p, specialRequests: e.target.value }))}
                    placeholder="Dietary requirements, occasion, seating preferences…"
                    rows={2} resize="none" />
                </FieldRow>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter px="22px" pb="18px" pt="0" gap="7px">
            <Button variant="outline_soft" size="sm" h="34px" px="16px" fontSize="12px" onClick={resModal.onClose}>Cancel</Button>
            <Button variant="terracotta" size="sm" h="34px" px="16px" fontSize="12px" isLoading={resLoading} onClick={handleCreateRes}>
              Confirm Reservation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// ─── EXPORT (wraps with ChakraProvider + Google Fonts) ────────────────────────
export default function TableManagement() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />
      <ChakraProvider theme={theme}>
        <TableManagementInner />
      </ChakraProvider>
    </>
  );
}