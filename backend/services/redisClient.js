import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

let client = null;
let connectPromise = null;

function getRedisUrl() {
  return process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING || '';
}

async function connectIfNeeded() {
  if (client && client.isOpen) return client;
  if (connectPromise) return connectPromise;

  const url = getRedisUrl();
  if (!url) return null;

  client = createClient({
    url,
    socket: {
      // Fail fast if Redis is down/unreachable
      connectTimeout: 1500,
      // Avoid hanging forever on reconnect attempts (caching should be optional)
      reconnectStrategy: () => new Error('Redis reconnect disabled'),
    },
  });

  client.on('error', (err) => {
    // Do not crash the app; middleware will bypass cache if Redis is unhealthy.
    console.error('Redis client error:', err?.message || err);
  });

  connectPromise = client
    .connect()
    .then(() => client)
    .catch((err) => {
      console.error('Redis connect failed:', err?.message || err);
      try {
        client?.disconnect();
      } catch {
        // ignore
      }
      client = null;
      connectPromise = null;
      return null;
    });

  return connectPromise;
}

export async function getRedisClient() {
  return connectIfNeeded();
}

export async function redisPing() {
  const c = await connectIfNeeded();
  if (!c) return false;
  try {
    const pong = await c.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
