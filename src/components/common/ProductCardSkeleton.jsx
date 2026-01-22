'use client'

import React from 'react'

/**
 * ProductCardSkeleton - Shimmer loading skeleton for product cards
 * Matches the structure and size of ProductCard to prevent layout shift
 */
const ProductCardSkeleton = ({ variant = 'default', compact = false }) => {
  // Base classes match ProductCard styling
  const cardClasses = compact 
    ? 'bg-white rounded-lg border border-gray-200 overflow-hidden'
    : 'bg-white rounded-lg border border-gray-200 overflow-hidden'

  return (
    <div className={`${cardClasses} w-full max-w-full min-w-0 animate-pulse`}>
      {/* Image Container - matches ProductCard aspect-[3/4] */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Product Info - matches ProductCard padding and spacing */}
      <div className="p-3 space-y-2 bg-white">
        {/* Product Name Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse">
          <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
        </div>

        {/* Price Section Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-300 rounded w-20 animate-pulse">
            <div className="h-full bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 animate-shimmer" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse">
            <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-12 animate-pulse">
            <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
          </div>
        </div>

        {/* Button Skeleton (optional, matches Add to Bag button space) */}
        <div className="h-8 bg-gray-200 rounded mt-2 animate-pulse">
          <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
        </div>
      </div>

    </div>
  )
}

export default ProductCardSkeleton
