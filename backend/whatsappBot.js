import qrcode from 'qrcode-terminal';
import whatsappService from './services/whatsappService.js';

// CLI helper only.
// App workflow: run `npm run dev` (backend/index.js) and use Manager Dashboard → WhatsApp → Enable.
// Troubleshooting/pairing workflow: run `node whatsappBot.js` to print QR in terminal.

const reset = process.argv.includes('--reset');

console.log('[WhatsApp CLI] Starting Baileys QR login...');
console.log('[WhatsApp CLI] Ensure your backend API is running (default BACKEND_URL=http://localhost:4000).');
console.log(`[WhatsApp CLI] Reset session: ${reset ? 'yes' : 'no'} (use --reset if you see 401/logged out)`);

try {
  await whatsappService.enableWhatsAppBot((qr) => {
    console.log('\n[WhatsApp CLI] Scan this QR code with WhatsApp:');
    qrcode.generate(qr, { small: true });
  }, reset);
} catch (e) {
  console.error('[WhatsApp CLI] Failed to start:', e?.message || e);
  process.exitCode = 1;
}

process.on('SIGINT', () => {
  try { whatsappService.disableWhatsAppBot(); } catch { /* ignore */ }
  process.exit(0);
});