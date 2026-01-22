'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useProducts } from '@/contexts/ProductsContext'
import PageWrapper from '@/components/common/PageWrapper'
import LuxuryShopProductCard from '@/components/luxury/LuxuryShopProductCard'
import LuxuryShopFilterPanel from '@/components/luxury/LuxuryShopFilterPanel'
import LuxuryShopSortPanel from '@/components/luxury/LuxuryShopSortPanel'
import { motion } from 'framer-motion'
import { getShopBaseProducts, SHOP_SLUGS } from '@/utils/shopFilters'
import { shopAPI } from '@/utils/api'

// Luxury products are identified by having a brand name

const categoryData = {
  fragrances: {
    name: 'Fragrances',
    description: 'Discover exquisite fragrances that define luxury',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=600&fit=crop'
  },
  lipsticks: {
    name: 'Lipsticks',
    description: 'Premium lip colors for the sophisticated',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=1200&h=600&fit=crop'
  },
  eyewear: {
    name: 'Eyewear',
    description: 'Elegant eyewear that combines style and sophistication',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&h=600&fit=crop'
  },
  foundation: {
    name: 'Foundation',
    description: 'Flawless base for a radiant complexion',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=1200&h=600&fit=crop'
  },
  skincare: {
    name: 'Skincare',
    description: 'Luxury skincare for timeless beauty',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=600&fit=crop'
  },
  watches: {
    name: 'Watches',
    description: 'Timepieces that embody precision and elegance',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=600&fit=crop'
  }
}

