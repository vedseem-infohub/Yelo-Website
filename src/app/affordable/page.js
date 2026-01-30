'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PageWrapper from '@/components/common/PageWrapper'
import AffordableProductCard from '@/components/affordable/AffordableProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

const AFFORDABLE_MAX_PRICE = 1000
const BATCH_SIZE = 6

export default function AffordablePage() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  useEffect(() => {
    saveShopContext('affordable')
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
  const [filters, setFilters] = useState({
    priceRange: [0, AFFORDABLE_MAX_PRICE],
    sizes: [],
    colors: [],
    brands: [],
    discountRanges: [],
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

      const response = await shopAPI.getProducts('affordable', {
        page,
        limit: BATCH_SIZE,
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < AFFORDABLE_MAX_PRICE ? filters.priceRange[1] : undefined,
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
      console.error('Error fetching affordable products:', error)
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

  // Filter products client-side (after progressive loading)
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // Apply discount filter
    if (filters.discountRanges && filters.discountRanges.length > 0) {
      filtered = filtered.filter((product) => {
        const discount = product.discount || 0
        const originalPrice = product.originalPrice || product.price
        const calculatedDiscount = originalPrice > product.price
          ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
          : discount

        return filters.discountRanges.some((range) => {
          if (range === '10+') return calculatedDiscount >= 10
          if (range === '20+') return calculatedDiscount >= 20
          if (range === '40+') return calculatedDiscount >= 40
          if (range === '60+') return calculatedDiscount >= 60
          return false
        })
      })
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

    // Sort products
    switch (selectedSort) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'discount-high':
        filtered.sort((a, b) => {
          const discountA = a.discount || (a.originalPrice && a.price ? 
            Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100) : 0)
          const discountB = b.discount || (b.originalPrice && b.price ? 
            Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100) : 0)
          return discountB - discountA
        })
        break
      case 'popular':
      default:
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    return filtered
  }, [products, filters, selectedSort])

  // Combine products with skeletons for display
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

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Bright Hero Banner */}
        <section className="relative opacity-0 w-full bg-gradient-to-r from-pink-500 via-orange-500 to-red-500 py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Under ₹999
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium">
              Best Deals Today • Shop Now & Save More!
            </p>
          </div>
        </section>

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="text-sm text-gray-600">
              <span className="hover:text-gray-900 cursor-pointer" onClick={() => router.push('/')}>
                Home
              </span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">Affordable</span>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-1 py-6 pb-16 md:py-16">
          <div className="flex gap-6">
            {/* Sticky Left Filter Panel - Desktop */}
            <div className="hidden md:block">
              <FilterPanel
                isOpen={true}
                onClose={() => {}}
                filters={filters}
                onApply={handleFilterApply}
                resultCount={filteredProducts.length}
                showCategories={false}
              />
            </div>

            {/* Product Grid Area */}
            <div className="flex-1">
              {/* Products Count */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                  {isLoading && ' (loading...)'}
                </p>
              </div>

              {/* Products Grid with Progressive Loading */}
              {!isLoading && filteredProducts.length === 0 && skeletonCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-gray-500 text-lg">No products found</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Back to Home
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-1 gap-y-4 md:gap-4">
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
                        <AffordableProductCard
                          key={`${item.data._id || item.data.id || 'product'}-${index}`}
                          product={item.data}
                        />
                      )
                    })}
                  </div>
                  
                  {/* Infinite scroll trigger */}
                  {hasMore && skeletonCount === 0 && (
                    <div ref={observerTarget} className="h-10 w-full" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Filter/Sort Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex md:hidden">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 py-4 px-4 bg-yellow-500 text-white font-semibold text-center hover:bg-yellow-600 transition-colors"
            suppressHydrationWarning
          >
            Filter
          </button>
          <button
            onClick={() => setIsSortOpen(true)}
            className="flex-1 py-4 px-4 bg-yellow-500 text-white font-semibold text-center hover:bg-yellow-600 transition-colors border-l-2 border-yellow-400"
            suppressHydrationWarning
          >
            Sort
          </button>
        </div>

        {/* Mobile Filter Panel */}
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
      </div>
    </PageWrapper>
  )
}
