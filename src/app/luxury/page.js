'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { shopAPI } from '@/utils/api'

// Luxury products are identified by having a brand name

export default function LuxuryPage() {
  const router = useRouter()
  const [luxuryProducts, setLuxuryProducts] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  // Fetch luxury products from API
  useEffect(() => {
    const fetchLuxuryProducts = async () => {
      try {
        setIsLoading(true)
        const response = await shopAPI.getProducts('luxury-shop', {
          page: 1,
          limit: 6, // Limit to 6 products for editorial showcase
          sort: 'newest', // Sort by newest first
        })

        if (response && response.success) {
          const rawProducts = response.products || response.data || []
          console.log(`📦 Luxury page: Received ${rawProducts.length} products from API`, rawProducts.length > 0 ? rawProducts[0] : 'No products')
          
          if (rawProducts.length === 0) {
            console.warn('⚠️ No products returned from luxury-shop API')
          }
          
          // Sort by dateAdded/createdAt (newest first) and limit to 6
          const sortedProducts = rawProducts
            .map(product => ({
              ...product,
              id: product._id || product.id,
              slug: product.slug || product.baseSlug || product._id,
              dateAdded: product.dateAdded || product.createdAt
            }))
            .sort((a, b) => {
              const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0
              const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0
              return dateB - dateA // Newest first
            })
            .slice(0, 6) // Limit to 6 products
          
          setLuxuryProducts(sortedProducts)
        } else {
          console.error('❌ Invalid response from luxury-shop API:', response)
          setLuxuryProducts([])
        }
      } catch (error) {
        console.error('Error fetching luxury products:', error)
        setLuxuryProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLuxuryProducts()
  }, [])

  // Split products into curated sections
  const curatedSections = [
    {
      title: 'Craftsmanship',
      subtitle: 'Where tradition meets innovation',
      description: 'Each piece is a testament to meticulous attention to detail, where every stitch tells a story of dedication and artistry passed down through generations.',
      products: luxuryProducts.slice(0, 2),
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&h=800&fit=crop'
    },
    {
      title: 'Timeless Design',
      subtitle: 'Beyond the trends',
      description: 'These pieces transcend seasons, designed not for the moment but for a lifetime. Classic silhouettes reimagined with contemporary sensibility.',
      products: luxuryProducts.slice(2, 4),
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop'
    },
    {
      title: 'Heritage',
      subtitle: 'A legacy of excellence',
      description: 'Rooted in history, elevated for today. These collections honor the past while embracing the future, creating pieces that become heirlooms.',
      products: luxuryProducts.slice(4, 6),
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=800&fit=crop'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Editorial Hero - Full Viewport */}
      <section 
        className={`relative h-screen flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"
            alt="Luxury Fashion"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight tracking-tight"
            style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
          >
            Timeless Elegance
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
            Where craftsmanship meets artistry, and every piece tells a story of enduring beauty
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Story Sections */}
      {curatedSections.map((section, index) => (
        <section 
          key={index}
          className={`py-20 md:py-32 transition-opacity duration-1000 delay-${index * 200} ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
              index % 2 === 1 ? 'lg:flex-row-reverse' : ''
            }`}>
              {/* Visual */}
              <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className={`${index % 2 === 1 ? 'lg:order-1' : ''} space-y-6`}>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider mb-2 font-light">
                    {section.subtitle}
                  </p>
                  <h2 
                    className="text-4xl md:text-5xl text-gray-900 mb-6 leading-tight"
                    style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
                  >
                    {section.title}
                  </h2>
                </div>
                
                <p className="text-lg text-gray-700 leading-relaxed max-w-xl">
                  {section.description}
                </p>

                {/* Curated Products - Minimal Showcase */}
                {section.products.length > 0 && (
                  <div className="pt-8 space-y-6">
                    {section.products.map((product, productIndex) => (
                      <div 
                        key={product._id || product.id || `luxury-${index}-${productIndex}`}
                        className="group cursor-pointer"
                        onClick={() => router.push(product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`)}
                      >
                        <div className="flex gap-6">
                          <div className="w-32 h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {(() => {
                              const firstImage = product.images?.[0]
                              const imageUrl = typeof firstImage === 'string' 
                                ? firstImage 
                                : firstImage?.url
                              return imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-4xl">{product.emoji || '👔'}</span>
                                </div>
                              )
                            })()}
                          </div>
                          <div className="flex-1 pt-2">
                            <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                              {product.name}
                            </h3>
                            <div className="text-base text-gray-600 font-light">
                              {new Intl.NumberFormat('en-IN', { 
                                style: 'currency', 
                                currency: 'INR',
                                maximumFractionDigits: 0 
                              }).format(product.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Closing Statement */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <h2 
            className="text-4xl md:text-5xl text-gray-900 mb-6 leading-tight"
            style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
          >
            A Collection for the Discerning
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Each piece in our luxury collection is carefully curated, representing the pinnacle of design, 
            quality, and timeless appeal. These are not merely garments, but investments in enduring style.
          </p>
        </div>
      </section>

      {/* Minimal Footer CTA */}
      <section className="py-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <button
            onClick={() => router.push('/luxury/shop')}
            className="px-8 py-3 text-sm font-medium text-gray-900 border border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 tracking-wider uppercase"
          >
            Explore Collection
          </button>
        </div>
      </section>
    </div>
  )
}
