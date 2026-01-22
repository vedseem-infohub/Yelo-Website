/**
 * Geocoding Utilities
 * Uses backend API endpoints for geocoding operations
 */
import { geocodingAPI } from './api';

/**
 * Get user's current location using browser Geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocode: Convert latitude/longitude to address
 * Uses backend API endpoint
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{address: string, city: string, state: string, pincode: string, fullAddress: string}>}
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await geocodingAPI.reverseGeocode(latitude, longitude);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to reverse geocode location');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Geocode: Convert address to latitude/longitude
 * Uses backend API endpoint
 * @param {string} address
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export async function geocodeAddress(address) {
  try {
    const response = await geocodingAPI.geocodeAddress(address);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to geocode address');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

