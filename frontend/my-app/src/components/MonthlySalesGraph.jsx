import { useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useToken,
} from '@chakra-ui/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function MonthlySalesGraph({ orders = [] }) {
  const INR = '\u20B9';
  const [blue500, blue600, blue50, gray600, gray200, gray900, white] = useToken('colors', [
    'blue.500',
    'blue.600',
    'blue.50',
    'gray.600',
    'gray.200',
    'gray.900',
    'white',
  ]);

  const monthlyData = useMemo(() => {
    const data = [];
    const currentDate = new Date();
    const safeOrders = Array.isArray(orders) ? orders : [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });

      const monthSales = safeOrders
        .filter((order) => {
          const orderDate = new Date(order?.createdAt);
          return orderDate.getMonth() === targetDate.getMonth() && orderDate.getFullYear() === targetDate.getFullYear();
        })
        .reduce((sum, order) => sum + (order?.totalAmount || 0), 0);

      data.push({ month: monthName, sales: monthSales });
    }

    return data;
  }, [orders]);

  const totalSales = useMemo(() => monthlyData.reduce((sum, item) => sum + (item.sales || 0), 0), [monthlyData]);
  const avgSales = monthlyData.length > 0 ? totalSales / monthlyData.length : 0;
  const latestMonth = monthlyData.at(-1);
  const previousMonth = monthlyData.length >= 2 ? monthlyData.at(-2) : null;

  const insight = useMemo(() => {
    if (!latestMonth || !previousMonth) return 'Track sales across months to spot trends early.';
    if ((latestMonth.sales || 0) > (previousMonth.sales || 0)) return 'Sales are trending upward this month.';
    if ((latestMonth.sales || 0) < (previousMonth.sales || 0)) return 'Sales dipped compared to last month — consider promotions.';
    return 'Sales are steady month-over-month.';
  }, [latestMonth, previousMonth]);

  return (
    <Card variant="outline" borderColor="blue.100" bg="white">
      <CardHeader pb={3}>
        <Heading size="sm" color="blue.700">
          Monthly Sales
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Last 6 months performance
        </Text>
      </CardHeader>
      <CardBody pt={0}>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={4}>
          <Stat bg="blue.50" borderRadius="lg" px={4} py={3} borderWidth="1px" borderColor="blue.100">
            <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
              Total Sales
            </StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: 'xl' }} color="blue.700">
              {INR}{Math.round(totalSales).toLocaleString('en-IN')}
            </StatNumber>
          </Stat>

          <Stat bg="white" borderRadius="lg" px={4} py={3} borderWidth="1px" borderColor="blue.100">
            <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
              Average / Month
            </StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: 'xl' }} color="gray.900">
              {INR}{Math.round(avgSales).toLocaleString('en-IN')}
            </StatNumber>
          </Stat>

          <Stat bg="white" borderRadius="lg" px={4} py={3} borderWidth="1px" borderColor="blue.100">
            <StatLabel color="gray.600" fontSize="xs" fontWeight="semibold">
              Months Tracked
            </StatLabel>
            <StatNumber fontSize={{ base: 'lg', md: 'xl' }} color="gray.900">
              {monthlyData.length}
            </StatNumber>
          </Stat>
        </SimpleGrid>

        <Box borderWidth="1px" borderColor="blue.100" borderRadius="lg" overflow="hidden">
          <Box px={4} py={3} bg="blue.50">
            <Text fontSize="sm" fontWeight="semibold" color="blue.700">
              Sales trend
            </Text>
          </Box>
          <Box px={2} py={2} bg="white">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={blue600} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={blue50} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gray200} />
                <XAxis dataKey="month" tick={{ fill: gray600, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: gray600, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${INR}${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => `${INR}${Number(v || 0).toLocaleString('en-IN')}`}
                  contentStyle={{
                    background: white,
                    borderRadius: 10,
                    border: `1px solid ${gray200}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    fontWeight: 600,
                    color: gray900,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={blue500}
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  dot={{ fill: blue500, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, stroke: blue500, strokeWidth: 2, fill: white }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Divider my={4} />
        <Box>
          <Text fontSize="xs" color="gray.600" fontWeight="semibold" mb={1}>
            Insight
          </Text>
          <Text fontSize="sm" color="gray.900">
            {insight}
          </Text>
        </Box>
      </CardBody>
    </Card>
  );
} 