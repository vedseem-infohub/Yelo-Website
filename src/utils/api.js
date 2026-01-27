/**
 * API utility functions for frontend
 */
import { getApiUrl } from "./config";

const apiUrl = getApiUrl();


async function apiFetch(endpoint, options = {}) {
  const url = `${apiUrl}${endpoint}`;

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yelo_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, config);

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      throw new Error(`Empty response from server: ${response.status}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      if (response.status === 404 && (endpoint.includes('/products/category') || endpoint.includes('/shops/') && endpoint.includes('/products'))) {
        return {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 6,
            total: 0,
            pages: 0,
            hasMore: false
          }
        };
      }
      throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    // For product endpoints, return empty array instead of throwing
    if (endpoint.includes('/products/category') || (endpoint.includes('/shops/') && endpoint.includes('/products'))) {
      return {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 6,
          total: 0,
          pages: 0,
          hasMore: false
        }
      };
    }
    throw error;
  }
}


export const productAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/products${queryString ? `?${queryString}` : ""}`);
  },

  getBySlug: async (slug) => {
    return apiFetch(`/products/${slug}`);
  },

  getByShop: async (shopSlug, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/products/shop/${shopSlug}${queryString ? `?${queryString}` : ""}`);
  },

  getByVendor: async (vendorSlug, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/products/vendor/${vendorSlug}${queryString ? `?${queryString}` : ""}`);
  },

  getTrending: async (limit = 20) => {
    return apiFetch(`/products/trending?limit=${limit}`);
  },

  search: async (query, params = {}) => {
    const searchParams = { ...params, search: query };
    const queryString = new URLSearchParams(searchParams).toString();
    return apiFetch(`/products${queryString ? `?${queryString}` : ""}`);
  },

  getSearchSuggestions: async (query, includeLuxury = false) => {
    return apiFetch(`/products/search/suggestions?q=${encodeURIComponent(query)}&includeLuxury=${includeLuxury}`);
  },
  comprehensiveSearch: async (query, includeLuxury = false) => {
    return apiFetch(`/products/search/comprehensive?q=${encodeURIComponent(query)}&includeLuxury=${includeLuxury}`);
  },

  getByCategory: async (categorySlug, subcategorySlug = null, params = {}) => {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 6,
      sort: params.sort || 'popular',
      categorySlug: categorySlug || '',
      ...(subcategorySlug && { subcategorySlug }),
      ...(params.minPrice && params.minPrice !== 'undefined' && { minPrice: params.minPrice }),
      ...(params.maxPrice && params.maxPrice !== 'undefined' && { maxPrice: params.maxPrice })
    };

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined || queryParams[key] === 'undefined' || queryParams[key] === '') {
        delete queryParams[key];
      }
    });

    const queryString = new URLSearchParams(queryParams).toString();
    return apiFetch(`/products/category${queryString ? `?${queryString}` : ""}`);
  },
};

