'use client'

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Search, X, Filter, SlidersHorizontal, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { useProducts } from '@/contexts/ProductsContext'
import { useSearch } from '@/contexts/SearchContext'
import ProductCard from '@/components/common/ProductCard'
import PageWrapper from '@/components/common/PageWrapper'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { productAPI } from '@/utils/api'

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


function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { allProducts, getAllBrands } = useProducts()
  const { searchQuery, setSearchQuery, addRecentSearch, recentSearches, clearRecentSearches } = useSearch()
  const query = searchParams.get('q') || ''
  
  // Check if we're on a luxury route (either pathname starts with /luxury OR luxury=true query param)
  const isLuxuryRoute = pathname?.startsWith('/luxury') || searchParams.get('luxury') === 'true' || false
  
  const [selectedSort, setSelectedSort] = useState('relevance')
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    priceRange: [0, 100000],
    discount: null,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  // Sync searchQuery with URL query param
  useEffect(() => {
    if (query && query !== searchQuery) {
      setSearchQuery(query)
    } else if (!query) {
      setSearchQuery('')
    }
  }, [query])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Generate search suggestions
  const generateSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return []
    }

    const query = searchQuery.toLowerCase().trim()
    const results = []

    // Search products
    const productMatches = allProducts
      .filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(query)
        const brandMatch = product.brand?.toLowerCase().includes(query)
        const categoryMatch = product.category?.toLowerCase().includes(query)
        return nameMatch || brandMatch || categoryMatch
      })
      .slice(0, 5)
      .map((product) => {
        // Handle image - could be string, object with url, or array
        let imageValue = product.emoji || '📦'
        if (product.images?.[0]) {
          const firstImage = product.images[0]
          if (typeof firstImage === 'string') {
            imageValue = firstImage
          } else if (firstImage?.url) {
            imageValue = firstImage.url
          } else if (typeof firstImage === 'object' && firstImage !== null) {
            imageValue = String(firstImage)
          }
        }
        return {
          type: 'product',
          id: product.id,
          name: product.name,
          brand: product.brand,
          image: imageValue,
          slug: product.slug,
        }
      })

    results.push(...productMatches)

    // Search brands
    const brands = getAllBrands()
    const brandMatches = brands
      .filter((brand) => brand.toLowerCase().includes(query))
      .slice(0, 3)
      .map((brand) => ({
        type: 'brand',
        name: brand,
      }))

    results.push(...brandMatches)

    // Remove category suggestions - only show products and brands

    return results
  }, [searchQuery, allProducts, getAllBrands])

  // Debounce suggestions update
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setSuggestions(generateSuggestions)
    }, 200)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [generateSuggestions])

  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    return [...new Set(allProducts.map(p => p.category).filter(Boolean))]
  }, [allProducts])

  const brands = useMemo(() => {
    return getAllBrands()
  }, [getAllBrands])

  // Fetch comprehensive search results from API
  const [searchResults, setSearchResults] = useState({
    products: [],
    categories: [],
    subcategories: []
  })
  // Initialize loading state to true if there's a query (to avoid showing "No results" before API call)
  const [isLoadingSearch, setIsLoadingSearch] = useState(() => {
    const initialQuery = searchParams.get('q') || ''
    return initialQuery.trim() !== ''
  })
  
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query || query.trim() === '') {
        setSearchResults({ products: [], categories: [], subcategories: [] })
        setIsLoadingSearch(false)
        return
      }

      // Set loading to true immediately when query changes (before API call)
      setIsLoadingSearch(true)
      // Clear previous results to show loading state instead of old results
      setSearchResults({ products: [], categories: [], subcategories: [] })
      try {
        // Include luxury products only if we're on a luxury route
        const response = await productAPI.comprehensiveSearch(query.trim(), isLuxuryRoute)
        
        if (response && response.success && response.data) {
          let results = {
            products: Array.isArray(response.data.products) ? response.data.products : [],
            categories: Array.isArray(response.data.categories) ? response.data.categories : [],
            subcategories: Array.isArray(response.data.subcategories) ? response.data.subcategories : []
          }
          
          // Apply client-side filters to products only
          if (filters.category.length > 0) {
            results.products = results.products.filter(p => filters.category.includes(p.category))
          }

          if (filters.brand.length > 0) {
            results.products = results.products.filter(p => filters.brand.includes(p.brand))
          }

          if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
            results.products = results.products.filter(p => {
              const price = p.price || 0
              return price >= filters.priceRange[0] && price <= filters.priceRange[1]
            })
          }

          if (filters.discount !== null) {
            results.products = results.products.filter(p => {
              if (!p.originalPrice) return false
              const discount = ((p.originalPrice - p.price) / p.originalPrice) * 100
              return discount >= filters.discount
            })
          }

          // Sort products
          switch (selectedSort) {
            case 'price-low':
              results.products.sort((a, b) => (a.price || 0) - (b.price || 0))
              break
            case 'price-high':
              results.products.sort((a, b) => (b.price || 0) - (a.price || 0))
              break
            case 'discount':
              results.products.sort((a, b) => {
                const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0
                const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0
                return discountB - discountA
              })
              break
            case 'relevance':
            default:
              // Results from API are already sorted by relevance
              break
          }

          setSearchResults(results)
        } else {
          setSearchResults({ products: [], categories: [], subcategories: [] })
        }
      } catch (error) {
        setSearchResults({ products: [], categories: [], subcategories: [] })
      } finally {
        setIsLoadingSearch(false)
      }
    }

    fetchSearchResults()
  }, [query, filters, selectedSort, isLuxuryRoute])

  // Add to recent searches
  useEffect(() => {
    if (query) {
      addRecentSearch(query)
    }
  }, [query, addRecentSearch])

  const handleSearch = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') return

    const trimmedQuery = searchTerm.trim()
    addRecentSearch(trimmedQuery)
    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      router.push(suggestion.vendorSlug ? `/product/${suggestion.vendorSlug}/${suggestion.baseSlug || suggestion.slug}` : `/product/${suggestion.slug}`)
    } else if (suggestion.type === 'brand') {
      handleSearch(suggestion.name)
    }
  }

  const handleRecentSearchClick = (searchTerm) => {
    setSearchQuery(searchTerm)
    handleSearch(searchTerm)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    } else if (e.key === 'Escape') {
      router.back()
    }
  }

  const activeFiltersCount = filters.category.length + filters.brand.length + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0) +
    (filters.discount !== null ? 1 : 0)

  // Show overlay UI when no query in URL, show results when query exists in URL
  const showOverlayUI = !query || query.trim() === ''
  
  // Show suggestions when typing (searchQuery has value), hide recent/trending/categories
  const isTyping = searchQuery.trim() !== ''

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-24 md:pb-8">
        {/* Search Input Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 w-full">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <div className="ml-4 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products, brands and more"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-10 py-3 rounded-xl border-2 text-gray-900 border-gray-200 focus:outline-none focus:border-yellow-500 text-base bg-gray-50 focus:bg-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      router.push('/search')
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters & Sort Bar (only show when there's a query) */}
          {!showOverlayUI && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Filter</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <div className="relative">
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="appearance-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="discount">Discount</option>
                  </select>
                  <SlidersHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {searchResults.products.length + searchResults.categories.length + searchResults.subcategories.length} {searchResults.products.length + searchResults.categories.length + searchResults.subcategories.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          )}

          {/* Active Filter Chips */}
          {!showOverlayUI && activeFiltersCount > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {filters.category.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== cat) }))}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors"
                >
                  {cat}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {filters.brand.map(brand => (
                <button
                  key={brand}
                  onClick={() => setFilters(prev => ({ ...prev, brand: prev.brand.filter(b => b !== brand) }))}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors"
                >
                  {brand}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors"
                >
                  ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                  <X className="w-3 h-3" />
                </button>
              )}
              {filters.discount !== null && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, discount: null }))}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors"
                >
                  {filters.discount}%+ OFF
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {showOverlayUI ? (
          /* Overlay UI - Recent Searches, Trending, Categories, Suggestions */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Suggestions (when typing) - Show at top when user is typing */}
              {isTyping && suggestions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggestions</h3>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id || suggestion.name}-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        {suggestion.type === 'product' && (
                          <>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {suggestion.image && typeof suggestion.image === 'string' && (suggestion.image.startsWith('http') || suggestion.image.startsWith('/')) ? (
                                <img src={suggestion.image} alt={suggestion.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">{suggestion.image || '📦'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 uppercase font-semibold truncate">{suggestion.brand}</p>
                              <p className="text-sm text-gray-900 truncate">{suggestion.name}</p>
                            </div>
                          </>
                        )}
                        {suggestion.type === 'brand' && (
                          <>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Tag className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">{suggestion.name}</p>
                              <p className="text-xs text-gray-500">Brand</p>
                            </div>
                          </>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No suggestions message (when typing but no results) */}
              {isTyping && suggestions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No results found</p>
                  <button
                    onClick={() => handleSearch(searchQuery)}
                    className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
                  >
                    Search for "{searchQuery}"
                  </button>
                </div>
              )}

              {/* Recent Searches - Only show when search bar is empty */}
              {!isTyping && recentSearches.length > 0 && (
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

              {/* Trending Searches - Only show when search bar is empty */}
              {!isTyping && (
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
              )}

            </div>
          </div>
        ) : (
          /* Results UI */
          <>
            {isLoadingSearch ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500">Searching...</p>
              </div>
            ) : searchResults.products.length === 0 && searchResults.categories.length === 0 && searchResults.subcategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <Search className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
                <p className="text-gray-500 text-center mb-6">
                  We couldn't find any products, categories, or subcategories matching "{query}"
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="px-4 py-6 space-y-8">
                <p className="text-sm text-gray-600">
                  Showing {searchResults.products.length + searchResults.categories.length + searchResults.subcategories.length} {searchResults.products.length + searchResults.categories.length + searchResults.subcategories.length === 1 ? 'result' : 'results'} for "{query}"
                </p>
                
                {/* Categories Section */}
                {searchResults.categories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📁</span>
                      Categories ({searchResults.categories.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.categories.map((category, index) => (
                        <motion.button
                          key={category.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => router.push(`/categories/${category.slug}`)}
                          className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl p-4 text-left border-2 border-purple-200 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="text-4xl mb-2">{category.icon || '📁'}</div>
                          <h3 className="font-semibold text-gray-900 text-sm">{category.name}</h3>
                          <p className="text-xs text-purple-600 mt-1">Category</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subcategories Section */}
                {searchResults.subcategories.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📂</span>
                      Subcategories ({searchResults.subcategories.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {searchResults.subcategories.map((subcategory, index) => (
                        <motion.button
                          key={subcategory.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => router.push(`/categories/${subcategory.categorySlug}/${subcategory.slug}`)}
                          className="bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-xl p-4 text-left border-2 border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="text-4xl mb-2">{subcategory.icon || '📂'}</div>
                          <h3 className="font-semibold text-gray-900 text-sm">{subcategory.name}</h3>
                          <p className="text-xs text-indigo-600 mt-1">{subcategory.categoryName}</p>
                          <p className="text-xs text-indigo-500 mt-0.5">Subcategory</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Section */}
                {searchResults.products.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📦</span>
                      Products ({searchResults.products.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      <AnimatePresence>
                        {searchResults.products.map((product, index) => (
                          <motion.div
                            key={product._id || product.id || `search-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <ProductCard product={product} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Filter Modal */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <label key={category} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.category.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, category: [...prev.category, category] }))
                                } else {
                                  setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category) }))
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brand Filter */}
                  {brands.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Brand</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map(brand => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.brand.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, brand: [...prev.brand, brand] }))
                                } else {
                                  setFilters(prev => ({ ...prev, brand: prev.brand.filter(b => b !== brand) }))
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min</label>
                        <input
                          type="number"
                          value={filters.priceRange[0]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: [Number(e.target.value), prev.priceRange[1]]
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max</label>
                        <input
                          type="number"
                          value={filters.priceRange[1]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: [prev.priceRange[0], Number(e.target.value)]
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="100000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Discount Filter */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Discount</h4>
                    <div className="space-y-2">
                      {[10, 20, 30, 40, 50].map(discount => (
                        <label key={discount} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="discount"
                            checked={filters.discount === discount}
                            onChange={() => setFilters(prev => ({ ...prev, discount: discount }))}
                            className="w-4 h-4 text-yellow-500 border-gray-300 focus:ring-yellow-500"
                          />
                          <span className="text-sm text-gray-700">{discount}% or more</span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discount"
                          checked={filters.discount === null}
                          onChange={() => setFilters(prev => ({ ...prev, discount: null }))}
                          className="w-4 h-4 text-yellow-500 border-gray-300 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-700">Any discount</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      setFilters({ category: [], brand: [], priceRange: [0, 100000], discount: null })
                    }}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PageWrapper showLoader={false}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageWrapper>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
