'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import PageWrapper from '@/components/common/PageWrapper'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

const BATCH_SIZE = 6

export default function BestSellersPage() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  useEffect(() => {
    saveShopContext('best-sellers')
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
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
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

      const response = await shopAPI.getProducts('best-sellers', {
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
      console.error('Error fetching best sellers:', error)
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
        filtered.sort((a, b) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0)
          const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0)
          return dateB - dateA
        })
        break
      case 'popular':
      default:
        filtered.sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          const reviewsA = a.reviews || 0
          const reviewsB = b.reviews || 0
          if (ratingB !== ratingA) return ratingB - ratingA
          return reviewsB - reviewsA
        })
        break
    }

    return filtered
  }, [products, filters, selectedSort])

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

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-24 relative">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Best Sellers</h1>
              <p className="text-xs text-gray-500">Top rated products</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto">
          {/* Products Count */}
          <div className="px-4 py-4">
            <p className="text-sm text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              {isLoading && ' (loading...)'}
            </p>
          </div>

          {/* Products Grid with Progressive Loading */}
          {!isLoading && filteredProducts.length === 0 && skeletonCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
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
              <div className="pb-6">
                <div className="px-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-1 gap-y-4">
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
                          key={item.data._id || item.data.id || `best-seller-${index}`}
                          product={item.data}
                          showAddToBag={true}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              
              {/* Infinite scroll trigger */}
              {hasMore && skeletonCount === 0 && (
                <div ref={observerTarget} className="h-10 w-full" />
              )}
            </>
          )}

          {/* Bottom Filter/Sort Buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex md:hidden">
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
    </PageWrapper>
  )
}
