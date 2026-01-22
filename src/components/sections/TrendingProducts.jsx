'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import ProductCard from '@/components/common/ProductCard'
import { productAPI } from '@/utils/api'
import { saveSectionData } from '@/utils/routePersistence'

function TrendingProducts() {
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.1 })
  const [trendingProducts, setTrendingProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch trending products from backend API
  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setIsLoading(true)
        const response = await productAPI.getTrending(24) // Fetch 24 trending products
        if (response && response.success && response.data) {
          // Sort by newest first (backend already sorts, but ensure it's correct)
          const sorted = response.data.sort((a, b) => {
            const dateA = new Date(a.dateAdded || a.createdAt || 0)
            const dateB = new Date(b.dateAdded || b.createdAt || 0)
            return dateB - dateA
          })
          const products = sorted.slice(0, 24)
          setTrendingProducts(products)
          // Save section data to localStorage
          saveSectionData('trending', products)
        } else {
          setTrendingProducts([])
        }
      } catch (error) {
        setTrendingProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingProducts()
  }, [])

  return (
    <div 
      id="trending"
      ref={sectionRef}
      className={`w-full bg-white py-12 md:py-16 scroll-reveal-right ${isRevealed ? 'revealed' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-1 md:px-8">
        <div className="flex justify-between items-center mb-8 md:mb-10 px-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 tracking-tight ">Trending Products</h2>
            <p className="text-gray-500 text-sm">Best sellers this week</p>
          </div>
          <Link
            href="/trending"
            className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center gap-1 transition-colors"
          >
            View All <span className="text-base">→</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-4">
            {[...Array(24)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-4">
            {trendingProducts.map((product, index) => (
              <ProductCard
                key={product._id || product.id || `trending-${index}`}
                product={product}
                tag="Trending"
                showAddToBag={true}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TrendingProducts

