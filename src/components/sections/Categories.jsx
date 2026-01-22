'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCategories } from '@/contexts/CategoriesContext'
import Image from 'next/image'

// Categories will be fetched from backend only

function Categories() {
  const router = useRouter()
  const { categories: backendCategories, isLoading } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.1 })

  // Use backend categories only
  const categories = React.useMemo(() => {
    if (backendCategories && backendCategories.length > 0) {
      return backendCategories.map((cat, index) => ({
        id: index + 1,
        name: cat.name,
        slug: cat.slug,
        image: cat.image?.url || cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
      }))
    }
    return []
  }, [backendCategories])

  const handleCategoryClick = (e, category) => {
    e.preventDefault()
    setSelectedCategory(category.id)
    
    // Simple scale animation
    const categoryElement = e.currentTarget
    categoryElement.style.transform = 'scale(0.95)'
    categoryElement.style.opacity = '0.7'
    
    setTimeout(() => {
      router.push(`/category/${category.slug}`)
    }, 200)
  }

  return (
    <div 
      ref={sectionRef}
      id="categories" 
      className={`w-full bg-white px-4 py-6 md:py-8 scroll-reveal ${isRevealed ? 'revealed' : ''}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Categories Horizontal Scrollable - Modern Image-Based Design */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleCategoryClick(e, category)
                }}
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 shrink-0 snap-center min-w-[100px] md:min-w-[120px] ${
                  isSelected ? 'scale-95 opacity-50' : ''
                }`}
              >
                {/* Image Container with Gradient Overlay */}
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-active:scale-95 shadow-md ring-2 ring-transparent group-hover:ring-yellow-400">
                  <img
                    src={category.image}
                    alt={category.name}
                    width={100}
                    height={100}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 96px, 112px"
                    loading="lazy"
                  />
                  {/* Gradient Overlay for Better Text Readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
                {/* Category Name - Single Line with Ellipsis */}
                <span className="text-xs md:text-sm font-semibold text-gray-900 text-center leading-tight w-full truncate px-1 group-hover:text-yellow-600 transition-colors duration-200">
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Categories

