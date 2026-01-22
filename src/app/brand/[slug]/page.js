'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProductCard from '@/components/common/ProductCard'
import { useProducts } from '@/contexts/ProductsContext'
import { brandAPI } from '@/utils/api'
import PageWrapper from '@/components/common/PageWrapper'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'
import CartPopup from '@/components/mobile/CartPopup'

export default function BrandPage() {
  const params = useParams()
  const router = useRouter()
  const { allProducts } = useProducts()
  const slugParam = params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : (slugParam || '')
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    sizes: [],
    colors: [],
    brands: [],
  })

  // Filter products by brand slug - improved matching logic
  const filteredProducts = useMemo(() => {
    const slugLower = slug.toLowerCase().trim()
    
    // Handle special cases like "hm" -> "H&M", "fastrack x bags" -> "fastrack"
    const brandSlugMap = {
      'hm': ['h&m', 'h and m'],
      'h&m': ['h&m', 'h and m'],
      'fastrack': ['fastrack'],
      'fastrack-x-bags': ['fastrack'],
      'voylla': ['voylla'],
      'nike': ['nike'],
      'adidas': ['adidas'],
      'zara': ['zara'],
    }
    
    // Get possible brand name variations from slug
    const possibleBrands = brandSlugMap[slugLower] || [slugLower]
    
    let filtered = allProducts.filter((product) => {
      if (!product.brand) return false
      
      const brandName = product.brand.toLowerCase().trim()
      
      // Check against all possible brand variations
      for (const possibleBrand of possibleBrands) {
        // Exact match
        if (brandName === possibleBrand) return true
        
        // Contains match (for partial matches like "Fastrack x Bags")
        if (brandName.includes(possibleBrand) || possibleBrand.includes(brandName)) return true
        
        // Handle special characters - normalize both for comparison
        const normalizedBrand = brandName.replace(/[&]/g, '').replace(/\s+/g, '').replace(/x/g, '')
        const normalizedPossible = possibleBrand.replace(/[&]/g, '').replace(/\s+/g, '').replace(/x/g, '')
        
        if (normalizedBrand === normalizedPossible) return true
        if (normalizedBrand.includes(normalizedPossible) || normalizedPossible.includes(normalizedBrand)) return true
      }
      
      // Also check if slug matches brand directly (fallback)
      if (brandName === slugLower || brandName.includes(slugLower) || slugLower.includes(brandName)) {
        return true
      }
      
      return false
    })

    // Apply price filter
    filtered = filtered.filter((product) => {
      const price = product.price || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

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

    // Apply sorting
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
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    return filtered
  }, [allProducts, slug, filters, selectedSort])

  // Get brand name from slug
  const brandName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const handleSort = (sort) => {
    setSelectedSort(sort)
    setIsSortOpen(false)
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-white pb-20 md:pb-8">
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
              <h1 className="text-lg font-bold text-gray-900">{brandName}</h1>
              <p className="text-xs text-gray-500">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <p className="text-gray-500 text-center mb-4">No products found for this brand</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product._id || product.id || `brand-${index}`}
                  product={product}
                  showAddToBag={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Filter/Sort Buttons */}
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

        <CartPopup />
      </div>
    </PageWrapper>
  )
}

