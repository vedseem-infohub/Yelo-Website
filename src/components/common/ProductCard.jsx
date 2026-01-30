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
  onRemove = null, 
  variant = 'default', 
  theme = 'light', 
  compact = false 
}) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Determine the correct product ID
  const productId = product.id || product._id

  useEffect(() => {
    if (productId) {
      setIsWishlisted(isInWishlist(productId))
    }
  }, [productId, isInWishlist])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const imageContainerRef = useRef(null)
  const autoSlideRef = useRef(null)

  // Helper function to extract image URL (handles both string and object formats)
  const getImageUrl = (image) => {
    if (!image) return null
    if (typeof image === 'string') return image
    if (typeof image === 'object' && image.url) return image.url
    return null
  }

  // Helper function to check if a string is a URL or base64 data URL
  const isImageUrl = (str) => {
    if (!str || typeof str !== 'string') return false
    return str.startsWith('http://') || 
           str.startsWith('https://') || 
           str.startsWith('/') ||
           str.startsWith('data:image/') // Support base64 data URLs
  }

  // Get all images for the product (extract URLs from objects if needed)
  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => {
        const url = getImageUrl(img)
        return url || product.emoji || '🛍️'
      })
    : [product.emoji || '🛍️']

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
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
        goToNextImage()
      } else {
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

    const handleMouseLeaveAuto = () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
        autoSlideRef.current = null
      }
      setCurrentImageIndex(0)
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeaveAuto)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeaveAuto)
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
      }
    }
  }, [productImages.length])

  // Calculate discount percentage
  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  // Calculate best price (10% off from current price)
  const bestPrice = Math.round(product.price * 0.9)

  // Tag colors
  const getTagColor = (tagName) => {
    switch (tagName) {
      case 'NEW DROP':
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-orange-500'
      case 'Trending':
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-red-500'
      case 'Fresh Arrival':
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-green-500'
      case 'Best Seller':
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-blue-500'
      case 'Premium':
      case 'Luxury':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      default:
        return theme === 'dark' ? 'bg-yellow-500' : 'bg-orange-500'
    }
  }

  // Theme-based classes
  const cardClasses = theme === 'dark' 
    ? 'group bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 cursor-pointer border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-2xl hover:shadow-yellow-500/20'
    : 'group bg-white rounded-lg overflow-hidden transition-all duration-300 cursor-pointer border border-gray-100'
  
  const infoBgClasses = theme === 'dark'
    ? 'p-3 space-y-0.5 bg-gray-800/90 backdrop-blur-sm'
    : 'p-3 space-y-0.5 bg-white'

  const textColorClasses = theme === 'dark'
    ? {
        name: 'text-sm font-semibold text-gray-100 line-clamp-1 truncate',
        price: 'text-base font-bold text-yellow-400',
        originalPrice: 'text-sm text-gray-400 line-through',
        discount: 'text-xs font-bold text-yellow-500',
        bestPrice: 'text-xs text-gray-300',
        bestPriceValue: 'font-bold text-yellow-400'
      }
    : {
        name: 'text-sm font-semibold text-gray-900 line-clamp-1 truncate',
        price: 'text-base font-bold text-gray-900',
        originalPrice: 'text-sm text-gray-500 line-through',
        discount: 'text-xs font-bold text-orange-600',
        bestPrice: 'text-xs text-gray-600',
        bestPriceValue: 'font-bold text-gray-900'
      }

  return (
    <div className={`${cardClasses} w-full max-w-full min-w-0`}>
      <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`}>
        {/* Product Image Container with Enhanced Swipe Support */}
        <div 
          ref={imageContainerRef}
          className={`relative aspect-[3/4] overflow-hidden select-none ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
          }`}
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
                    <span className="text-[clamp(2.5rem,6vw,4rem)] transform transition-transform duration-500 group-hover:scale-110">
                      {image}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tag Badge - Softer Accent, Rounded Pill */}
          {tag && (
            <div className={`absolute top-2 left-2 z-20 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${
              tag === 'Trending' 
                ? 'bg-yellow-100 text-yellow-700' 
                : tag === 'NEW DROP'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {tag}
            </div>
          )}

          {/* Rating Badge */}
          {product.rating && (
            <div className={`absolute bottom-2 left-2 backdrop-blur-sm text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 z-20 ${
              theme === 'dark' 
                ? 'bg-yellow-500/20 border border-yellow-500/30' 
                : 'bg-black/70'
            }`}>
              <Star className={`w-2.5 h-2.5 fill-yellow-400 ${
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-400'
              }`} />
              <span className={theme === 'dark' ? 'text-yellow-400' : 'text-white'}>
                {product.rating?.toFixed(1) || '4.0'}
              </span>
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
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 ${
                  theme === 'dark'
                    ? 'bg-gray-800/90 hover:bg-gray-700/90 border border-yellow-500/30'
                    : 'bg-white/90 hover:bg-white'
                }`}
                aria-label="Previous image"
                suppressHydrationWarning
              >
                <ChevronLeft className={`w-4 h-4 ${theme === 'dark' ? 'text-yellow-400' : 'text-gray-700'}`} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goToNextImage()
                }}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 backdrop-blur-sm rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 ${
                  theme === 'dark'
                    ? 'bg-gray-800/90 hover:bg-gray-700/90 border border-yellow-500/30'
                    : 'bg-white/90 hover:bg-white'
                }`}
                aria-label="Next image"
                suppressHydrationWarning
              >
                <ChevronRight className={`w-4 h-4 ${theme === 'dark' ? 'text-yellow-400' : 'text-gray-700'}`} />
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


          {/* Wishlist Button */}
          {variant !== 'cart' && (
            <button
              onClick={handleWishlist}
              className={`absolute top-2 right-2 p-1.5 backdrop-blur-sm rounded-full transition-all duration-300 z-20 shadow-lg ${
                theme === 'dark'
                  ? isWishlisted
                    ? 'scale-110 bg-yellow-500/90'
                    : 'bg-gray-800/90 hover:bg-gray-700/90 hover:scale-110'
                  : isWishlisted
                    ? 'scale-110 bg-yellow-50'
                    : 'bg-white/90 hover:bg-white hover:scale-110'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              suppressHydrationWarning
            >
              <Heart 
                className={`w-4 h-4 transition-all duration-300 ${
                  isWishlisted 
                    ? 'fill-red-500 text-red-500 scale-110' 
                    : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`} 
              />
            </button>
          )}

          {/* Remove Button (for wishlist/cart) */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove(productId)
              }}
              className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-300 z-20 shadow-lg hover:bg-red-50"
              aria-label="Remove item"
              suppressHydrationWarning
            >
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            </button>
          )}
        </div>

        {/* Product Info - Enhanced UI */}
        <div className={infoBgClasses}>
          {/* Product Name - Single Line with Ellipsis */}
          <h3 className={textColorClasses.name}>
            {product.name}
          </h3>

          {/* Price Section - Optimized for visibility */}
          <div className="space-y-1">
            {/* Price and Original Price Row */}
            <div className="flex items-center gap-2">
              <span className={textColorClasses.price}>
                ₹{product.price?.toLocaleString('en-IN') || '0'}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className={textColorClasses.originalPrice}>
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Best Price and Discount Row */}
            <div className="flex items-center gap-3">
              <p className={textColorClasses.bestPrice}>
                Best Price: <span className={textColorClasses.bestPriceValue}>₹{bestPrice.toLocaleString('en-IN')}</span>
              </p>
              {discountPercentage && (
                <span className={`${textColorClasses.discount} whitespace-nowrap`}>
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
              className={`w-full max-w-full ${compact ? 'py-2 px-3 text-xs' : 'py-2.5 px-4 text-sm'} font-semibold rounded-lg transition-all duration-200 mt-2 transform hover:scale-[1.02] active:scale-100 ${
                (product.stock === 0 || product.stock === '0')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  : theme === 'dark'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                    : 'border-2 border-yellow-500 hover:bg-yellow-500 hover:text-white text-yellow-500'
              }`}
              suppressHydrationWarning
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

