'use client'

import React, { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Filter, SlidersHorizontal, ChevronRight, Sparkles } from 'lucide-react'
import { useProducts } from '@/contexts/ProductsContext'
import { useCategories } from '@/contexts/CategoriesContext'
import PageWrapper from '@/components/common/PageWrapper'
import LuxuryShopProductCard from '@/components/luxury/LuxuryShopProductCard'
import LuxuryShopFilterPanel from '@/components/luxury/LuxuryShopFilterPanel'
import LuxuryShopSortPanel from '@/components/luxury/LuxuryShopSortPanel'
import CountdownTimer from '@/components/luxury/CountdownTimer'
import LuxuryBrandOfferCard from '@/components/luxury/LuxuryBrandOfferCard'
import Link from 'next/link'
import { getShopBaseProducts, SHOP_SLUGS } from '@/utils/shopFilters'
import { shopAPI } from '@/utils/api'
import { saveShopContext } from '@/utils/routePersistence'

export default function LuxuryShopPage() {
  const router = useRouter()
  
  // Save shop context when user views this shop
  React.useEffect(() => {
    saveShopContext('luxury-shop')
  }, [])
  const { allProducts, getShopProducts } = useProducts()
  const { categories: allCategories = [], isLoading: categoriesLoading } = useCategories()
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
  const [luxuryProducts, setLuxuryProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef(null)

  const premierScrollRef = useRef(null)
  const elevatedScrollRef = useRef(null)

  // Fetch luxury products from API
  React.useEffect(() => {
    const fetchLuxuryProducts = async (pageNum = 1, reset = false) => {
      try {
        if (reset) {
          setIsLoadingProducts(true)
          setPage(1)
        } else {
          setIsLoadingMore(true)
        }

        const response = await shopAPI.getProducts('luxury-shop', {
          page: pageNum,
          limit: 50, // Fetch more products for luxury page
          sort: selectedSort,
          minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
          maxPrice: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined,
        })

        if (response && response.success) {
          const rawProducts = response.products || response.data || []
          console.log(`📦 Luxury shop page: Received ${rawProducts.length} products from API (page ${pageNum})`, rawProducts.length > 0 ? `First product: ${rawProducts[0]?.name}` : 'No products')
          
          if (reset && rawProducts.length === 0) {
            console.warn('⚠️ No products returned from luxury-shop API on first page load')
          }
          
          const newProducts = rawProducts.map(product => ({
            ...product,
            id: product._id || product.id,
            slug: product.slug || product.baseSlug || product._id
          }))

          if (reset) {
            setLuxuryProducts(newProducts)
          } else {
            setLuxuryProducts(prev => {
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
        console.error('Error fetching luxury products:', error)
        if (reset) {
          setLuxuryProducts([])
        }
        setHasMore(false)
      } finally {
        setIsLoadingProducts(false)
        setIsLoadingMore(false)
      }
    }

    // Reset and fetch first page when sort/filters change
    setLuxuryProducts([])
    setPage(1)
    setHasMore(true)
    fetchLuxuryProducts(1, true)
  }, [selectedSort, filters.priceRange])

  // Infinite scroll for loading more products
  React.useEffect(() => {
    if (!hasMore || isLoadingMore || isLoadingProducts) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingProducts) {
          const nextPage = page + 1
          const fetchLuxuryProducts = async () => {
            try {
              setIsLoadingMore(true)
              const response = await shopAPI.getProducts('luxury-shop', {
                page: nextPage,
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

                setLuxuryProducts(prev => {
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
            } catch (error) {
              console.error('Error fetching more luxury products:', error)
              setHasMore(false)
            } finally {
              setIsLoadingMore(false)
            }
          }
          fetchLuxuryProducts()
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
  }, [hasMore, isLoadingMore, isLoadingProducts, page, selectedSort, filters.priceRange])

  // Get brands for Premier Weekend Access
  const premierBrands = useMemo(() => {
    const brands = ['GUESS', 'Desigual', 'KEEN', 'Columbia', 'The North Face']
    return brands.map(brand => {
      const brandProducts = luxuryProducts.filter(p => 
        p.brand?.toUpperCase().includes(brand)
      )
      return {
        brand,
        product: brandProducts[0] || luxuryProducts[0],
        discount: brand === 'GUESS' ? 40 : brand === 'Desigual' ? 40 : brand === 'KEEN' ? 30 : brand === 'Columbia' ? 20 : 40,
        extraDiscount: brand === 'GUESS' ? 10 : brand === 'Desigual' ? 20 : 0
      }
    }).filter(item => item.product).slice(0, 5)
  }, [luxuryProducts])

  // Get brands for Endless Elevated Offers
  const elevatedBrands = useMemo(() => {
    const brands = ['Columbia', 'The North Face', 'GUESS', 'Calvin Clein', 'Ethnic Wear']
    return brands.map(brand => {
      const brandProducts = luxuryProducts.filter(p => 
        p.brand?.toUpperCase().includes(brand)
      )
      return {
        brand,
        product: brandProducts[0] || luxuryProducts[0],
        discount: brand === 'Columbia' ? 20 : brand === 'The North Face' ? 40 : brand === 'GUESS' ? 30 : 25
      }
    }).filter(item => item.product).slice(0, 5)
  }, [luxuryProducts])

  // Get luxury categories for "A World of Luxury" grid - only show categories with at least 1 luxury product (brand-based)
  const luxuryCategories = useMemo(() => {
    // Ensure allCategories is an array
    const safeCategories = Array.isArray(allCategories) ? allCategories : []
    
    // Filter: Only show categories that have at least 1 luxury product (products with brand)
    // luxuryProducts is already filtered to only include products with brand name
    const categoriesWithLuxuryProducts = safeCategories
      .map(cat => {
        // Count only luxury products in this category (products with brand)
        const luxuryCategoryProducts = luxuryProducts.filter(p => {
          const hasBrand = p.brand && p.brand.trim() !== ''
          const categoryMatch = p.category?.toLowerCase() === cat.slug?.toLowerCase() ||
                               p.category?.toLowerCase()?.includes(cat.slug?.toLowerCase()) ||
                               cat.slug?.toLowerCase()?.includes(p.category?.toLowerCase())
          return categoryMatch && hasBrand
        })
        
        // Only include category if it has at least 1 luxury product
        if (luxuryCategoryProducts.length === 0) {
          return null
        }
        
        // Find a product image for the category
        const productImage = luxuryCategoryProducts[0]?.images?.[0]?.url
        const firstImage = typeof productImage === 'string' ? productImage : productImage?.url
        
        return {
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon || '✨',
          image: cat.image || firstImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
          product: luxuryCategoryProducts[0],
          count: luxuryCategoryProducts.length // Count only luxury products
        }
      })
      .filter(cat => cat !== null) // Remove categories with no luxury products

    // Add clothing category if luxury products exist for it
    const luxuryClothingProducts = luxuryProducts.filter(p => {
      const hasBrand = p.brand && p.brand.trim() !== ''
      const isClothing = ['shirts', 'dresses', 'hoodies', 'blazers', 'trousers', 'shorts', 'skirts', 'tshirts'].includes(p.category?.toLowerCase())
      return isClothing && hasBrand
    })
    
    if (luxuryClothingProducts.length > 0 && !categoriesWithLuxuryProducts.find(c => c.slug === 'clothing')) {
      const clothingImage = luxuryClothingProducts[0]?.images?.[0]?.url
      const firstClothingImage = typeof clothingImage === 'string' ? clothingImage : clothingImage?.url
      categoriesWithLuxuryProducts.push({
        name: 'Clothing',
        slug: 'clothing',
        icon: '👔',
        image: firstClothingImage || 'https://images.unsplash.com/photo-1594938291221-94f18e0e0d7a?w=400&h=400&fit=crop',
        product: luxuryClothingProducts[0],
        count: luxuryClothingProducts.length // Count only luxury products
      })
    }

    // Return categories that have luxury products, sorted by count (descending)
    return categoriesWithLuxuryProducts
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [allCategories, luxuryProducts])

  // Get featured products for "Brands in Spotlight" with banners
  const spotlightBrands = useMemo(() => {
    const brands = []
    
    // Get unique brands from luxury products
    const uniqueBrands = [...new Set(luxuryProducts.map(p => p.brand).filter(Boolean))]
    
    // Create brand entries with banners
    uniqueBrands.slice(0, 4).forEach(brandName => {
      const brandProducts = luxuryProducts.filter(p => p.brand === brandName)
      if (brandProducts.length > 0) {
        brands.push({
          brand: brandName,
          product: brandProducts[0],
          discount: Math.floor(Math.random() * 30) + 20, // Random discount 20-50%
          type: brandProducts[0].category || 'fashion',
          image: brandProducts[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=800&fit=crop',
          banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop' // Banner image
        })
      }
    })

    // Fallback if no brands found
    if (brands.length === 0 && luxuryProducts.length > 0) {
      return [
        {
          brand: luxuryProducts[0].brand || 'Premium Brand',
          product: luxuryProducts[0],
          discount: 50,
          type: 'watch',
          image: luxuryProducts[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=800&fit=crop',
          banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop'
        }
      ]
    }

    return brands
  }, [luxuryProducts])

  // Get iconic launches (fragrances)
  const iconicLaunches = useMemo(() => {
    return luxuryProducts
      .filter(p => p.category === 'fashion' || p.name?.toLowerCase().includes('fragrance') || p.name?.toLowerCase().includes('perfume'))
      .slice(0, 5)
  }, [luxuryProducts])

  // Get watch list products
  const watchList = useMemo(() => {
    return luxuryProducts
      .filter(p => p.name?.toLowerCase().includes('watch') || p.category?.toLowerCase().includes('watch'))
      .slice(0, 4)
  }, [luxuryProducts])

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...luxuryProducts]

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
  }, [luxuryProducts, filters, selectedSort])

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
      <div className="min-h-screen bg-white mt-24">
        {/* Premium Hero Banner */}
        <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"
              alt="Luxury Collection"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h1 
                className="text-4xl md:text-6xl lg:text-7xl text-white mb-4 leading-tight tracking-tight"
                style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
              >
                Luxury Collection
              </h1>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto">
              Curated pieces defined by craftsmanship and timeless elegance
            </p>
          </div>
        </section>

        {/* Premier Weekend Access Section - Dark Background */}
        <section className="bg-black py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-white text-2xl md:text-3xl font-bold">PREMIER WEEKEND ACCESS</h2>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="mb-6">
              <p className="text-white/80 text-sm mb-3">Offers End In</p>
              <CountdownTimer />
            </div>
            
            {/* Horizontal Scrollable Brand Offers */}
            <div className="relative">
              <div 
                ref={premierScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {premierBrands.map((item, index) => (
                  <LuxuryBrandOfferCard
                    key={index}
                    product={item.product}
                    discount={item.discount}
                    extraDiscount={item.extraDiscount}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Endless Elevated Offers Section - Dark Background */}
        <section className="bg-black py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-white text-2xl md:text-3xl font-bold">ENDLESS ELEVATED OFFERS</h2>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            
            {/* Horizontal Scrollable Brand Offers */}
            <div className="relative">
              <div 
                ref={elevatedScrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {elevatedBrands.map((item, index) => (
                  <LuxuryBrandOfferCard
                    key={index}
                    product={item.product}
                    discount={item.discount}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Brands in Spotlight Section - White Background with Banners */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h2 
                className="text-3xl md:text-4xl text-gray-900 font-bold text-center"
                style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
              >
                BRANDS IN SPOTLIGHT
              </h2>
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            
            {/* Banner for Brands in Spotlight */}
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop"
                alt="Brands in Spotlight"
                className="w-full h-48 md:h-64 object-cover"
                loading="lazy"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spotlightBrands.map((item, index) => (
                <div key={index} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.brand}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (() => {
                    const firstImage = item.product?.images?.[0]
                    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.brand}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">{item.product?.emoji || '👔'}</span>
                      </div>
                    )
                  })()}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent text-white p-6">
                    {item.discount && (
                      <div className="text-base font-bold mb-2">UP TO {item.discount}% OFF</div>
                    )}
                    {item.startingPrice && (
                      <div className="text-base font-bold mb-2">STARTING ₹{item.startingPrice.toLocaleString('en-IN')}</div>
                    )}
                    <div className="text-2xl font-bold">{item.brand}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* A World of Luxury - Category Grid - White Background with Banner */}
        <section className="bg-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <h2 
                className="text-3xl md:text-4xl text-gray-900 font-bold text-center"
                style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
              >
                A WORLD OF LUXURY
              </h2>
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>

            {/* Banner for A World of Luxury */}
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=400&fit=crop"
                alt="A World of Luxury"
                className="w-full h-48 md:h-64 object-cover"
                loading="lazy"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {luxuryCategories.map((category, index) => (
                <Link 
                  key={index}
                  href={`/luxury/shop/${category.slug}`}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group block"
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (() => {
                    const firstImage = category.product?.images?.[0]
                    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <span className="text-5xl">{category.icon}</span>
                      </div>
                    )
                  })()}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white p-4 text-center">
                    <div className="text-sm md:text-base font-semibold">{category.name.toUpperCase()}</div>
                    {category.count > 0 && (
                      <div className="text-xs text-white/80 mt-1">{category.count} pieces</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Iconic Launches Section - White Background */}
        {iconicLaunches.length > 0 && (
          <section className="bg-white py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <h2 
                  className="text-2xl md:text-3xl text-gray-900 font-bold mb-2"
                  style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
                >
                  ICONIC LAUNCHES
                </h2>
                <p className="text-gray-600 text-sm md:text-base">Deck Up In New Arrivals</p>
              </div>
              
              {/* Horizontal Scrollable Fragrances */}
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {iconicLaunches.map((product, index) => (
                  <div key={product._id || product.id || `iconic-${index}`} className="flex-shrink-0 w-32 md:w-40">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
                      {(() => {
                        const firstImage = product.images?.[0]
                        const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">{product.emoji || '🌹'}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <p className="text-xs text-gray-600 text-center line-clamp-2">{product.name}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 italic mt-4 text-center">An Ode To Fine Fragrances</p>
            </div>
          </section>
        )}

        {/* The Watch List Section - White Background */}
        {watchList.length > 0 && (
          <section className="bg-white py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <h2 
                className="text-2xl md:text-3xl text-gray-900 font-bold mb-6"
                style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
              >
                THE WATCH LIST
              </h2>
              
              {/* Horizontal Scrollable Watches */}
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {watchList.map((product, index) => (
                  <div key={product._id || product.id || `watch-${index}`} className="flex-shrink-0 w-48 md:w-56">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
                      {(() => {
                        const firstImage = product.images?.[0]
                        const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{product.emoji || '⌚'}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">{product.brand}</div>
                    <p className="text-xs text-gray-600 line-clamp-2">{product.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products Grid - 2 columns - White Background */}
        <section className="bg-white py-12 px-1">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 
                  className="text-2xl md:text-3xl text-gray-900 font-bold mb-2"
                  style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
                >
                  All Luxury Pieces
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} available
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
                <button
                  onClick={() => setIsSortOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Sort</span>
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-500 text-lg">No products found</p>
                <button
                  onClick={() => router.push('/luxury')}
                  className="mt-4 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back to Collection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-1 gap-y-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <LuxuryShopProductCard
                    key={product._id || product.id || `luxury-product-${index}`}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Mobile Filter Panel */}
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
