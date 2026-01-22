'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

const BATCH_SIZE = 6

export default function TrendingPage() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  useEffect(() => {
    saveShopContext('trending')
  }, [])
  const [products, setProducts] = useState([])
  const [skeletonCount, setSkeletonCount] = useState(BATCH_SIZE)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
    discountRanges: [],
    ratings: [],
  })
  const observerTarget = useRef(null)

  // Fetch products progressively
  const fetchProducts = useCallback(async (page = 1, reset = false) => {
    if (isLoadingMore && !reset) return

    try {
      if (reset) {
        setIsLoading(true)
        setProducts([])
        setSkeletonCount(BATCH_SIZE)
        setCurrentPage(1)
        setHasMore(true)
      } else {
        setIsLoadingMore(true)
        setSkeletonCount(BATCH_SIZE)
      }

      const response = await shopAPI.getProducts('trending', {
        page,
        limit: BATCH_SIZE,
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
      })

      if (response && response.success && response.data) {
        const newProducts = response.data || []

        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }

        setSkeletonCount(prev => Math.max(0, prev - newProducts.length))

        const pagination = response.pagination || {}
        setHasMore(pagination.hasMore !== false && (pagination.pages > page || newProducts.length >= BATCH_SIZE))
        setCurrentPage(page)
      } else {
        setHasMore(false)
        setSkeletonCount(0)
      }
    } catch (error) {
      console.error('Error fetching trending products:', error)
      setHasMore(false)
      setSkeletonCount(0)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [selectedSort, filters.priceRange, isLoadingMore])

  // Initial load and when filters/sort change
  useEffect(() => {
    fetchProducts(1, true)
  }, [selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && skeletonCount === 0) {
          fetchProducts(currentPage + 1, false)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoadingMore, skeletonCount, currentPage, fetchProducts])

  // Filter products client-side
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

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

    // Apply rating filter
    if (filters.ratings && filters.ratings.length > 0) {
      filtered = filtered.filter((product) => {
        const rating = product.rating || 0
        return filters.ratings.some((filterRating) => {
          if (filterRating === '4+') return rating >= 4
          if (filterRating === '3+') return rating >= 3
          return false
        })
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
        filtered.sort((a, b) => {
          const scoreA = (a.rating || 0) * (a.reviews || 0)
          const scoreB = (b.rating || 0) * (b.reviews || 0)
          return scoreB - scoreA
        })
        break
    }

    return filtered
  }, [products, selectedCategory, filters, selectedSort])

  // Combine products with skeletons
  const displayItems = useMemo(() => {
    const items = []
    
    filteredProducts.forEach((product) => {
      items.push({ type: 'product', data: product })
    })
    
    for (let i = 0; i < skeletonCount; i++) {
      items.push({ type: 'skeleton', key: `skeleton-${i}` })
    }
    
    return items
  }, [filteredProducts, skeletonCount])

  const handleSort = (sort) => {
    setSelectedSort(sort)
    setIsSortOpen(false)
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
  }

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.discountRanges?.length > 0) count += filters.discountRanges.length
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) count += 1
    if (filters.sizes.length > 0) count += filters.sizes.length
    if (filters.colors.length > 0) count += filters.colors.length
    if (filters.brands?.length > 0) count += filters.brands.length
    if (filters.ratings?.length > 0) count += filters.ratings.length
    return count
  }, [filters])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        {/* Category Sidebar */}
        <SubcategorySidebar
          products={products}
          selectedSubcategory={selectedCategory}
          onSubcategorySelect={setSelectedCategory}
          type="category"
        />

        {/* Main Content Area */}
        <div className="ml-18 mt-24 w-[calc(100%-3.5rem)] md:w-[calc(100%-5rem)] pr-2 md:pr-0">
          {/* Page Header */}
          <div className="max-w-7xl mx-auto px-3 py-8 md:px-6 md:py-6">
            {/* Products Grid with Progressive Loading */}
            {!isLoading && filteredProducts.length === 0 && skeletonCount === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <TrendingUp className="w-24 h-24 text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No trending products</h3>
                <p className="text-gray-500 text-center">Check back later for trending items!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-6">
                  {displayItems.map((item, index) => {
                    if (item.type === 'skeleton') {
                      return (
                        <ProductCardSkeleton
                          key={item.key || `skeleton-${index}`}
                          compact={false}
                        />
                      )
                    }
                    return (
                      <ProductCard
                        key={item.data._id || item.data.id || `trending-${index}`}
                        product={item.data}
                        tag="Trending"
                        showAddToBag={true}
                      />
                    )
                  })}
                </div>
                
                {/* Infinite scroll trigger */}
                {hasMore && skeletonCount === 0 && (
                  <div ref={observerTarget} className="h-10 w-full mt-4" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Filter/Sort Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden shadow-lg">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 py-4 px-4 bg-yellow-500 text-white font-semibold text-center hover:bg-yellow-600 transition-colors relative"
          >
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
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
          resultCount={filteredProducts.length}
          showCategories={false}
        />

        {/* Sort Panel */}
        <SortPanel
          isOpen={isSortOpen}
          onClose={() => setIsSortOpen(false)}
          selectedSort={selectedSort}
          onSelect={handleSort}
        />

        <CartPopup />
      </div>
    </PageWrapper>
  )
}
