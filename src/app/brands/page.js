'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PageWrapper from '@/components/common/PageWrapper'

const featuredBrands = [
  { 
    id: 1, 
    name: 'Fastrack x Bags', 
    offer: 'UP TO 70% OFF',
    tagline: 'Wear It Your Way',
    slug: 'fastrack',
  },
  { 
    id: 2, 
    name: 'Voylla', 
    offer: 'UP TO 50% OFF',
    tagline: 'Handcrafted In Jaipur',
    slug: 'voylla',
  },
  { 
    id: 3, 
    name: 'Nike', 
    offer: 'UP TO 60% OFF',
    tagline: 'Just Do It',
    slug: 'nike',
  },
  { 
    id: 4, 
    name: 'Adidas', 
    offer: 'UP TO 55% OFF',
    tagline: 'Impossible Is Nothing',
    slug: 'adidas',
  },
  { 
    id: 5, 
    name: 'Zara', 
    offer: 'UP TO 50% OFF',
    tagline: 'Fast Fashion',
    slug: 'zara',
  },
  { 
    id: 6, 
    name: 'H&M', 
    offer: 'UP TO 40% OFF',
    tagline: 'Fashion & Quality',
    slug: 'hm',
  },
]

export default function BrandsPage() {
  const router = useRouter()

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-20 md:pb-8 mt-12">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 uppercase">Featured Brands</h1>
              <p className="text-xs text-gray-500">Shop from top brands</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 gap-4 mb-8">
            {featuredBrands.map((brand) => {
              return (
                <div
                  key={brand.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200"
                >
                  {/* Brand Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{brand.name}</h3>
                        <p className="text-sm text-gray-600 mb-1 truncate">{brand.tagline}</p>
                        <p className="text-base font-bold text-yellow-600">{brand.offer}</p>
                      </div>
                      <button
                        onClick={() => router.push(`/brand/${brand.slug}`)}
                        className="text-yellow-600 text-sm font-medium px-4 py-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                      >
                        View Products
                      </button>
                    </div>
                  </div>
                  
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </PageWrapper>
  )
}
