'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import ProductCard from '@/components/common/ProductCard'
import { useProducts } from '@/contexts/ProductsContext'
import PageWrapper from '@/components/common/PageWrapper'

const deals = [
  {
    id: 1,
    title: 'FLAT 50% OFF',
    code: 'EORS50OFF',
    bg: 'from-purple-600 to-purple-700',
    discount: 50,
  },
  {
    id: 2,
    title: 'FLAT 40% OFF',
    code: 'SAVE40',
    bg: 'from-blue-600 to-blue-700',
    discount: 40,
  },
  {
    id: 3,
    title: 'FLAT 60% OFF',
    code: 'MEGA60',
    bg: 'from-pink-600 to-pink-700',
    discount: 60,
  },
]

export default function Flat50OffPage() {
  const router = useRouter()
  const { allProducts } = useProducts()

  // Get products with discounts
  const discountedProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        const discount = product.discount || 0
        const originalPrice = product.originalPrice || product.price || 0
        const currentPrice = product.price || 0
        const calculatedDiscount = originalPrice > currentPrice 
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : discount
        return calculatedDiscount >= 40
      })
      .slice(0, 24)
  }, [allProducts])

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-24 pt-32">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Special Deals</h1>
              <p className="text-xs text-gray-500">Exclusive offers for you</p>
            </div>
          </div>
        </div>

        {/* Scrollable Deal Banners */}
        <div className="px-4 py-6">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory mb-6">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className={`flex-shrink-0 snap-center w-full bg-gradient-to-r ${deal.bg} rounded-xl p-6 relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-4">{deal.title}</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
                      Shop Now
                      <ChevronRight className="w-4 h-4" />
                    </span>
                    <div className="bg-yellow-400 px-4 py-2.5 rounded-lg">
                      <p className="text-gray-900 text-xs font-bold">USE CODE: {deal.code}</p>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              </div>
            ))}
          </div>
          {/* Carousel Dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {deals.map((deal, index) => (
              <div
                key={deal.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === 0 ? 'bg-purple-600 w-4' : 'bg-gray-300 w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Discounted Products</h2>
          {discountedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No discounted products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discountedProducts.map((product, index) => (
                <ProductCard
                  key={product._id || product.id || `flat-50-${index}`}
                  product={product}
                  tag="Deal"
                  showAddToBag={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

