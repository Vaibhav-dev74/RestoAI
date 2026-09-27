import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  ChakraProvider,
  extendTheme,
  Box, Flex, Text, Heading, Button, Input, Select,
  Table, Thead, Tbody, Tr, Th, Td, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter,
  FormControl, FormLabel, Image, Badge, SimpleGrid,
  Icon, IconButton, useToast, Skeleton, SkeletonText,
  Alert, AlertIcon, VStack, HStack, Spinner, Center,
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, Divider, Textarea,
  Tag, TagLabel, TagCloseButton, useDisclosure, Circle,
} from '@chakra-ui/react';
import {
  FaPlus, FaReceipt, FaTimes, FaCheck, FaTrash,
  FaUtensils, FaTag, FaStar, FaSearch, FaBoxOpen,
  FaChevronRight, FaTable, FaLeaf, FaDrumstickBite,
} from 'react-icons/fa';
import { GiChefToque } from 'react-icons/gi';

/* ─── Theme (mirrors WaiterDashboard) ─── */
const theme = extendTheme({
  fonts: {
    heading: `'Space Grotesk', 'Plus Jakarta Sans', sans-serif`,
    body:    `'Plus Jakarta Sans', 'DM Sans', sans-serif`,
  },
  styles: {
    global: {
      body: { bg: 'linear-gradient(160deg,#eef4ff 0%,#f5f0ff 50%,#eef8ff 100%)' },
    },
  },
});

/* ─── Design tokens ─── */
const T = {
  pageBg:      'linear-gradient(160deg,#eef4ff 0%,#f5f0ff 50%,#eef8ff 100%)',
  cardBg:      'white',
  cardBorder:  'rgba(24,95,165,0.10)',
  tabBarBg:    '#f7f9ff',
  inputBg:     '#f0f4ff',
  blue50:      '#E6F1FB',
  blue100:     '#B5D4F4',
  blue200:     '#85B7EB',
  blue400:     '#378ADD',
  blue600:     '#185FA5',
  blue800:     '#0C447C',
  blue900:     '#042C53',
  teal50:      '#E1F5EE',
  teal600:     '#0F6E56',
  amber50:     '#FAEEDA',
  amber600:    '#BA7517',
  purple50:    '#EEEDFE',
  purple600:   '#534AB7',
  green50:     '#EAF3DE',
  green600:    '#3B6D11',
  red50:       '#FCEBEB',
  red600:      '#A32D2D',
};

/* ─── Shared card style ─── */
const card = {
  bg: 'white',
  borderRadius: '18px',
  border: '0.5px solid',
  borderColor: 'rgba(24,95,165,0.10)',
  overflow: 'hidden',
};

/* ─── Status helpers ─── */
const statusMap = {
  pending:   { bg: T.amber50,  fg: T.amber600,  label: 'Pending'   },
  preparing: { bg: T.blue50,   fg: T.blue600,   label: 'Preparing' },
  served:    { bg: T.teal50,   fg: T.teal600,   label: 'Served'    },
  paid:      { bg: '#F1EFE8',  fg: '#5F5E5A',   label: 'Paid'      },
};

const VITE_API_URL = API_BASE_URL;

