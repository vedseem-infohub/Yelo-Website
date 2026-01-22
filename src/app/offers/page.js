'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Tag, ShoppingBag } from 'lucide-react'
import CartPopup from '@/components/mobile/CartPopup'
import OfferCard from '@/components/offers/OfferCard'
import { useCategories } from '@/contexts/CategoriesContext'
import PageWrapper from '@/components/common/PageWrapper'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

const BATCH_SIZE = 6

export default function OffersPage() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  useEffect(() => {
    saveShopContext('offers')
  }, [])
  const { categories } = useCategories()
  const [products, setProducts] = useState([])
  const [skeletonCount, setSkeletonCount] = useState(BATCH_SIZE)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('discount-high')
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

      const response = await shopAPI.getProducts('offers', {
        page,
        limit: BATCH_SIZE,
        sort: selectedSort || 'discount-high', // Default to discount-high for offers
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
      console.error('Error fetching offers:', error)
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

  // Filter products client-side (backend already filters discount > 10%)
  const offers = useMemo(() => {
    // Backend already filters products with discount > 10% and sorts by discount descending
    // Calculate discount for display purposes
    let filtered = products.map((product) => {
      let discount = product.discount || 0
      if (product.originalPrice && product.price) {
        const calculatedDiscount = Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
        if (calculatedDiscount > discount) {
          discount = calculatedDiscount
        }
      }
      return { ...product, calculatedDiscount: discount }
    })

    // Apply additional discount range filter (for fine-grained filtering)
    if (filters.discountRanges && filters.discountRanges.length > 0) {
      filtered = filtered.filter((product) => {
        const discount = product.calculatedDiscount || 0
        return filters.discountRanges.some((range) => {
          if (range === '10+') return discount >= 10
          if (range === '20+') return discount >= 20
          if (range === '40+') return discount >= 40
          if (range === '60+') return discount >= 60
          return false
        })
      })
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      const selectedCategoryLower = selectedCategory.toLowerCase()
      filtered = filtered.filter(product => {
        const productCategory = product.category?.toLowerCase()
        return productCategory === selectedCategoryLower || 
               productCategory === selectedCategoryLower.replace(/-/g, ' ') ||
               product.subcategory?.toLowerCase() === selectedCategoryLower ||
               (product.subcategory && categories?.some(cat => 
                 cat.slug === selectedCategoryLower && 
                 cat.subcategories?.some(sub => 
                   sub.slug === product.subcategory?.toLowerCase() ||
                   sub.name?.toLowerCase() === product.subcategory?.toLowerCase()
                 )
               ))
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
      case 'discount-high':
        filtered.sort((a, b) => {
          const discountA = a.calculatedDiscount || 0
          const discountB = b.calculatedDiscount || 0
          return discountB - discountA
        })
        break
      case 'newest':
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
        break
      case 'popular':
      default:
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    return filtered
  }, [products, selectedCategory, filters, selectedSort, categories])

  // Combine products with skeletons for display
  const displayItems = useMemo(() => {
    const items = []
    
    offers.forEach((product) => {
      items.push({ type: 'product', data: product })
    })
    
    for (let i = 0; i < skeletonCount; i++) {
      items.push({ type: 'skeleton', key: `skeleton-${i}` })
    }
    
    return items
  }, [offers, skeletonCount])

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
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 w-full overflow-x-hidden">
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
          <div className="max-w-7xl mx-auto px-2 md:px-6 py-4 md:py-6">
            {/* Offers Content with Progressive Loading */}
            <div className="px-1 md:px-0 py-6">
              {!isLoading && offers.length === 0 && skeletonCount === 0 ? (
                // Empty State
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center min-h-[60vh]"
                >
                  <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-full p-8 mb-6">
                    <Tag className="w-16 h-16 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">No offers available right now</h2>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    Check back later for exciting deals and discounts on your favorite products!
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-linear-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Browse Products</span>
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        Special Offers ({offers.length})
                        {isLoading && ' (loading...)'}
                      </h2>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => setIsFilterOpen(true)}
                          className="text-sm text-yellow-600 font-medium hover:text-yellow-700"
                        >
                          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Limited time deals on selected products
                    </p>
                  </div>

                  {/* Products Grid with Progressive Loading */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 w-full items-stretch">
                    <AnimatePresence>
                      {displayItems.map((item, index) => {
                        if (item.type === 'skeleton') {
                          return (
                            <div key={item.key || `skeleton-${index}`} className="h-full">
                              <OfferCard isLoading={true} />
                            </div>
                          )
                        }
                        return (
                          <motion.div
                            key={item.data._id || item.data.id || `offer-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="h-full"
                          >
                            <OfferCard product={item.data} />
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                  
                  {/* Infinite scroll trigger */}
                  {hasMore && skeletonCount === 0 && (
                    <div ref={observerTarget} className="h-10 w-full mt-4" />
                  )}
                </>
              )}
            </div>
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
          resultCount={offers.length}
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
