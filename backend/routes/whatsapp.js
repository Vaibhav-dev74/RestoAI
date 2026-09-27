import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import * as whatsappController from '../controllers/whatsappController.js';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import { redisAutoInvalidate, redisCache } from '../middleware/redisCache.js';
dotenv.config();

const router = express.Router();

router.use(redisAutoInvalidate());

// When handling Meta WhatsApp Cloud API webhooks, the internal APIs are protected.
// For demo purposes you can set WHATSAPP_WEBHOOK_JWT to a manager JWT.
const INTERNAL_API_BASE_URL = process.env.INTERNAL_API_BASE_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
const WHATSAPP_WEBHOOK_JWT = process.env.WHATSAPP_WEBHOOK_JWT || '';

function internalAuthHeaders() {
  return WHATSAPP_WEBHOOK_JWT ? { Authorization: `Bearer ${WHATSAPP_WEBHOOK_JWT}` } : {};
}

// Baileys bot endpoints
router.post('/enable', authMiddleware, requireRole('manager'), whatsappController.enable);
router.post('/disable', authMiddleware, requireRole('manager'), whatsappController.disable);
router.post('/send-message', authMiddleware, requireRole('manager'), whatsappController.sendMessage);
router.get('/qr', authMiddleware, requireRole('manager'), whatsappController.qrStatus);
router.post('/logout', authMiddleware, requireRole('manager'), whatsappController.logout);

// Verification endpoint for Meta
router.get('/webhook', redisCache({ ttlSeconds: 60, scope: 'public' }), (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Main webhook for incoming messages (Meta)
router.post('/webhook', async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  const from = message?.from;
  const text = message?.text?.body?.toLowerCase();

  if (text) {
    // === ORDER CREATION ===
    if (text.startsWith('order')) {
      const items = parseOrderItems(text);
      await axios.post(`${INTERNAL_API_BASE_URL}/api/orders/create`, {
        table: 'WhatsApp',
        items
      }, {
        headers: internalAuthHeaders(),
      });
      await sendWhatsAppReply(from, 'Order placed!');
    }
    // === ANALYTICS QUERY ===
    else if (text.includes('profit') || text.includes('sales')) {
      const res2 = await axios.post(`${INTERNAL_API_BASE_URL}/api/ai/sales-profit-advisor`, { voiceInput: text }, {
        headers: internalAuthHeaders(),
      });
      const totalSales = res2.data?.totalSales ?? '₹0';
      const profit = res2.data?.profit ?? '₹0';
      const tip = res2.data?.tip ? `\nTip: ${res2.data.tip}` : '';
      await sendWhatsAppReply(from, `Sales: ${totalSales}\nProfit: ${profit}${tip}`);
    }
    // === INVENTORY UPDATE ===
    else if (text.startsWith('add inventory')) {
      const [_, name, quantity] = text.split(' ');
      await axios.post(`${INTERNAL_API_BASE_URL}/api/orders/inventory/upsert`, { name, quantity: Number(quantity) }, {
        headers: internalAuthHeaders(),
      });
      await sendWhatsAppReply(from, `Inventory updated: ${name} +${quantity}`);
    }
    // === WASTE ALERTS ===
    else if (text.includes('waste')) {
      const res2 = await axios.post(`${INTERNAL_API_BASE_URL}/api/ai/inventory-waste-alert`, {}, {
        headers: internalAuthHeaders(),
      });
      const alerts = Array.isArray(res2.data?.alerts) ? res2.data.alerts : [];
      await sendWhatsAppReply(from, alerts.length ? `Waste Alerts:\n${alerts.map(a => `${a.item}: ${a.reason}`).join('\n')}` : 'No waste alerts right now.');
    }
    // === UPSALE SUGGESTIONS ===
    else if (text.includes('upsell')) {
      const res2 = await axios.get(`${INTERNAL_API_BASE_URL}/api/ai/upsell`, {
        headers: internalAuthHeaders(),
      });
      const suggestions = Array.isArray(res2.data?.suggestions) ? res2.data.suggestions : [];
      await sendWhatsAppReply(from, suggestions.length ? `Upsell Suggestions:\n${suggestions.map(s => `${s.base} → ${s.upsell}`).join('\n')}` : 'No upsell suggestions right now.');
    }
    // Add more commands as needed!
  }

  res.sendStatus(200);
});

function parseOrderItems(text) {
  // "order 2 butter naan, 1 paneer tikka"
  return text.replace('order', '').split(',').map(item => {
    const [qty, ...nameArr] = item.trim().split(' ');
    return { name: nameArr.join(' '), quantity: Number(qty) };
  });
}

async function sendWhatsAppReply(to, message) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

export default router; 