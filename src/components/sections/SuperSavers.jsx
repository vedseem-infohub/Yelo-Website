'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

const superSaversCategories = [
  // {
  //   id: 1,
  //   name: 'Jackets',
  //   price: 'UNDER ₹949',
  //   image: '/super-saver-offer-image/',
  //   brands: ['HRX', 'Adidas'],
  //   href: '/super-savers/jacket-under-949',
  // },
  {
    id: 2,
    name: 'Kurta Sets',
    price: 'UNDER ₹1099',
    image: '/super-saver-offer-images/kurta-set.jpg',
    brands: ['Anouk', 'Jaspere'],
    href: '/super-savers/kurta-set-under-1099',
  },
  {
    id: 3,
    name: 'Sneakers',
    price: 'UNDER ₹1299',
    image: '/super-saver-offer-images/shoes.jpg',
    brands: ['Nike', 'Puma'],
    href: '/super-savers/sneaker-under-1299',
  },
  {
    id: 4,
    name: 'Sweaters',
    price: 'UNDER ₹549',
    image: '/super-saver-offer-images/sweater.jpg',
    brands: ['Roadster', 'Dressberry'],
    href: '/super-savers/sweater-under-549',
  },
  {
    id: 5,
    name: 'Kurtas',
    price: 'UNDER ₹349',
    image: '/super-saver-offer-images/kurti.jpg',
    brands: ['Anouk'],
    href: '/super-savers/kurta-under-349',
  },
]

function SuperSavers() {
  const scrollContainerRef = useRef(null)

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full bg-white py-6">
      {/* SUPER SAVERS Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 px-4 py-4 mb-4 rounded-t-2xl">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-1">SUPER SAVERS</h2>
          {/* <Link href="/super-savers"> */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
              <p className="text-white text-sm">Prices Slashed, Style Doubled</p>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          {/* </Link> */}
        </div>
      </div>

      {/* Scrollable Category Cards with Brands */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {superSaversCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="flex-shrink-0 snap-center w-[170px]"
            >
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md active:scale-95">
                {/* Product Image Area */}
                <div className="bg-gray-50 flex items-center justify-center">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={200}
                    height={160}
                    className="object-cover"
                  />
                </div>

                {/* Brand Logos */}
                <div className="px-3 py-2 bg-white border-b border-gray-100">
                  <div className="flex items-center justify-center gap-2">
                    {category.brands.map((brand, index) => (
                      <React.Fragment key={brand}>
                        <span className="text-xs font-semibold text-gray-700">{brand}</span>
                        {index < category.brands.length - 1 && (
                          <span className="text-xs text-gray-400">&</span>
                        )}
                      </React.Fragment>
                    ))}
                    {category.brands.length > 1 && (
                      <span className="text-xs text-gray-500 ml-1">More</span>
                    )}
                  </div>
                </div>
                {/* Category and Price Banner */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2.5">
                  <p className="text-white text-xs font-semibold mb-0.5 line-clamp-2">{category.name}</p>
                  <p className="text-white text-sm font-bold">{category.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuperSavers

