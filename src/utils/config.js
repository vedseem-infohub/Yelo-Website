/**
 * API Configuration
 * Provides the backend API URL with proper fallbacks
 */
const RENDER_BACKEND_URL = 'https://yelo-backend-r5pu.onrender.com/api';
const LOCALHOST_BACKEND_URL = 'http://localhost:5000/api';

export const getApiUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // PRIORITY 1: If running on localhost, prefer localhost backend but allow fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return LOCALHOST_BACKEND_URL;
    }
    
    // PRIORITY 2: Check environment variable (only if not on localhost)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // PRIORITY 3: Production domains use deployed backend
    if (hostname.includes('yeloindia.com') || hostname.includes('vercel.app')) {
      return RENDER_BACKEND_URL;
    }
    
    // PRIORITY 4: Default to localhost (shouldn't reach here in browser)
    return LOCALHOST_BACKEND_URL;
  }
  
  // Server-side: Check env var first, then default to localhost
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  return LOCALHOST_BACKEND_URL;
};

/**
 * Get fallback backend URL (used when primary backend is unavailable)
 */
export const getFallbackApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // On localhost, fallback to Render backend
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return RENDER_BACKEND_URL;
    }
  }
  
  // Default fallback (shouldn't be used)
  return RENDER_BACKEND_URL;
};

export const API_URL = getApiUrl();