export const userAPI = {
  getMe: async () => {
    return apiFetch("/users/me");
  },

  updateProfile: async (data) => {
    return apiFetch("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  updateAddress: async (data) => {
    return apiFetch("/users/address", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

/**
 * Cart API functions
 */
export const cartAPI = {
  get: async () => {
    return apiFetch("/cart");
  },

  add: async (productId, data) => {
    return apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, ...data }),
    });
  },

  update: async (itemId, data) => {
    return apiFetch(`/cart/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  remove: async (itemId) => {
    return apiFetch(`/cart/${itemId}`, {
      method: "DELETE",
    });
  },
};

/**
 * Review API functions
 */
export const reviewAPI = {
  // Get reviews for a product
  getByProduct: async (productId) => {
    return apiFetch(`/reviews?productId=${productId}`);
  },

  // Create a new review
  create: async (productId, rating, comment) => {
    return apiFetch("/reviews", {
      method: "POST",
      body: JSON.stringify({ productId, rating, comment }),
    });
  },
};

/**
 * Wishlist API functions
 */
export const wishlistAPI = {
  get: async () => {
    return apiFetch("/wishlist");
  },

  add: async (productId) => {
    return apiFetch("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  remove: async (productId) => {
    return apiFetch(`/wishlist/${productId}`, {
      method: "DELETE",
    });
  },
};

/**
 * Order API functions
 */
export const orderAPI = {
  getAll: async () => {
    return apiFetch("/orders");
  },

  getRemaining: async () => {
    return apiFetch("/orders/remaining");
  },

  getById: async (orderId) => {
    return apiFetch(`/orders/${orderId}`);
  },

  create: async (data) => {
    return apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  complete: async (orderId) => {
    return apiFetch(`/orders/${orderId}/complete`, {
      method: "POST",
    });
  },

  requestRefund: async (orderId, reason) => {
    return apiFetch(`/orders/${orderId}/refund`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  requestExchange: async (orderId, reason, newSize, newColor) => {
    return apiFetch(`/orders/${orderId}/exchange`, {
      method: "POST",
      body: JSON.stringify({ reason, newSize, newColor }),
    });
  },
};

/**
 * Notification API functions
 */
export const notificationAPI = {
  getRelatedProducts: async (days = 7, limit = 50) => {
    return apiFetch(`/notifications/related-products?days=${days}&limit=${limit}`);
  },
};

/**
 * Payment API functions
 */
export const paymentAPI = {
  createRazorpayOrder: async (orderId, amount) => {
    return apiFetch("/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ orderId, amount }),
    });
  },

  verifyPayment: async (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    return apiFetch("/payment/verify", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
    });
  },
};

/**
 * Auth API functions
 */
export const authAPI = {
  requestOTP: async (phone) => {
    return apiFetch("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  verifyOTP: async (phone, code) => {
    return apiFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  },
};

/**
 * Geocoding API functions
 */
export const geocodingAPI = {
  reverseGeocode: async (latitude, longitude) => {
    return apiFetch(`/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`);
  },

  geocodeAddress: async (address) => {
    return apiFetch(`/geocoding/geocode?address=${encodeURIComponent(address)}`);
  },
};

/**
 * Category API functions
 */
export const categoryAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/categories${queryString ? `?${queryString}` : ""}`);
  },

  // Get lightweight categories (name + image only)
  getLightweight: async (params = {}) => {
    const queryParams = { ...params, lightweight: 'true' };
    const queryString = new URLSearchParams(queryParams).toString();
    return apiFetch(`/categories${queryString ? `?${queryString}` : ""}`);
  },

  getBySlug: async (slug, lightweight = false) => {
    const queryParams = lightweight ? { lightweight: 'true' } : {};
    const queryString = new URLSearchParams(queryParams).toString();
    return apiFetch(`/categories/${slug}${queryString ? `?${queryString}` : ""}`);
  },

  seedHardcoded: async () => {
    return apiFetch("/categories/admin/seed-hardcoded", {
      method: "POST",
    });
  },

  updateCounts: async () => {
    return apiFetch("/categories/update-counts", {
      method: "POST",
    });
  },
};

/**
 * Brand API functions
 */
export const brandAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/brands${queryString ? `?${queryString}` : ""}`);
  },

  getBySlug: async (slug) => {
    return apiFetch(`/brands/${slug}`);
  },
};

/**
 * Shop API functions
 */
export const shopAPI = {
  // Get all shops
  getAll: async () => {
    return apiFetch("/shops");
  },

  // Get shop by slug
  getBySlug: async (slug) => {
    return apiFetch(`/shops/${slug}`);
  },

  // Get products by shop (paginated)
  getProducts: async (slug, params = {}) => {
    // Filter out undefined, null, and empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        acc[key] = value;
      }
      return acc;
    }, {});
    const queryParams = {
      ...cleanParams,
      page: params.page || 1,
      limit: params.limit || 6
    };
    const queryString = new URLSearchParams(queryParams).toString();
    return apiFetch(`/shops/${slug}/products${queryString ? `?${queryString}` : ""}`);
  },

  // Create a new shop
  create: async (shopData) => {
    return apiFetch("/shops", {
      method: "POST",
      body: JSON.stringify(shopData),
    });
  },

  // Update a shop
  update: async (slug, shopData) => {
    return apiFetch(`/shops/${slug}`, {
      method: "PUT",
      body: JSON.stringify(shopData),
    });
  },

  // Delete a shop
  delete: async (slug) => {
    return apiFetch(`/shops/${slug}`, {
      method: "DELETE",
    });
  },

  // Reassign all products to shops (useful after seeding shops or updating shop criteria)
  reassignProducts: async () => {
    return apiFetch("/shops/reassign-products", {
      method: "POST",
    });
  },
};

export default apiFetch;

