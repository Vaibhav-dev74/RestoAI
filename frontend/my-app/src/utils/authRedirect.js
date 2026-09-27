function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function base64UrlDecode(input) {
  if (!input) return null;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const decoded = base64UrlDecode(parts[1]);
  return safeJsonParse(decoded);
}

function normalizeRestaurantId(restaurant) {
  if (!restaurant) return null;
  if (typeof restaurant === 'string') return restaurant;
  if (typeof restaurant === 'object') return restaurant._id || restaurant.id || null;
  return null;
}

export function getAuthenticatedRedirectPath() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return null;

  const storedUser = typeof localStorage !== 'undefined' ? safeJsonParse(localStorage.getItem('user')) : null;
  const role = storedUser?.role || decodeJwtPayload(token)?.role;

  if (role === 'customer') return '/restaurants';
  if (role === 'vendor') return '/dashboard/vendor';
  if (role === 'kitchen') return '/dashboard/kitchen';
  if (role === 'waiter') return '/dashboard/waiter';

  if (role === 'manager') {
    const restaurantId =
      normalizeRestaurantId(storedUser?.restaurant) ||
      storedUser?.restaurantId ||
      storedUser?.restaurant?._id ||
      storedUser?.restaurant?.id ||
      null;

    return `/dashboard/manager/${restaurantId || 'new'}`;
  }

  // Fallback: if token exists but role is unknown, keep them off public auth pages.
  return '/dashboard/vendor';
}
