import { getRedisClient } from '../services/redisClient.js';

function stableStringifyQuery(query) {
  const entries = Object.entries(query || {})
    .map(([k, v]) => [k, v])
    .sort(([a], [b]) => a.localeCompare(b));

  return entries
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}=${v.map(x => String(x)).sort().join(',')}`;
      if (v === undefined) return `${k}=`;
      return `${k}=${String(v)}`;
    })
    .join('&');
}

function defaultTagsFromReq(req) {
  const tags = new Set();

  // Route-level tag
  if (req.baseUrl) tags.add(`route:${req.baseUrl}`);

  // Restaurant-scoped tags (common in this app)
  const fromParams = req.params?.restaurantId || req.params?.id;
  const fromQuery = req.query?.restaurantId;
  const fromBody = req.body?.restaurantId;
  const fromUser = req.user?.restaurant?._id || req.user?.restaurant;

  const restaurantId = fromParams || fromQuery || fromBody || fromUser;
  if (restaurantId) tags.add(`restaurant:${String(restaurantId)}`);

  // User tag (safe-by-default)
  if (req.user?._id) tags.add(`user:${String(req.user._id)}`);

  return Array.from(tags);
}

async function addKeyToTag(redis, tag, key, ttlSeconds) {
  const setKey = `tagset:${tag}`;
  await redis.sAdd(setKey, key);
  // Keep tagset a bit longer than the cached item, so invalidation can find it.
  const expireSeconds = Math.max(60, Math.min(24 * 60 * 60, (ttlSeconds || 30) + 300));
  await redis.expire(setKey, expireSeconds);
}

export function redisCache(options = {}) {
  const {
    ttlSeconds = 20,
    keyPrefix = 'cache',
    scope = 'auto', // 'auto' includes req.user if present
    tagsFromReq = defaultTagsFromReq,
    skip = (req) => {
      const p = `${req.baseUrl || ''}${req.path || ''}`;
      // Volatile endpoints or ones that already manage caching explicitly
      if (p.includes('/api/whatsapp/qr')) return true;
      if (p.includes('/api/health')) return true;
      return false;
    },
  } = options;

  return async function redisCacheMiddleware(req, res, next) {
    try {
      if (req.method !== 'GET') return next();
      if (res.locals?.disableRedisCache) return next();
      if (skip(req)) return next();

      const redis = await getRedisClient();
      if (!redis) return next();

      const userScope = (() => {
        if (scope === 'public') return 'public';
        if (scope === 'user') return req.user?._id ? `u:${req.user._id}` : 'anon';
        // auto
        return req.user?._id ? `u:${req.user._id}` : 'public';
      })();

      const q = stableStringifyQuery(req.query);
      const pathKey = `${req.baseUrl || ''}${req.path || ''}`;
      const cacheKey = `${keyPrefix}:${userScope}:${pathKey}${q ? `?${q}` : ''}`;

      const hit = await redis.get(cacheKey);
      if (hit) {
        res.set('X-Redis-Cache', 'HIT');
        try {
          return res.json(JSON.parse(hit));
        } catch {
          return res.send(hit);
        }
      }

      res.set('X-Redis-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const status = res.statusCode;
        // Cache only successful JSON responses
        if (status >= 200 && status < 300) {
          Promise.resolve()
            .then(async () => {
              try {
                await redis.set(cacheKey, JSON.stringify(body), { EX: ttlSeconds });
                const tags = typeof tagsFromReq === 'function' ? tagsFromReq(req) : [];
                for (const tag of tags) {
                  await addKeyToTag(redis, tag, cacheKey, ttlSeconds);
                }
              } catch {
                // ignore cache errors
              }
            })
            .catch(() => {});
        }
        return originalJson(body);
      };

      return next();
    } catch {
      return next();
    }
  };
}

export function redisAutoInvalidate(options = {}) {
  const { tagsFromReq = defaultTagsFromReq } = options;

  return async function redisAutoInvalidateMiddleware(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    const redis = await getRedisClient();
    if (!redis) return next();

    res.on('finish', () => {
      const status = res.statusCode;
      if (status >= 400) return;

      Promise.resolve()
        .then(async () => {
          const tags = typeof tagsFromReq === 'function' ? tagsFromReq(req) : [];
          for (const tag of tags) {
            const setKey = `tagset:${tag}`;
            let keys = [];
            try {
              keys = await redis.sMembers(setKey);
            } catch {
              keys = [];
            }
            if (keys.length > 0) {
              try {
                await redis.del(keys);
              } catch {
                // ignore
              }
            }
            try {
              await redis.del(setKey);
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    });

    return next();
  };
}
