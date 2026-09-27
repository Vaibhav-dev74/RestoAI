// Centralized API base URL for frontend → backend requests.
// Set VITE_API_URL in your environment (e.g., https://api.example.com).
// If omitted, defaults to the current hostname on port 4000 (useful for LAN/mobile testing).

const defaultBaseUrl = (typeof window !== 'undefined' && window.location?.hostname)
	? `http://${window.location.hostname}:4000`
	: 'http://localhost:4000';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || defaultBaseUrl).replace(/\/$/, '');