export default function LuxuryCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const { allProducts, getShopProducts } = useProducts()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedSort, setSelectedSort] = useState('newest')
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    brands: [],
    categories: [],
    materials: [],
    colors: [],
    availability: [],
  })
  const [categoryProducts, setCategoryProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef(null)

  // Handle slug - it might be a string or array in Next.js 16
  const categoryParam = params?.category
  const categorySlug = Array.isArray(categoryParam) ? categoryParam[0] : (categoryParam || '')
  const validCategorySlug = categorySlug && categorySlug !== 'undefined' ? categorySlug : ''

  const categoryInfo = categoryData[validCategorySlug] || {
    name: 'Luxury Collection',
    description: 'Curated pieces defined by craftsmanship and timeless elegance',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=600&fit=crop'
  }

  // Fetch products for this category shop
  React.useEffect(() => {
    const fetchCategoryProducts = async (pageNum = 1, reset = false) => {
      if (!validCategorySlug) {
        setIsLoadingProducts(false)
        return
      }

      try {
        if (reset) {
          setIsLoadingProducts(true)
          setPage(1)
        } else {
          setIsLoadingMore(true)
        }

        const shopSlug = `luxury-${validCategorySlug}`
        const response = await shopAPI.getProducts(shopSlug, {
          page: pageNum,
          limit: 50,
          sort: selectedSort,
          minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
          maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
        })

        if (response && response.success) {
          const rawProducts = response.products || response.data || []
          const newProducts = rawProducts.map(product => ({
            ...product,
            id: product._id || product.id,
            slug: product.slug || product.baseSlug || product._id
          }))

          if (reset) {
            setCategoryProducts(newProducts)
          } else {
            setCategoryProducts(prev => {
              const existingIds = new Set(prev.map(p => p._id || p.id))
              const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id || p.id))
              return [...prev, ...uniqueNewProducts]
            })
          }

          const pagination = response.pagination || {}
          setHasMore(pagination.hasMore !== undefined ? pagination.hasMore : (newProducts.length >= 50 && (pageNum * 50) < (pagination.total || 0)))
          setPage(pageNum)
        }
      } catch (error) {
        console.error('Error fetching category products:', error)
        if (reset) {
          setCategoryProducts([])
        }
        setHasMore(false)
      } finally {
        setIsLoadingProducts(false)
        setIsLoadingMore(false)
      }
    }

    // Reset and fetch when category/sort/filters change
    setCategoryProducts([])
    setPage(1)
    setHasMore(true)
    fetchCategoryProducts(1, true)
  }, [validCategorySlug, selectedSort, filters.priceRange])

  // Infinite scroll for loading more products
  React.useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingProducts || !validCategorySlug) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingProducts) {
          const nextPage = page + 1
          const shopSlug = `luxury-${validCategorySlug}`
          shopAPI.getProducts(shopSlug, {
            page: nextPage,
            limit: 50,
            sort: selectedSort,
            minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
            maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
          }).then(response => {
            if (response && response.success) {
              const rawProducts = response.products || response.data || []
              const newProducts = rawProducts.map(product => ({
                ...product,
                id: product._id || product.id,
                slug: product.slug || product.baseSlug || product._id
              }))

              setCategoryProducts(prev => {
                const existingIds = new Set(prev.map(p => p._id || p.id))
                const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p._id || p.id))
                return [...prev, ...uniqueNewProducts]
              })

              const pagination = response.pagination || {}
              setHasMore(pagination.hasMore !== undefined ? pagination.hasMore : (newProducts.length >= 50 && (nextPage * 50) < (pagination.total || 0)))
              setPage(nextPage)
            } else {
              setHasMore(false)
            }
          }).catch(error => {
            console.error('Error fetching more category products:', error)
            setHasMore(false)
          }).finally(() => {
            setIsLoadingMore(false)
          })
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
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
  }, [hasMore, isLoadingMore, isLoadingProducts, page, validCategorySlug, selectedSort, filters.priceRange])

  // Apply filters - categoryProducts is already filtered by the category shop API
  const filteredProducts = useMemo(() => {
    let filtered = [...categoryProducts]

    // Apply price range filter
    filtered = filtered.filter((product) => {
      const price = product.price || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter((product) => {
        const productBrand = product.brand || ''
        return filters.brands.some((brand) =>
          productBrand.toLowerCase().includes(brand.toLowerCase())
        )
      })
    }

    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((product) => {
        return filters.categories.includes(product.category)
      })
    }

    // Apply material filter
    if (filters.materials && filters.materials.length > 0) {
      filtered = filtered.filter((product) => {
        const category = product.category || ''
        const name = product.name || ''
        return filters.materials.some((material) =>
          category.toLowerCase().includes(material.toLowerCase()) ||
          name.toLowerCase().includes(material.toLowerCase())
        )
      })
    }

    // Apply color filter
    if (filters.colors && filters.colors.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.colors || product.colors.length === 0) return false
        return filters.colors.some((color) => {
          if (typeof product.colors[0] === 'string') {
            return product.colors.some(c => c.toLowerCase().includes(color.toLowerCase()))
          } else {
            return product.colors.some((c) => c.name.toLowerCase().includes(color.toLowerCase()))
          }
        })
      })
    }

    // Sort products
    switch (selectedSort) {
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'brand-az':
        filtered.sort((a, b) => {
          const brandA = (a.brand || '').toLowerCase()
          const brandB = (b.brand || '').toLowerCase()
          return brandA.localeCompare(brandB)
        })
        break
      case 'newest':
      default:
        filtered.sort((a, b) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0)
          const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0)
          return dateB - dateA
        })
        break
    }

    return filtered
  }, [categoryProducts, filters, selectedSort])

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
      <div className="min-h-screen bg-white text-gray-900">
        {/* Header Section (Matching Luxury Page) */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 
                  className="text-3xl md:text-5xl text-white mb-2 flex items-center gap-3"
                  style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
                >
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 fill-yellow-400 text-yellow-400" />
                  {categoryInfo.name}
                </h1>
                <p className="text-sm md:text-base text-white/80 font-light">
                  {categoryInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <section className="relative h-[30vh] md:h-[40vh] flex items-center justify-center overflow-hidden">
          <img
            src={categoryInfo.image}
            alt={categoryInfo.name}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" />
          <div className="relative z-10 text-center px-4">
            <h2 
              className="text-3xl md:text-5xl text-white mb-4"
              style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
            >
              {categoryInfo.name}
            </h2>
            <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto">
              {categoryInfo.description}
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-1 py-4 md:px-6 md:py-6">
          <div className="flex gap-8">
            {/* Sticky Filter Sidebar - Desktop */}
            <div className="hidden md:block">
              <LuxuryShopFilterPanel
                isOpen={true}
                onClose={() => {}}
                filters={filters}
                onApply={handleFilterApply}
                resultCount={filteredProducts.length}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    {categoryInfo.name} ({filteredProducts.length})
                  </h2>
                  <p className="text-sm text-gray-600">{categoryInfo.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="md:hidden px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => setIsSortOpen(true)}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Sort
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Try adjusting your filters to see more results
                  </p>
                  <button
                    onClick={() => {
                      setFilters({
                        priceRange: [0, 100000],
                        brands: [],
                        categories: [],
                        materials: [],
                        colors: [],
                        availability: [],
                      })
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-6">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product._id || product.id || `luxury-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <LuxuryShopProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter/Sort Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md:hidden shadow-lg">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 py-4 px-4 bg-gray-900 text-white font-semibold text-center hover:bg-gray-800 transition-colors"
          >
            Filter
          </button>
          <button
            onClick={() => setIsSortOpen(true)}
            className="flex-1 py-4 px-4 bg-gray-900 text-white font-semibold text-center hover:bg-gray-800 transition-colors border-l-2 border-gray-700"
          >
            Sort
          </button>
        </div>

        {/* Filter Panel */}
        <LuxuryShopFilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onApply={handleFilterApply}
          resultCount={filteredProducts.length}
        />

        {/* Sort Panel */}
        <LuxuryShopSortPanel
          isOpen={isSortOpen}
          onClose={() => setIsSortOpen(false)}
          selectedSort={selectedSort}
          onSelect={handleSort}
        />
      </div>
    </PageWrapper>
  )
}

