'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'

const AffordableProductCard = ({ product }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const imageContainerRef = useRef(null)

  React.useEffect(() => {
    setIsWishlisted(isInWishlist(product.id))
  }, [product.id, isInWishlist])

  // Helper function to check if a string is a URL or base64 data URL
  const isImageUrl = (str) => {
    if (typeof str !== 'string') return false
    return str.startsWith('http://') || 
           str.startsWith('https://') || 
           str.startsWith('/') ||
           str.startsWith('data:image/') // Support base64 data URLs
  }

  // Get product images - handle both string URLs and image objects
  const getProductImages = () => {
    if (!product.images || product.images.length === 0) {
      return [product.emoji || '🛍️']
    }
    
    return product.images.map(img => {
      // If it's an object with url property
      if (typeof img === 'object' && img !== null && img.url) {
        return img.url
      }
      // If it's already a string
      if (typeof img === 'string') {
        return img
      }
      // Fallback
      return product.emoji || '🛍️'
    })
  }

  const productImages = getProductImages()

  // Navigate to next/previous image
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
  }

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const goToImage = (index) => {
    setCurrentImageIndex(index)
  }

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNextImage()
      } else {
        goToPrevImage()
      }
    }
    
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    e.preventDefault()
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    if (touchStart) {
      setTouchEnd(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNextImage()
      } else {
        goToPrevImage()
      }
    }
    
    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleMouseLeave = () => {
    setTouchStart(0)
    setTouchEnd(0)
  }

  // Auto-slide on hover (desktop only)
  useEffect(() => {
    const container = imageContainerRef.current
    if (!container || productImages.length <= 1) return

    const handleMouseEnter = () => {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
      }, 2000)
      
      return () => clearInterval(interval)
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', () => setCurrentImageIndex(0))

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [productImages.length])

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isWishlisted) {
      removeFromWishlist(product.id)
      setIsWishlisted(false)
    } else {
      addToWishlist(product)
      setIsWishlisted(true)
    }
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group bg-white rounded-lg overflow-hidden transition-all duration-200 cursor-pointer border border-gray-200 hover:shadow-lg hover:scale-[1.02]">
      <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`}>
        {/* Compact Image Container with Swipe Support */}
        <div 
          ref={imageContainerRef}
          className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Image Slider */}
          <div className="relative w-full h-full">
            {productImages.map((image, index) => {
              const isActive = index === currentImageIndex
              return (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    isActive 
                      ? 'opacity-100 scale-100 z-10' 
                      : 'opacity-0 scale-95 z-0'
                  }`}
                >
                  {isImageUrl(image) ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl">{image || product.emoji || '🛍️'}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Prominent Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md z-10">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Navigation Arrows (Desktop) */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToPrevImage()
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 bg-white/90 hover:bg-white"
                aria-label="Previous image"
                suppressHydrationWarning
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToNextImage()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 bg-white/90 hover:bg-white"
                aria-label="Next image"
                suppressHydrationWarning
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Dots Indicator */}
          {productImages.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5 px-2 py-1.5 rounded-full z-20">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    goToImage(index)
                  }}
                  className={`transition-all duration-200 rounded-full ${
                    index === currentImageIndex
                      ? 'bg-gray-900 w-6 h-1.5'
                      : 'bg-gray-900/50 w-1.5 h-1.5 hover:bg-gray-900/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                  suppressHydrationWarning
                />
              ))}
            </div>
          )}

          {/* Wishlist Icon - Always Visible */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 z-10 ${
              isWishlisted
                ? 'bg-pink-500 text-white'
                : 'bg-white/90 hover:bg-pink-50 text-gray-700'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-4 h-4 ${
                isWishlisted ? 'fill-current' : ''
              }`} 
            />
          </button>
        </div>

        {/* Product Info - Compact */}
        <div className="p-3 space-y-1.5">
          {/* Brand + Product Name - 2 Line Clamp */}
          <div>
            {/* <p className="text-xs text-gray-600 font-medium mb-0.5">
              {product.brand || 'Brand'}
            </p> */}
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </div>

          {/* Rating + Review Count */}
          {/* {product.rating && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-semibold text-gray-900">{product.rating.toFixed(1)}</span>
              </div>
              {product.reviews && (
                <span className="text-xs text-gray-500">({product.reviews})</span>
              )}
            </div>
          )} */}

          {/* Price Section - Optimized for visibility */}
          <div className="space-y-1 mt-1">
            {/* Row 1: Current and Original Price */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-gray-900 leading-none">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-500 line-through leading-none">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Row 2: Best Price and Discount */}
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[11px] text-gray-600 leading-none">
                Best Price: <span className="font-bold text-gray-900">{formatPrice(Math.round(product.price * 0.9))}</span>
              </p>
              {discountPercentage > 0 && (
                <span className="text-[11px] font-bold text-orange-600 whitespace-nowrap leading-none">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Add to Bag Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addToCart(product, {
                size: product.sizes?.[0] || 'M',
                color: typeof product.colors?.[0] === 'string' 
                  ? product.colors[0] 
                  : product.colors?.[0]?.name || 'White',
                quantity: 1
              })
            }}
            className="w-full py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-200 mt-2 transform hover:scale-[1.02] active:scale-100 border-2 border-yellow-500 hover:bg-yellow-500 hover:text-white text-yellow-500"
            suppressHydrationWarning
          >
            Add to Bag
          </button>
        </div>
      </Link>
    </div>
  )
}

export default AffordableProductCard

