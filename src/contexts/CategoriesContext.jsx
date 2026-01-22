'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { categoryAPI } from '@/utils/api'

const CategoriesContext = createContext({
  categories: [],
  isLoading: true,
  error: null,
  getCategoryBySlug: () => null,
  fetchCategorySubcategories: async () => null,
  subcategoriesCache: {},
  refreshCategories: async () => {},
})

const CACHE_KEY = 'yelo_categories_cache'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes (increased for better performance)

// Export function to clear cache (for debugging)
if (typeof window !== 'undefined') {
  window.clearCategoriesCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      return true
    } catch (e) {
      return false
    }
  }
}

// Function to clear cache (can be called from outside)
export const clearCategoriesCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (e) {
    // Ignore cache errors
  }
}

export const useCategories = () => useContext(CategoriesContext)

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [subcategoriesCache, setSubcategoriesCache] = useState({}) // Cache subcategories by category slug
  const fetchPromiseRef = useRef(null) // Prevent duplicate requests

  // Load from cache immediately and fetch from API
  useEffect(() => {
    let cachedData = null
    let cacheAge = Infinity
    
    // Load from cache first (synchronous for instant display)
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        cachedData = parsed.data
        cacheAge = Date.now() - (parsed.timestamp || 0)
        
        // Use cache if valid and fresh
        if (cacheAge < CACHE_DURATION && Array.isArray(cachedData) && cachedData.length > 0) {
          setCategories(cachedData)
          setIsLoading(false)
          // Still fetch in background to update cache
        } else if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
          // Use stale cache while fetching fresh data
          setCategories(cachedData)
        }
      }
    } catch (e) {
      // Ignore cache errors
      console.warn('Cache read error:', e)
    }

    // Fetch from API (prevent duplicate requests)
    if (fetchPromiseRef.current) {
      return
    }

    const fetchCategories = async () => {
      // Only set loading if we don't have cached data or cache is very stale
      if (!cachedData || cacheAge >= CACHE_DURATION) {
        setIsLoading(true)
      }
      setError(null)
      
      let timeoutId = null
      
      // Add timeout to prevent hanging
      timeoutId = setTimeout(() => {
        if (fetchPromiseRef.current) {
          setIsLoading(false)
          fetchPromiseRef.current = null
        }
      }, 10000) // 10 second timeout
      
      try {
        // Use lightweight endpoint for faster initial load (name + image only)
        const response = await categoryAPI.getLightweight()
        
        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (response && response.success) {
          // Handle case where data might be null or undefined
          const categoriesData = Array.isArray(response.data) ? response.data : (response.data === null || response.data === undefined ? [] : [])
          
          // NO FILTERING - use all categories as received from backend
          const allCategories = categoriesData.filter(cat => cat && cat.slug) // Only filter out completely invalid entries
          
          // Lightweight endpoint already returns only name, slug, image, productCount
          // No subcategories included for faster loading
          setCategories(allCategories)
          
          // Cache the data
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: allCategories,
              timestamp: Date.now()
            }))
          } catch (e) {
            // Ignore cache errors
          }
        } else {
          // If response is empty object or doesn't have expected structure, use cached data or empty array
          if (cachedData && cachedData.data) {
            setCategories(cachedData.data)
          } else {
            setCategories([])
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch categories')
        // Keep cached data on error
        if (!cachedData) {
          setCategories([])
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        setIsLoading(false)
        fetchPromiseRef.current = null
      }
    }

    // Always fetch from API (even if we have cache, to ensure fresh data)
    // Cache is just for instant display while fetching
    fetchPromiseRef.current = fetchCategories()
  }, []) // Only run once on mount

  const getCategoryBySlug = (slug) => {
    if (!slug || !Array.isArray(categories)) return null
    return categories.find(cat => cat && cat.slug === slug.toLowerCase()) || null
  }

  // Fetch subcategories for a specific category (lightweight - name + image only)
  const fetchCategorySubcategories = async (categorySlug) => {
    // Check cache first
    if (subcategoriesCache[categorySlug]) {
      return subcategoriesCache[categorySlug]
    }

    try {
      // Fetch lightweight category data with subcategories (name + image only)
      const response = await categoryAPI.getBySlug(categorySlug, true)
      
      if (response && response.success && response.data) {
        const categoryData = response.data
        const subcategories = categoryData.subcategories || []
        
        // Cache subcategories
        setSubcategoriesCache(prev => ({
          ...prev,
          [categorySlug]: subcategories
        }))
        
        // Update the category in the categories array with subcategories
        setCategories(prev => prev.map(cat => 
          cat.slug === categorySlug 
            ? { ...cat, subcategories }
            : cat
        ))
        
        return subcategories
      }
      
      return []
    } catch (err) {
      console.error(`Error fetching subcategories for ${categorySlug}:`, err)
      return []
    }
  }

  // Function to refresh categories (force fetch from API and clear cache)
  const refreshCategories = async () => {
    try {
      // Clear cache
      try {
        localStorage.removeItem(CACHE_KEY)
      } catch (e) {
        // Ignore localStorage errors
      }
      
      setIsLoading(true)
      setError(null)
      
      const response = await categoryAPI.getLightweight()
      
      if (response && response.success && response.data) {
        const categoriesData = Array.isArray(response.data) ? response.data : []
        const activeCategories = categoriesData.filter(cat => cat && cat.isActive !== false)
        setCategories(activeCategories)
        
        // Update cache with fresh data
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: activeCategories,
            timestamp: Date.now()
          }))
        } catch (e) {
          // Ignore localStorage errors
        }
      }
    } catch (err) {
      console.error('Error refreshing categories:', err)
      setError(err.message || 'Failed to refresh categories')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        isLoading,
        error,
        getCategoryBySlug,
        fetchCategorySubcategories,
        subcategoriesCache,
        refreshCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

