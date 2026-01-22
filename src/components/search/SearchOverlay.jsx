'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Clock, TrendingUp, Tag, ArrowRight } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useSearch } from '@/contexts/SearchContext'
import { useProducts } from '@/contexts/ProductsContext'
import { productAPI } from '@/utils/api'
import { motion, AnimatePresence } from 'framer-motion'

const TRENDING_SEARCHES = [
  'T-Shirts',
  'Jeans',
  'Sneakers',
  'Watches',
  'Bags',
  'Dresses',
  'Shirts',
  'Shoes',
]

const POPULAR_CATEGORIES = [
  { name: 'Fashion', icon: '👔', slug: 'fashion' },
  { name: 'Electronics', icon: '📱', slug: 'electronics' },
  { name: 'Beauty', icon: '💄', slug: 'beauty' },
  { name: 'Sports', icon: '⚽', slug: 'sports' },
]

export default function SearchOverlay() {
  const router = useRouter()
  const pathname = usePathname()
  const { searchQuery, setSearchQuery, showSearchOverlay, setShowSearchOverlay, recentSearches, addRecentSearch, clearRecentSearches } = useSearch()
  const { allProducts, getAllBrands } = useProducts()
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)
  
  // Check if we're on a luxury route
  const isLuxuryRoute = pathname?.startsWith('/luxury') || false

  // Focus input when overlay opens
  useEffect(() => {
    if (showSearchOverlay && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showSearchOverlay])

  // Fetch search suggestions from API
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.trim() === '') {
        setSuggestions([])
        return
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(async () => {
        try {
          // Include luxury products only if we're on a luxury route
          const response = await productAPI.getSearchSuggestions(searchQuery.trim(), isLuxuryRoute)
          if (response && response.success && Array.isArray(response.data)) {
            setSuggestions(response.data)
          } else {
            setSuggestions([])
          }
        } catch (error) {
          setSuggestions([])
        }
      }, 300)

      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
      }
    }

    fetchSuggestions()
  }, [searchQuery, isLuxuryRoute])

  const handleSearch = (query) => {
    if (!query || query.trim() === '') return

    const trimmedQuery = query.trim()
    addRecentSearch(trimmedQuery)
    setSearchQuery('')
    setShowSearchOverlay(false)
    
    // If we're on a luxury route, pass luxury=true query param to include luxury products
    if (isLuxuryRoute) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}&luxury=true`)
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      // Search for the product name
      handleSearch(suggestion.name)
    }
    setShowSearchOverlay(false)
  }

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query)
    handleSearch(query)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    } else if (e.key === 'Escape') {
      setShowSearchOverlay(false)
    }
  }

  if (!showSearchOverlay) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSearchOverlay(false)}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white min-h-[400px] max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Search Content */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() === '' ? (
              /* Default View - Recent Searches, Trending, Categories */
              <div className="p-4 space-y-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" />
                    Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((trend, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(trend)}
                        className="px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4" />
                    Popular Categories
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {POPULAR_CATEGORIES.map((category) => (
                      <button
                        key={category.slug}
                        onClick={() => {
                          router.push(`/categories/${category.slug}`)
                          setShowSearchOverlay(false)
                        }}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Suggestions View - Product Names */
              <div className="p-2">
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Suggestions
                    </div>
                    {suggestions.map((suggestion, index) => {
                      // Highlight matching text in product name
                      const highlightText = (text, query) => {
                        if (!text || !query) return text
                        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
                        const parts = text.split(regex)
                        return parts.map((part, i) => 
                          regex.test(part) ? (
                            <span key={i} className="font-semibold text-gray-900">{part}</span>
                          ) : (
                            <span key={i} className="text-gray-700">{part}</span>
                          )
                        )
                      }

                      return (
                        <button
                          key={`${suggestion.type}-${suggestion.id || suggestion.name}-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-yellow-50 rounded-lg transition-colors text-left group"
                        >
                          <Search className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 group-hover:text-gray-900 truncate">
                              {highlightText(suggestion.name, searchQuery)}
                            </p>
                            {suggestion.brand && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{suggestion.brand}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    <div className="px-3 py-2 mt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleSearch(searchQuery)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        Search for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4 text-sm">No suggestions found</p>
                    <button
                      onClick={() => handleSearch(searchQuery)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Search for "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

