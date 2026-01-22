'use client'

import React from 'react'
import Link from 'next/link'

const LuxuryBrandOfferCard = ({ product, discount, extraDiscount }) => {
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

  return (
    <Link href={product.vendorSlug ? `/product/${product.vendorSlug}/${product.baseSlug || product.slug}` : `/product/${product.slug}`} className="flex-shrink-0 w-48 md:w-56">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
        {productImages[0] && typeof productImages[0] === 'string' && productImages[0].startsWith('http') ? (
          <img
            src={productImages[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{productImages[0] || product.emoji || '👔'}</span>
          </div>
        )}
      </div>
      <div className="text-white text-lg md:text-xl font-bold mb-2">
        {product.brand?.toUpperCase() || 'BRAND'}
      </div>
      <div className="bg-black text-white text-xs md:text-sm px-3 py-2 rounded">
        {discount && `MIN. ${discount}%`}
        {extraDiscount && ` + EXTRA ${extraDiscount}% OFF`}
        {!discount && !extraDiscount && 'SPECIAL OFFER'}
      </div>
    </Link>
  )
}

export default LuxuryBrandOfferCard

