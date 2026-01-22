'use client'

import React from 'react'
import { Star } from 'lucide-react'

const reviews = [
  {
    id: 1,
    name: 'Sarah M.',
    rating: 5,
    comment: 'Amazing quality and fast delivery!',
    product: 'Fashion items',
  },
  {
    id: 2,
    name: 'John D.',
    rating: 5,
    comment: 'Great prices and excellent service.',
    product: 'Electronics',
  },
  {
    id: 3,
    name: 'Emma L.',
    rating: 4,
    comment: 'Love the product selection!',
    product: 'Beauty products',
  },
]

function SocialProof() {
  return (
    <div className="w-full bg-white px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">What Our Customers Say</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex-shrink-0 w-[280px] snap-center bg-gray-50 rounded-xl p-4 border border-gray-100"
            >
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-700 mb-3 line-clamp-3">{review.comment}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-yellow-600">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.product}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SocialProof