const OrdersPage = ({ orders, setOrders, dishes, setDishes, mergeOrders, restaurantId }) => {
  /* Bill drawer */
  const { isOpen: billOpen, onOpen: openBill, onClose: closeBill } = useDisclosure();
  const [selectedBillTable, setSelectedBillTable] = useState('');

  /* Add dish modal */
  const { isOpen: dishOpen, onOpen: openDish, onClose: closeDish } = useDisclosure();
  const [addDishForm, setAddDishForm] = useState({
    name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '',
  });
  const [inventoryItems, setInventoryItems]   = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [recipeDraft, setRecipeDraft]         = useState([]);
  const [recipePick, setRecipePick]           = useState({ item: '', quantity: '', unit: 'pieces' });

  /* Gallery order modal */
  const [galleryDish, setGalleryDish]         = useState(null);
  const [galleryQty, setGalleryQty]           = useState('');
  const [galleryMods, setGalleryMods]         = useState('');
  const [galleryTable, setGalleryTable]       = useState('');
  const [gallerySuccess, setGallerySuccess]   = useState(false);
  const [galleryError, setGalleryError]       = useState('');

  /* Loading / errors */
  const [ordersLoading, setOrdersLoading]     = useState(false);
  const [dishLoading, setDishLoading]         = useState(false);
  const [dishError, setDishError]             = useState('');
  const [menuSearch, setMenuSearch]           = useState('');

  const toast = useToast();
  const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  /* ── fetch ── */
  useEffect(() => { fetchOrders(); fetchDishes(); }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/orders`, { headers: authH() });
      setOrders(prev => mergeOrders(prev, res.data));
    } catch { toast({ title: 'Failed to fetch orders', status: 'error', duration: 3000, isClosable: true }); }
    finally { setOrdersLoading(false); }
  };

  const fetchDishes = async (search = '') => {
    setDishLoading(true); setDishError('');
    try {
      const res = await axios.get(
        `${VITE_API_URL}/api/orders/dishes${search ? `?search=${encodeURIComponent(search)}` : ''}`,
        { headers: authH() }
      );
      setDishes(res.data);
    } catch { setDishError('Could not load dishes'); }
    finally { setDishLoading(false); }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/orders/inventory`, { headers: authH() });
      setInventoryItems(Array.isArray(res.data) ? res.data : []);
    } catch { setInventoryItems([]); }
    finally { setInventoryLoading(false); }
  };

  useEffect(() => {
    if (dishOpen) { fetchInventory(); setRecipeDraft([]); setRecipePick({ item: '', quantity: '', unit: 'pieces' }); }
  }, [dishOpen]);

  /* ── add dish ── */
  const handleAddDish = async (e) => {
    e.preventDefault(); setDishLoading(true); setDishError('');
    try {
      const payload = {
        ...addDishForm,
        ingredients: addDishForm.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        dietary: addDishForm.dietary.split(',').map(i => i.trim()).filter(Boolean),
        price: parseFloat(addDishForm.price),
        recipeItems: recipeDraft.map(r => ({ item: r.item, quantity: Number(r.quantity), unit: r.unit })),
      };
      await axios.post(`${VITE_API_URL}/api/orders/dishes`, payload, { headers: authH() });
      closeDish();
      setAddDishForm({ name: '', description: '', ingredients: '', price: '', image: '', category: '', dietary: '' });
      setRecipeDraft([]);
      fetchDishes();
      toast({ title: 'Dish added successfully', status: 'success', duration: 3000, isClosable: true });
    } catch { setDishError('Failed to add dish'); }
    finally { setDishLoading(false); }
  };

  const addRecipeItem = () => {
    if (!recipePick.item) return;
    const q = Number(recipePick.quantity);
    if (!Number.isFinite(q) || q <= 0) return;
    setRecipeDraft(prev => {
      const ex = prev.find(x => x.item === recipePick.item && x.unit === recipePick.unit);
      if (ex) return prev.map(x => x === ex ? { ...x, quantity: Number(x.quantity) + q } : x);
      return [...prev, { item: recipePick.item, quantity: q, unit: recipePick.unit || 'pieces' }];
    });
    setRecipePick({ item: '', quantity: '', unit: 'pieces' });
  };

  /* ── gallery order ── */
  const handleGalleryOrder = async (e) => {
    e.preventDefault(); setGalleryError('');
    try {
      await axios.post(`${VITE_API_URL}/api/orders/create`, {
        table: galleryTable,
        items: [{
          dish: galleryDish._id, name: galleryDish.name,
          quantity: galleryQty, price: galleryDish.price,
          modifications: galleryMods ? galleryMods.split(',').map(m => m.trim()).filter(Boolean) : [],
        }],
      }, { headers: authH() });
      setGallerySuccess(true); setGalleryQty(''); setGalleryMods(''); setGalleryTable('');
      fetchOrders();
      toast({ title: `${galleryDish.name} ordered for Table ${galleryTable}`, status: 'success', duration: 3000, isClosable: true });
      setTimeout(() => { setGallerySuccess(false); setGalleryDish(null); }, 1600);
    } catch { setGalleryError('Failed to place order'); }
  };

  /* ── payment ── */
  const handlePayment = async (orderId) => {
    try {
      await axios.put(`${VITE_API_URL}/api/orders/${orderId}`, { status: 'paid' }, { headers: authH() });
      fetchOrders(); setSelectedBillTable('');
      toast({ title: 'Payment recorded', status: 'success', duration: 2000, isClosable: true });
    } catch { toast({ title: 'Payment failed', status: 'error', duration: 2000, isClosable: true }); }
  };

  /* ── derived ── */
  const filteredDishes = dishes.filter(d =>
    d.name.toLowerCase().includes(menuSearch.toLowerCase())
  );
  const unpaidTables = [...new Set(orders.filter(o => o.status !== 'paid').map(o => o.table))];
  const billItems = selectedBillTable
    ? orders.filter(o => o.table === selectedBillTable && o.status !== 'paid').flatMap(o => o.items)
    : [];
  const billTotal = billItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const inputStyle = {
    bg: T.inputBg, border: '0.5px solid rgba(24,95,165,0.18)',
    borderRadius: '10px', fontSize: '13px', color: T.blue900,
    _focus: { borderColor: T.blue400, boxShadow: '0 0 0 3px rgba(55,138,221,0.12)' },
    _placeholder: { color: 'gray.400' },
  };

  return (
    <ChakraProvider theme={theme}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      <Box minH="100vh" background={T.pageBg} px={{ base: 4, md: 8 }} py={8}>

        {/* ══ PAGE HEADER ══ */}
        <Flex align="center" justify="space-between" mb={8} flexWrap="wrap" gap={4}>
          <Box>
            <Heading
              fontFamily="'Space Grotesk', sans-serif"
              fontSize={{ base: '22px', md: '26px' }}
              fontWeight="700" color={T.blue900} letterSpacing="-0.5px"
            >
              Menu & Orders
            </Heading>
            <Text fontSize="13px" color="gray.400" mt={1}>
              Manage dishes, place orders and process bills
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaPlus size={12} />}
              bg="white" color={T.blue600}
              border={`0.5px solid ${T.blue100}`}
              _hover={{ bg: T.blue50 }}
              borderRadius="10px" fontSize="13px" h="36px"
              onClick={openDish}
            >
              Add Dish
            </Button>
            <Box position="relative">
              <Button
                leftIcon={<FaReceipt size={12} />}
                bg={T.blue600} color="white"
                _hover={{ bg: T.blue800 }}
                borderRadius="10px" fontSize="13px" h="36px"
                onClick={openBill}
              >
                Bills
              </Button>
              {unpaidTables.length > 0 && (
                <Circle size="18px" bg="red.500" position="absolute" top="-6px" right="-6px"
                  border="2px solid white">
                  <Text fontSize="9px" color="white" fontWeight="700">{unpaidTables.length}</Text>
                </Circle>
              )}
            </Box>
          </HStack>
        </Flex>

        {/* ══ SEARCH ══ */}
        <Flex
          align="center" gap={3} mb={6}
          bg="white" borderRadius="12px"
          border={`0.5px solid rgba(24,95,165,0.12)`}
          px={4} py={3}
          maxW="460px"
        >
          <Icon as={FaSearch} color="gray.300" boxSize="13px" flexShrink={0} />
          <Input
            variant="unstyled" placeholder="Search menu items…"
            fontSize="13px" color={T.blue900}
            _placeholder={{ color: 'gray.400' }}
            value={menuSearch} onChange={e => setMenuSearch(e.target.value)}
          />
        </Flex>

        {/* ══ DISH GALLERY ══ */}
        {dishLoading && !dishes.length ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {Array(8).fill(0).map((_, i) => (
              <Box key={i} borderRadius="14px" overflow="hidden" border={`0.5px solid ${T.cardBorder}`}>
                <Skeleton h="200px" />
                <Box p={4}><SkeletonText noOfLines={3} spacing={3} /></Box>
              </Box>
            ))}
          </SimpleGrid>
        ) : dishError ? (
          <Alert status="error" borderRadius="12px" mb={4}>
            <AlertIcon />{dishError}
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {filteredDishes.map(dish => (
              <Box
                key={dish._id}
                bg="white" borderRadius="16px"
                border={`0.5px solid rgba(24,95,165,0.10)`}
                overflow="hidden" cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)', borderColor: T.blue400, boxShadow: '0 8px 24px rgba(24,95,165,0.12)' }}
                onClick={() => { setGalleryDish(dish); setGallerySuccess(false); setGalleryError(''); }}
              >
                <Box position="relative">
                  <Image
                    src={dish.image || '/images/chef3.png'}
                    alt={dish.name} h="200px" w="100%" objectFit="cover"
                    fallback={
                      <Box h="200px" bg={T.blue50} display="flex" alignItems="center" justifyContent="center">
                        <Icon as={GiChefToque} boxSize={12} color={T.blue200} />
                      </Box>
                    }
                  />
                  {/* Price badge */}
                  <Badge
                    position="absolute" top={3} right={3}
                    bg={T.blue900} color="white"
                    fontFamily="'Space Grotesk',sans-serif"
                    fontSize="12px" fontWeight="700"
                    px={3} py={1} borderRadius="8px"
                  >
                    ₹{dish.price}
                  </Badge>
                  {/* Category badge */}
                  {dish.category && (
                    <Badge
                      position="absolute" top={3} left={3}
                      bg="rgba(255,255,255,0.92)" color={T.blue600}
                      fontSize="9px" fontWeight="700"
                      px={2} py={1} borderRadius="6px"
                      letterSpacing="0.4px"
                      textTransform="uppercase"
                    >
                      {dish.category}
                    </Badge>
                  )}
                  {/* Gradient overlay */}
                  <Box
                    position="absolute" bottom={0} left={0} right={0} h="80px"
                    bgGradient="linear(to-t, blackAlpha.600, transparent)"
                  />
                </Box>
                <Box p={4}>
                  <Text
                    fontFamily="'Space Grotesk',sans-serif"
                    fontWeight="600" fontSize="14px" color={T.blue900}
                    mb={1} noOfLines={1}
                  >
                    {dish.name}
                  </Text>
                  <Text fontSize="11px" color="gray.400" noOfLines={2} mb={3} lineHeight="1.5">
                    {dish.description || 'Premium quality dish'}
                  </Text>
                  <Flex justify="space-between" align="center">
                    <HStack spacing={1}>
                      {dish.dietary?.includes('vegan') && (
                        <Badge bg={T.green50} color={T.green600} fontSize="9px" px={2} borderRadius="5px">
                          <Flex align="center" gap={1}><Icon as={FaLeaf} boxSize="8px" />VEG</Flex>
                        </Badge>
                      )}
                      {dish.dietary?.includes('non-veg') && (
                        <Badge bg={T.red50} color={T.red600} fontSize="9px" px={2} borderRadius="5px">
                          <Flex align="center" gap={1}><Icon as={FaDrumstickBite} boxSize="8px" />NON-VEG</Flex>
                        </Badge>
                      )}
                    </HStack>
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
      </Box>

      {/* ══ BILL DRAWER ══ */}
      <Drawer isOpen={billOpen} placement="right" onClose={closeBill} size="sm">
        <DrawerOverlay backdropFilter="blur(8px)" bg="rgba(4,44,83,0.35)" />
        <DrawerContent borderLeftRadius="20px" borderLeft={`0.5px solid ${T.blue100}`}>
          <DrawerCloseButton color={T.blue600} top={4} right={4} />
          <DrawerHeader
            fontFamily="'Space Grotesk',sans-serif"
            fontSize="16px" fontWeight="700" color={T.blue800}
            borderBottom={`0.5px solid rgba(24,95,165,0.08)`}
            pb={4}
          >
            <Flex align="center" gap={3}>
              <Box w="30px" h="30px" bg={T.blue50} borderRadius="8px"
                display="flex" alignItems="center" justifyContent="center">
                <Icon as={FaReceipt} color={T.blue600} boxSize="12px" />
              </Box>
              Pending Bills
              {unpaidTables.length > 0 && (
                <Badge bg={T.amber50} color={T.amber600}
                  fontSize="10px" fontWeight="700" px={2} py={1} borderRadius="full">
                  {unpaidTables.length} tables
                </Badge>
              )}
            </Flex>
          </DrawerHeader>
          <DrawerBody py={5} px={5}>
            {unpaidTables.length === 0 ? (
              <Center flexDirection="column" py={12}>
                <Icon as={FaCheck} boxSize={10} color="gray.200" mb={3} />
                <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600" color="gray.300">
                  All bills cleared
                </Text>
              </Center>
            ) : (
              <VStack spacing={3} align="stretch">
                {/* Table selector */}
                <Flex gap={2} flexWrap="wrap" mb={2}>
                  {unpaidTables.map(t => (
                    <Button
                      key={t}
                      size="sm" borderRadius="8px" fontSize="12px"
                      bg={selectedBillTable === t ? T.blue600 : T.blue50}
                      color={selectedBillTable === t ? 'white' : T.blue600}
                      border={`0.5px solid ${selectedBillTable === t ? T.blue600 : T.blue100}`}
                      _hover={{ bg: selectedBillTable === t ? T.blue800 : T.blue100 }}
                      onClick={() => setSelectedBillTable(t)}
                    >
                      Table {t}
                    </Button>
                  ))}
                </Flex>

                {/* Bill details */}
                {selectedBillTable && (
                  <Box bg="white" borderRadius="14px" border={`0.5px solid ${T.cardBorder}`} overflow="hidden">
                    <Box bg={T.tabBarBg} px={4} py={3}
                      borderBottom={`0.5px solid rgba(24,95,165,0.08)`}>
                      <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="700"
                        fontSize="13px" color={T.blue800}>
                        Bill — Table {selectedBillTable}
                      </Text>
                    </Box>
                    <Box px={4} py={3}>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            {['Item', 'Qty', 'Amount'].map(h => (
                              <Th key={h}
                                fontSize="9px" fontWeight="600"
                                textTransform="uppercase" letterSpacing="0.8px"
                                color="gray.400"
                                borderBottomColor="rgba(24,95,165,0.08)"
                                isNumeric={h !== 'Item'}
                              >
                                {h}
                              </Th>
                            ))}
                          </Tr>
                        </Thead>
                        <Tbody>
                          {billItems.map((item, idx) => (
                            <Tr key={idx} _hover={{ bg: T.blue50 }}>
                              <Td fontSize="12px" fontWeight="500" color={T.blue900}
                                borderColor="rgba(24,95,165,0.06)">{item.name}</Td>
                              <Td isNumeric fontSize="12px" color="gray.500"
                                borderColor="rgba(24,95,165,0.06)">{item.quantity}</Td>
                              <Td isNumeric fontSize="12px" fontWeight="600" color={T.blue600}
                                borderColor="rgba(24,95,165,0.06)">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    <Flex px={4} pb={4} pt={2} justify="space-between" align="center"
                      borderTop={`0.5px solid rgba(24,95,165,0.08)`}>
                      <Text fontSize="12px" fontWeight="600" color="gray.500">Total</Text>
                      <Badge
                        bg={T.blue900} color="white"
                        fontFamily="'Space Grotesk',sans-serif"
                        fontSize="14px" fontWeight="700" px={3} py={1} borderRadius="8px"
                      >
                        ₹{billTotal.toFixed(2)}
                      </Badge>
                    </Flex>
                    <Box px={4} pb={4}>
                      <Button
                        w="full" bg={T.blue600} color="white"
                        _hover={{ bg: T.blue800 }}
                        borderRadius="10px" fontSize="13px" fontWeight="600"
                        leftIcon={<FaCheck size={12} />}
                        onClick={() => {
                          const order = orders.find(o => o.table === selectedBillTable && o.status !== 'paid');
                          if (order) handlePayment(order._id);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ══ ADD DISH MODAL ══ */}
      <Modal isOpen={dishOpen} onClose={closeDish} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(4,44,83,0.4)" />
        <ModalContent borderRadius="20px" border={`0.5px solid rgba(24,95,165,0.15)`} maxH="90vh">
          <form onSubmit={handleAddDish}>
            <ModalHeader
              fontFamily="'Space Grotesk',sans-serif"
              fontSize="16px" fontWeight="700" color={T.blue800}
              borderBottom={`0.5px solid rgba(24,95,165,0.08)`} pb={4}
            >
              <Flex align="center" gap={3}>
                <Box w="32px" h="32px" bg={T.blue50} borderRadius="8px"
                  display="flex" alignItems="center" justifyContent="center">
                  <Icon as={FaPlus} color={T.blue600} boxSize="13px" />
                </Box>
                Add New Dish
              </Flex>
            </ModalHeader>

            <ModalBody py={5} overflowY="auto">
              <VStack spacing={4} align="stretch">
                {/* Basic info grid */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Dish Name</FormLabel>
                    <Input {...inputStyle} placeholder="e.g. Butter Chicken"
                      value={addDishForm.name}
                      onChange={e => setAddDishForm({ ...addDishForm, name: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Price (₹)</FormLabel>
                    <Input {...inputStyle} type="number" placeholder="e.g. 280"
                      value={addDishForm.price}
                      onChange={e => setAddDishForm({ ...addDishForm, price: e.target.value })} />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                    textTransform="uppercase" letterSpacing="0.6px">Description</FormLabel>
                  <Input {...inputStyle} placeholder="Short description"
                    value={addDishForm.description}
                    onChange={e => setAddDishForm({ ...addDishForm, description: e.target.value })} />
                </FormControl>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Category</FormLabel>
                    <Input {...inputStyle} placeholder="e.g. Main Course"
                      value={addDishForm.category}
                      onChange={e => setAddDishForm({ ...addDishForm, category: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Dietary Tags</FormLabel>
                    <Input {...inputStyle} placeholder="vegan, gluten-free (comma separated)"
                      value={addDishForm.dietary}
                      onChange={e => setAddDishForm({ ...addDishForm, dietary: e.target.value })} />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                    textTransform="uppercase" letterSpacing="0.6px">Ingredients</FormLabel>
                  <Input {...inputStyle} placeholder="Tomato, Cream, Spices (comma separated)"
                    value={addDishForm.ingredients}
                    onChange={e => setAddDishForm({ ...addDishForm, ingredients: e.target.value })} />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                    textTransform="uppercase" letterSpacing="0.6px">Image URL</FormLabel>
                  <Input {...inputStyle} placeholder="https://..."
                    value={addDishForm.image}
                    onChange={e => setAddDishForm({ ...addDishForm, image: e.target.value })} />
                </FormControl>

                {/* ── Recipe linker ── */}
                <Box bg={T.inputBg} borderRadius="14px"
                  border={`0.5px solid rgba(24,95,165,0.14)`} p={5}>
                  <Flex align="center" gap={2} mb={1}>
                    <Icon as={FaBoxOpen} color={T.blue600} boxSize="13px" />
                    <Text fontFamily="'Space Grotesk',sans-serif" fontWeight="600"
                      fontSize="13px" color={T.blue800}>
                      Recipe → Inventory Link
                    </Text>
                  </Flex>
                  <Text fontSize="11px" color="gray.400" mb={4}>
                    Inventory quantities are auto-decremented per serving when orders are placed.
                  </Text>

                  <Flex gap={3} flexWrap="wrap" mb={3}>
                    <Select
                      flex="2" minW="180px"
                      value={recipePick.item}
                      onChange={e => {
                        const inv = inventoryItems.find(x => x._id === e.target.value);
                        setRecipePick({ ...recipePick, item: e.target.value, unit: inv?.unit || 'pieces' });
                      }}
                      isDisabled={inventoryLoading}
                      bg="white" borderRadius="10px" fontSize="13px"
                      borderColor="rgba(24,95,165,0.18)"
                      _focus={{ borderColor: T.blue400 }}
                      color={T.blue900}
                    >
                      <option value="">{inventoryLoading ? 'Loading…' : 'Select inventory item'}</option>
                      {inventoryItems.map(inv => (
                        <option key={inv._id} value={inv._id}>{inv.name} ({inv.unit})</option>
                      ))}
                    </Select>

                    <Input
                      type="number" placeholder="Qty" min="0" step="0.01"
                      value={recipePick.quantity}
                      onChange={e => setRecipePick({ ...recipePick, quantity: e.target.value })}
                      w="100px" bg="white" borderRadius="10px" fontSize="13px"
                      borderColor="rgba(24,95,165,0.18)"
                      _focus={{ borderColor: T.blue400 }}
                      color={T.blue900}
                    />

                    <Select
                      w="130px" value={recipePick.unit}
                      onChange={e => setRecipePick({ ...recipePick, unit: e.target.value })}
                      bg="white" borderRadius="10px" fontSize="13px"
                      borderColor="rgba(24,95,165,0.18)"
                      _focus={{ borderColor: T.blue400 }}
                      color={T.blue900}
                    >
                      {['pieces','packs','kg','gms','liters','ml'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </Select>

                    <Button
                      onClick={addRecipeItem}
                      bg={T.blue600} color="white" _hover={{ bg: T.blue800 }}
                      borderRadius="10px" fontSize="12px" fontWeight="600"
                      leftIcon={<FaPlus size={10} />}
                    >
                      Add
                    </Button>
                  </Flex>

                  {recipeDraft.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {recipeDraft.map((r, idx) => {
                        const inv = inventoryItems.find(x => x._id === r.item);
                        return (
                          <Flex key={idx} align="center" justify="space-between"
                            bg="white" borderRadius="10px" px={3} py={2}
                            border={`0.5px solid ${T.blue100}`}>
                            <Flex align="center" gap={2}>
                              <Icon as={FaBoxOpen} color={T.blue400} boxSize="11px" />
                              <Text fontSize="12px" fontWeight="500" color={T.blue900}>
                                {inv?.name || 'Item'}
                              </Text>
                              <Badge bg={T.blue50} color={T.blue600}
                                fontSize="10px" px={2} borderRadius="5px">
                                {r.quantity} {r.unit}
                              </Badge>
                            </Flex>
                            <IconButton
                              icon={<FaTrash size={10} />}
                              size="xs" variant="ghost" color="red.400"
                              _hover={{ bg: T.red50 }} borderRadius="6px"
                              aria-label="Remove"
                              onClick={() => setRecipeDraft(prev => prev.filter((_, i) => i !== idx))}
                            />
                          </Flex>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text fontSize="11px" color="gray.400" fontStyle="italic">
                      No recipe items yet — add at least one to enable auto-decrement.
                    </Text>
                  )}
                </Box>

                {dishError && (
                  <Alert status="error" borderRadius="10px" fontSize="12px">
                    <AlertIcon />{dishError}
                  </Alert>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter gap={3} borderTop={`0.5px solid rgba(24,95,165,0.08)`}>
              <Button variant="ghost" onClick={closeDish}
                fontSize="13px" borderRadius="10px" color="gray.500">
                Cancel
              </Button>
              <Button
                type="submit" bg={T.blue600} color="white"
                _hover={{ bg: T.blue800 }} borderRadius="10px" fontSize="13px"
                isLoading={dishLoading} loadingText="Adding…"
                leftIcon={<FaPlus size={11} />}
              >
                Add Dish
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* ══ GALLERY ORDER MODAL ══ */}
      <Modal isOpen={!!galleryDish} onClose={() => setGalleryDish(null)} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(4,44,83,0.4)" />
        <ModalContent borderRadius="20px" border={`0.5px solid rgba(24,95,165,0.15)`}>
          <form onSubmit={handleGalleryOrder}>
            <ModalHeader
              fontFamily="'Space Grotesk',sans-serif"
              fontSize="16px" fontWeight="700" color={T.blue800}
              borderBottom={`0.5px solid rgba(24,95,165,0.08)`} pb={4}
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
                    fallback={
                      <Box h="180px" bg={T.blue50} borderRadius="12px"
                        display="flex" alignItems="center" justifyContent="center">
                        <Icon as={GiChefToque} boxSize={12} color={T.blue200} />
                      </Box>
                    }
                  />

                  <Flex align="center" justify="space-between">
                    <Text fontSize="13px" color="gray.400" flex={1} noOfLines={2}>
                      {galleryDish.description || 'Premium quality dish'}
                    </Text>
                    <Badge
                      bg={T.blue900} color="white"
                      fontFamily="'Space Grotesk',sans-serif"
                      fontSize="14px" fontWeight="700"
                      px={3} py={1} borderRadius="8px" ml={3}
                    >
                      ₹{galleryDish.price}
                    </Badge>
                  </Flex>

                  <FormControl isRequired>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Table Number</FormLabel>
                    <Input {...inputStyle} type="number" placeholder="e.g. 5"
                      value={galleryTable} onChange={e => setGalleryTable(e.target.value)} />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Quantity</FormLabel>
                    <Input {...inputStyle} type="number" min="1" placeholder="e.g. 2"
                      value={galleryQty} onChange={e => setGalleryQty(e.target.value)} />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="10px" fontWeight="600" color="gray.400"
                      textTransform="uppercase" letterSpacing="0.6px">Modifications</FormLabel>
                    <Input {...inputStyle} placeholder="e.g. no onions, extra spicy (comma separated)"
                      value={galleryMods} onChange={e => setGalleryMods(e.target.value)} />
                  </FormControl>

                  {gallerySuccess && (
                    <Alert status="success" borderRadius="10px" bg={T.teal50}>
                      <AlertIcon color={T.teal600} />
                      <Text fontSize="13px" color={T.teal600} fontWeight="500">Order placed successfully!</Text>
                    </Alert>
                  )}
                  {galleryError && (
                    <Alert status="error" borderRadius="10px" fontSize="12px">
                      <AlertIcon />{galleryError}
                    </Alert>
                  )}
                </VStack>
              )}
            </ModalBody>

            <ModalFooter gap={3} borderTop={`0.5px solid rgba(24,95,165,0.08)`}>
              <Button variant="ghost" onClick={() => setGalleryDish(null)}
                fontSize="13px" borderRadius="10px" color="gray.500">
                Cancel
              </Button>
              <Button
                type="submit" bg={T.blue600} color="white"
                _hover={{ bg: T.blue800 }} borderRadius="10px" fontSize="13px"
                leftIcon={<FaCheck size={11} />}
              >
                Place Order
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
};

export default OrdersPage;