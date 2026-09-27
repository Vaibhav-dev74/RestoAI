import whatsappService from '../services/whatsappService.js';
import qrcode from 'qrcode';

let lastQr = '';
let lastQrImageUrl = '';
let lastQrAt = null;

// Enable WhatsApp bot (returns QR code if needed)
export async function enable(req, res) {
  let responded = false;
  const reset = req.query.reset === 'true';
  const bearer = req.headers.authorization || '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length) : '';

  if (token) {
    try { whatsappService.setBackendJwtToken(token); } catch { /* ignore */ }
  }
  // Prevent repeated resets: warn if reset is used too often
  if (reset) {
    if (!global.lastWhatsAppReset) global.lastWhatsAppReset = 0;
    const now = Date.now();
    if (now - global.lastWhatsAppReset < 60000) { // 1 minute
      return res.status(429).json({ success: false, error: 'Please wait before resetting WhatsApp session again.' });
    }
    global.lastWhatsAppReset = now;
  }

  // If already connected, respond immediately.
  try {
    if (whatsappService.isWhatsAppEnabled()) {
      return res.json({ success: true, status: 'ready', message: 'WhatsApp bot already enabled.' });
    }
  } catch {
    // ignore
  }

  try {
    await whatsappService.enableWhatsAppBot(async (qr) => {
      // Always cache QR for the polling endpoint
      try {
        const qrImageUrl = qr ? await qrcode.toDataURL(qr) : '';
        lastQr = qr || '';
        lastQrImageUrl = qrImageUrl || '';
        lastQrAt = new Date();
      } catch (qrErr) {
        console.error('Failed to generate QR image:', qrErr);
      }

      // Respond with QR only if we haven't responded yet
      if (responded) return;
      responded = true;
      if (!qr) {
        return res.status(500).json({ success: false, error: 'QR code not generated.' });
      }
      return res.json({ success: true, status: 'qr', message: 'Scan QR to enable WhatsApp bot.', qr, qrImageUrl: lastQrImageUrl });
    }, reset);

    // If QR is not produced quickly, return a connecting response and let the client poll /qr.
    setTimeout(() => {
      if (responded) return;
      responded = true;
      const status = (() => {
        try {
          const s = whatsappService.getWhatsAppStatus?.();
          if (s?.connected) return 'ready';
        } catch {
          // ignore
        }
        return 'connecting';
      })();
      res.json({ success: true, status, message: status === 'ready' ? 'WhatsApp bot enabled.' : 'WhatsApp bot starting. Poll /api/whatsapp/qr for QR/status.' });
    }, 15000);
  } catch (err) {
    if (!responded) {
      responded = true;
      console.error('Failed to enable WhatsApp bot:', err);
      if (err.name === 'WhatsAppBotError') {
        res.status(500).json({ success: false, error: err.message, code: err.code, details: err.stack });
      } else {
        res.status(500).json({ success: false, error: err.message, details: err.stack });
      }
    }
  }
}

// Disable WhatsApp bot
export function disable(req, res) {
  try {
    whatsappService.disableWhatsAppBot();
    lastQr = '';
    lastQrImageUrl = '';
    lastQrAt = null;
    res.json({ success: true, message: 'WhatsApp bot disabled.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Status endpoint used by the manager dashboard polling
export function qrStatus(req, res) {
  try {
    // This endpoint is polled by the frontend. Conditional GET (ETag + If-None-Match)
    // can yield 304 responses with an empty body, which breaks QR polling.
    // Force no-store and a changing ETag so the client always receives JSON.
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });
    res.set('ETag', `"${Date.now()}"`);

    const ready = whatsappService.isWhatsAppEnabled();
    if (ready) {
      return res.json({ status: 'ready' });
    }
    if (lastQrImageUrl) {
      return res.json({ status: 'qr', qrImage: lastQrImageUrl, qrAt: lastQrAt });
    }
    return res.json({ status: 'disabled' });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
}

// Logout/reset endpoint: clears WhatsApp auth so a new QR is required
export function logout(req, res) {
  try {
    whatsappService.resetWhatsAppAuth();
    lastQr = '';
    lastQrImageUrl = '';
    lastQrAt = null;
    res.json({ success: true, message: 'WhatsApp bot logged out. Please enable again to get a new QR.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Send a test message (for now, takes jid and text)
export async function sendMessage(req, res) {
  try {
    const { jid, text } = req.body;
    if (!jid || !text) return res.status(400).json({ success: false, error: 'jid and text required' });
    await whatsappService.sendWhatsAppMessage(jid, text);
    res.json({ success: true, message: 'Message sent.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// TODO: Add endpoints for announcements, group management, chat command handling, Gemini integration, etc. 