'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useProducts } from '@/contexts/ProductsContext'
import { 
  Shirt, 
  Laptop, 
  Home, 
  Sparkles, 
  Dumbbell, 
  BookOpen, 
  Baby,
  Sofa
} from 'lucide-react'

const categoryIcons = {
  fashion: Shirt,
  electronics: Laptop,
  appliances: Home,
  beauty: Sparkles,
  sports: Dumbbell,
  books: BookOpen,
  toys: Baby,
  fur: Sofa,
  shirts: Shirt,
  dresses: Shirt,
  jeans: Shirt,
  shoes: Shirt,
  accessories: Sparkles,
  bags: Shirt,
  jewelry: Sparkles,
  ethnicwear: Shirt,
}

function MobileCategoryBar({ selectedCategory, onCategorySelect, products }) {
  const { categoryNames } = useProducts()
  const [categories, setCategories] = useState([])
  const scrollContainerRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    // Get unique categories from products
    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]
    const categoryList = uniqueCategories.map(slug => ({
      slug,
      name: categoryNames[slug] || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      icon: categoryIcons[slug] || Shirt,
    }))
    setCategories(categoryList)
  }, [products, categoryNames])

  // Scroll selected category into view
  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selected = selectedRef.current
      const containerRect = container.getBoundingClientRect()
      const selectedRect = selected.getBoundingClientRect()
      
      const scrollTop = container.scrollTop
      const selectedTop = selected.offsetTop
      const containerHeight = container.clientHeight
      const selectedHeight = selected.clientHeight
      
      // Center the selected item
      const targetScroll = selectedTop - (containerHeight / 2) + (selectedHeight / 2)
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      })
    }
  }, [selectedCategory])

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed left-0 top-0 bottom-16 w-20 bg-white border-r border-gray-200 z-40 overflow-y-auto scrollbar-hide"
      style={{ 
        height: 'calc(100vh - 4rem)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div className="flex flex-col py-2">
        {categories.map((category) => {
          const IconComponent = category.icon
          const isSelected = selectedCategory === category.slug
          
          return (
            <button
              key={category.slug}
              ref={isSelected ? selectedRef : null}
              onClick={() => onCategorySelect(category.slug)}
              className={`
                flex flex-col items-center justify-center gap-1 py-3 px-2 
                transition-all duration-200 relative
                ${isSelected 
                  ? 'bg-yellow-50 text-yellow-600' 
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r-full" />
              )}
              
              <div className={`
                p-2 rounded-lg transition-all duration-200
                ${isSelected ? 'bg-yellow-100' : 'bg-gray-100'}
              `}>
                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-yellow-600' : 'text-gray-600'}`} />
              </div>
              
              <span className={`
                text-[10px] font-medium text-center leading-tight px-1
                ${isSelected ? 'text-yellow-600 font-semibold' : 'text-gray-600'}
              `}>
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MobileCategoryBar

