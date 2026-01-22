'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'

const LuxuryShopProductCard = ({ product }) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isWishlisted, setIsWishlisted] = useState(false)

  React.useEffect(() => {
    setIsWishlisted(isInWishlist(product.id))
  }, [product.id, isInWishlist])

  // Helper to extract image URL (handles both string and object formats)
  const getImageUrl = (image) => {
    if (!image) return null
    if (typeof image === 'string') return image
    if (typeof image === 'object' && image.url) return image.url
    return null
  }

  const productImages = product.images && product.images.length > 0 
    ? product.images.map(img => getImageUrl(img) || product.emoji || '👔')
    : [product.emoji || '👔']

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group bg-white rounded-lg overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg border border-gray-200">
      <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`}>
        {/* Large Product Image - Centered, Calm Background */}
        <div 
          className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ transform: 'scale(1)' }}
        >
          {productImages[0] && typeof productImages[0] === 'string' && productImages[0].startsWith('http') ? (
            <img
              src={productImages[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{productImages[0] || product.emoji || '👔'}</span>
            </div>
          )}

          {/* Subtle Wishlist Icon - Outline Heart */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
              isWishlisted
                ? 'bg-white/90 text-gray-900'
                : 'bg-white/70 hover:bg-white/90 text-gray-600'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-4 h-4 transition-all duration-200 ${
                isWishlisted ? 'fill-current' : ''
              }`} 
            />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 md:p-5 space-y-2">
          {/* Brand Name - Small, Uppercase, Muted Gray */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {product.brand || 'BRAND'}
          </p>

          {/* Product Name - Serif or Elegant Font */}
          <h3 
            className="text-sm md:text-base font-light text-gray-900 leading-snug line-clamp-2"
            style={{ fontFamily: '"Playfair Display", "Georgia", serif' }}
          >
            {product.name}
          </h3>

          {/* Price Only - No Strike-through, No Discount Badge */}
          <p className="text-base md:text-lg font-medium text-gray-900">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </div>
  )
}

export default LuxuryShopProductCard

