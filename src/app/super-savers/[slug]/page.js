'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import ProductCard from '@/components/common/ProductCard'
import { useProducts } from '@/contexts/ProductsContext'
import { useSearch } from '@/contexts/SearchContext'
import CartPopup from '@/components/mobile/CartPopup'
import { shopAPI } from '@/utils/api'
import PageWrapper from '@/components/common/PageWrapper'
import { saveShopContext } from '@/utils/routePersistence'

// Map URL slugs to shop slugs
const slugToShopSlug = {
  'jacket-under-949': 'super-savers-jackets',
  'kurta-set-under-1099': 'super-savers-kurta-sets',
  'sneaker-under-1299': 'super-savers-sneakers',
  'sweater-under-549': 'super-savers-sweaters',
  'kurta-under-349': 'super-savers-kurtas',
  'home-decor-under-799': 'super-savers-home-decor',
}

export default function SuperSaversShopPage() {
  const params = useParams()
  const { allProducts, getShopProducts } = useProducts()
  const { searchQuery } = useSearch()
  
  const slugParam = params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : (slugParam || '')
  const shopSlug = slugToShopSlug[slug] || slug
  
  // Save shop context when user views this shop
  useEffect(() => {
    if (shopSlug) {
      saveShopContext(shopSlug)
    }
  }, [shopSlug])
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
  })
  const [shopData, setShopData] = useState(null)
  const [loadingShop, setLoadingShop] = useState(true)

  useEffect(() => {
    const fetchShopData = async () => {
      if (!shopSlug) return
      setLoadingShop(true)
      try {
        const response = await shopAPI.getBySlug(shopSlug)
        if (response.success) {
          setShopData(response.data)
        }
      } catch (error) {
        console.error('Error fetching shop data:', error)
      } finally {
        setLoadingShop(false)
      }
    }
    fetchShopData()
  }, [shopSlug])

  // Pagination state
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef(null)

  // Fetch products with pagination
  const fetchProducts = useCallback(async (pageNum = 1, reset = false) => {
    if (!shopSlug || (isLoadingMore && !reset)) return
    
    try {
      if (reset) {
        setIsLoadingProducts(true)
        setPage(1)
      } else {
        setIsLoadingMore(true)
      }

      const response = await shopAPI.getProducts(shopSlug, {
        page: pageNum,
        limit: 6,
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
      })

      if (response && response.success && response.products) {
        const newProducts = response.products || []
        
        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }
        
        setHasMore(response.pagination?.hasMore || false)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoadingProducts(false)
      setIsLoadingMore(false)
    }
  }, [shopSlug, selectedSort, filters])

  // Initial load and when filters/sort change
  useEffect(() => {
    if (shopSlug) {
      // Reset products when shop/sort/filters change
      setProducts([])
      setPage(1)
      setHasMore(true)
      fetchProducts(1, true)
    }
  }, [shopSlug, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands])

  // Infinite scroll observer - loads next batch when scrolling near bottom
  useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingProducts) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingProducts) {
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
  }, [hasMore, isLoadingMore, isLoadingProducts, page, fetchProducts])

  // Apply client-side filters (search query only - other filters handled by API)
  const filteredProducts = useMemo(() => {
    let productsList = products || []
    
    // Apply search query filter (client-side only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      productsList = productsList.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query)
        const brandMatch = product.brand?.toLowerCase().includes(query)
        const categoryMatch = product.category?.toLowerCase().includes(query)
        return nameMatch || brandMatch || categoryMatch
      })
    }

    return productsList
  }, [products, searchQuery])

  if (loadingShop) {
    return (
      <PageWrapper showLoader={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-24 relative">
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
          {/* Shop Header */}
          {shopData && (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{shopData.name}</h1>
              <p className="text-gray-600">UNDER ₹{shopData.criteria?.priceMax || ''}</p>
              {shopData.criteria?.brandMatch && shopData.criteria.brandMatch.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {shopData.criteria.brandMatch.join(', ')} & More
                </p>
              )}
            </div>
          )}

          {/* Products Grid */}
          {isLoadingProducts && products.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || `product-${index}`}
                    product={product}
                    showAddToBag={true}
                  />
                ))}
              </div>
              
              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={observerTarget} className="flex items-center justify-center py-8">
                  {isLoadingMore && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center mb-4">No products found</p>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden shadow-lg">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 py-4 px-4 bg-purple-500 text-white font-semibold text-center hover:bg-purple-600 transition-colors"
          >
            Filter
          </button>
          <button
            onClick={() => setIsSortOpen(true)}
            className="flex-1 py-4 px-4 bg-purple-500 text-white font-semibold text-center hover:bg-purple-600 transition-colors border-l-2 border-purple-400"
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

