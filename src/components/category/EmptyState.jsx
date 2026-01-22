'use client'

import React from 'react'

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 py-36">
      {/* Empty Box Illustration */}
      <div className="relative mb-8 animate-float">
        {/* Colorful shapes above box */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="w-10 h-10 bg-yellow-300 rounded-full animate-float" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-10 h-10 bg-yellow-500 rounded-full animate-float" style={{ animationDelay: '0.6s' }}></div>
        </div>
        
        {/* Empty Box */}
        <div className="relative">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-premium-lg"
          >
            {/* Box base */}
            <rect
              x="30"
              y="80"
              width="140"
              height="100"
              fill="#FCD34D"
              stroke="#F59E0B"
              strokeWidth="3"
              rx="4"
            />
            {/* Box front */}
            <rect
              x="30"
              y="80"
              width="140"
              height="100"
              fill="#FEF3C7"
              opacity="0.8"
              rx="4"
            />
            {/* Box lid (open) */}
            <path
              d="M 30 80 L 50 40 L 170 40 L 150 80"
              fill="#FCD34D"
              stroke="#F59E0B"
              strokeWidth="3"
              rx="4"
            />
            {/* Box lid inner */}
            <path
              d="M 50 40 L 170 40 L 150 80 L 30 80"
              fill="#FEF3C7"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {/* Empty State Text */}
      <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">No products Found</h2>
      <p className="text-gray-500 text-center max-w-md text-base leading-relaxed mb-6">
        We couldn't find any products in this category. Try adjusting your filters or check back later.
      </p>
      <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-premium hover:shadow-premium-lg transform hover:scale-105">
        Clear Filters
      </button>
    </div>
  )
}

export default EmptyState

