'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

const ProductCard = ({ 
  product, 
  tag = null,
  showAddToBag = true,
  theme = 'light'
}) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const imageContainerRef = useRef(null)
  const autoSlideRef = useRef(null)

  // Helper function to check if a string is a URL or base64 data URL
  const isImageUrl = (str) => {
    if (typeof str !== 'string') return false
    return str.startsWith('http://') || 
           str.startsWith('https://') || 
           str.startsWith('/') ||
           str.startsWith('data:image/') // Support base64 data URLs
  }

  // Check if product is in wishlist on mount
  useEffect(() => {
    const productId = product._id || product.id
    if (productId) {
      setIsWishlisted(isInWishlist(productId))
    }
  }, [product._id, product.id, isInWishlist])

  // Get all images for the product
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.emoji || '🛍️']

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const productId = product._id || product.id
    if (isWishlisted) {
      removeFromWishlist(productId)
      setIsWishlisted(false)
    } else {
      addToWishlist(product)
      setIsWishlisted(true)
    }
  }

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
    setIsDragging(true)
    // Pause auto-slide if exists
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      return
    }
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - next image
        goToNextImage()
      } else {
        // Swipe right - previous image
        goToPrevImage()
      }
    }
    
    setTouchStart(0)
    setTouchEnd(0)
    setIsDragging(false)
  }

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    e.preventDefault()
    setTouchStart(e.clientX)
    setIsDragging(true)
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && touchStart) {
      setTouchEnd(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false)
      return
    }
    
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
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setTouchStart(0)
    setTouchEnd(0)
    setIsDragging(false)
  }

  // Auto-slide on hover (desktop only)
  useEffect(() => {
    const container = imageContainerRef.current
    if (!container) return

    const handleMouseEnter = () => {
      if (productImages.length > 1) {
        autoSlideRef.current = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % productImages.length)
        }, 2000)
      }
    }

    const handleMouseLeave = () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
        autoSlideRef.current = null
      }
      // Reset to first image
      setCurrentImageIndex(0)
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }
  }, [productImages.length])

  // Calculate discount percentage
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  // Get product tags (color and fit)
  const productTags = []
  if (product.colors && product.colors.length > 0) {
    const firstColor = typeof product.colors[0] === 'string' 
      ? product.colors[0] 
      : product.colors[0].name
    productTags.push(firstColor)
  }
  if (product.sizes && product.sizes.length > 0) {
    productTags.push('Slim fit')
  }

  // Calculate best price (10% off from current price)
  const bestPrice = Math.round(product.price * 0.9)

  return (
    <div className="group bg-white rounded-lg overflow-hidden transition-all duration-300 cursor-pointer border border-gray-100">
      <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`}>
        {/* Product Image Container with Enhanced Swipe Support */}
        <div 
          ref={imageContainerRef}
          className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Image Slider with Smooth Transitions */}
          <div className="relative w-full h-full">
            {productImages.map((image, index) => {
              const offset = index - currentImageIndex
              const isActive = index === currentImageIndex
              
              return (
                <div
                  key={index}
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    isActive 
                      ? 'opacity-100 scale-100 z-10' 
                      : 'opacity-0 scale-95 z-0'
                  }`}
                  style={{
                    transform: isActive 
                      ? 'translateX(0) scale(1)' 
                      : offset > 0 
                        ? 'translateX(100%) scale(0.95)' 
                        : 'translateX(-100%) scale(0.95)',
                  }}
                >
                  {isImageUrl(image) ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-7xl transform transition-transform duration-500 group-hover:scale-110">
                      {image}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* NEW DROP Badge */}
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg z-20">
            NEW DROP
          </div>

          {/* Rating Badge */}
          {product.rating && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 z-20">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{product.rating}</span>
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
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToNextImage()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Dots Indicator */}
          {productImages.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1.5 rounded-full z-20">
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
                      ? 'bg-white w-6 h-1.5'
                      : 'bg-white/50 w-1.5 h-1.5 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-300 z-20 shadow-lg ${
              isWishlisted 
                ? 'scale-110 bg-yellow-50' 
                : 'hover:bg-white hover:scale-110'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-300 ${
                isWishlisted 
                  ? 'fill-yellow-500 text-yellow-500 scale-110' 
                  : 'text-gray-700'
              }`} 
            />
          </button>

          {/* Swipe Indicator (Mobile) */}
          {productImages.length > 1 && isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none">
              <div className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-lg">
                {touchEnd > touchStart ? '← Swipe' : 'Swipe →'}
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Enhanced UI */}
        <div className="p-3 space-y-2 bg-white">
          {/* Product Name - Single Line with Ellipsis */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 truncate">
            {product.name}
          </h3>

          {/* Price Section - Optimized for visibility */}
          <div className="space-y-1">
            {/* Price and Original Price Row */}
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Best Price and Discount Row */}
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-600">
                Best Price: <span className="font-bold text-gray-900">₹{bestPrice}</span>
              </p>
              {discountPercentage && (
                <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Add to Bag Button */}
          {showAddToBag && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (product.stock === 0 || product.stock === '0') {
                  return // Don't add out of stock items
                }
                addToCart(product, {
                  size: product.sizes?.[0] || 'M',
                  color: typeof product.colors?.[0] === 'string' 
                    ? product.colors[0] 
                    : product.colors?.[0]?.name || 'White',
                  quantity: 1
                })
              }}
              disabled={product.stock === 0 || product.stock === '0'}
              className={`w-full py-2.5 px-4 border-2 font-bold text-sm rounded-lg transition-all duration-200 mt-2 transform hover:scale-[1.02] active:scale-100 ${
                (product.stock === 0 || product.stock === '0')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 border-gray-300'
                  : 'border-yellow-500 hover:bg-yellow-500 hover:text-white text-yellow-500'
              }`}
            >
              {(product.stock === 0 || product.stock === '0') ? 'Out of Stock' : 'Add to Bag'}
            </button>
          )}
        </div>
      </Link>
    </div>
  )
}

export default ProductCard

