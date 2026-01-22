'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Star, ShoppingBag, Check } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { motion } from 'framer-motion'

const OfferCard = ({ product, isLoading = false }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Check if product is in wishlist
  useEffect(() => {
    setIsWishlisted(isInWishlist(product?.id))
  }, [product?.id, isInWishlist])

  // Helper function to check if a string is a URL or base64 data URL
  const isImageUrl = (str) => {
    if (typeof str !== 'string') return false
    return str.startsWith('http://') || 
           str.startsWith('https://') || 
           str.startsWith('/') ||
           str.startsWith('data:image/') // Support base64 data URLs
  }

  // Get product image - handle both string URLs and image objects
  const getImageUrl = () => {
    const firstImage = product?.images?.[0]
    if (!firstImage) return product?.emoji || '🛍️'
    
    // If it's an object with url property
    if (typeof firstImage === 'object' && firstImage !== null && firstImage.url) {
      return firstImage.url
    }
    
    // If it's a string
    if (typeof firstImage === 'string') {
      return firstImage
    }
    
    // Fallback to emoji
    return product?.emoji || '🛍️'
  }

  const productImage = getImageUrl()
  const isImage = isImageUrl(productImage)

  // Calculate discount percentage
  const discountPercentage = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product?.discount || 0

  // Check if it's a best price (discount > 40%)
  const isBestPrice = discountPercentage >= 40

  // Calculate original price if not provided
  const originalPrice = product?.originalPrice || (product?.price ? Math.round(product.price / (1 - discountPercentage / 100)) : 0)

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product) return
    
    if (isWishlisted) {
      removeFromWishlist(product.id)
      setIsWishlisted(false)
    } else {
      addToWishlist(product)
      setIsWishlisted(true)
    }
  }

  const handleAddToBag = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product || isAddingToCart) return

    setIsAddingToCart(true)
    
    // Add to cart
    addToCart(product, { silent: false })
    
    // Show success feedback
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setIsAddingToCart(false)
    }, 1500)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm h-full flex flex-col">
        {/* Skeleton Image - Fixed Height */}
        <div className="relative w-full h-64 bg-gray-200 skeleton flex-shrink-0" />
        
        {/* Skeleton Content */}
        <div className="p-3 flex flex-col flex-grow space-y-1.5">
          <div className="h-4 bg-gray-200 rounded skeleton w-3/4" />
          <div className="h-3 bg-gray-200 rounded skeleton w-1/2" />
          <div className="h-4 bg-gray-200 rounded skeleton w-2/3 mt-1" />
          <div className="h-9 bg-gray-200 rounded skeleton w-full mt-auto pt-2" />
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-md overflow-hidden border border-gray-100 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col w-full"
    >
      <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug || product.id}`} className="flex flex-col h-full">
        {/* Product Image Container - Fixed Height */}
        <div className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
          {/* Image */}
          {isImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 skeleton" />
              )}
              <img
                src={productImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{productImage}</span>
            </div>
          )}

          {/* Discount Badge - Top Left */}
          {discountPercentage > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute top-2 left-2 z-20 ${
                discountPercentage >= 40
                  ? 'bg-red-500 animate-pulse'
                  : discountPercentage >= 20
                  ? 'bg-orange-500'
                  : 'bg-yellow-500'
              } text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg`}
            >
              {discountPercentage}% OFF
            </motion.div>
          )}

          {/* Wishlist Icon - Top Right */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition-all hover:scale-110 active:scale-95"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-700'
              }`}
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-3 flex flex-col flex-grow space-y-1.5">
          {/* Product Name - Single line with ellipsis */}
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-gray-700 ml-0.5">
                {product.rating?.toFixed(1) || '4.0'}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviews || 0})
            </span>
          </div>

          {/* Price Section */}
          <div className="space-y-1 mt-1">
            <div className="flex items-center gap-2">
              {/* Discounted Price */}
              <span className="text-base font-bold text-gray-900">
                ₹{product.price?.toLocaleString() || '0'}
              </span>
              
              {/* Original Price (Strikethrough) */}
              {originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Best Price Label */}
            {isBestPrice && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                <span>✓</span>
                <span>Best Price</span>
              </div>
            )}
          </div>

          {/* Add to Bag Button - Push to bottom */}
          <div className="mt-auto pt-2">
            <button
            onClick={handleAddToBag}
            disabled={isAddingToCart}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              showSuccess
                ? 'bg-green-500 text-white'
                : isAddingToCart
                ? 'bg-yellow-400 text-white cursor-wait'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white active:scale-95'
            }`}
          >
            {showSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added!</span>
              </>
            ) : isAddingToCart ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </>
            )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default OfferCard

