'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import ProductCard from '@/components/category/ProductCard'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import CartPopup from '@/components/mobile/CartPopup'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

export default function SubcategoryShopPage() {
  const params = useParams()
  
  // Handle slug - it might be a string or array in Next.js 16
  const slugParam = params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : (slugParam || '')
  
  // Save shop context when user views this shop
  useEffect(() => {
    if (slug) {
      saveShopContext(slug)
    }
  }, [slug])
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [shopData, setShopData] = useState(null)
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

  // Fetch shop data to check if sidebar should be shown
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await shopAPI.getBySlug(slug)
        if (response.success && response.data) {
          setShopData(response.data)
        }
      } catch (error) {
        console.error('Error fetching shop data:', error)
      }
    }
    
    if (slug) {
      fetchShopData()
    }
  }, [slug])

  // Fetch products with pagination - only loads 6 at a time based on shop
  const fetchProducts = useCallback(async (pageNum = 1, reset = false) => {
    // Don't fetch if already loading more (unless it's a reset)
    if (isLoadingMore && !reset) return
    
    // Don't fetch if no slug
    if (!slug) {
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

      const response = await shopAPI.getProducts(slug, {
        page: pageNum,
        limit: 6, // Always fetch 6 products at a time
        sort: selectedSort,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
      })

      if (response && response.success) {
        const rawProducts = response.products || response.data || []
        // Map products to ensure all required fields for ProductCard
        const newProducts = rawProducts.map(product => ({
          ...product,
          id: product._id || product.id, // Ensure id field exists for ProductCard
          slug: product.slug || product.baseSlug || product._id // Ensure slug exists
        }))
        
        // Apply subcategory filter client-side (if needed)
        let filteredProducts = newProducts
        if (selectedSubcategory && selectedSubcategory !== 'all') {
          filteredProducts = newProducts.filter(product => {
            return product.productType === selectedSubcategory || 
                   product.subcategory === selectedSubcategory
          })
        }
        
        if (reset) {
          // Reset: replace all products with new ones
          setProducts(filteredProducts)
        } else {
          // Load more: append new products to existing ones
          setProducts(prev => {
            // Avoid duplicates by checking IDs
            const existingIds = new Set(prev.map(p => p._id || p.id))
            const uniqueNewProducts = filteredProducts.filter(p => !existingIds.has(p._id || p.id))
            return [...prev, ...uniqueNewProducts]
          })
        }
        
        // Update pagination state
        const pagination = response.pagination || {}
        setHasMore(pagination.hasMore !== undefined ? pagination.hasMore : (filteredProducts.length >= 6 && (pageNum * 6) < (pagination.total || 0)))
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
  }, [slug, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands, selectedSubcategory])

  // Initial load and when filters/sort change - only fetch if we have a slug
  useEffect(() => {
    if (!slug) {
      setProducts([])
      setIsLoading(false)
      return
    }
    
    // Reset products when slug/sort/filters/subcategory change
    setProducts([])
    setPage(1)
    setHasMore(true)
    fetchProducts(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, selectedSort, filters.priceRange, filters.sizes, filters.colors, filters.brands, selectedSubcategory])

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

  const showSidebar = shopData?.hasSidebar === true
  const sidebarType = shopData?.shopType === 'BRAND_BASED' ? 'brand' : 'productType'

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* Sidebar - Only show if shop has hasSidebar: true */}
      {showSidebar && (
        <SubcategorySidebar
          products={products}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
          type={sidebarType}
          theme={shopData?.uiTheme || 'light'}
        />
      )}
      
      {/* Main Content Area */}
      <div className={`max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 ${showSidebar ? 'ml-20' : ''}`}>
        {/* Products Grid */}
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, index) => (
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
  )
}
