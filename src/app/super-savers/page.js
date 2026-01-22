'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Filter, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/common/ProductCard'
import { useProducts } from '@/contexts/ProductsContext'
import PageWrapper from '@/components/common/PageWrapper'
import FilterPanel from '@/components/category/FilterPanel'
import SortPanel from '@/components/category/SortPanel'

// Categories will be derived from products dynamically

export default function SuperSaversPage() {
  const router = useRouter()
  const { getShopProducts } = useProducts()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [filters, setFilters] = useState({
    priceRange: [0, 1299],
    sizes: [],
    colors: [],
    brands: [],
  })

  // Get products for each category from their respective shops (uses backend assignment)
  const getProductsForCategory = (category) => {
    // Get products from the specific shop for this category
    let filtered = getShopProducts(category.shopSlug)

    // Apply subcategory filter
    if (selectedSubcategory && selectedSubcategory !== 'all') {
      filtered = filtered.filter((product) => {
        return product.productType === selectedSubcategory
      })
    }

    // Apply additional filters
    filtered = filtered.filter((product) => {
      const price = product.price || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    if (filters.sizes.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.sizes || product.sizes.length === 0) return false
        return filters.sizes.some((size) => product.sizes.includes(size))
      })
    }

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
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0))
        break
      case 'popular':
      default:
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    return filtered.slice(0, 12)
  }

  const handleSort = (sort) => {
    setSelectedSort(sort)
    setIsSortOpen(false)
  }

  const handleFilterApply = (newFilters) => {
    setFilters(newFilters)
    setIsFilterOpen(false)
  }

  // Get all super savers products (products assigned to super-savers shops)
  const superSaversProducts = useMemo(() => {
    const allShopSlugs = ['super-savers-jackets', 'super-savers-kurta-sets', 'super-savers-sneakers', 
                          'super-savers-sweaters', 'super-savers-kurtas', 'super-savers-home-decor']
    const products = []
    allShopSlugs.forEach(shopSlug => {
      products.push(...getShopProducts(shopSlug))
    })
    return products
  }, [getShopProducts])

  // Derive categories dynamically from products
  const superSaversCategories = useMemo(() => {
    const categoryMap = new Map()
    
    superSaversProducts.forEach(product => {
      const productType = product.productType || product.category || 'Other'
      if (!categoryMap.has(productType)) {
        const categoryProducts = superSaversProducts.filter(p => 
          (p.productType || p.category || 'Other') === productType
        )
        const maxPrice = Math.max(...categoryProducts.map(p => p.price || 0), 0)
        const brands = [...new Set(categoryProducts.map(p => p.brand).filter(Boolean))]
        
        categoryMap.set(productType, {
          name: productType,
          maxPrice: maxPrice,
          slug: productType.toLowerCase().replace(/\s+/g, '-'),
          brands: brands,
          shopSlug: `super-savers-${productType.toLowerCase().replace(/\s+/g, '-')}`
        })
      }
    })
    
    return Array.from(categoryMap.values())
  }, [superSaversProducts])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-20">
        {/* Main Content */}
        <div>
          {/* Banner */}
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop&q=80" 
            alt="Super Savers Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600/85 via-purple-600/85 to-pink-600/85 flex flex-col justify-center items-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">SUPER SAVERS</h2>
            <p className="text-white text-lg font-medium drop-shadow-md">Prices Slashed, Style Doubled</p>
          </div>
        </div>

        {/* Categories */}
        {superSaversCategories.length > 0 ? superSaversCategories.map((category) => {
          const products = getProductsForCategory(category)
          if (products.length === 0) return null

          return (
            <div key={category.slug} className="px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{category.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-sm text-gray-600">UNDER ₹{category.maxPrice}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500 truncate">
                      {category.brands.join(' & ')} & More
                    </p>
                  </div>
                </div>
                <Link
                  href={`/super-savers/${category.slug}`}
                  className="text-purple-600 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || `super-saver-${index}`}
                    product={product}
                    showAddToBag={true}
                  />
                ))}
              </div>
            </div>
          )
        }) : (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500">No categories available. Products will appear here once they are added to Super Savers shops.</p>
          </div>
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

