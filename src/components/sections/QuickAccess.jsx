'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

const quickAccessCards = [
  {
    id: 1,
    title: 'New Arrivals',
    subtitle: 'LATEST COLLECTION',
    description: 'Discover the newest trends',
    href: '/new-arrivals',
    image: '/banner6.jpeg',
    buttonBg: 'bg-pink-500',
    buttonHover: 'hover:bg-pink-600',
  },
  {
    id: 2,
    title: 'Best Sellers',
    subtitle: 'TOP RATED',
    description: 'Shop what everyone loves',
    href: '/best-sellers',
    image: '/banner9.jpeg',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
  },
  {
    id: 3,
    title: 'Under ₹999',
    subtitle: 'BUDGET FRIENDLY',
    description: 'Great deals under budget',
    href: '/under-999',
    image: '/banner8.jpeg',
    buttonBg: 'bg-green-500',
    buttonHover: 'hover:bg-green-600',
  },
  {
    id: 4,
    title: "Today's Deals",
    subtitle: 'FLASH SALE',
    description: 'Limited time offers',
    href: '/deals',
    image: '/banner7.jpeg',
    buttonBg: 'bg-yellow-500',
    buttonHover: 'hover:bg-yellow-600',
  },
]

function QuickAccess() {
  return (
    <div className="w-full bg-white px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Improved Collage Layout */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* Large Card 1 - New Arrivals (Full Width) */}
          <Link
            href={quickAccessCards[0].href}
            className="col-span-2 group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
              {/* Image */}
              <div className="relative h-56 md:h-64 bg-gray-100 overflow-hidden">
                <img 
                  src={quickAccessCards[0].image} 
                  alt={quickAccessCards[0].title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="p-4 md:p-5">
                <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  {quickAccessCards[0].subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  {quickAccessCards[0].title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {quickAccessCards[0].description}
                </p>
                <button suppressHydrationWarning={true} className={`${quickAccessCards[0].buttonBg} ${quickAccessCards[0].buttonHover} text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm`}>
                  <ShoppingBag className="w-4 h-4" />
                  Shop Now
                </button>
              </div>
            </div>
          </Link>

          {/* Medium Card 2 - Best Sellers */}
          <Link
            href={quickAccessCards[1].href}
            className="col-span-1 group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 h-full flex flex-col">
              {/* Image */}
              <div className="relative h-40 md:h-44 bg-gray-100 overflow-hidden shrink-0">
                <img 
                  src={quickAccessCards[1].image} 
                  alt={quickAccessCards[1].title}
                  className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    {quickAccessCards[1].subtitle}
                  </p>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                    {quickAccessCards[1].title}
                  </h3>
                </div>
                <button suppressHydrationWarning={true} className={`${quickAccessCards[1].buttonBg} ${quickAccessCards[1].buttonHover} text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm w-full justify-center`}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Shop Now
                </button>
              </div>
            </div>
          </Link>

          {/* Medium Card 3 - Under ₹999 */}
          <Link
            href={quickAccessCards[2].href}
            className="col-span-1 group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 h-full flex flex-col">
              {/* Image */}
              <div className="relative h-40 md:h-44 bg-gray-100 overflow-hidden shrink-0">
                <img 
                  src={quickAccessCards[2].image} 
                  alt={quickAccessCards[2].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                    {quickAccessCards[2].subtitle}
                  </p>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                    {quickAccessCards[2].title}
                  </h3>
                </div>
                <button suppressHydrationWarning={true} className={`${quickAccessCards[2].buttonBg} ${quickAccessCards[2].buttonHover} text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm w-full justify-center`}>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Shop Now
                </button>
              </div>
            </div>
          </Link>

          {/* Large Card 4 - Today's Deals (Full Width) */}
          <Link
            href={quickAccessCards[3].href}
            className="col-span-2 group"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
              {/* Image */}
              <div className="relative h-56 md:h-64 bg-gray-100 overflow-hidden">
                <img 
                  src={quickAccessCards[3].image} 
                  alt={quickAccessCards[3].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="p-4 md:p-5">
                <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  {quickAccessCards[3].subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  {quickAccessCards[3].title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {quickAccessCards[3].description}
                </p>
                <button suppressHydrationWarning={true} className={`${quickAccessCards[3].buttonBg} ${quickAccessCards[3].buttonHover} text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm`}>
                  <ShoppingBag className="w-4 h-4" />
                  Shop Now
                </button>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default QuickAccess

