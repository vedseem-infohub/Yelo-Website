/**
 * Change detection utility
 * Detects changes on pages and triggers refresh with state save
 */

const CHANGE_CHECK_INTERVAL = 5000 // Check for changes every 5 seconds
const CHANGE_HASH_KEY = 'yelo_page_hash_'

/**
 * Generate a hash from page content/state
 */
const generatePageHash = (pageData) => {
  if (typeof window === 'undefined') return null
  
  try {
    const str = JSON.stringify(pageData)
    // Simple hash function
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  } catch (e) {
    return null
  }
}

/**
 * Check if page has changed and trigger refresh if needed
 */
export const detectPageChanges = (pathname, pageData, onChange) => {
  if (typeof window === 'undefined') return null
  
  const hashKey = `${CHANGE_HASH_KEY}${pathname}`
  const currentHash = generatePageHash(pageData)
  
  try {
    const savedHash = localStorage.getItem(hashKey)
    
    if (savedHash && savedHash !== currentHash) {
      // Page has changed
      if (onChange && typeof onChange === 'function') {
        onChange(pathname, pageData)
      }
    }
    
    // Save current hash
    if (currentHash) {
      localStorage.setItem(hashKey, currentHash)
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  return currentHash
}

/**
 * Start monitoring page for changes
 */
export const startChangeDetection = (pathname, getPageData, onChange, interval = CHANGE_CHECK_INTERVAL) => {
  if (typeof window === 'undefined') return null
  
  const checkChanges = () => {
    const pageData = getPageData()
    detectPageChanges(pathname, pageData, onChange)
  }
  
  // Initial check
  checkChanges()
  
  // Set up interval
  const intervalId = setInterval(checkChanges, interval)
  
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * Save page state after changes detected
 */
export const savePageAfterChange = (pathname, pageData, router) => {
  if (typeof window === 'undefined') return
  
  try {
    // Save page state
    const stateKey = `yelo_page_state_${pathname}`
    localStorage.setItem(stateKey, JSON.stringify({
      state: pageData,
      timestamp: Date.now()
    }))
    
    // Refresh the page to show new changes
    if (router && router.refresh) {
      router.refresh()
    } else {
      window.location.reload()
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

