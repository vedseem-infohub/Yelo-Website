'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import { useCategories } from '@/contexts/CategoriesContext'
import PageWrapper from '@/components/common/PageWrapper'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

const MAX_PRICE = 999
const BATCH_SIZE = 6

export default function Under999Page() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  useEffect(() => {
    saveShopContext('under-999')
  }, [])
  const { categories } = useCategories()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [filters, setFilters] = useState({
    priceRange: [0, MAX_PRICE],
    sizes: [],
    colors: [],
    brands: [],
  })

  // Progressive loading state
  const [products, setProducts] = useState([])
  const [skeletonCount, setSkeletonCount] = useState(BATCH_SIZE) // Initial skeleton count
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const observerTarget = useRef(null)

  // Fetch products progressively
  const fetchProducts = useCallback(async (page = 1, reset = false) => {
    if (isLoadingMore && !reset) return

    try {
      if (reset) {
        setIsLoading(true)
        setProducts([])
        setSkeletonCount(BATCH_SIZE) // Show initial skeletons
        setCurrentPage(1)
        setHasMore(true)
      } else {
        setIsLoadingMore(true)
        setSkeletonCount(BATCH_SIZE) // Show skeletons for next batch
      }

      const response = await shopAPI.getProducts('under-999', {
        page,
        limit: BATCH_SIZE,
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < MAX_PRICE ? filters.priceRange[1] : undefined,
      })

      if (response && response.success && response.data) {
        const newProducts = response.data || []

        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }

        // Update skeleton count (decrease by products received)
        setSkeletonCount(prev => Math.max(0, prev - newProducts.length))

        // Update pagination
        const pagination = response.pagination || {}
        setHasMore(pagination.hasMore !== false && (pagination.pages > page || newProducts.length >= BATCH_SIZE))
        setCurrentPage(page)
      } else {
        setHasMore(false)
        setSkeletonCount(0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setHasMore(false)
      setSkeletonCount(0)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [selectedSort, filters.priceRange])

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
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products]

    // Apply subcategory filter
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      filtered = filtered.filter((product) => {
        const productCategory = product.category?.toLowerCase()
        const selectedCategory = selectedSubcategory.toLowerCase()
        return productCategory === selectedCategory || 
               productCategory === selectedCategory.replace(/-/g, ' ') ||
               product.subcategory?.toLowerCase() === selectedCategory
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

    return filtered
  }, [products, selectedSubcategory, filters.sizes, filters.colors, filters.brands])

  const handleSort = (sort) => {
    setSelectedSort(sort)
    setIsSortOpen(false)
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
  }

  // Combine products with skeletons for display
  const displayItems = React.useMemo(() => {
    const items = []
    
    // Add loaded products
    filteredProducts.forEach((product) => {
      items.push({ type: 'product', data: product })
    })
    
    // Add skeletons at the end
    for (let i = 0; i < skeletonCount; i++) {
      items.push({ type: 'skeleton', key: `skeleton-${i}` })
    }
    
    return items
  }, [filteredProducts, skeletonCount])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-24 relative">
        {/* Subcategory Sidebar */}
        <SubcategorySidebar
          products={products}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
          type="category"
        />
        
        {/* Main Content Area */}
        <div className="ml-20 mt-20">
          {/* Products Count */}
          <div className="max-w-7xl mx-auto px-4 py-4">
            <p className="text-sm text-gray-600">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
              {isLoading && ' (loading...)'}
            </p>
          </div>

          {/* Products Grid with Progressive Loading */}
          <div className="max-w-7xl mx-auto pb-6">
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
                      key={item.data._id || item.data.id || `product-${index}`}
                      product={item.data}
                      showAddToBag={true}
                    />
                  )
                })}
              </div>
              
              {/* Infinite scroll trigger */}
              {hasMore && skeletonCount === 0 && (
                <div ref={observerTarget} className="h-10 w-full" />
              )}
            </div>
          </div>

          {/* Empty State */}
          {!isLoading && filteredProducts.length === 0 && skeletonCount === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <p className="text-gray-500 text-lg">No products found</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
                suppressHydrationWarning
              >
                Back to Home
              </button>
            </div>
          )}

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
