import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const DEBUG_WHATSAPP = String(process.env.DEBUG_WHATSAPP || '').toLowerCase() === 'true';

// Prevent reply loops: track message IDs we sent, so we can ignore them on upsert.
// Map: messageId -> expiresAt (ms)
const sentMessageIds = new Map();

function rememberSentMessage(sendResult) {
  const id = sendResult?.key?.id;
  if (!id) return;
  sentMessageIds.set(id, Date.now() + 5 * 60 * 1000);
}

function wasSentByThisBot(msg) {
  const id = msg?.key?.id;
  if (!id) return false;
  const expiresAt = sentMessageIds.get(id);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sentMessageIds.delete(id);
    return false;
  }
  return true;
}

const salesFilePath = path.resolve('./sales.json');

function readSales() {
  try {
    if (!fs.existsSync(salesFilePath)) return [];
    const raw = fs.readFileSync(salesFilePath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSales(sales) {
  fs.writeFileSync(salesFilePath, JSON.stringify(sales, null, 2));
}

function isSameLocalDate(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// In-memory session state (for demo; use DB or file for production)
let sock = null;
let isEnabled = false;
let qrCallback = null;
let isConnected = false;
let lastConnectAttempt = 0;
let connectAttempts = 0;
let backendJwtToken = null;
let lastDisconnectStatusCode = null;
let lastDisconnectAt = null;

function unwrapBaileysMessageContent(message) {
  // Common wrappers: ephemeral, viewOnce, etc.
  let m = message;
  // Protect against pathological nesting
  for (let i = 0; i < 5 && m; i++) {
    if (m.ephemeralMessage?.message) {
      m = m.ephemeralMessage.message;
      continue;
    }
    if (m.viewOnceMessage?.message) {
      m = m.viewOnceMessage.message;
      continue;
    }
    if (m.viewOnceMessageV2?.message) {
      m = m.viewOnceMessageV2.message;
      continue;
    }
    if (m.documentWithCaptionMessage?.message) {
      m = m.documentWithCaptionMessage.message;
      continue;
    }
    break;
  }
  return m;
}

function extractIncomingText(msg) {
  const content = unwrapBaileysMessageContent(msg?.message);
  if (!content) return '';

  // Plain text
  if (typeof content.conversation === 'string') return content.conversation;

  // Most common for messages sent from some clients
  if (typeof content.extendedTextMessage?.text === 'string') return content.extendedTextMessage.text;

  // Captions
  if (typeof content.imageMessage?.caption === 'string') return content.imageMessage.caption;
  if (typeof content.videoMessage?.caption === 'string') return content.videoMessage.caption;
  if (typeof content.documentMessage?.caption === 'string') return content.documentMessage.caption;

  // Button/list replies (best-effort)
  if (typeof content.buttonsResponseMessage?.selectedButtonId === 'string') return content.buttonsResponseMessage.selectedButtonId;
  if (typeof content.listResponseMessage?.singleSelectReply?.selectedRowId === 'string') return content.listResponseMessage.singleSelectReply.selectedRowId;

  return '';
}

function setBackendJwtToken(token) {
  backendJwtToken = token || null;
}

class WhatsAppBotError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WhatsAppBotError';
    this.code = code;
  }
}

function deleteAuthFolder() {
  const authPath = path.resolve('./whatsapp_auth');
  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
  }
}

function resetWhatsAppAuth() {
  try {
    if (sock) {
      try { sock.end(); } catch { /* ignore */ }
    }
  } finally {
    sock = null;
    isEnabled = false;
    isConnected = false;
    try { deleteAuthFolder(); } catch { /* ignore */ }
  }
}

async function startWhatsAppBot(onQR, reset = false) {
  try {
    // Rate limit connection attempts
    const now = Date.now();
    if (now - lastConnectAttempt < 10000) { // 10 seconds
      connectAttempts++;
      if (connectAttempts > 5) {
        console.error('[E1] Too many WhatsApp sign-in attempts. Please wait and try again.');
        throw new WhatsAppBotError('Too many WhatsApp sign-in attempts. Please wait and try again.', 'E1');
      }
    } else {
      connectAttempts = 0;
    }
    lastConnectAttempt = now;
    if (reset) {
      try {
        deleteAuthFolder();
      } catch (e) {
        console.error('[E2] Failed to delete auth folder:', e);
        throw new WhatsAppBotError('Failed to delete auth folder: ' + (e.message || e.toString()), 'E2');
      }
      sock = null;
      isEnabled = false;
      isConnected = false;
    }
    if (sock) return sock;
    let state, saveCreds;
    try {
      ({ state, saveCreds } = await useMultiFileAuthState('./whatsapp_auth'));
    } catch (e) {
      console.error('[E3] Failed to load WhatsApp auth state:', e);
      throw new WhatsAppBotError('Failed to load WhatsApp auth state: ' + (e.message || e.toString()), 'E3');
    }
    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch (e) {
      console.error('[E4] Failed to fetch latest Baileys version:', e);
      throw new WhatsAppBotError('Failed to fetch latest Baileys version: ' + (e.message || e.toString()), 'E4');
    }
    try {
      sock = makeWASocket({
        version,
        auth: state,
        getMessage: async (key) => ({}),
      });
    } catch (e) {
      console.error('[E5] Failed to create WhatsApp socket:', e);
      throw new WhatsAppBotError('Failed to create WhatsApp socket: ' + (e.message || e.toString()), 'E5');
    }
    isEnabled = true;
    if (onQR) qrCallback = onQR;

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr && qrCallback) {
        try {
          qrCallback(qr);
        } catch (e) {
          console.error('[E6] Error in QR callback:', e);
        }
      }
      if (connection === 'open') {
        isConnected = true;
        lastDisconnectStatusCode = null;
        lastDisconnectAt = null;
        console.log('[I1] WhatsApp bot is connected and ready.');
      } else if (connection === 'close') {
        isConnected = false;
        lastDisconnectStatusCode = lastDisconnect?.error?.output?.statusCode ?? null;
        lastDisconnectAt = new Date();
        if (lastDisconnect?.error) {
          const errMsg = lastDisconnect.error.message || lastDisconnect.error.toString();
          console.error('[E7] WhatsApp connection closed:', errMsg);
        }
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // IMPORTANT: when the socket closes, Baileys requires a new socket for reconnection.
        // Keeping a stale `sock` prevents reconnect because startWhatsAppBot() short-circuits.
        try { sock?.end(); } catch { /* ignore */ }
        sock = null;

        if (!isLoggedOut) {
          console.warn('[W1] Attempting to reconnect WhatsApp bot in 10s...');
          setTimeout(() => startWhatsAppBot(qrCallback), 10000);
        } else {
          isEnabled = false;
          console.warn('[W2] WhatsApp bot logged out (401). Call /api/whatsapp/enable?reset=true to re-pair.');
        }
      } else if (connection === 'connecting') {
        console.log('[I2] WhatsApp bot is connecting...');
      } else {
        console.warn('[W3] Unknown WhatsApp connection state:', connection);
      }
    });
    sock.ev.on('creds.update', (creds) => {
      try {
        saveCreds(creds);
      } catch (e) {
        console.error('[E8] Failed to save WhatsApp credentials:', e);
      }
    });

    sock.ev.on('connection.failure', (failure) => {
      console.error('[E9] WhatsApp connection failure:', failure);
      if (failure?.reason) {
        console.error('[E10] Failure reason:', failure.reason);
      }
      if (failure?.stack) {
        console.error('[E11] Failure stack:', failure.stack);
      }
    });

    // Handle incoming messages (full manager dashboard features)
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages?.[0];
      if (!msg?.message) return;
      if (wasSentByThisBot(msg)) return; // ignore messages we sent (prevents loops)

      const jid = msg.key?.remoteJid;
      if (!jid) return;
      if (jid === 'status@broadcast') return;

      const rawText = extractIncomingText(msg);
      const text = String(rawText || '').trim().toLowerCase();
      if (!text) return;

      if (DEBUG_WHATSAPP) {
        console.log('[I3] WA incoming:', {
          fromMe: Boolean(msg.key?.fromMe),
          jid,
          text: String(rawText || ''),
          messageId: msg.key?.id,
        });
      }

      const send = async (content) => {
        const result = await sock.sendMessage(jid, content);
        rememberSentMessage(result);
        if (DEBUG_WHATSAPP) {
          console.log('[I4] WA sent:', { jid, messageId: result?.key?.id });
        }
        return result;
      };

      try {
        // Quick sanity check
        if (text === 'ping' || text === '!ping') {
          await send({ text: 'pong' });
          return;
        }

        // === SALES LOGGING (lightweight, file-backed) ===
        // Commands:
        // - "sale 250" -> logs a sale amount
        // - "today sales" -> sums today's logged sales
        if (text === 'today sales') {
            // Match website KPI logic: sum today's orders.
            // Fallback to local file log if auth/token is not available.
            try {
              if (!backendJwtToken) throw new Error('Missing backend JWT token');

              const headers = { Authorization: `Bearer ${backendJwtToken}` };
              const ordersRes = await axios.get(`${BACKEND_URL}/api/orders`, { headers });
              const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

              const now = new Date();
              const todaysOrders = orders.filter((o) => {
                const createdAt = new Date(o?.createdAt);
                return Number.isFinite(createdAt.getTime()) && isSameLocalDate(createdAt, now);
              });
              const total = todaysOrders.reduce((sum, o) => sum + (Number(o?.totalAmount ?? o?.total ?? 0) || 0), 0);

              await send({ text: `Today's sales: ₹${total.toLocaleString()}\nOrders: ${todaysOrders.length}` });
              return;
            } catch {
              const now = new Date();
              const sales = readSales();
              const todays = sales.filter((s) => {
                const at = new Date(s?.at);
                return Number.isFinite(at.getTime()) && isSameLocalDate(at, now);
              });
              const total = todays.reduce((sum, s) => sum + (Number(s?.amount) || 0), 0);
              await send({ text: `Today's sales: ₹${total.toLocaleString()}\nCount: ${todays.length}` });
              return;
            }
        }

        if (text.startsWith('sale')) {
          const match = rawText.match(/\bsale\b\s*(?<amount>\d+(?:\.\d+)?)/i);
          const amount = match?.groups?.amount ? Number(match.groups.amount) : 0;
          const sales = readSales();
          sales.push({ amount: Number.isFinite(amount) ? amount : 0, at: new Date().toISOString() });
          writeSales(sales);
          await send({ text: `Sale recorded: ₹${Number.isFinite(amount) ? amount : 0}` });
          return;
        }

        // === ORDER CREATION ===
        if (text.startsWith('order')) {
          const items = parseOrderItems(text);
          await axios.post(`${BACKEND_URL}/api/orders/create`, {
            table: 'WhatsApp',
            items
          }, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await send({ text: 'Order placed!' });
        }
        // === ANALYTICS QUERY ===
        else if (text.includes('profit') || text.includes('sales')) {
          // Prefer AI endpoint, but fall back to /api/orders/profit so the user always gets a reply.
          try {
            const res2 = await axios.post(`${BACKEND_URL}/api/ai/sales-profit-advisor`, {
              voiceInput: text,
            }, {
              headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
            });

            const totalSales = res2.data?.totalSales ?? '₹0';
            const profit = res2.data?.profit ?? '₹0';
            const tip = res2.data?.tip ? `\nTip: ${res2.data.tip}` : '';
            await send({ text: `Sales: ${totalSales}\nProfit: ${profit}${tip}` });
          } catch (aiErr) {
            const res2 = await axios.get(`${BACKEND_URL}/api/orders/profit`, {
              headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
            });
            const profit = res2.data?.profit ?? 0;
            const change = res2.data?.change ?? '0';
            await send({ text: `Today sales (profit): ₹${profit}\nChange vs yesterday: ${change}%` });
          }
        }
        // === INVENTORY UPDATE ===
        else if (text.startsWith('add inventory')) {
          const [_, name, quantity] = text.split(' ');
          await axios.post(`${BACKEND_URL}/api/orders/inventory/upsert`, { name, quantity: Number(quantity) }, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await send({ text: `Inventory updated: ${name} +${quantity}` });
        }
        // === WASTE ALERTS ===
        else if (text.includes('waste')) {
          const res2 = await axios.post(`${BACKEND_URL}/api/ai/inventory-waste-alert`, {}, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });

          const alerts = Array.isArray(res2.data?.alerts) ? res2.data.alerts : [];
          await send({
            text: alerts.length
              ? `Waste Alerts:\n${alerts.map(a => `${a.item}: ${a.reason}`).join('\n')}`
              : 'No waste alerts right now.'
          });
        }
        // === UPSALE SUGGESTIONS ===
        else if (text.includes('upsell')) {
          const res2 = await axios.get(`${BACKEND_URL}/api/ai/upsell`, {
            headers: backendJwtToken ? { Authorization: `Bearer ${backendJwtToken}` } : {},
          });
          await send({ text: `Upsell Suggestions:\n${res2.data.suggestions.map(s => `${s.base} → ${s.upsell}`).join('\n')}` });
        }
        // Add more commands as needed!
        else {
          await send({ text: 'Commands: "sale 100", "today sales", "sales"/"profit", "order ...", "ping".' });
        }
      } catch (err) {
        console.error('[E12] Error handling incoming WhatsApp message:', err);
        try {
          await send({ text: 'Error: ' + (err.response?.data?.error || err.message) });
        } catch {
          // ignore
        }
      }
    });
    return sock;
  } catch (err) {
    console.error('[E13] Error starting WhatsApp bot:', err);
    if (err.stack) console.error('[E14] Stack trace:', err.stack);
    if (err instanceof WhatsAppBotError) throw err;
    throw new WhatsAppBotError('Failed to start WhatsApp bot: ' + (err.message || err.toString()), 'E13');
  }
}

