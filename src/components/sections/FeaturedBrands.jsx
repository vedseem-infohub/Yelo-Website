'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Image from 'next/image'

const brands = [
  { 
    id: 1, 
    name: 'Fastrack x Bags', 
    logo: '👜', 
    offer: 'UP TO 70% OFF',
    tagline: 'Wear It Your Way',
    image: '/Featured-brand/6.jpg',
    color: 'bg-blue-50'
  },
  { 
    id: 2, 
    name: 'Voylla', 
    logo: '💎', 
    offer: 'UP TO 50% OFF',
    tagline: 'Handcrafted In Jaipur',
    image: '/Featured-brand/5.jpg',
    color: 'bg-pink-50'
  },
  { 
    id: 3, 
    name: 'Nike', 
    logo: '✓', 
    offer: 'UP TO 60% OFF',
    tagline: 'Just Do It',
    image: '/Featured-brand/4.jpg',
    color: 'bg-gray-100'
  },
  { 
    id: 4, 
    name: 'Adidas', 
    logo: '✓', 
    offer: 'UP TO 55% OFF',
    tagline: 'Impossible Is Nothing',
    image: '/Featured-brand/3.jpg',
    color: 'bg-gray-100'
  },
  { 
    id: 5, 
    name: 'Zara', 
    logo: '✓', 
    offer: 'UP TO 50% OFF',
    tagline: 'Fast Fashion',
    image: '/Featured-brand/2.jpg',
    color: 'bg-gray-100'
  },
  { 
    id: 6, 
    name: 'H&M', 
    logo: '✓', 
    offer: 'UP TO 40% OFF',
    tagline: 'Fashion & Quality',
    image: '/Featured-brand/1.jpg',
    color: 'bg-gray-100'
  },
]

function FeaturedBrands() {
  const scrollContainerRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.1 })

  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkScrollPosition()
      container.addEventListener('scroll', checkScrollPosition)
      return () => container.removeEventListener('scroll', checkScrollPosition)
    }
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <div 
      ref={sectionRef}
      className={`w-full bg-white py-10 md:py-14 scroll-reveal-left ${isRevealed ? 'revealed' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center mb-6 md:mb-8 px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight uppercase">Featured Brands</h2>
            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">AD</span>
          </div>
          <Link
            href="/brands"
            className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All <span className="text-base">→</span>
          </Link>
        </div>

        <div className="relative">
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 transition-all duration-200 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex-shrink-0 snap-center w-[280px]"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 transition-all duration-200 hover:shadow-lg active:scale-95 relative">
                  {/* Brand Image/Background */}
                  <div className={`${brand.color} h-[280px] flex items-center justify-center relative overflow-hidden`}>
                    <Image 
                      src={brand.image} 
                      alt={brand.name} 
                      fill
                      className="object-cover z-0"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    {/* Offer Text Overlay */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <p className="text-white text-xl font-bold mb-0.5">{brand.offer}</p>
                      <p className="text-white text-sm">{brand.tagline}</p>
                    </div>
                  </div>
                  {/* Brand Name Strip */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{brand.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 md:p-3 transition-all duration-200 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeaturedBrands

