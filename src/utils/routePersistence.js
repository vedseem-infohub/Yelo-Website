/**
 * Route persistence utility
 * Saves current page/route to localStorage and restores on refresh
 */

const ROUTE_KEY = 'yelo_current_route'
const PAGE_STATE_KEY_PREFIX = 'yelo_page_state_'

/**
 * Save current route to localStorage
 */
export const saveRoute = (pathname, searchParams = {}) => {
  if (typeof window === 'undefined') return
  
  try {
    const routeData = {
      pathname,
      searchParams,
      timestamp: Date.now()
    }
    localStorage.setItem(ROUTE_KEY, JSON.stringify(routeData))
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get saved route from localStorage
 */
export const getSavedRoute = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem(ROUTE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return null
}

/**
 * Save page state to localStorage
 */
export const savePageState = (pathname, state) => {
  if (typeof window === 'undefined') return
  
  try {
    const stateKey = `${PAGE_STATE_KEY_PREFIX}${pathname}`
    const stateData = {
      state,
      timestamp: Date.now()
    }
    localStorage.setItem(stateKey, JSON.stringify(stateData))
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get saved page state from localStorage
 */
export const getPageState = (pathname) => {
  if (typeof window === 'undefined') return null
  
  try {
    const stateKey = `${PAGE_STATE_KEY_PREFIX}${pathname}`
    const saved = localStorage.getItem(stateKey)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return null
}

/**
 * Clear saved route (useful for logout or navigation)
 */
export const clearRoute = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(ROUTE_KEY)
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Save product data to localStorage when product detail page loads
 */
export const saveProductData = (productId, productData) => {
  if (typeof window === 'undefined' || !productId) return
  
  try {
    const productKey = `yelo_product_${productId}`
    localStorage.setItem(productKey, JSON.stringify({
      data: productData,
      timestamp: Date.now()
    }))
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get saved product data from localStorage
 */
export const getProductData = (productId) => {
  if (typeof window === 'undefined' || !productId) return null
  
  try {
    const productKey = `yelo_product_${productId}`
    const saved = localStorage.getItem(productKey)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return null
}

/**
 * Save section data to localStorage when section loads (e.g., homepage sections)
 */
export const saveSectionData = (sectionKey, sectionData) => {
  if (typeof window === 'undefined' || !sectionKey) return
  
  try {
    const key = `yelo_section_${sectionKey}`
    localStorage.setItem(key, JSON.stringify({
      data: sectionData,
      timestamp: Date.now()
    }))
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get saved section data from localStorage
 */
export const getSectionData = (sectionKey) => {
  if (typeof window === 'undefined' || !sectionKey) return null
  
  try {
    const key = `yelo_section_${sectionKey}`
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return null
}

/**
 * Save current shop context to localStorage
 * Used to track which shop a user is viewing for related products
 */
export const saveShopContext = (shopSlug) => {
  if (typeof window === 'undefined' || !shopSlug) return
  
  try {
    const contextData = {
      shopSlug,
      timestamp: Date.now()
    }
    localStorage.setItem('yelo_shop_context', JSON.stringify(contextData))
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get saved shop context from localStorage
 * Returns the shop slug the user was viewing
 */
export const getShopContext = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const saved = localStorage.getItem('yelo_shop_context')
    if (saved) {
      const data = JSON.parse(saved)
      // Return shop slug if it's less than 1 hour old (to avoid stale data)
      const oneHourMs = 60 * 60 * 1000
      if (Date.now() - data.timestamp < oneHourMs) {
        return data.shopSlug
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return null
}

/**
 * Clear shop context from localStorage
 */
export const clearShopContext = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('yelo_shop_context')
  } catch (e) {
    // Ignore localStorage errors
  }
}

