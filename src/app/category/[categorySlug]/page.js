'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Search, X } from 'lucide-react'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import EmptyState from '@/components/category/EmptyState'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import { useProducts } from '@/contexts/ProductsContext'
import { useCategories } from '@/contexts/CategoriesContext'
import PageLoader from '@/components/common/PageLoader'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import { useSearch } from '@/contexts/SearchContext'
import { motion, AnimatePresence } from 'framer-motion'
import { productAPI } from '@/utils/api'

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { allProducts: allProductsFromContext, getCategoryProducts, categoryNames } = useProducts()
  const { categories } = useCategories()
  
  // Handle categorySlug - it might be a string or array in Next.js 16
  const categorySlugParam = params?.categorySlug
  const categorySlug = Array.isArray(categorySlugParam) ? categorySlugParam[0] : (categorySlugParam || '')
  
  // Filter out 'undefined' string
  const validSlug = categorySlug && categorySlug !== 'undefined' ? categorySlug : ''

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [skeletonCount, setSkeletonCount] = useState(6)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { searchQuery, setSearchQuery } = useSearch()
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
  })
  const observerTarget = useRef(null)

  // Get category name
  const categoryName = useMemo(() => {
    if (!validSlug) return 'Category'
    return categoryNames[validSlug] || validSlug.charAt(0).toUpperCase() + validSlug.slice(1)
  }, [validSlug, categoryNames])

  // Fetch products progressively
  const fetchProducts = useCallback(async (pageNum = 1, reset = false) => {
    if ((isLoadingMore && !reset) || (!hasMore && !reset)) return
    if (!validSlug) {
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }

    try {
      if (reset) {
        setIsLoading(true)
        setProducts([])
        setPage(1)
        setHasMore(true)
        setSkeletonCount(6)
      } else if (pageNum > 1) {
        setIsLoadingMore(true)
        setSkeletonCount(prev => prev + 6)
      }

      const response = await productAPI.getByCategory(validSlug, selectedSubcategory !== 'all' ? selectedSubcategory : null, {
        page: pageNum,
        limit: 6,
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
      })

      if (response && response.success && Array.isArray(response.data)) {
        const newProducts = response.data || []
        
        setProducts(prev => {
          if (reset) return newProducts
          const existingIds = new Set(prev.map(p => p._id || p.id))
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id || p.id))
          return [...prev, ...uniqueNewProducts]
        })
        
        setHasMore(response.pagination?.hasMore || false)
        setPage(pageNum)
      } else {
        setHasMore(false)
        if (reset) setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setHasMore(false)
      if (reset) setProducts([])
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      setSkeletonCount(0)
    }
  }, [validSlug, selectedSubcategory, selectedSort, filters, hasMore, isLoadingMore])

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    if (validSlug) {
      fetchProducts(1, true)
    }
  }, [validSlug, selectedSubcategory, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands])

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchProducts(page + 1, false)
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, isLoadingMore, page, fetchProducts])

  // Filter and search products using useMemo for performance
  // Note: Subcategory and price filtering are handled by the API
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Apply search filter first and prioritize matching results
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.map((product) => {
        const nameMatch = product.name?.toLowerCase().includes(query)
        const brandMatch = product.brand?.toLowerCase().includes(query)
        const categoryMatch = product.category?.toLowerCase().includes(query)
        const matches = nameMatch || brandMatch || categoryMatch
        
        // Calculate match score (name matches are highest priority)
        let matchScore = 0
        if (nameMatch) matchScore += 3
        if (brandMatch) matchScore += 2
        if (categoryMatch) matchScore += 1
        
        return { ...product, matches, matchScore }
      }).filter(product => product.matches)
        .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score (highest first)
    }

    // Note: Price filtering is handled by the API, no need to filter here

    // Apply size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.sizes || product.sizes.length === 0) return false
        return filters.sizes.some((size) => product.sizes.includes(size))
      })
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.colors || product.colors.length === 0) return false
        return filters.colors.some((color) => {
          if (typeof product.colors[0] === 'string') {
            return product.colors.includes(color)
          } else {
            return product.colors.some((c) => c.name === color)
          }
        })
      })
    }

    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter((product) => {
        const productBrand = product.brand || ''
        return filters.brands.some((brand) =>
          productBrand.toLowerCase().includes(brand.toLowerCase())
        )
      })
    }

    // Sort products
    switch (selectedSort) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'newest':
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
        break
      case 'popular':
      default:
        // Sort by rating
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    // If search query exists, prioritize exact matches at the top
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered.sort((a, b) => {
        const aName = (a.name || '').toLowerCase()
        const bName = (b.name || '').toLowerCase()
        const aStartsWith = aName.startsWith(query)
        const bStartsWith = bName.startsWith(query)
        
        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1
        return 0
      })
    }

    return filtered
  }, [products, searchQuery, filters, selectedSort, selectedSubcategory, validSlug, categories])

  const handleSort = (sortOption) => {
    setSelectedSort(sortOption)
    setIsSortOpen(false)
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
  }

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (isSearchOpen) {
      setSearchQuery('') // Clear search when closing
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  // Show loader while loading
  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-white pb-20 flex">
      {/* Subcategory Sidebar */}
      <SubcategorySidebar
        products={allProducts}
        selectedSubcategory={selectedSubcategory}
        onSubcategorySelect={setSelectedSubcategory}
        type="subcategory"
        backendSubcategories={(() => {
          // Get subcategories from backend for this category
          const category = categories?.find(cat => 
            cat.slug === validSlug || 
            cat.slug === validSlug.replace(/-/g, ' ')
          )
          return category?.subcategories?.filter(sub => 
            sub.isActive && (sub.productCount > 0 || !sub.productCount)
          ) || null
        })()}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{categoryName || 'Category'}</h1>
          <div className="flex items-center gap-4 opacity-0">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-6 h-6 text-gray-700" />
            </button>
            <button 
              onClick={handleSearchToggle}
              className={`p-2 hover:bg-gray-900 text-gray-700 rounded-full transition-colors ${
                isSearchOpen ? 'bg-yellow-500 text-yellow-600' : ''
              }`}
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar - Toggles on search button click */}
        {isSearchOpen && (
          <div className="px-4 pb-4 border-t border-gray-200 animate-fade-in">
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products in this category..."
                className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm bg-gray-50 focus:bg-white"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-gray-500 mt-2">
                Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Subcategory Suggestions (when searching) */}
      {searchQuery.trim() && (() => {
        // Get subcategories from backend
        const category = categories?.find(cat => 
          cat.slug === validSlug || 
          cat.slug === validSlug.replace(/-/g, ' ')
        )
        const backendSubcategories = category?.subcategories || []
        const subcategories = backendSubcategories
          .filter(sub => sub.isActive && (sub.productCount > 0 || !sub.productCount))
          .map(sub => ({
            name: sub.name,
            slug: sub.slug,
            productType: sub.name // Use name as productType for filtering
          }))
        const matchingSubcategories = subcategories.filter(sub => 
          sub.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        return matchingSubcategories.length > 0 ? (
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Matching Subcategories</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {matchingSubcategories.map((subcategory) => (
                <button
                  key={subcategory.slug}
                  onClick={() => router.push(`/category/${validSlug}/${subcategory.slug}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-colors shrink-0"
                >
                  <span className="text-lg">{subcategory.icon || '📦'}</span>
                  <span className="text-sm font-medium text-gray-900">{subcategory.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null
      })()}

      {/* Products Count */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-500">
          {searchQuery.trim() ? (
            <>Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} for "{searchQuery}"</>
          ) : (
            <>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found</>
          )}
        </p>
      </div>

      {/* Products Grid or Empty State */}
      {isLoading && filteredProducts.length === 0 ? (
        <div className="pb-24">
          <div className="px-1">
            <div className="grid grid-cols-2 gap-x-1 gap-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="pb-24">
          <div className="px-1">
            <div className="grid grid-cols-2 gap-x-1 gap-y-4">
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={product._id || product.id || `category-${index}`}
                  product={product}
                  tag={index < 2 ? 'NEW DROP' : index < 4 ? 'Trending' : 'Fresh Arrival'}
                  showAddToBag={true}
                />
              ))}
              {/* Skeleton cards for loading more */}
              {skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-more-${index}`} />
              ))}
              {/* Observer target for infinite scroll */}
              {hasMore && !isLoadingMore && (
                <div ref={observerTarget} className="col-span-2 h-10" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden shadow-lg">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex-1 py-4 px-4 bg-yellow-500 text-white font-semibold text-center hover:bg-yellow-600 transition-colors"
        >
          Filter
        </button>
        <button
          onClick={() => setIsSortOpen(true)}
          className="flex-1 py-4 px-4 bg-yellow-500 text-white font-semibold text-center hover:bg-yellow-600 transition-colors border-l-2 border-yellow-400"
        >
          Sort
        </button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={handleFilterApply}
      />

      {/* Sort Panel */}
      <SortPanel
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        selectedSort={selectedSort}
        onSelect={handleSort}
      />
      </div>
    </div>
  )
}

