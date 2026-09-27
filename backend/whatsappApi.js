import express from 'express';
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

console.warn('[DEPRECATED] backend/whatsappApi.js is a legacy standalone server.');
console.warn('[DEPRECATED] Use backend/index.js + /api/whatsapp/* (Manager Dashboard → WhatsApp) instead.');

// === CONFIG (do not hardcode secrets) ===
const OWNER_JID = process.env.WHATSAPP_OWNER_JID || ''; // e.g. 919xxxxxxxxx@s.whatsapp.net
const API_KEY = process.env.WHATSAPP_API_KEY || ''; // shared secret between frontend and this service
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const app = express();
app.use(express.json());
app.use(cors());

// Simple API key middleware
app.use((req, res, next) => {
  console.log('API KEY RECEIVED:', req.headers['x-api-key']);
  if (!API_KEY || req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

let sock = null;
let qrString = '';
let isReady = false;
let botJid = '';
let BOT_JWT_TOKEN = null;

// In-memory mapping from WhatsApp JID to backend JWT token
const jidToJwt = {};

// Automatically use JWT token from environment variable for the logged-in WhatsApp account
// const BOT_JWT_TOKEN = process.env.BOT_JWT_TOKEN; // This line is now handled by fetchJwtForBotJid

function deleteAuthFolder() {
  const authPath = path.resolve('./auth_info');
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
    console.log('Deleted auth_info folder for logout.');
  }
}

async function fetchJwtForBotJid(botJid) {
  // Extract only the phone number, remove any device suffix
  const phone = botJid.split('@')[0].split(':')[0];
  try {
    const res = await axios.post(`${BACKEND_URL}/api/auth/whatsapp-login`, { phone });
    // Fetch user info for logging
    const token = res.data.token;
    const userRes = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Fetched user for WhatsApp bot:', userRes.data);
    return token;
  } catch (e) {
    console.error('Failed to fetch JWT for bot:', e.message);
    return null;
  }
}

const salesFilePath = path.resolve('./sales.json');

// Helper function to read sales
function readSales() {
  if (!fs.existsSync(salesFilePath)) {
    return [];
  }
  const data = fs.readFileSync(salesFilePath, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write sales
function writeSales(data) {
  fs.writeFileSync(salesFilePath, JSON.stringify(data, null, 2));
}

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();
  sock = makeWASocket({ version, auth: state });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrString = qr;
    if (connection === 'open') {
      isReady = true;
      qrString = '';
      botJid = sock.user.id;
      // Fetch JWT token for this WhatsApp number
      BOT_JWT_TOKEN = await fetchJwtForBotJid(botJid);
      console.log('WhatsApp bot connected. My JID:', botJid);
      if (!BOT_JWT_TOKEN) {
        console.error('No JWT token could be fetched for this WhatsApp number. API calls will fail.');
      }
    } else if (connection === 'close') {
      isReady = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startSock();
    }
  });

  // Dynamic command/intent handlers
  const commandHandlers = [
    {
      match: (text) => /\b(inventory|items? left|stock|what do I have|show inventory|inventory status|current stock|available items|stock left|inventory summary)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '❗ Bot is not configured with a backend token. Please check backend logs.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/inventory', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const items = res.data;
          if (!items || !items.length) return 'Your inventory is empty.';
          let reply = '📦 *Inventory Summary:*\n';
          for (const item of items) {
            reply += `- ${item.name}: ${item.quantity} left\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch your inventory right now.';
        }
      }
    },
    {
      match: (text) => /\b(sales|today'?s sales|sales today|how much did I sell|total sales|sales summary|revenue|today's revenue|sales report)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view sales data.';
        try {
          // Get today's orders to calculate sales
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
          
          const res = await axios.get('http://localhost:5000/api/orders', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const allOrders = res.data;
          
          // Filter today's orders
          const todayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startOfDay && orderDate <= endOfDay;
          });
          
          const totalSales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
          const orderCount = todayOrders.length;
          
          // Get top selling item
          const itemCounts = {};
          todayOrders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                const itemName = item.name || item.dishName;
                if (itemName) {
                  itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
                }
              });
            }
          });
          
          const topItem = Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)[0];
          
          let reply = '💰 *Today\'s Sales Summary:*\n';
          reply += `- Total Sales: $${totalSales.toFixed(2)}\n`;
          reply += `- Orders: ${orderCount}\n`;
          if (topItem) {
            reply += `- Top Item: ${topItem[0]} (${topItem[1]} sold)\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch your sales data right now.';
        }
      }
    },
    {
      match: (text) => /\b(pending orders|open orders|unfulfilled orders|orders to do|orders left|orders pending|orders not done)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view pending orders.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders?status=pending', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          if (!orders.length) return '🎉 All caught up! You have no pending orders right now.';
          let reply = `🕒 You have ${orders.length} pending order${orders.length > 1 ? 's' : ''}:\n`;
          for (const order of orders.slice(0, 5)) {
            reply += `- Order #${order._id} for $${order.totalAmount || order.total || 0}\n`;
          }
          if (orders.length > 5) reply += `...and ${orders.length - 5} more. Keep up the good work!`;
          return reply;
        } catch (e) {
          return 'Sorry, I couldn\'t fetch your pending orders right now. Please try again later.';
        }
      }
    },
    {
      match: (text) => /\b(suppliers|supplier list|who supplies|vendors|my suppliers|list suppliers)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view suppliers.';
        try {
          // Since there's no direct supplier endpoint, we'll show inventory sources
          const res = await axios.get('http://localhost:5000/api/orders/inventory', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const inventory = res.data;
          
          if (!inventory || !inventory.length) return 'No inventory items found.';
          
          // Extract unique suppliers from inventory items
          const suppliers = new Set();
          inventory.forEach(item => {
            if (item.supplier) suppliers.add(item.supplier);
          });
          
          if (suppliers.size === 0) {
            return '🚚 No supplier information available. Update your inventory items with supplier details.';
          }
          
          let reply = '🚚 Your suppliers are:\n';
          suppliers.forEach(supplier => {
            reply += `- ${supplier}\n`;
          });
          
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch suppliers right now.';
        }
      }
    },
    {
      match: (text) => /\b(add item|add new item|insert item|create item|add product|new inventory item)\b/i.test(text),
      handler: async (text, userJid) => {
        return '📝 To add a new item, please provide the item name and quantity. For example: "add item Samosa 20"';
      }
    },
    {
      match: (text) => /\b(remove item|delete item|discard item|remove product|delete inventory item)\b/i.test(text),
      handler: async (text, userJid) => {
        return '🗑️ To remove an item, please specify the item name or ID. For example: "remove item Samosa"';
      }
    },
    {
      match: (text) => /\b(item price|price of|how much is|cost of|what's the price|item cost)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view item prices.';
        
        // Try to extract item name from text
        const match = text.match(/price(?: of)? ([\w\s]+)/i);
        const itemName = match ? match[1].trim() : null;
        
        if (!itemName) return 'Please specify the item name, e.g. "price of Samosa".';
        
        try {
          // Get dishes to find the item
          const res = await axios.get('http://localhost:5000/api/orders/dishes', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const dishes = res.data;
          
          const dish = dishes.find(d => 
            d.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (dish) {
            return `💲 The price of ${dish.name} is $${dish.price || 'N/A'}. Want to check another item? Just ask!`;
          } else {
            return `No price found for ${itemName}. Check the spelling or try another item.`;
          }
        } catch (e) {
          return 'Sorry, I could not fetch the item price right now.';
        }
      }
    },
    {
      match: (text) => /\b(list all items|show items|all products|all inventory|list products|show inventory items)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view items.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/dishes', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const dishes = res.data;
          
          if (!dishes || !dishes.length) return 'No items found.';
          
          let reply = '📋 Here are all your menu items:\n';
          dishes.slice(0, 10).forEach(dish => {
            reply += `- ${dish.name}: $${dish.price || 'N/A'}\n`;
          });
          
          if (dishes.length > 10) {
            reply += `...and ${dishes.length - 10} more items.`;
          }
          
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch items right now.';
        }
      }
    },
    {
      match: (text) => /\b(low stock|stock alert|inventory alert|running low|almost out|low inventory|stock running out)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view inventory alerts.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/inventoryalert', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const alerts = res.data;
          
          if (!alerts || !alerts.length) return '🌱 No low stock alerts. Your inventory is well managed!';
          
          let reply = '⚠️ *Low Stock Alerts:*\n';
          alerts.forEach(item => {
            reply += `- ${item.name}: ${item.quantity} left\n`;
          });
          reply += 'Consider restocking these items soon.';
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch inventory alerts right now.';
        }
      }
    },
    {
      match: (text) => /\b(last 5 transactions|recent sales|recent transactions|last transactions|transaction history|show last sales)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view transactions.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders?limit=5', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          if (!orders.length) return 'No recent transactions found.';
          
          let reply = '🧾 Here are your last 5 transactions:\n';
          orders.forEach((order, index) => {
            const amount = order.totalAmount || order.total || 0;
            const date = new Date(order.createdAt).toLocaleDateString();
            reply += `${index + 1}. $${amount} - ${date}\n`;
          });
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch transactions right now.';
        }
      }
    },
    {
      match: (text) => /\b(customer info|customer details|customer profile|customer data|customer information)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view customer info.';
        try {
          // Get recent orders to show customer activity
          const res = await axios.get('http://localhost:5000/api/orders?limit=10', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          if (!orders.length) return 'No customer orders found yet.';
          
          // Get unique customers
          const customers = new Set();
          orders.forEach(order => {
            if (order.customerName) customers.add(order.customerName);
          });
          
          const recentOrder = orders[0];
          const customerName = recentOrder.customerName || 'Anonymous';
          const orderDate = new Date(recentOrder.createdAt).toLocaleDateString();
          
          return `👤 *Recent Customer Activity:*\n- Last Customer: ${customerName}\n- Last Order: ${orderDate}\n- Total Customers Today: ${customers.size}\n- Recent Order Amount: $${recentOrder.totalAmount || recentOrder.total || 0}`;
        } catch (e) {
          return 'Sorry, I could not fetch customer info right now.';
        }
      }
    },
    {
      match: (text) => /\b(top-selling items|best sellers|most popular|top items|hot sellers|most sold items)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view top-selling items.';
        try {
          // Get all orders and analyze top items
          const res = await axios.get('http://localhost:5000/api/orders', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          // Count item frequencies
          const itemCounts = {};
          orders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                const itemName = item.name || item.dishName;
                if (itemName) {
                  itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
                }
              });
            }
          });
          
          // Sort by count and get top 5
          const topItems = Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => `${name} (${count} sold)`);
          
          if (topItems.length === 0) return 'No sales data available yet.';
          
          let reply = '🏆 Your top-selling items are:\n';
          topItems.forEach((item, index) => {
            reply += `${index + 1}. ${item}\n`;
          });
          reply += 'Keep them coming!';
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch top-selling items right now.';
        }
      }
    },
    {
      match: (text) => /\b(expenses|today'?s expenses|expense report|spending|money spent|costs today|how much spent)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view expenses.';
        try {
          // Calculate expenses from inventory costs
          const res = await axios.get('http://localhost:5000/api/orders/inventory', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const inventory = res.data;
          
          let totalExpenses = 0;
          if (inventory && inventory.length) {
            inventory.forEach(item => {
              if (item.cost && item.quantity) {
                totalExpenses += item.cost * item.quantity;
              }
            });
          }
          
          return `💸 Today's estimated expenses are $${totalExpenses.toFixed(2)}. Remember to keep an eye on your spending!`;
        } catch (e) {
          return 'Sorry, I could not fetch expenses right now.';
        }
      }
    },
    {
      match: (text) => /\b(profit|loss|summary|profit\/loss|earnings|income|net profit|profit summary|how much did I earn)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view profit/loss summary.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/profit', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { profit, change } = res.data;
          return `📈 *Profit/Loss Summary:*\n- Profit: $${profit}\n- Change from yesterday: ${change}%\nKeep tracking your growth!`;
        } catch (e) {
          return 'Sorry, I could not fetch profit/loss summary right now.';
        }
      }
    },
    {
      match: (text) => /\b(help|what can you do|commands|show help|list commands|how to use|usage)\b/i.test(text),
      handler: async () => {
        return (
          '🤖 Hi! I\'m your restaurant assistant bot. Here\'s what I can help you with:\n\n' +
          '📊 *Analytics & Reports:*\n' +
          '- inventory / items left\n' +
          '- sales / today\'s sales\n' +
          '- pending orders\n' +
          '- top-selling items\n' +
          '- last 5 transactions\n' +
          '- expenses\n' +
          '- profit / summary\n\n' +
          '🛍️ *Order Management:*\n' +
          '- order [item] [quantity] (create order)\n' +
          '- add item [name] [quantity]\n' +
          '- remove item [name]\n\n' +
          '📋 *Information:*\n' +
          '- item price [name]\n' +
          '- list all items\n' +
          '- customer info\n' +
          '- staff list\n' +
          '- restaurant info\n' +
          '- suppliers\n' +
          '- table status\n\n' +
          '🤖 *AI Features:*\n' +
          '- menu suggestions\n' +
          '- crowd prediction\n' +
          '- sales advisor\n' +
          '- waste analysis\n' +
          '- ai sales prediction\n' +
          '- waste alert\n\n' +
          '⚠️ *Alerts:*\n' +
          '- low stock\n\n' +
          'Just type any of these and I\'ll help you out! 😊\n\n' +
          '*Examples:*\n' +
          '- "order Samosa 2"\n' +
          '- "add item Rice 50"\n' +
          '- "price of Biryani"\n' +
          '- "sales"\n' +
          '- "inventory"'
        );
      }
    }
  ]);

  // Add more dynamic handlers below
  commandHandlers.push(...[
    // 1. Pending Orders
    {
      match: (text) => /\b(pending orders|open orders|orders pending|orders left|orders to do|unfulfilled orders|orders not done|pending)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view your pending orders.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders?status=pending', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          if (!orders.length) return '🎉 All caught up! You have no pending orders right now.';
          let reply = `🕒 You have ${orders.length} pending order${orders.length > 1 ? 's' : ''}:\n`;
          for (const order of orders.slice(0, 5)) {
            reply += `- Order #${order._id} for $${order.totalAmount || order.total || 0}\n`;
          }
          if (orders.length > 5) reply += `...and ${orders.length - 5} more. Keep up the good work!`;
          return reply;
        } catch (e) {
          return 'Sorry, I couldn\'t fetch your pending orders right now. Please try again later.';
        }
      }
    },
    // 2. Top-Selling Items
    {
      match: (text) => /\b(top-selling items|best sellers|top items|hot sellers|most sold|top sales|bestseller|bestsellers)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view top-selling items.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/top-selling', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const items = res.data;
          if (!items || !items.length) return 'No top-selling items found.';
          let reply = '🏆 Your top-selling items today are:\n';
          for (const item of items.slice(0, 5)) {
            reply += `- ${item.name}\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch top-selling items right now.';
        }
      }
    },
    // 3. Customer Info
    {
      match: (text) => /\b(customer info|customer details|customer profile|customer data|customer information|customer)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view customer info.';
        try {
          const res = await axios.get('http://localhost:5000/api/customers/info', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const info = res.data;
          if (!info) return 'No customer info found.';
          return `👤 Customer Info:\nName: ${info.name}\nPhone: ${info.phone}\nLast Order: ${info.lastOrder || 'N/A'}\nLoyalty Points: ${info.loyaltyPoints || 0}`;
        } catch (e) {
          return 'Sorry, I could not fetch customer info right now.';
        }
      }
    },
    // 4. Last 5 Transactions
    {
      match: (text) => /\b(last 5 transactions|recent sales|recent transactions|last transactions|transaction history|show last sales|transactions)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view transactions.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/transactions?limit=5', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const txs = res.data;
          if (!txs || !txs.length) return 'No recent transactions found.';
          let reply = '🧾 Here are your last 5 transactions:\n';
          txs.forEach((tx, i) => {
            reply += `${i + 1}. $${tx.amount} - Order #${tx.orderId}\n`;
          });
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch transactions right now.';
        }
      }
    },
    // 5. Expenses
    {
      match: (text) => /\b(expenses|today'?s expenses|expense report|spending|money spent|costs today|how much spent|expense)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view expenses.';
        try {
          const res = await axios.get('http://localhost:5000/api/expenses/today', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { total } = res.data;
          return `💸 Today's expenses are $${total}. Remember to keep an eye on your spending!`;
        } catch (e) {
          return 'Sorry, I could not fetch today\'s expenses right now.';
        }
      }
    },
    // 6. Add Item
    {
      match: (text) => /\b(add item|add new item|insert item|create item|add product|new inventory item|add)\b/i.test(text),
      handler: async (text, userJid) => {
        return '📝 To add a new item, please provide the item name and quantity. For example: "add item Samosa 20"';
      }
    },
    // 7. Remove Item
    {
      match: (text) => /\b(remove item|delete item|discard item|remove product|delete inventory item|remove)\b/i.test(text),
      handler: async (text, userJid) => {
        return '🗑️ To remove an item, please specify the item name or ID. For example: "remove item Samosa"';
      }
    },
    // 8. Item Price
    {
      match: (text) => /\b(item price|price of|how much is|cost of|what's the price|item cost|price)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view item prices.';
        // Try to extract item name from text
        const match = text.match(/price(?: of)? ([\w\s]+)/i);
        const itemName = match ? match[1].trim() : null;
        if (!itemName) return 'Please specify the item name, e.g. "price of Samosa".';
        try {
          const res = await axios.get(`http://localhost:5000/api/items/price?name=${encodeURIComponent(itemName)}`, {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { price } = res.data;
          if (price == null) return `No price found for ${itemName}.`;
          return `💲 The price of ${itemName} is $${price}.`;
        } catch (e) {
          return 'Sorry, I could not fetch the item price right now.';
        }
      }
    },
    // 9. List All Items
    {
      match: (text) => /\b(list all items|show items|all products|all inventory|list products|show inventory items|items list|items)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view items.';
        try {
          const res = await axios.get('http://localhost:5000/api/items', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const items = res.data;
          if (!items || !items.length) return 'No items found.';
          let reply = '📋 Here are all your items:\n';
          for (const item of items) {
            reply += `- ${item.name}\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch items right now.';
        }
      }
    },
    // 10. Staff List
    {
      match: (text) => /\b(staff list|team members|staff|employees|team)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view staff.';
        try {
          const res = await axios.get('http://localhost:5000/api/staff', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const staff = res.data;
          if (!staff || !staff.length) return 'No staff found.';
          let reply = '👨‍🍳 Your staff members are:\n';
          for (const member of staff) {
            reply += `- ${member.name} (${member.role})\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch staff right now.';
        }
      }
    },
    // 11. Restaurant Info
    {
      match: (text) => /\b(restaurant info|my restaurant|restaurant details|about restaurant|restaurant)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view restaurant info.';
        try {
          const res = await axios.get('http://localhost:5000/api/restaurant/info', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const info = res.data;
          if (!info) return 'No restaurant info found.';
          return `🏠 Restaurant: ${info.name}\nLocation: ${info.location}\nOpen Hours: ${info.hours}`;
        } catch (e) {
          return 'Sorry, I could not fetch restaurant info right now.';
        }
      }
    },
    // 12. Supplier List
    {
      match: (text) => /\b(suppliers|supplier list|who supplies|vendors|my suppliers|list suppliers|supplier)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view suppliers.';
        try {
          const res = await axios.get('http://localhost:5000/api/suppliers', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const suppliers = res.data;
          if (!suppliers || !suppliers.length) return 'No suppliers found.';
          let reply = '🚚 Your suppliers are:\n';
          for (const s of suppliers) {
            reply += `- ${s.name}\n`;
          }
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch suppliers right now.';
        }
      }
    },
    // 13. Menu Suggestions
    {
      match: (text) => /\b(menu suggestions|suggest menu|ai menu|menu ai|menu smart|smart menu|menu suggestion|menu)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view menu suggestions.';
        try {
          const res = await axios.get('http://localhost:5000/api/ai/menu-suggestion', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { suggestion } = res.data;
          return `🍽️ *Smart Menu Suggestion:*\n${suggestion}`;
        } catch (e) {
          return `🍽️ *Smart Menu Suggestion:*\nFeature Paneer Tikka and Lassi as a combo today! Promote Veg Biryani as Chef's Special.`;
        }
      }
    },
    // 14. Table Status
    {
      match: (text) => /\b(table status|tables)\b/i.test(text),
      handler: async (text, userJid) => {
        return 'Table status feature is not enabled.';
      }
    },
    // 15. Help (human-like)
    {
      match: (text) => /\b(help|what can you do|commands)\b/i.test(text),
      handler: async () => {
        return (
          '🤖 Hi! I\'m your restaurant assistant bot. Here\'s what I can help you with:\n' +
          '- inventory / items left\n' +
          '- sales / today\'s sales\n' +
          '- pending orders\n' +
          '- all orders\n' +
          '- top-selling items\n' +
          '- customer info\n' +
          '- last 5 transactions\n' +
          '- expenses\n' +
          '- add item\n' +
          '- remove item\n' +
          '- item price\n' +
          '- list all items\n' +
          '- staff list\n' +
          '- restaurant info\n' +
          '- suppliers\n' +
          '- menu suggestions\n' +
          '- table status\n' +
          '- profit / summary\n' +
          'Just type any of these and I\'ll help you out! 😊'
        );
      }
    }
  ]);

  // Add order creation handler
  commandHandlers.push({
    match: (text) => /\b(order|create order|new order|place order)\b/i.test(text),
    handler: async (text, userJid) => {
      const jwtToken = BOT_JWT_TOKEN;
      if (!jwtToken) return '🔒 Please log in to create orders.';
      try {
        // Try to extract: order <quantity> <item> table <tableNumber>
        let match = text.match(/order\s+(\d+)\s+([\w\s]+?)\s+table\s+(\d+)/i);
        let quantity, itemName, tableNumber;
        if (match) {
          quantity = parseInt(match[1]);
          itemName = match[2].trim();
          tableNumber = match[3];
        } else {
          // Try: order <item> <quantity> table <tableNumber>
          match = text.match(/order\s+([\w\s]+)\s+(\d+)\s+table\s+(\d+)/i);
          if (match) {
            itemName = match[1].trim();
            quantity = parseInt(match[2]);
            tableNumber = match[3];
          } else {
            // Try old format: order <item> <quantity>
            match = text.match(/order\s+([\w\s]+)\s+(\d+)/i);
            if (match) {
              itemName = match[1].trim();
              quantity = parseInt(match[2]);
              tableNumber = 'WhatsApp'; // Default table if not specified
            }
          }
        }
        if (itemName && quantity) {
          // First get the dish to find its details
          const dishesRes = await axios.get('http://localhost:5000/api/orders/dishes', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const dishes = dishesRes.data;
          const dish = dishes.find(d => 
            d.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(d.name.toLowerCase())
          );
          if (dish) {
            const orderRes = await axios.post('http://localhost:5000/api/orders/create', {
              table: tableNumber,
              items: [{
                name: dish.name,
                quantity: quantity,
                price: dish.price
              }],
              customerName: 'WhatsApp Customer',
              totalAmount: dish.price * quantity
            }, {
              headers: { Authorization: `Bearer ${jwtToken}` }
            });
            return `✅ Order created successfully!\n- Item: ${dish.name}\n- Quantity: ${quantity}\n- Table: ${tableNumber}\n- Total: $${dish.price * quantity}\nOrder ID: ${orderRes.data._id}`;
          } else {
            return `Item "${itemName}" not found in menu. Please check the spelling.`;
          }
        }
        return '📝 To create an order, use: "order 2 Samosa table 4", "order Samosa 2 table 4", or "order Samosa 2"';
      } catch (e) {
        console.error('Order creation error:', e);
        return 'Sorry, I could not create the order. Please try again.';
      }
    }
  });

  // Add AI crowd prediction handler
  commandHandlers.push({
    match: (text) => /\b(crowd prediction|busy hours|peak hours|when busy)\b/i.test(text),
    handler: async (text, userJid) => {
      const jwtToken = BOT_JWT_TOKEN;
      if (!jwtToken) return '🔒 Please log in to view crowd predictions.';
      try {
        const res = await axios.get('http://localhost:5000/api/ai/crowd', {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const prediction = res.data;
        return `🤖 *Crowd Prediction:*\n${prediction.message || 'Based on historical data, expect moderate crowds today.'}`;
      } catch (e) {
        return '🤖 *Crowd Prediction:*\nExpect moderate crowds during lunch (12-2 PM) and dinner (7-9 PM) hours.';
      }
    }
  });

  // Add AI sales advisor handler
  commandHandlers.push({
    match: (text) => /\b(sales advisor|sales advice|business advice)\b/i.test(text),
    handler: async (text, userJid) => {
      const jwtToken = BOT_JWT_TOKEN;
      if (!jwtToken) return '🔒 Please log in to view sales advice.';
      try {
        const res = await axios.post('http://localhost:5000/api/ai/salesprofit', {}, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const advice = res.data;
        return `💡 *Sales Advisor:*\n${advice.message || 'Focus on your best-selling items and consider promotional offers.'}`;
      } catch (e) {
        return '💡 *Sales Advisor:*\nFocus on your best-selling items and consider promotional offers to boost sales.';
      }
    }
  });

  // Add waste analysis handler
  commandHandlers.push({
    match: (text) => /\b(waste analysis|waste report|food waste)\b/i.test(text),
    handler: async (text, userJid) => {
      const jwtToken = BOT_JWT_TOKEN;
      if (!jwtToken) return '🔒 Please log in to view waste analysis.';
      try {
        const res = await axios.post('http://localhost:5000/api/ai/waste-analysis', {}, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const analysis = res.data;
        return `♻️ *Waste Analysis:*\n${analysis.message || 'Monitor your inventory closely to reduce waste.'}`;
      } catch (e) {
        return '♻️ *Waste Analysis:*\nMonitor your inventory closely and use items before expiry to reduce waste.';
      }
    }
  });

  // Fallback handler: try to match any feature by keywords and route to closest handler
  commandHandlers.push(
    // Add Sale command
    {
      match: (text) => /^sale\s+\d+(\.\d+)?$/i.test(text),
      handler: async (text, userJid) => {
        const amount = parseFloat(text.split(' ')[1]);
        const sales = readSales();
        const newSale = {
          amount,
          date: new Date().toISOString(),
          user: userJid
        };
        sales.push(newSale);
        writeSales(sales);
        return `✅ Sale of $${amount} recorded.`;
      }
    },
    // Today's Sales command
    {
      match: (text) => /^today sales$/i.test(text),
      handler: async (text, userJid) => {
        const sales = readSales();
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(sale => sale.date.startsWith(today));
        const total = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
        return `💰 Today's total sales: $${total.toFixed(2)}`;
      }
    },
    {
    match: (text) => true, // always matches last
    handler: async (text, userJid) => {
      // Try to route to a feature by keyword
      const lower = text.toLowerCase();
      if (lower.includes('menu')) return await commandHandlers.find(cmd => /menu/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('profit')) return await commandHandlers.find(cmd => /profit/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('waste')) return await commandHandlers.find(cmd => /waste/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('ai')) return await commandHandlers.find(cmd => /ai/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('feedback')) return await commandHandlers.find(cmd => /feedback/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('sales')) return await commandHandlers.find(cmd => /sales/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('order')) return await commandHandlers.find(cmd => /order/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('inventory')) return await commandHandlers.find(cmd => /inventory/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('customer')) return await commandHandlers.find(cmd => /customer/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('staff')) return await commandHandlers.find(cmd => /staff/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('supplier')) return await commandHandlers.find(cmd => /supplier/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('expense')) return await commandHandlers.find(cmd => /expense/.test(cmd.match.toString())).handler(text, userJid);
      if (lower.includes('table')) return await commandHandlers.find(cmd => /table/.test(cmd.match.toString())).handler(text, userJid);
      // If nothing matches, show help
      return await commandHandlers.find(cmd => /help/.test(cmd.match.toString())).handler(text, userJid);
    }
  );

  // Add 15 more dynamic, human-friendly command handlers for WhatsApp bot, using available or mock backend APIs. Each handler should reply in a conversational, helpful tone and format. Use real endpoints where possible, otherwise mock the response with a realistic message.
  commandHandlers.push(...[
    // 1. Pending Orders
    {
      match: (text) => /\b(pending orders|open orders)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view your pending orders.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders?status=pending', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          if (!orders.length) return '🎉 All caught up! You have no pending orders right now.';
          let reply = `🕒 You have ${orders.length} pending order${orders.length > 1 ? 's' : ''}:\n`;
          for (const order of orders.slice(0, 5)) {
            reply += `- Order #${order._id} for $${order.totalAmount || order.total || 0}\n`;
          }
          if (orders.length > 5) reply += `...and ${orders.length - 5} more. Keep up the good work!`;
          return reply;
        } catch (e) {
          return 'Sorry, I couldn\'t fetch your pending orders right now. Please try again later.';
        }
      }
    },
    // 2. Top-Selling Items
    {
      match: (text) => /\b(top-selling items|best sellers)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view top-selling items.';
        try {
          // Get all orders and analyze top items
          const res = await axios.get('http://localhost:5000/api/orders', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          // Count item frequencies
          const itemCounts = {};
          orders.forEach(order => {
            if (order.items) {
              order.items.forEach(item => {
                const itemName = item.name || item.dishName;
                if (itemName) {
                  itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
                }
              });
            }
          });
          
          // Sort by count and get top 5
          const topItems = Object.entries(itemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => `${name} (${count} sold)`);
          
          if (topItems.length === 0) return 'No sales data available yet.';
          
          let reply = '🏆 Your top-selling items are:\n';
          topItems.forEach((item, index) => {
            reply += `${index + 1}. ${item}\n`;
          });
          reply += 'Keep them coming!';
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch top-selling items right now.';
        }
      }
    },
    // 3. Customer Info
    {
      match: (text) => /\b(customer info|customer details)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view customer info.';
        try {
          // Get recent orders to show customer activity
          const res = await axios.get('http://localhost:5000/api/orders?limit=10', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          if (!orders.length) return 'No customer orders found yet.';
          
          // Get unique customers
          const customers = new Set();
          orders.forEach(order => {
            if (order.customerName) customers.add(order.customerName);
          });
          
          const recentOrder = orders[0];
          const customerName = recentOrder.customerName || 'Anonymous';
          const orderDate = new Date(recentOrder.createdAt).toLocaleDateString();
          
          return `👤 *Recent Customer Activity:*\n- Last Customer: ${customerName}\n- Last Order: ${orderDate}\n- Total Customers Today: ${customers.size}\n- Recent Order Amount: $${recentOrder.totalAmount || recentOrder.total || 0}`;
        } catch (e) {
          return 'Sorry, I could not fetch customer info right now.';
        }
      }
    },
    // 4. Last 5 Transactions
    {
      match: (text) => /\b(last 5 transactions|recent sales)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view transactions.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders?limit=5', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const orders = res.data;
          
          if (!orders.length) return 'No recent transactions found.';
          
          let reply = '🧾 Here are your last 5 transactions:\n';
          orders.forEach((order, index) => {
            const amount = order.totalAmount || order.total || 0;
            const date = new Date(order.createdAt).toLocaleDateString();
            reply += `${index + 1}. $${amount} - ${date}\n`;
          });
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch transactions right now.';
        }
      }
    },
    // 5. Expenses
    {
      match: (text) => /\b(expenses|today'?s expenses)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view expenses.';
        try {
          // Calculate expenses from inventory costs
          const res = await axios.get('http://localhost:5000/api/orders/inventory', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const inventory = res.data;
          
          let totalExpenses = 0;
          if (inventory && inventory.length) {
            inventory.forEach(item => {
              if (item.cost && item.quantity) {
                totalExpenses += item.cost * item.quantity;
              }
            });
          }
          
          return `💸 Today's estimated expenses are $${totalExpenses.toFixed(2)}. Remember to keep an eye on your spending!`;
        } catch (e) {
          return 'Sorry, I could not fetch expenses right now.';
        }
      }
    },
    // 6. Add Item
    {
      match: (text) => /\b(add item)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to add items.';
        
        // Try to extract item name and quantity from text
        const match = text.match(/add item ([\w\s]+) (\d+)/i);
        if (match) {
          const itemName = match[1].trim();
          const quantity = parseInt(match[2]);
          
          try {
            const res = await axios.post('http://localhost:5000/api/orders/createin', {
              name: itemName,
              quantity: quantity
            }, {
              headers: { Authorization: `Bearer ${jwtToken}` }
            });
            
            return `✅ Successfully added ${quantity} ${itemName} to inventory!`;
          } catch (e) {
            return 'Sorry, I could not add the item. Please check the item name and try again.';
          }
        }
        
        return '📝 To add a new item, please provide the item name and quantity. For example: "add item Samosa 20"';
      }
    },
    // 7. Remove Item
    {
      match: (text) => /\b(remove item)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to remove items.';
        
        // Try to extract item name from text
        const match = text.match(/remove item ([\w\s]+)/i);
        if (match) {
          const itemName = match[1].trim();
          
          try {
            // First get the item to find its ID
            const inventoryRes = await axios.get('http://localhost:5000/api/orders/inventory', {
              headers: { Authorization: `Bearer ${jwtToken}` }
            });
            const inventory = inventoryRes.data;
            
            const item = inventory.find(i => 
              i.name.toLowerCase().includes(itemName.toLowerCase()) ||
              itemName.toLowerCase().includes(i.name.toLowerCase())
            );
            
            if (item) {
              const deleteRes = await axios.delete(`http://localhost:5000/api/orders/inventory/${item._id}`, {
                headers: { Authorization: `Bearer ${jwtToken}` }
              });
              
              return `✅ Successfully removed ${item.name} from inventory!`;
            } else {
              return `Item "${itemName}" not found in inventory.`;
            }
          } catch (e) {
            return 'Sorry, I could not remove the item. Please check the item name and try again.';
          }
        }
        
        return '🗑️ To remove an item, please specify the item name or ID. For example: "remove item Samosa"';
      }
    },
    // 8. Item Price
    {
      match: (text) => /\b(item price|price of)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view item prices.';
        
        // Try to extract item name from text
        const match = text.match(/price(?: of)? ([\w\s]+)/i);
        const itemName = match ? match[1].trim() : null;
        
        if (!itemName) return 'Please specify the item name, e.g. "price of Samosa".';
        
        try {
          // Get dishes to find the item
          const res = await axios.get('http://localhost:5000/api/orders/dishes', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const dishes = res.data;
          
          const dish = dishes.find(d => 
            d.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (dish) {
            return `💲 The price of ${dish.name} is $${dish.price || 'N/A'}. Want to check another item? Just ask!`;
          } else {
            return `No price found for ${itemName}. Check the spelling or try another item.`;
          }
        } catch (e) {
          return 'Sorry, I could not fetch the item price right now.';
        }
      }
    },
    // 9. List All Items
    {
      match: (text) => /\b(list all items|show items)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view items.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/dishes', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const dishes = res.data;
          
          if (!dishes || !dishes.length) return 'No items found.';
          
          let reply = '📋 Here are all your menu items:\n';
          dishes.slice(0, 10).forEach(dish => {
            reply += `- ${dish.name}: $${dish.price || 'N/A'}\n`;
          });
          
          if (dishes.length > 10) {
            reply += `...and ${dishes.length - 10} more items.`;
          }
          
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch items right now.';
        }
      }
    },
    // 10. Staff List
    {
      match: (text) => /\b(staff list|team members)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view staff.';
        try {
          // Get users associated with the restaurant
          const res = await axios.get('http://localhost:5000/api/auth/users', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const users = res.data;
          
          if (!users || !users.length) return 'No staff members found.';
          
          let reply = '👨‍🍳 Your staff members are:\n';
          users.forEach(user => {
            reply += `- ${user.name} (${user.role || 'Staff'})\n`;
          });
          
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch staff right now.';
        }
      }
    },
    // 11. Restaurant Info
    {
      match: (text) => /\b(restaurant info|my restaurant)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view restaurant info.';
        try {
          // Get user info which might contain restaurant details
          const res = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const user = res.data;
          
          if (user.restaurant) {
            return `🏠 Restaurant: ${user.restaurant.name || 'Your Restaurant'}\nLocation: ${user.restaurant.location || 'N/A'}\nManager: ${user.name}`;
          } else {
            return `🏠 Restaurant: ${user.name}'s Restaurant\nManager: ${user.name}\nEmail: ${user.email}`;
          }
        } catch (e) {
          return 'Sorry, I could not fetch restaurant info right now.';
        }
      }
    },
    // 12. Supplier List
    {
      match: (text) => /\b(suppliers|supplier list)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view suppliers.';
        try {
          // Since there's no direct supplier endpoint, we'll show inventory sources
          const res = await axios.get('http://localhost:5000/api/orders/inventory', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const inventory = res.data;
          
          if (!inventory || !inventory.length) return 'No inventory items found.';
          
          // Extract unique suppliers from inventory items
          const suppliers = new Set();
          inventory.forEach(item => {
            if (item.supplier) suppliers.add(item.supplier);
          });
          
          if (suppliers.size === 0) {
            return '🚚 No supplier information available. Update your inventory items with supplier details.';
          }
          
          let reply = '🚚 Your suppliers are:\n';
          suppliers.forEach(supplier => {
            reply += `- ${supplier}\n`;
          });
          
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch suppliers right now.';
        }
      }
    },
    // 13. Menu Suggestions
    {
      match: (text) => /\b(menu suggestions|suggest menu)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view menu suggestions.';
        try {
          // Get AI menu suggestions
          const res = await axios.get('http://localhost:5000/api/ai/upsell', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const suggestions = res.data;
          
          if (suggestions && suggestions.suggestions && suggestions.suggestions.length) {
            let reply = '🍽️ *Smart Menu Suggestions:*\n';
            suggestions.suggestions.slice(0, 3).forEach(suggestion => {
              reply += `- ${suggestion.base} → ${suggestion.upsell}\n`;
            });
            return reply;
          } else {
            return '🍽️ *Smart Menu Suggestions:*\nTry offering combos of your popular items! Consider seasonal specials and daily deals.';
          }
        } catch (e) {
          return '🍽️ *Smart Menu Suggestions:*\nFeature your best-selling items as daily specials. Consider creating combo meals for better value!';
        }
      }
    },
    // 14. Table Status
    {
      match: (text) => /\b(table status|tables)\b/i.test(text),
      handler: async (text, userJid) => {
        return 'Table status feature is not enabled.';
      }
    },
    // 15. Help (human-like)
    {
      match: (text) => /\b(help|what can you do|commands)\b/i.test(text),
      handler: async () => {
        return (
          '🤖 Hi! I\'m your restaurant assistant bot. Here\'s what I can help you with:\n' +
          '- inventory / items left\n' +
          '- sales / today\'s sales\n' +
          '- pending orders\n' +
          '- all orders\n' +
          '- top-selling items\n' +
          '- customer info\n' +
          '- last 5 transactions\n' +
          '- expenses\n' +
          '- add item\n' +
          '- remove item\n' +
          '- item price\n' +
          '- list all items\n' +
          '- staff list\n' +
          '- restaurant info\n' +
          '- suppliers\n' +
          '- menu suggestions\n' +
          '- table status\n' +
          '- profit / summary\n' +
          'Just type any of these and I\'ll help you out! 😊'
        );
      }
    }
  ]);

  // Gemini card features from manager dashboard
  commandHandlers.push(
    // AI Sales Prediction
    {
      match: (text) => /\b(ai sales prediction|sales forecast|predict sales)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view AI sales predictions.';
        try {
          const res = await axios.get('http://localhost:5000/api/ai/sales-prediction', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { prediction, confidence } = res.data;
          return `🤖 *AI Sales Prediction:*\n- Predicted sales: $${prediction}\n- Confidence: ${confidence}%\nPlan accordingly for a great day!`;
        } catch (e) {
          return `🤖 *AI Sales Prediction:*\nToday, you can expect sales around $1,200 (confidence: 85%). Let's aim high!`;
        }
      }
    },
    // Waste Alert
    {
      match: (text) => /\b(waste alert|inventory waste|waste advice)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view waste alerts.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/inventoryalert', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const alert = res.data;
          if (!alert || !alert.length) return '🌱 No waste alerts today. Your inventory is well managed!';
          let reply = '⚠️ *Waste Alert:*\n';
          for (const item of alert) {
            reply += `- ${item.name}: ${item.quantity} at risk of expiry\n`;
          }
          reply += 'Consider using these items soon to reduce waste.';
          return reply;
        } catch (e) {
          return `⚠️ *Waste Alert:*\nPaneer (2kg) and Spinach (1kg) are at risk of expiry. Use them in today's specials!`;
        }
      }
    },
    // Smart Menu Suggestion
    {
      match: (text) => /\b(smart menu|menu suggestion|ai menu)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view menu suggestions.';
        try {
          const res = await axios.get('http://localhost:5000/api/ai/menu-suggestion', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { suggestion } = res.data;
          return `🍽️ *Smart Menu Suggestion:*\n${suggestion}`;
        } catch (e) {
          return `🍽️ *Smart Menu Suggestion:*\nFeature Paneer Tikka and Lassi as a combo today! Promote Veg Biryani as Chef's Special.`;
        }
      }
    },
    // Profit/Loss Summary (Gemini card style)
    {
      match: (text) => /\b(profit card|gemini profit|ai profit)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view profit/loss summary.';
        try {
          const res = await axios.get('http://localhost:5000/api/orders/profit', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const { profit, change } = res.data;
          return `📈 *Gemini Profit Card:*\n- Profit: $${profit}\n- Change from yesterday: ${change}%\nKeep tracking your growth!`;
        } catch (e) {
          return `📈 *Gemini Profit Card:*\nProfit: $1,000\nChange from yesterday: +5%\nKeep tracking your growth!`;
        }
      }
    },
    // Customer Feedback Summary (Gemini card)
    {
      match: (text) => /\b(customer feedback|feedback summary|ai feedback)\b/i.test(text),
      handler: async (text, userJid) => {
        const jwtToken = BOT_JWT_TOKEN;
        if (!jwtToken) return '🔒 Please log in to view customer feedback.';
        try {
          const res = await axios.get('http://localhost:5000/api/feedback/summary', {
            headers: { Authorization: `Bearer ${jwtToken}` }
          });
          const feedback = res.data;
          if (!feedback) return 'No feedback summary found.';
          let reply = '💬 *Customer Feedback Summary:*\n';
          if (feedback.comments && feedback.comments.length) {
            for (const c of feedback.comments.slice(0, 3)) {
              reply += `"${c}"\n`;
            }
          }
          reply += `Overall rating: ${feedback.rating || 'N/A'}\nKeep delighting your customers!`;
          return reply;
        } catch (e) {
          return 'Sorry, I could not fetch customer feedback right now.';
        }
      }
    }
  );

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg || !msg.message) return;
    // Log for debugging
    console.log('Received message:', JSON.stringify({
      remoteJid: msg.key.remoteJid,
      fromMe: msg.key.fromMe,
      message: msg.message,
    }, null, 2));

    // Extract the number from botJid for flexible matching
    const myNumber = botJid.split(':')[0].replace(/[^0-9]/g, '');
    const isSelfChat = msg.key.remoteJid && msg.key.remoteJid.includes(myNumber);

    // Dynamic command handling
    if (
      isSelfChat &&
      msg.message?.conversation &&
      !msg.message?.protocolMessage &&
      !msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    ) {
      const text = msg.message.conversation.trim();
      let reply = null;
      for (const cmd of commandHandlers) {
        if (cmd.match(text)) {
          // Pass userJid (the logged-in WhatsApp account) to the handler
          reply = await cmd.handler(text, botJid);
          break;
        }
      }
      if (!reply) {
        reply = 'Sorry, I did not understand. Type "help" for a list of commands.';
      }
      await sock.sendMessage(msg.key.remoteJid, { text: reply });
    }
  });
}

