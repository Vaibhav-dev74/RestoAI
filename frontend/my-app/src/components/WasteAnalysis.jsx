import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  HStack,
  List,
  ListItem,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function WasteAnalysis({ restaurantId, userRole }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-load waste analysis on component mount
  useEffect(() => {
    if (restaurantId) {
      fetchWasteAnalysis();
    }
  }, [restaurantId]);

  const fetchWasteAnalysis = async () => {
    setLoading(true);
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
      
      // Fixed API endpoint - using the correct route
      const response = await axios.post(
        `${API_URL}/api/ai/waste-analysis`, // Changed from /api/orders/wasteanalyze
        {
          voiceInput: "Analyze food waste patterns and provide recommendations",
          weather: "sunny"
        },
        { 
          headers,
          timeout: 15000
        }
      );

      // Validate response structure
      if (response.data) {
        // Ensure data has the expected structure
        const validatedData = {
          wastePrediction: Array.isArray(response.data.wastePrediction) ? response.data.wastePrediction : [],
          doNotMake: Array.isArray(response.data.doNotMake) ? response.data.doNotMake : [],
          generalTips: Array.isArray(response.data.generalTips) ? response.data.generalTips : []
        };
        
        setAnalysis(validatedData);
      } else {
        throw new Error('Invalid response format from server');
      }
      setLoading(false);
    } catch (err) {
      console.error('Waste analysis error:', err);
      
      // Fallback data when API fails
      const fallbackAnalysis = {
        wastePrediction: [
          {
            item: "Fresh Vegetables",
            suggestedPrep: "Reduce by 30%",
            reason: "Historical data shows 30% waste rate for vegetables on sunny days"
          },
          {
            item: "Dairy Products",
            suggestedPrep: "Order 50% less",
            reason: "Short shelf life and low demand in current weather"
          }
        ],
        doNotMake: [
          {
            item: "Cream-based Desserts",
            reason: "High spoilage risk in current temperature"
          }
        ],
        generalTips: [
          "Implement FIFO (First In First Out) inventory system",
          "Monitor fridge temperatures regularly",
          "Train staff on proper food storage techniques"
        ]
      };
      
      setAnalysis(fallbackAnalysis);
      setError('AI analysis unavailable - showing fallback data');
      setLoading(false);
    }
  };

  const getNotificationCount = () => {
    if (!analysis) return 0;
    return (analysis.wastePrediction?.length || 0) + (analysis.doNotMake?.length || 0);
  };

  const getAllAlerts = () => {
    if (!analysis) return [];
    const alerts = [];
    
    if (analysis.wastePrediction) {
      analysis.wastePrediction.forEach(item => {
        alerts.push({ 
          ...item, 
          type: 'waste', 
          priority: 'high',
          name: item.item,
          description: item.reason,
          action: item.suggestedPrep
        });
      });
    }
    
    if (analysis.doNotMake) {
      analysis.doNotMake.forEach(item => {
        alerts.push({ 
          ...item, 
          type: 'avoid', 
          priority: 'medium',
          name: item.item,
          description: item.reason,
          action: 'Avoid preparation'
        });
      });
    }
    
    return alerts;
  };

  const handleAction = (action, item) => {
    console.log(`${action} for ${item.name || item.item}`);
    
    const actionMessages = {
      reduce: `Reduced preparation quantity for ${item.name}`,
      substitute: `Finding substitutes for ${item.name}`,
      ignore: `Ignored alert for ${item.name}`,
      implement: `Implementing suggestion for ${item.name}`
    };
    
    alert(actionMessages[action] || `Action taken for ${item.name}`);
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'waste': return '🚨';
      case 'avoid': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getAlertBadgeScheme = (type) => {
    switch (type) {
      case 'waste':
        return 'red';
      case 'avoid':
        return 'orange';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <Card variant="outline" borderColor="blue.100" bg="white">
        <CardBody>
          <HStack spacing={3}>
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="sm" color="gray.600" fontWeight="semibold">
              Analyzing waste patterns…
            </Text>
          </HStack>
          <Progress mt={3} size="sm" isIndeterminate colorScheme="blue" borderRadius="md" />
        </CardBody>
      </Card>
    );
  }

  if (error && !analysis) {
    return (
      <Card variant="outline" borderColor="blue.100" bg="white">
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Heading size="sm" color="blue.700">
              Waste Analysis
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {error}
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <Button size="sm" colorScheme="blue" onClick={fetchWasteAnalysis}>
                Retry analysis
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={() => {
                  const fallbackAnalysis = {
                    wastePrediction: [
                      {
                        item: 'All perishable items',
                        suggestedPrep: 'Reduce by 25%',
                        reason: 'Conservative estimate while system recovers',
                      },
                    ],
                    doNotMake: [
                      {
                        item: 'High-risk items',
                        reason: 'Temporary system issue - proceed with caution',
                      },
                    ],
                    generalTips: ['Monitor inventory daily', 'Use older stock first', 'Train staff on portion control'],
                  };
                  setAnalysis(fallbackAnalysis);
                  setError('');
                }}
              >
                Use fallback
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const alerts = getAllAlerts();
  const totalAlerts = alerts.length;

  const current = alerts[currentSlide] || null;

  return (
    <Box>
      <Card variant="outline" borderColor="blue.100" bg="white" mb={4}>
        <CardHeader pb={3} bg="blue.50">
          <HStack spacing={3} flexWrap="wrap">
            <Box>
              <Heading size="sm" color="blue.700">
                Waste Analysis
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {totalAlerts > 0 ? `${totalAlerts} alerts detected` : 'No waste alerts'}
                {error ? ' • Using fallback data' : ''}
              </Text>
            </Box>
            <Box flex="1" />
            {totalAlerts > 1 ? (
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  isDisabled={currentSlide === 0}
                >
                  ←
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => setCurrentSlide(Math.min(totalAlerts - 1, currentSlide + 1))}
                  isDisabled={currentSlide === totalAlerts - 1}
                >
                  →
                </Button>
              </HStack>
            ) : null}
          </HStack>
        </CardHeader>
        <CardBody>
          {totalAlerts > 0 && current ? (
            <Stack spacing={3}>
              <HStack spacing={3} align="start">
                <Box fontSize="lg" lineHeight="1">
                  {getAlertIcon(current.type)}
                </Box>
                <Box flex="1">
                  <HStack spacing={2} flexWrap="wrap">
                    <Heading size="sm" color="gray.900">
                      {current.name}
                    </Heading>
                    <Badge colorScheme={getAlertBadgeScheme(current.type)} variant="subtle">
                      {current.type === 'waste' ? 'High waste risk' : 'Avoid preparation'}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {current.description}
                  </Text>
                </Box>
              </HStack>

              {current.action ? (
                <Box borderWidth="1px" borderColor="blue.100" bg="blue.50" borderRadius="lg" px={4} py={3}>
                  <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                    Recommended action
                  </Text>
                  <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                    {current.action}
                  </Text>
                </Box>
              ) : null}

              <HStack spacing={3} flexWrap="wrap">
                <Button size="sm" colorScheme="blue" onClick={() => handleAction('reduce', current)}>
                  Reduce quantity
                </Button>
                <Button size="sm" variant="outline" colorScheme="blue" onClick={() => handleAction('substitute', current)}>
                  Find substitute
                </Button>
                <Button size="sm" variant="outline" colorScheme="blue" onClick={() => handleAction('implement', current)}>
                  Implement
                </Button>
              </HStack>
            </Stack>
          ) : (
            <VStack spacing={2} py={3}>
              <Text fontSize="lg">✅</Text>
              <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                No waste alerts
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                All items are within safe waste prediction limits.
              </Text>
            </VStack>
          )}
        </CardBody>
      </Card>

      {analysis?.generalTips && analysis.generalTips.length > 0 ? (
        <Card variant="outline" borderColor="blue.100" bg="white" mb={4}>
          <CardHeader pb={3}>
            <Heading size="sm" color="blue.700">
              Waste reduction tips
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Practical steps for daily operations
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <List spacing={2}>
              {analysis.generalTips.map((tip, index) => (
                <ListItem key={index}>
                  <Text fontSize="sm" color="gray.900">
                    • {tip}
                  </Text>
                </ListItem>
              ))}
            </List>
          </CardBody>
        </Card>
      ) : null}

      {totalAlerts > 1 ? (
        <HStack justify="center" spacing={2} mb={3}>
          {alerts.map((_, index) => (
            <Box
              key={index}
              width="8px"
              height="8px"
              borderRadius="full"
              bg={index === currentSlide ? 'blue.500' : 'blue.100'}
              cursor="pointer"
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </HStack>
      ) : null}

      <HStack justify="center">
        <Button size="sm" colorScheme="blue" onClick={fetchWasteAnalysis} isDisabled={loading}>
          Refresh analysis
        </Button>
      </HStack>
    </Box>
  );
}