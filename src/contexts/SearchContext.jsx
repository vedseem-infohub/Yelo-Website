'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SearchContext = createContext({
  searchQuery: '',
  setSearchQuery: () => {},
  searchMode: 'globalSearch',
  recentSearches: [],
  addRecentSearch: () => {},
  clearRecentSearches: () => {},
  showSearchOverlay: false,
  setShowSearchOverlay: () => {},
})

export const useSearch = () => useContext(SearchContext)

const RECENT_SEARCHES_KEY = 'yelo_recent_searches'
const MAX_RECENT_SEARCHES = 10

export function SearchProvider({ children }) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing recent searches:', e)
        }
      }
    }
  }, [])

  // Determine search mode based on current route
  const searchMode = useCallback(() => {
    if (!pathname) return 'globalSearch'
    
    // Landing page - global search
    if (pathname === '/') return 'globalSearch'
    
    // Category pages - category scoped
    if (pathname.startsWith('/categories') || pathname.startsWith('/category')) return 'categoryScopedSearch'
    
    // Product listing pages - page scoped
    if (
      pathname.startsWith('/shop') ||
      pathname.startsWith('/luxury') ||
      pathname.startsWith('/affordable') ||
      pathname.startsWith('/price-spot') ||
      pathname.startsWith('/super-savers') ||
      pathname.startsWith('/brands') ||
      pathname.startsWith('/under-999') ||
      pathname.startsWith('/wardrobe')
    ) {
      return 'pageScopedSearch'
    }
    
    // Search results page - global search
    if (pathname.startsWith('/search')) return 'globalSearch'
    
    return 'globalSearch'
  }, [pathname])

  // Add search to recent searches
  const addRecentSearch = useCallback((query) => {
    if (!query || query.trim() === '') return
    
    const trimmedQuery = query.trim()
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmedQuery.toLowerCase())
      // Add to beginning
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
      }
      
      return updated
    })
  }, [])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    }
  }, [])

  // Clear search query when navigating away from search results
  useEffect(() => {
    if (!pathname?.startsWith('/search') && searchQuery) {
      // Don't clear if we're on a page that uses scoped search
      if (searchMode() === 'globalSearch') {
        setSearchQuery('')
      }
    }
  }, [pathname, searchMode])

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchMode: searchMode(),
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        showSearchOverlay,
        setShowSearchOverlay,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
