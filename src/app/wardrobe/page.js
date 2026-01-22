'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import { wardrobeCategories } from '@/utils/categorySubcategories'
import { 
  Dumbbell,
  Briefcase,
  Shirt,
  PartyPopper,
  Sparkles,
  Snowflake
} from 'lucide-react'

const wardrobeCategoryData = [
  { slug: 'gym-wear', name: "Gym Wear", icon: Dumbbell, emoji: '🏋️' },
  { slug: 'office-wear', name: "Office Wear", icon: Briefcase, emoji: '👔' },
  { slug: 'casual-wear', name: "Casual Wear", icon: Shirt, emoji: '👕' },
  { slug: 'party-wear', name: "Party Wear", icon: PartyPopper, emoji: '🎉' },
  { slug: 'ethnic-wear', name: "Ethnic Wear", icon: Sparkles, emoji: '👗' },
  { slug: 'winter-wear', name: "Winter Wear", icon: Snowflake, emoji: '🧥' },
]

export default function WardrobePage() {
  const router = useRouter()
  const [isDoorOpen, setIsDoorOpen] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('gym-wear')
  const sidebarRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    // Open door on mount
    setIsDoorOpen(true)
    
    // Show content after door animation
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Get subcategories for selected category
  const subcategories = wardrobeCategories[selectedCategory] || []

  // Scroll selected category into view
  useEffect(() => {
    if (selectedRef.current && sidebarRef.current) {
      const sidebar = sidebarRef.current
      const selected = selectedRef.current
      const sidebarRect = sidebar.getBoundingClientRect()
      const selectedRect = selected.getBoundingClientRect()
      
      const scrollTop = sidebar.scrollTop
      const selectedTop = selected.offsetTop
      const selectedHeight = selected.offsetHeight
      const sidebarHeight = sidebar.clientHeight
      
      // Center the selected item
      const targetScroll = selectedTop - (sidebarHeight / 2) + (selectedHeight / 2)
      
      sidebar.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      })
    }
  }, [selectedCategory])

  const handleSubcategoryClick = (subcategory) => {
    // Navigate to shop page for this subcategory
    router.push(`/shop/${subcategory.slug}`)
  }

  return (
    <div className="min-h-screen bg-white md:hidden relative overflow-hidden">
      {/* Door Animation Overlay */}
      {!showContent && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Left Door */}
          <div
            className={`w-1/2 h-full bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-900 shadow-2xl ${
              isDoorOpen ? 'door-open-left' : ''
            }`}
            style={{
              borderRight: '2px solid rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Door Handle Left */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-12 bg-yellow-700 rounded-full shadow-lg" />
            
            {/* Door Decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-yellow-600/30 rounded-full" />
            </div>
          </div>

          {/* Right Door */}
          <div
            className={`w-1/2 h-full bg-gradient-to-bl from-amber-800 via-yellow-900 to-amber-900 shadow-2xl ${
              isDoorOpen ? 'door-open-right' : ''
            }`}
            style={{
              borderLeft: '2px solid rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Door Handle Right */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-12 bg-yellow-700 rounded-full shadow-lg" />
            
            {/* Door Decoration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-yellow-600/30 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Content - Categories Layout */}
      {showContent && (
        <div className="door-content-enter">
          <div className="bg-white">
            <div className="flex" style={{ minHeight: 'calc(100vh - 110px)', marginTop: '110px' }}>
              {/* Left Sidebar - Wardrobe Categories */}
              <div
                ref={sidebarRef}
                className="w-20 fixed left-0 bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide z-20"
                style={{
                  top: '10px', // Account for main header (search bar + nav links)
                  bottom: '80px', // Account for bottom nav
                  paddingTop: '10px',
                  paddingBottom: '10px',
                }}
              >
                <div className="py-4 space-y-2">
                  {wardrobeCategoryData.map((category) => {
                    const isSelected = selectedCategory === category.slug
                    const IconComponent = category.icon
                    
                    return (
                      <button
                        key={category.slug}
                        ref={isSelected ? selectedRef : null}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`w-full flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                          isSelected
                            ? 'bg-yellow-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                          isSelected ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <span className="text-2xl">{category.emoji}</span>
                        </div>
                        <span className={`text-xs font-medium text-center leading-tight ${
                          isSelected ? 'text-white' : 'text-gray-700'
                        }`}>
                          {category.name.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Content Area - Subcategories */}
              <div className="flex-1 ml-20 overflow-y-auto pt-4" style={{ paddingBottom: '80px' }}>
                <div className="px-4 mt-[10px]">
                  {/* Category Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {wardrobeCategoryData.find(c => c.slug === selectedCategory)?.name}
                  </h2>

                  {/* Subcategories Grid */}
                  {subcategories.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {subcategories.map((subcategory) => (
                        <div
                          key={subcategory.slug}
                          onClick={() => handleSubcategoryClick(subcategory)}
                          className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-[0.98] flex flex-col items-center text-center"
                        >
                          {/* Subcategory Icon/Image */}
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                            {subcategory.image ? (
                              <img
                                src={subcategory.image}
                                alt={subcategory.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-3xl">{subcategory.icon}</span>
                            )}
                          </div>
                          
                          {/* Subcategory Name */}
                          <h4 className="text-sm font-medium text-gray-900 leading-tight">
                            {subcategory.name}
                          </h4>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-gray-500 text-center">No subcategories available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CartPopup />
          <MobileBottomNav />
        </div>
      )}
    </div>
  )
}
