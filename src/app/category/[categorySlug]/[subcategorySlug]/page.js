'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'
import { productAPI } from '@/utils/api'

export default function CategorySubcategoryPage() {
  const params = useParams()
  
  const categorySlugParam = params?.categorySlug
  const subcategorySlugParam = params?.subcategorySlug
  
  const categorySlug = Array.isArray(categorySlugParam) ? categorySlugParam[0] : (categorySlugParam || '')
  const subcategorySlug = Array.isArray(subcategorySlugParam) ? subcategorySlugParam[0] : (subcategorySlugParam || '')
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
  })
  
  // Pagination state
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef(null)

  // Fetch products with pagination - only loads 6 at a time
  const fetchProducts = useCallback(async (pageNum = 1, reset = false) => {
    // Don't fetch if already loading more (unless it's a reset)
    if (isLoadingMore && !reset) return
    
    // Don't fetch if no category/subcategory
    if (!categorySlug && !subcategorySlug) {
      setIsLoading(false)
      setIsLoadingMore(false)
      return
    }
    
    try {
      if (reset) {
        setIsLoading(true)
        setPage(1)
        setProducts([]) // Clear existing products on reset
      } else {
        setIsLoadingMore(true)
      }

      const response = await productAPI.getByCategory(categorySlug, subcategorySlug, {
        page: pageNum,
        limit: 6, // Always fetch 6 products at a time
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
      })

      if (response && response.success) {
        const newProducts = response.data || []
        
        if (reset) {
          // Reset: replace all products with new ones
          setProducts(newProducts)
        } else {
          // Load more: append new products to existing ones
          setProducts(prev => {
            // Avoid duplicates by checking IDs
            const existingIds = new Set(prev.map(p => p._id || p.id))
            const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id || p.id))
            return [...prev, ...uniqueNewProducts]
          })
        }
        
        // Update pagination state
        setHasMore(response.pagination?.hasMore || false)
        setPage(pageNum)
      } else {
        // If no products found, that's okay - just set hasMore to false
        if (reset) {
          setProducts([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // On error, don't break the UI - just stop loading more
      if (reset) {
        setProducts([])
      }
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [categorySlug, subcategorySlug, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands])

  // Initial load and when filters/sort change - only fetch if we have category/subcategory
  useEffect(() => {
    // Only fetch if we have at least category or subcategory
    if (!categorySlug && !subcategorySlug) {
      setProducts([])
      setIsLoading(false)
      return
    }
    
    // Reset products when category/subcategory/sort/filters change
    setProducts([])
    setPage(1)
    setHasMore(true)
    fetchProducts(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug, subcategorySlug, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands])

  // Infinite scroll observer - loads next batch when scrolling near bottom
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          // Load next page
          const nextPage = page + 1
          fetchProducts(nextPage, false)
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading 100px before reaching the trigger
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore, isLoading, page])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-24 pt-12 relative">
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-1 py-4 md:px-6 md:py-6">
          {/* Page Header */}
          <div className="mb-6 opacity-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 capitalize">
              {subcategorySlug.replace(/-/g, ' ')}
            </h1>
            <p className="text-gray-600 capitalize">
              {categorySlug.replace(/-/g, ' ')}
            </p>
          </div>

          {/* Products Grid */}
          {isLoading && products.length === 0 ? (
            <div className="pb-24">
              <div className="px-1">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <ProductCardSkeleton key={`skeleton-${index}`} />
                  ))}
                </div>
              </div>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="pb-24">
                <div className="px-1">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-6">
                    {products.map((product, index) => (
                      <ProductCard
                        key={product._id || product.id || `product-${index}`}
                        product={product}
                        showAddToBag={true}
                      />
                    ))}
                    {/* Skeleton cards for loading more */}
                    {isLoadingMore && Array.from({ length: 6 }).map((_, index) => (
                      <ProductCardSkeleton key={`skeleton-more-${index}`} />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Infinite scroll trigger */}
              {hasMore && !isLoadingMore && (
                <div ref={observerTarget} className="h-10 w-full" />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center mb-4">No products found</p>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden shadow-lg" suppressHydrationWarning>
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

        {/* Filter Panel */}
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters)
            setIsFilterOpen(false)
          }}
        />

        {/* Sort Panel */}
        <SortPanel
          isOpen={isSortOpen}
          onClose={() => setIsSortOpen(false)}
          selectedSort={selectedSort}
          onSelect={(sort) => {
            setSelectedSort(sort)
            setIsSortOpen(false)
          }}
        />

        <CartPopup />
      </div>
    </PageWrapper>
  )
}
