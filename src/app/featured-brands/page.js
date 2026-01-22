'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import ProductCard from '@/components/common/ProductCard'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import { useProducts } from '@/contexts/ProductsContext'
import { useSearch } from '@/contexts/SearchContext'
import CartPopup from '@/components/mobile/CartPopup'
import { shopAPI } from '@/utils/api'
import PageWrapper from '@/components/common/PageWrapper'

export default function FeaturedBrandsPage() {
  const router = useRouter()
  const { allProducts, getShopProducts } = useProducts()
  const { searchQuery } = useSearch()
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
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
      setLoadingShop(true)
      try {
        const response = await shopAPI.getBySlug('featured-brands')
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
  }, [])

  // Get products from featured-brands shop
  const filteredProducts = useMemo(() => {
    let products = getShopProducts('featured-brands')
    
    // Fallback: if no shop products, filter by brandMatch criteria
    if (products.length === 0 && shopData?.criteria?.brandMatch) {
      const brandMatch = shopData.criteria.brandMatch.map(b => b.toLowerCase())
      products = allProducts.filter(product => {
        const productBrand = (product.brand || '').toLowerCase()
        return brandMatch.some(brand => 
          productBrand === brand || 
          productBrand.includes(brand) || 
          brand.includes(productBrand)
        )
      })
    }

    // Apply subcategory filter (brand filter)
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      products = products.filter(product => {
        return product.brand?.toLowerCase() === selectedSubcategory.toLowerCase()
      })
    }

    // Apply price filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) {
      products = products.filter(product => {
        return product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
      })
    }

    // Apply size filter
    if (filters.sizes.length > 0) {
      products = products.filter(product => {
        return product.sizes?.some(size => filters.sizes.includes(size))
      })
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      products = products.filter(product => {
        if (!product.colors || product.colors.length === 0) return false
        return product.colors.some(color => {
          const colorName = typeof color === 'string' ? color : color?.name
          return filters.colors.includes(colorName)
        })
      })
    }

    // Apply brand filter
    if (filters.brands.length > 0) {
      products = products.filter(product => {
        return filters.brands.includes(product.brand)
      })
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      products = products.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query)
        const brandMatch = product.brand?.toLowerCase().includes(query)
        const categoryMatch = product.category?.toLowerCase().includes(query)
        return nameMatch || brandMatch || categoryMatch
      })
    }

    // Apply sorting
    switch (selectedSort) {
      case 'price-low':
        products = [...products].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        products = [...products].sort((a, b) => b.price - a.price)
        break
      case 'newest':
        products = [...products].sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
        break
      case 'rating':
        products = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'popular':
      default:
        products = [...products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
        break
    }

    return products
  }, [allProducts, selectedSubcategory, filters, selectedSort, searchQuery, getShopProducts, shopData])

  const showSidebar = shopData?.hasSidebar === true

  if (loadingShop) {
    return (
      <PageWrapper showLoader={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-gray-50 pb-24 relative">
        {/* Sidebar - Show if shop has hasSidebar: true */}
        {showSidebar && (
          <SubcategorySidebar
            products={filteredProducts}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
            type="brand"
            theme="light"
          />
        )}
        
        {/* Main Content Area */}
        <div className={`max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6 ${showSidebar ? 'ml-20' : ''}`}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {shopData?.name || 'Featured Brands'}
            </h1>
            <p className="text-gray-600">
              Discover products from top brands
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product._id || product.id || `product-${index}`}
                  product={product}
                  showAddToBag={true}
                />
              ))}
            </div>
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

