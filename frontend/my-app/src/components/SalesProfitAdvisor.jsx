import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API_BASE_URL } from '../config/apiBaseUrl';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Spacer,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
  Text,
  VStack,
  useToken,
} from '@chakra-ui/react';

const API_URL = API_BASE_URL;

export default function SalesProfitAdvisor({ restaurantId, userRole, orders = [] }) {
  const INR = '\u20B9';
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [realTimeData, setRealTimeData] = useState(true);
  const [blue500, blue200, blue50, gray600, gray200, gray900, white] = useToken('colors', [
    'blue.500',
    'blue.200',
    'blue.50',
    'gray.600',
    'gray.200',
    'gray.900',
    'white',
  ]);

  // Calculate dynamic sales data from actual orders
  const calculateSalesData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todaySales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdaySales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= yesterday && orderDate < today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekSales = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= lastWeek && orderDate < today;
      })
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0) / 7;

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      lastWeekAvg: Math.round(lastWeekSales),
      comparison: todaySales > 0 && yesterdaySales > 0 ? 
        ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1) : 0
    };
  };

  const salesData = calculateSalesData();
  
  const getChartData = () => {
    switch(timeRange) {
      case 'week':
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData = weekDays.map((day, index) => {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - (6 - index));
          const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          
          const daySales = orders
            .filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= dayStart && orderDate < dayEnd;
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
          return {
            name: day,
            Sales: daySales || 0,
            fill: index === 6 ? '#6366f1' : '#fbbf24'
          };
        });
        return weekData;

      case 'month':
        const monthData = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() - i);
          
          const daySales = orders
            .filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate.getDate() === targetDate.getDate() && 
                     orderDate.getMonth() === targetDate.getMonth() &&
                     orderDate.getFullYear() === targetDate.getFullYear();
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            
          monthData.push({
            name: targetDate.getDate().toString(),
            Sales: daySales,
            fill: i === 0 ? '#6366f1' : '#fbbf24'
          });
        }
        return monthData;

      default:
        return [
          { name: 'Yesterday', Sales: salesData.yesterday, fill: '#fbbf24' },
          { name: 'Today', Sales: salesData.today, fill: '#6366f1' },
        ];
    }
  };

  const chartData = getChartData();

  // Always keep numbers dynamic from live orders
  useEffect(() => {
    const calculatedAnalysis = calculateProfitFromOrders();
    setAnalysis(calculatedAnalysis);
    setLoading(false);
  }, [orders, timeRange]);

  useEffect(() => {
    if (!realTimeData) return;
    
    const interval = setInterval(() => {
      if (orders.length > 0) {
        const updatedAnalysis = calculateProfitFromOrders();
        setAnalysis(prev => ({
          ...prev,
          ...updatedAnalysis
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeData, orders]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [loading]);

  const calculateProfitFromOrders = () => {
    const currentSalesData = calculateSalesData();
    let totalCost = 0;
    let totalRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders
      .filter(order => new Date(order.createdAt) >= today)
      .forEach(order => {
        totalRevenue += order.totalAmount || 0;
        totalCost += (order.totalAmount || 0) * 0.6;
      });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const tips = generateDynamicTips(currentSalesData, profitMargin, orders);

    return {
      profit: `${INR}${Math.max(0, profit).toLocaleString('en-IN')}`,
      totalSales: `${INR}${totalRevenue.toLocaleString('en-IN')}`,
      tip: tips,
      profitMargin: Math.round(profitMargin),
      comparison: currentSalesData.comparison
    };
  };

  const generateDynamicTips = (salesData, profitMargin, orders) => {
    const tips = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const avgOrderValue = todayOrders.length > 0 ? salesData.today / todayOrders.length : 0;

    if (salesData.comparison > 0) {
      tips.push(`Great! Sales are up ${salesData.comparison}% from yesterday - maintain this momentum`);
    } else if (salesData.comparison < 0) {
      tips.push(`Sales are down ${Math.abs(salesData.comparison)}% from yesterday - consider promotions`);
    }

    if (profitMargin < 20) {
      tips.push(`Low profit margin (${Math.round(profitMargin)}%) - focus on high-margin items and reduce waste`);
    } else if (profitMargin > 35) {
      tips.push(`Excellent profit margin (${Math.round(profitMargin)}%) - consider reinvesting in quality improvements`);
    }

    if (avgOrderValue < 500) {
      tips.push(`Low average order value (${INR}${Math.round(avgOrderValue)}) - train staff on upselling techniques`);
    }

    const currentHour = new Date().getHours();
    if (currentHour >= 14 && currentHour <= 17 && salesData.today < salesData.lastWeekAvg) {
      tips.push(`Slow afternoon hours - consider offering happy hour specials`);
    }

    if (todayOrders.length > 0) {
      const popularItems = {};
      todayOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            popularItems[item.name] = (popularItems[item.name] || 0) + (item.quantity || 1);
          });
        }
      });
      
      const mostPopular = Object.entries(popularItems).sort((a, b) => b[1] - a[1])[0];
      if (mostPopular) {
        tips.push(`"${mostPopular[0]}" is your bestseller today - ensure adequate stock`);
      }
    }

    return tips.length > 0 ? tips.join('. ') : 
      'Focus on customer experience and quality consistency to drive repeat business';
  };

  const fetchProfitAnalysis = async () => {
    setLoading(true);
    setProgress(0);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const recentOrders = orders
        .filter(order => new Date(order.createdAt) >= today)
        .slice(0, 100);

      // Fixed API endpoint
      const response = await axios.post(
        `${API_URL}/api/ai/sales-profit-advisor`, // Changed from /api/ai/salesprofit
        {
          voiceInput: `Analyze sales performance for ${timeRange} with ${recentOrders.length} orders`,
          restaurantId: restaurantId,
          orders: recentOrders,
          timeRange: timeRange,
          currentSales: salesData.today
        },
        { 
          headers,
          timeout: 15000
        }
      );

      if (response.data && (response.data.profit || response.data.totalSales)) {
        setAnalysis(response.data);
      } else {
        setAnalysis(calculateProfitFromOrders());
      }
      setLoading(false);
    } catch (err) {
      console.error('Profit analysis error:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Using calculated data.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Using calculated data.');
      } else {
        setError('AI analysis unavailable - using calculated data');
      }
      
      setAnalysis(calculateProfitFromOrders());
      setLoading(false);
    }
  };

  const calculateProfitPercentage = () => {
    if (!analysis) return 0;
    
    try {
      if (analysis.profitMargin !== undefined) {
        return analysis.profitMargin;
      }

      const salesText = analysis.totalSales || '0';
      const profitText = analysis.profit || '0';
      
      const sales = parseInt(salesText.toString().replace(/[^\d-]/g, ''), 10) || 0;
      const profit = parseInt(profitText.toString().replace(/[^\d-]/g, ''), 10) || 0;
      
      if (sales === 0) return 0;
      return Math.round((profit / sales) * 100);
    } catch (error) {
      console.error('Error calculating profit percentage:', error);
      return 0;
    }
  };

  const getProfitColor = (percentage) => {
    if (percentage >= 35) return 'green.500';
    if (percentage >= 20) return 'orange.400';
    return 'red.500';
  };

  const formatCurrency = (amount) => {
    if (typeof amount === 'number') {
      return `${INR}${amount.toLocaleString('en-IN')}`;
    }
    return amount || `${INR}0`;
  };

  if (error && !analysis) {
    return (
      <Card variant="outline" borderColor="blue.100" bg="white">
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Heading size="sm" color="blue.700">
              Profit Advisor
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {error}
            </Text>
            <Button colorScheme="blue" size="sm" onClick={fetchProfitAnalysis} alignSelf="flex-start">
              Retry analysis
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      <HStack spacing={3} mb={4} flexWrap="wrap">
        <Box>
          <Heading size="sm" color="blue.700">
            Profit Advisor
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Sales + margin overview
          </Text>
        </Box>
        <Spacer />

        <HStack spacing={3} flexWrap="wrap">
          <FormControl display="flex" alignItems="center" width="auto">
            <FormLabel htmlFor="profit-live" mb="0" fontSize="sm" color="gray.600" fontWeight="semibold">
              Live
            </FormLabel>
            <Switch
              id="profit-live"
              colorScheme="blue"
              isChecked={realTimeData}
              onChange={() => setRealTimeData((v) => !v)}
            />
          </FormControl>

          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            size="sm"
            bg="white"
            borderColor="blue.100"
            width={{ base: 'full', sm: '220px' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">Last 30 Days</option>
          </Select>
        </HStack>
      </HStack>

      <Card variant="outline" borderColor="blue.100" bg="white" mb={4} overflow="hidden">
        <CardHeader pb={3} bg="blue.50">
          <HStack align="start" spacing={3}>
            <Box>
              <Heading size="sm" color="blue.700">
                Sales Performance
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {timeRange === 'today' ? 'Today vs yesterday' : timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </Text>
            </Box>
            <Spacer />
            {error ? (
              <Badge colorScheme="orange" variant="subtle">
                Calculated data
              </Badge>
            ) : null}
          </HStack>
          {salesData.comparison !== 0 && (
            <Stat mt={3}>
              <StatHelpText mb={0} color="gray.600" fontWeight="semibold">
                {salesData.comparison > 0 ? 'Up' : 'Down'} {Math.abs(salesData.comparison)}% from yesterday
              </StatHelpText>
            </Stat>
          )}
        </CardHeader>

        <CardBody pt={3}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={timeRange === 'today' ? 44 : 26}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gray200} />
              <XAxis dataKey="name" tick={{ fill: gray600, fontWeight: 600, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: gray600, fontWeight: 600, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${INR}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [`${INR}${Number(value || 0).toLocaleString('en-IN')}`, 'Sales']}
                contentStyle={{
                  background: white,
                  borderRadius: 10,
                  border: `1px solid ${gray200}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  fontWeight: 600,
                  color: gray900,
                }}
              />
              <Bar dataKey="Sales" radius={[6, 6, 0, 0]} fill={blue500} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <Card variant="outline" borderColor="blue.100" bg="white">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm" fontWeight="semibold">
                Today’s Sales
              </StatLabel>
              <StatNumber color="blue.700" fontSize={{ base: 'xl', md: '2xl' }}>
                {formatCurrency(salesData.today)}
              </StatNumber>
              <StatHelpText color="gray.600" mb={0}>
                Orders since midnight
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card variant="outline" borderColor="blue.100" bg="white">
          <CardBody>
            <Stat>
              <StatLabel color="gray.600" fontSize="sm" fontWeight="semibold">
                Daily Average (7 days)
              </StatLabel>
              <StatNumber color="gray.900" fontSize={{ base: 'xl', md: '2xl' }}>
                {formatCurrency(salesData.lastWeekAvg)}
              </StatNumber>
              <StatHelpText color="gray.600" mb={0}>
                Rolling baseline
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card variant="outline" borderColor="blue.100" bg="white" mb={4}>
        <CardHeader pb={3}>
          <Heading size="sm" color="blue.700">
            Profit Snapshot
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Estimated from orders (cost assumed at 60%)
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          {loading ? (
            <Box mb={3}>
              <Progress value={progress} size="sm" colorScheme="blue" borderRadius="md" />
              <Text mt={2} fontSize="sm" color="gray.600">
                Analyzing… {progress}%
              </Text>
            </Box>
          ) : null}

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <Stat bg="blue.50" borderWidth="1px" borderColor="blue.100" borderRadius="lg" px={4} py={3}>
              <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
                Profit
              </StatLabel>
              <StatNumber color={getProfitColor(calculateProfitPercentage())} fontSize={{ base: 'xl', md: '2xl' }}>
                {analysis?.profit || '₹0'}
              </StatNumber>
            </Stat>

            <Stat bg="white" borderWidth="1px" borderColor="blue.100" borderRadius="lg" px={4} py={3}>
              <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
                Total Sales
              </StatLabel>
              <StatNumber color="blue.700" fontSize={{ base: 'xl', md: '2xl' }}>
                {analysis?.totalSales || '₹0'}
              </StatNumber>
            </Stat>

            <Stat bg="white" borderWidth="1px" borderColor="blue.100" borderRadius="lg" px={4} py={3}>
              <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
                Margin
              </StatLabel>
              <StatNumber color={getProfitColor(calculateProfitPercentage())} fontSize={{ base: 'xl', md: '2xl' }}>
                {calculateProfitPercentage()}%
              </StatNumber>
            </Stat>
          </SimpleGrid>

          <Divider my={4} />

          <HStack spacing={3} flexWrap="wrap">
            {analysis?.tip && !loading ? (
              <Button colorScheme="blue" variant="outline" size="sm" onClick={() => setShowTipModal(true)}>
                View smart tips
              </Button>
            ) : null}
            <Button colorScheme="blue" size="sm" onClick={fetchProfitAnalysis} isDisabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze'}
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Modal isOpen={showTipModal && !!analysis?.tip} onClose={() => setShowTipModal(false)} isCentered size={{ base: 'full', sm: 'lg' }}>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: 0, sm: 'xl' }}>
          <ModalHeader>
            <Heading size="sm" color="blue.700">
              Smart profit tips
            </Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Based on your current performance
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={3} maxH={{ base: 'calc(100vh - 200px)', sm: '360px' }} overflowY="auto">
              {(analysis?.tip || '')
                .split('.')
                .map((p) => p.trim())
                .filter(Boolean)
                .map((point, index) => (
                  <Box key={index} borderWidth="1px" borderColor="blue.100" bg="blue.50" borderRadius="lg" px={4} py={3}>
                    <Text fontSize="sm" color="gray.900" fontWeight="medium" lineHeight="tall">
                      {point}
                    </Text>
                  </Box>
                ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}