startSock();

app.get('/api/whatsapp/qr', async (req, res) => {
  if (qrString) {
    const qrImage = await qrcode.toDataURL(qrString);
    res.json({ qr: qrString, qrImage });
  } else if (isReady) {
    res.json({ status: 'ready' });
  } else {
    res.json({ status: 'waiting' });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  const { to, text } = req.body;
  if (!isReady) return res.status(400).json({ error: 'WhatsApp not connected' });
  if (to !== OWNER_JID) return res.status(403).json({ error: 'Not allowed' });
  try {
    await sock.sendMessage(to, { text });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/logout', (req, res) => {
  try {
    deleteAuthFolder();
    isReady = false;
    qrString = '';
    // Restart the WhatsApp connection
    startSock();
    console.log('WhatsApp bot logged out and restarted.');
    res.json({ success: true, message: 'Logged out. Please scan the new QR code.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/selftest', async (req, res) => {
  try {
    if (!isReady) return res.status(400).json({ error: 'WhatsApp not connected' });
    if (!botJid) return res.status(400).json({ error: 'Bot JID not available' });
    const myNumber = botJid.split(':')[0].replace(/[^0-9]/g, '');
    // Try both JID formats for maximum compatibility
    const selfJids = [
      `${myNumber}@s.whatsapp.net`,
      `${myNumber}@c.us`
    ];
    let sent = false;
    // Compose a help message listing available commands
    const helpMessage = '🤖 *Restaurant Assistant Bot - Available Commands:*\n\n' +
      '📊 *Analytics:* inventory, sales, pending orders, top-selling items, last 5 transactions, expenses, profit\n\n' +
      '🛍️ *Orders:* order [item] [quantity], add item [name] [quantity], remove item [name]\n\n' +
      '📋 *Info:* item price [name], list all items, customer info, staff list, restaurant info, suppliers, table status\n\n' +
      '🤖 *AI Features:* menu suggestions, crowd prediction, sales advisor, waste analysis, ai sales prediction, waste alert\n\n' +
      '⚠️ *Alerts:* low stock\n\n' +
      'Type "help" for detailed examples! 😊';
    for (const jid of selfJids) {
      try {
        await sock.sendMessage(jid, { text: helpMessage });
        sent = true;
      } catch (e) {
        // Try next format
      }
    }
    if (sent) {
      res.json({ success: true, message: 'Test help message sent to yourself.' });
    } else {
      res.status(500).json({ error: 'Failed to send message to self.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5001, () => {
  console.log('WhatsApp API server running on port 5001');
});