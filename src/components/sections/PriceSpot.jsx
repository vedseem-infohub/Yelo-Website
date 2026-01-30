'use client'

import React, { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'

const priceSpotCategories = [
  {
    id: 1,
    name: 'Sweatshirts',
    price: 'UNDER ₹799',
    image: '/image-the-price-spot/sweatshirt.jpg',
    href: '/price-spot/sweatshirt-under-799',
  },
  {
    id: 2,
    name: 'Tshirts',
    price: 'UNDER ₹299',
    image: '/image-the-price-spot/t-shirt.jpg',
    href: '/price-spot/tshirt-under-299',
  },
  {
    id: 3,
    name: 'Tracksuits',
    price: 'UNDER ₹899',
    image: '/image-the-price-spot/tracesuit.jpg',
    href: '/price-spot/tracksuit-under-899',
  },
  {
    id: 4,
    name: 'Sweaters',
    price: 'UNDER ₹599',
    image: '/image-the-price-spot/sweater.jpg',
    href: '/price-spot/sweater-under-599',
  },
  {
    id: 5,
    name: 'Kurta Sets',
    price: 'UNDER ₹599',
    image: '/image-the-price-spot/kurta-set.jpg',
    href: '/price-spot/kurta-set-under-599',
  },
  {
    id: 6,
    name: 'Face Wash and Cleanser',
    price: 'UNDER ₹199',
    image: '/image-the-price-spot/personal-care-1.jpg',
    href: '/price-spot/face-wash-under-199',
  },
]

function PriceSpot() {
  const scrollContainerRef = useRef(null)
  const bannerScrollRef = useRef(null)
  const [currentBanner, setCurrentBanner] = useState(0)

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      if (bannerScrollRef.current) {
        const container = bannerScrollRef.current
        const nextIndex = (currentBanner + 1) % 3
        setCurrentBanner(nextIndex)
        // Scroll to the next banner (each banner is full width + gap)
        const scrollAmount = nextIndex * (container.offsetWidth + 16) // 16px gap
        container.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [currentBanner])

  return (
    <div className="w-full bg-white py-6">
      {/* The Price Spot Banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 px-4 py-4 mb-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">The Price Spot</h2>
            <div className="bg-gray-800 opacity-0 rounded-lg px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors">
              <p className="text-white text-sm font-medium">Deals That Keep You Coming Back</p>
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
        </div>
      </div>

      {/* Scrollable Category Cards */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {priceSpotCategories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="flex-shrink-0 snap-center w-[160px]"
            >
              <div className="bg-white border-2 border-yellow-400 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md active:scale-95">
                {/* Product Image Area */}
                <div className="bg-gray-50 flex items-center justify-center">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={160}
                    height={160}
                    className="object-cover"
                  />
                </div>
                {/* Price Banner */}
                <div className="bg-orange-500 px-3 py-2.5 min-h-[60px] flex flex-col justify-center">
                  <p className="text-white text-xs font-semibold mb-0.5 truncate">{category.name}</p>
                  <p className="text-white text-sm font-bold">{category.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FLAT 50% OFF Banner - Scrollable Carousel */}
      <div className="px-4 mt-6">
        <div className="relative">
          <div
            ref={bannerScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollSnapType: 'x mandatory' }}
            onScroll={(e) => {
              const scrollLeft = e.target.scrollLeft
              const width = e.target.offsetWidth
              const newIndex = Math.round(scrollLeft / width)
              if (newIndex !== currentBanner) {
                setCurrentBanner(newIndex)
              }
            }}
          >
            {[
              {
                id: 1,
                title: 'FLAT 50% OFF',
                code: 'EORS50OFF',
                bg: 'from-purple-600 to-purple-700',
              },
              {
                id: 2,
                title: 'FLAT 40% OFF',
                code: 'SAVE40',
                bg: 'from-blue-600 to-blue-700',
              },
              {
                id: 3,
                title: 'FLAT 60% OFF',
                code: 'MEGA60',
                bg: 'from-pink-600 to-pink-700',
              },
            ].map((offer) => (
              <Link
                key={offer.id}
                href="/deals/flat-50-off"
                className="flex-shrink-0 snap-center w-full"
              >
                <div className={`bg-gradient-to-r ${offer.bg} rounded-xl p-6 relative overflow-hidden`}>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-white mb-4">{offer.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                        Shop Now
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      <div className="bg-yellow-400 px-4 py-2.5 rounded-lg">
                        <p className="text-gray-900 text-xs font-bold">USE CODE: {offer.code}</p>
                      </div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                </div>
              </Link>
            ))}
          </div>
          {/* Carousel Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[1, 2, 3].map((dot, index) => (
              <button
                suppressHydrationWarning={true}
                key={dot}
                onClick={() => {
                  setCurrentBanner(index)
                  if (bannerScrollRef.current) {
                    const container = bannerScrollRef.current
                    const scrollAmount = index * (container.offsetWidth + 16) // 16px gap
                    container.scrollTo({
                      left: scrollAmount,
                      behavior: 'smooth'
                    })
                  }
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentBanner ? 'bg-purple-600 w-4' : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceSpot

