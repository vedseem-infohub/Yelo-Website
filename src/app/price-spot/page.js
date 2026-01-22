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

export default function PriceSpotPage() {
  const router = useRouter()
  const { getShopProducts } = useProducts()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('popular')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [filters, setFilters] = useState({
    priceRange: [0, 999],
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

  // Get all price spot products (products assigned to price-spot shops)
  const priceSpotProducts = useMemo(() => {
    const allShopSlugs = ['price-spot-sweatshirts', 'price-spot-tshirts', 'price-spot-tracksuits', 
                          'price-spot-sweaters', 'price-spot-kurta-sets', 'price-spot-face-wash']
    const products = []
    allShopSlugs.forEach(shopSlug => {
      products.push(...getShopProducts(shopSlug))
    })
    return products
  }, [getShopProducts])

  // Derive categories dynamically from products
  const priceSpotCategories = useMemo(() => {
    const categoryMap = new Map()
    
    priceSpotProducts.forEach(product => {
      const productType = product.productType || product.category || 'Other'
      if (!categoryMap.has(productType)) {
        const categoryProducts = priceSpotProducts.filter(p => 
          (p.productType || p.category || 'Other') === productType
        )
        const maxPrice = Math.max(...categoryProducts.map(p => p.price || 0), 0)
        
        categoryMap.set(productType, {
          name: productType,
          maxPrice: maxPrice,
          slug: productType.toLowerCase().replace(/\s+/g, '-'),
          shopSlug: `price-spot-${productType.toLowerCase().replace(/\s+/g, '-')}`
        })
      }
    })
    
    return Array.from(categoryMap.values())
  }, [priceSpotProducts])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-20">
        {/* Main Content */}
        <div>
          {/* Banner */}
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop&q=80" 
            alt="Price Spot Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/80 via-orange-500/80 to-yellow-500/80 flex flex-col justify-center items-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">The Price Spot</h2>
            <p className="text-white text-lg font-medium drop-shadow-md">Best deals under your budget</p>
          </div>
        </div>

        {/* Categories */}
        {priceSpotCategories.length > 0 ? priceSpotCategories.map((category) => {
          const products = getProductsForCategory(category)
          if (products.length === 0) return null

          return (
            <div key={category.slug} className="px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{category.name}</h3>
                  <p className="text-sm text-gray-600">UNDER ₹{category.maxPrice}</p>
                </div>
                <Link
                  href={`/price-spot/${category.slug}`}
                  className="text-yellow-600 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || `price-spot-${index}`}
                    product={product}
                    showAddToBag={true}
                  />
                ))}
              </div>
            </div>
          )
        }) : (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500">No categories available. Products will appear here once they are added to Price Spot shops.</p>
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