async function enableWhatsAppBot(onQR, reset = false) {
  return startWhatsAppBot(onQR, reset);
}

function disableWhatsAppBot() {
  if (sock) {
    sock.end();
    sock = null;
    isEnabled = false;
  }
}

async function sendWhatsAppMessage(jid, text) {
  if (!sock || !isConnected) {
    console.error('WhatsApp bot is not enabled or not connected.');
    throw new Error('WhatsApp bot not enabled or not connected');
  }
  if (!jid || typeof jid !== 'string') {
    console.error('Invalid JID provided to sendWhatsAppMessage:', jid);
    throw new Error('Invalid JID');
  }
  if (!text || typeof text !== 'string') {
    console.error('Invalid text provided to sendWhatsAppMessage:', text);
    throw new Error('Invalid message text');
  }
  console.log('Sending WhatsApp message:', { jid, text });
  try {
    const result = await sock.sendMessage(jid, { text });
    rememberSentMessage(result);
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    throw err;
  }
}

function isWhatsAppEnabled() {
  return isEnabled && isConnected;
}

function getWhatsAppStatus() {
  return {
    enabled: isEnabled,
    connected: isConnected,
    lastDisconnectStatusCode,
    lastDisconnectAt,
  };
}

function parseOrderItems(text) {
  // "order 2 butter naan, 1 paneer tikka"
  return text.replace('order', '').split(',').map(item => {
    const [qty, ...nameArr] = item.trim().split(' ');
    return { name: nameArr.join(' '), quantity: Number(qty) };
  });
}

export default {
  enableWhatsAppBot,
  disableWhatsAppBot,
  resetWhatsAppAuth,
  setBackendJwtToken,
  sendWhatsAppMessage,
  isWhatsAppEnabled,
  getWhatsAppStatus,
  // TODO: add group creation, announcement scheduling, Gemini integration, persistent session storage
}; 