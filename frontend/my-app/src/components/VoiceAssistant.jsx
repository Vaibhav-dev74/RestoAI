import { useState, useRef, useEffect } from 'react';

// Gemini 1.5 Flash Free API call
async function getGeminiIntent(text, apiKey) {
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text }] }
        ]
      })
    });
    const data = await res.json();
    // Parse Gemini response for intent/command (simple for now)
    // You can improve this with a system prompt for structured output
    let botText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      botText = data.candidates[0].content.parts.map(p => p.text).join(' ');
    }
    return { botText };
  } catch (e) {
    return { botText: 'Sorry, I could not process that.' };
  }
}

const GEMINI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env)
  ? (import.meta.env.VITE_GEMINI_API_KEY || '')
  : '';

const HELP_TEXT =
  'Try: “open inventory”, “delete <item> from inventory”, “add inventory <item> <qty> <unit>”, ' +
  '“enable whatsapp”, “show whatsapp qr”, “logout whatsapp”, ' +
  '“set table <name> on <floor> to seated/available/completed”, ' +
  '“mute”, “unmute”, “repeat”, “stop listening”.';

function normalizeText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseQuantityAndUnit(tokens) {
  // Accept: 5, 5.5, -2, etc.
  const qtyRaw = tokens[0];
  const qty = Number(qtyRaw);
  if (!Number.isFinite(qty)) return null;

  let unit = '';
  let restStart = 1;

  // Optional unit token (kg, grams, g, litre, l, pieces, pcs)
  const maybeUnit = (tokens[1] || '').toLowerCase();
  const knownUnits = new Set(['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'l', 'litre', 'litres', 'ml', 'pieces', 'piece', 'pcs']);
  if (knownUnits.has(maybeUnit)) {
    unit = maybeUnit;
    restStart = 2;
  }

  return { quantity: qty, unit, restStart };
}

function mapUnitToBackend(unit) {
  if (!unit) return '';
  const u = unit.toLowerCase();
  if (u === 'kilogram' || u === 'kilograms') return 'kg';
  if (u === 'gram' || u === 'grams') return 'g';
  if (u === 'litre' || u === 'litres') return 'l';
  if (u === 'piece') return 'pieces';
  if (u === 'pcs') return 'pieces';
  return u;
}

function normalizeFloorName(floor) {
  const f = normalizeText(floor);
  if (!f) return '';
  if (f === 'ground' || f === 'ground floor' || f === 'gf') return 'ground floor';
  if (f === 'first' || f === 'first floor' || f === '1st floor') return 'first floor';
  if (f === 'second' || f === 'second floor' || f === '2nd floor') return 'second floor';
  if (f === 'third' || f === 'third floor' || f === '3rd floor') return 'third floor';
  return f;
}

function mapSpokenTableStatusToReservationStatus(spokenStatus) {
  const s = normalizeText(spokenStatus);
  if (!s) return null;
  if (s === 'occupied' || s === 'seated') return 'seated';
  if (s === 'confirmed' || s === 'confirm') return 'confirmed';
  if (s === 'completed' || s === 'complete' || s === 'done' || s === 'finished') return 'completed';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'cancelled';
  if (s === 'available' || s === 'free') return 'available';
  return null;
}

export default function VoiceAssistant({ onCommand }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botSpeech, setBotSpeech] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [supportError, setSupportError] = useState('');
  const recognitionRef = useRef(null);
  const keepListeningRef = useRef(false);
  const lastCommandRef = useRef('');
  const lastCommandAtRef = useRef(0);
  const cooldownRef = useRef(false);
  const lastBotSpeechRef = useRef('');
  const isSpeakingRef = useRef(false);
  const pendingRestartRef = useRef(false);

  // Create recognition instance once
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      }
      keepListeningRef.current = false;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setSupportError('Speech recognition not supported in this browser.');
      return;
    }
    setShowModal(true);
    setSupportError('');
    console.log('VoiceAssistant: Starting listening...');
    const recognition = recognitionRef.current;
    recognition.lang = 'en-IN';
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      console.log('VoiceAssistant: Recognized text:', text);

      // Avoid feedback-loop: ignore recognition results triggered while TTS is speaking.
      if (isSpeakingRef.current) {
        console.log('VoiceAssistant: Ignoring result while speaking.');
        return;
      }

      // Prevent repeated identical commands
      const normalized = normalizeText(text);
      const now = Date.now();
      if (cooldownRef.current || (normalized && normalized === lastCommandRef.current && (now - lastCommandAtRef.current) < 1500)) {
        console.log('VoiceAssistant: Ignoring repeated or cooldown command:', text);
        return;
      }
      lastCommandRef.current = normalized;
      lastCommandAtRef.current = now;
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 1000); // 1 second cooldown
      // NLU: simple keyword/intent extraction for demo
      let intent = '';
      let entity = '';
      let tab = '';
      let highlight = '';
      let botText = '';
      const lower = normalized;
      let match;

      // Voice controls
      if (lower === 'help' || lower.includes('what can you do') || lower.includes('commands')) {
        intent = 'help';
        botText = HELP_TEXT;
      } else if (lower === 'mute') {
        intent = 'mute';
        botText = 'Muted.';
        setTtsEnabled(false);
      } else if (lower === 'unmute') {
        intent = 'unmute';
        botText = 'Unmuted.';
        setTtsEnabled(true);
      } else if (lower === 'repeat') {
        intent = 'repeat';
        botText = lastBotSpeechRef.current || 'Nothing to repeat yet.';
      } else if (lower === 'stop listening' || lower === 'stop' || lower === 'cancel') {
        intent = 'stop_listening';
        botText = 'Stopping.';
        // stop immediately
        keepListeningRef.current = false;
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        }
        setShowModal(false);
      }

      // WhatsApp controls
      else if (lower.includes('enable whatsapp') || lower.includes('start whatsapp')) {
        intent = 'whatsapp_enable';
        botText = 'Enabling WhatsApp. If needed, I will show a QR to scan.';
      } else if (lower.includes('disable whatsapp') || lower.includes('stop whatsapp')) {
        intent = 'whatsapp_disable';
        botText = 'Disabling WhatsApp.';
      } else if (lower.includes('logout whatsapp') || lower.includes('log out whatsapp')) {
        intent = 'whatsapp_logout';
        botText = 'Logging out WhatsApp. You may need to scan a new QR.';
      } else if ((lower.includes('show') || lower.includes('get') || lower.includes('open')) && (lower.includes('qr') && lower.includes('whatsapp'))) {
        intent = 'whatsapp_qr';
        botText = 'Fetching WhatsApp QR status.';
      }

      // Inventory update (voice)
      else if ((match = lower.match(/^(add inventory) (.+)$/))) {
        // add inventory tomato 5 kg
        intent = 'upsert_inventory';
        tab = 'inventory';
        const rest = match[2].trim();
        const parts = rest.split(' ');
        // Try patterns: <name> <qty> <unit?> OR <qty> <unit?> <name>
        let name = '';
        let quantity = null;
        let unit = '';

        // Pattern A: name first, number later
        const lastNumberIndex = parts.findIndex(p => /^-?\d+(\.\d+)?$/.test(p));
        if (lastNumberIndex > 0) {
          name = parts.slice(0, lastNumberIndex).join(' ').trim();
          const q = parseQuantityAndUnit(parts.slice(lastNumberIndex));
          if (q) {
            quantity = q.quantity;
            unit = mapUnitToBackend(q.unit);
          }
        } else {
          // Pattern B: number first
          const q = parseQuantityAndUnit(parts);
          if (q) {
            quantity = q.quantity;
            unit = mapUnitToBackend(q.unit);
            name = parts.slice(q.restStart).join(' ').trim();
          }
        }

        entity = name;
        highlight = name;
        if (!name || quantity === null) {
          intent = 'help';
          botText = 'Say: add inventory <item> <quantity> <unit>. Example: add inventory tomato 5 kg.';
        } else {
          botText = `Updating inventory: ${name} ${quantity}${unit ? ' ' + unit : ''}.`;
        }

        // Attach structured payload for the dashboard
        const payload = { name, quantity, unit };
        // pass payload through onCommand as extra fields
        // (kept below when calling onCommand)
        // store payload in highlight string not needed
        // We'll pass it via the meta object.
        // eslint-disable-next-line no-unused-vars
        highlight = highlight; // keep unchanged
        // Attach to global variable via closure
        // (we'll pass payload in onCommand meta)
        //
        // NOTE: we can't declare meta here because we call onCommand later.
        // We'll re-derive payload from entity/quantity in dashboard too if needed.
        //
        // We'll stash payload in botText parsing later.
        //
        // Use a ref-like local variable via function scope (below).
        //
        // We'll set a property on recognition for this result.
        recognition.__lastPayload = payload;
      }
      else if ((match = lower.match(/^(delete|remove) (.+) from inventory$/))) {
        intent = 'delete_inventory';
        entity = match[2].trim();
        tab = 'inventory';
        highlight = entity;
        botText = `Deleting ${entity} from inventory.`;
      }

      // Table status change (reservation-driven)
      else if (
        (match = lower.match(/^(set|change|mark) table (.+?)(?: on (.+?))? (?:to|as) (available|free|occupied|seated|confirmed|completed|complete|done|cancelled|canceled|cancel)$/))
        || (match = lower.match(/^(set|change|mark) table (.+?)(?: on (.+?))? (available|free|occupied|seated|confirmed|completed|complete|done|cancelled|canceled|cancel)$/))
      ) {
        intent = 'set_table_status';
        const tableNameRaw = (match[2] || '').trim();
        const floorRaw = (match[3] || '').trim();
        const statusRaw = (match[4] || '').trim();

        const tableName = tableNameRaw;
        const floor = normalizeFloorName(floorRaw);
        const desired = mapSpokenTableStatusToReservationStatus(statusRaw);

        if (!tableName || !desired) {
          intent = 'help';
          botText = 'Say: set table <name> on <floor> to seated/available/completed. Example: set table A1 on ground floor to seated.';
        } else {
          botText = `Setting table ${tableName}${floor ? ` on ${floor}` : ''} to ${desired}.`;
          recognition.__lastPayload = { tableName, floor, desiredStatus: desired };
        }
      }

      // Navigation / info intents
      else if (lower.includes('tomato') && lower.includes('inventory')) {
        intent = 'show_inventory';
        entity = 'tomato';
        tab = 'inventory';
        highlight = 'tomato';
        botText = 'Navigating to inventory. Tomatoes are highlighted.';
      } else if (lower.includes('chicken') && lower.includes('inventory')) {
        intent = 'show_inventory';
        entity = 'chicken';
        tab = 'inventory';
        highlight = 'chicken';
        botText = 'Navigating to inventory. Chicken is highlighted.';
      } else if (lower.includes('inventory')) {
        intent = 'show_inventory';
        tab = 'inventory';
        botText = 'Navigating to inventory.';
      } else if (lower.includes('traceability')) {
        intent = 'show_traceability';
        tab = 'traceability';
        botText = 'Navigating to traceability and safety.';
      } else if (lower.includes('dynamic pricing') || lower.includes('profit')) {
        intent = 'show_dynamic_pricing';
        tab = 'dynamicpricing';
        botText = 'Navigating to dynamic pricing.';
      } else if (lower.includes('food security') || lower.includes('donate')) {
        intent = 'show_food_security';
        tab = 'foodsecurity';
        botText = 'Navigating to food security grid.';
      } else {
        // Fallback to Gemini for more complex queries
        botText = HELP_TEXT;
        if (GEMINI_API_KEY && (lower.startsWith('ask ') || lower.startsWith('question ') || lower.includes('explain'))) {
          const gemini = await getGeminiIntent(text, GEMINI_API_KEY);
          botText = gemini.botText;
        }
      }
      setBotSpeech(botText);
      lastBotSpeechRef.current = botText;
      if (ttsEnabled) speakBack(botText);

      const payload = recognition.__lastPayload;
      recognition.__lastPayload = undefined;

      if (onCommand) onCommand(text, { intent, entity, tab, highlight, botText, payload });
      // Schedule restart via onend only (prevents double-start races).
      pendingRestartRef.current = true;
    };
    recognition.onend = () => {
      setListening(false);
      if (keepListeningRef.current && pendingRestartRef.current && !isSpeakingRef.current) {
        pendingRestartRef.current = false;
        setTimeout(() => {
          if (!keepListeningRef.current || isSpeakingRef.current) return;
          setTranscript('');
          setBotSpeech('');
          try {
            console.log('VoiceAssistant: onend - Restarting listening...');
            recognition.start();
            setListening(true);
          } catch (e) {
            console.log('VoiceAssistant: restart failed:', e);
          }
        }, 350);
      }
    };
    recognition.onerror = (e) => {
      setListening(false);
      console.log('VoiceAssistant: Recognition error', e);
      // Restart only for recoverable errors
      const err = e?.error || '';
      const recoverable = err === 'no-speech' || err === 'audio-capture' || err === 'network';
      if (keepListeningRef.current && recoverable && !isSpeakingRef.current) {
        pendingRestartRef.current = false;
        setTimeout(() => {
          if (!keepListeningRef.current || isSpeakingRef.current) return;
          setTranscript('');
          setBotSpeech('');
          try {
            console.log('VoiceAssistant: onerror - Restarting listening...');
            recognition.start();
            setListening(true);
          } catch (e2) {
            console.log('VoiceAssistant: restart failed:', e2);
          }
        }, 650);
      }
    };
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    keepListeningRef.current = false;
    pendingRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
    }
    setListening(false);
    setShowModal(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      keepListeningRef.current = true;
      startListening();
    }
  };

  // Simple TTS
  const speakBack = (text, lang = 'en-IN') => {
    if ('speechSynthesis' in window) {
      // Pause recognition while speaking to prevent the assistant hearing itself.
      isSpeakingRef.current = true;
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        }
      } catch {
        // ignore
      }

      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.onend = () => {
        isSpeakingRef.current = false;
        // Resume listening if user enabled continuous mode
        if (keepListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setListening(true);
          } catch {
            // ignore
          }
        }
      };
      utter.onerror = () => {
        isSpeakingRef.current = false;
      };
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 3000 }}>
      <button
        aria-label={listening ? 'Stop voice assistant' : 'Start voice assistant'}
        aria-pressed={listening}
        onClick={toggleListening}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleListening(); }}
        style={{
          background: listening ? '#b91c1c' : '#343a40',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 64,
          height: 64,
          boxShadow: '0 4px 24px #b91c1c44',
          fontSize: 32,
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        tabIndex={0}
      >
        {listening ? '🎤' : '🗣️'}
      </button>
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'absolute',
            right: 80,
            bottom: 0,
            minWidth: 260,
            background: '#fff',
            border: '1.5px solid #b91c1c',
            borderRadius: 12,
            boxShadow: '0 4px 24px #b91c1c44',
            padding: 16,
            zIndex: 3100,
            color: '#18181b',
            fontSize: 15,
            maxWidth: 320,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#b91c1c' }}>Voice Assistant</div>
          {supportError && (
            <div style={{ marginBottom: 8, color: '#b91c1c', fontWeight: 600 }}>{supportError}</div>
          )}
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#343a40', fontWeight: 600 }}>You:</span> <span>{transcript || <i>Say something...</i>}</span>
          </div>
          <div>
            <span style={{ color: '#343a40', fontWeight: 600 }}>Bot:</span> <span>{botSpeech || <i>Waiting...</i>}</span>
          </div>
          <button
            onClick={stopListening}
            style={{ marginTop: 12, background: '#b91c1c', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}
          >Stop</button>
        </div>
      )}
    </div>
  );
} 