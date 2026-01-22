'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'
import { useProducts } from '@/contexts/ProductsContext'
import { useCategories } from '@/contexts/CategoriesContext'
import { 
  Shirt, 
  Laptop, 
  Home, 
  Sparkles, 
  Dumbbell, 
  BookOpen, 
  Baby,
  Sofa,
  Flame
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
}

// Fallback category data (used if backend categories not available)

export default function CategoriesPage() {
  const router = useRouter()
  const { categoryNames } = useProducts()
  const { categories, isLoading: categoriesLoading, fetchCategorySubcategories, refreshCategories } = useCategories()
  
  // Refresh categories periodically to ensure fresh data (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!categoriesLoading) {
        refreshCategories()
      }
    }, 2 * 60 * 1000) // 2 minutes
    
    return () => clearInterval(interval)
  }, [categoriesLoading, refreshCategories])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
  const sidebarRef = useRef(null)
  const selectedRef = useRef(null)
  
  
  // Show loading state only if we have no data at all and still loading
  const showLoading = categoriesLoading && (!categories || categories.length === 0)

  // Get categories from backend or use fallback
  const categoryData = useMemo(() => {
    // Always show "All" first
    const baseCategories = [{ slug: 'all', name: "All", icon: Shirt, emoji: '🛍️' }]
    
    // If we have categories, add them - NO FILTERING, display ALL
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Map backend categories to frontend format - NO filtering, NO duplicate handling
      const mappedCategories = categories
        .filter(cat => cat && cat.slug) // Only filter out completely invalid entries
        .map(cat => ({
          slug: cat.slug,
          name: cat.name,
          icon: categoryIcons[cat.slug] || Shirt,
          emoji: '🛍️',
          image: cat.image // Preserve image for display
        }))
      
      return [...baseCategories, ...mappedCategories]
    }
    
    // Return at least "All" category
    return baseCategories
  }, [categories])

  // Debug logging (remove in production) - moved after categoryData declaration
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const mensWear = categories?.find(c => {
        const slug = c.slug?.toLowerCase().replace(/'/g, '')
        return slug === 'mens-wear'
      })
      const womensWear = categories?.find(c => {
        const slug = c.slug?.toLowerCase().replace(/'/g, '')
        return slug === 'womens-wear'
      })
      
    }
  }, [categories, categoriesLoading, categoryData, selectedCategory])

  // State for subcategories
  const [subcategories, setSubcategories] = useState([])

  // Fetch subcategories when category is selected
  useEffect(() => {
    if (selectedCategory === 'all' || !categories || categories.length === 0) {
      setSubcategories([])
      return
    }

    // Find category by slug
    const category = categories.find(cat => {
      if (!cat || !cat.slug) return false
      if (cat.slug === selectedCategory) return true
      // Handle apostrophe variations
      if ((cat.slug === "men's-wear" && selectedCategory === 'mens-wear') ||
          (cat.slug === 'mens-wear' && selectedCategory === "men's-wear") ||
          (cat.slug === "women's-wear" && selectedCategory === 'womens-wear') ||
          (cat.slug === 'womens-wear' && selectedCategory === "women's-wear")) {
        return true
      }
      return cat.slug === selectedCategory.replace(/-/g, ' ') ||
             cat.slug === selectedCategory.replace(/\s+/g, '-')
    })

    // If category already has subcategories loaded, use them
    if (category && category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
      const filtered = category.subcategories
        .filter(sub => sub && (sub.isActive !== false))
        .map(sub => ({
          name: sub.name || 'Unknown',
          slug: sub.slug || '',
          icon: '👕',
          image: sub.image || null
        }))
      setSubcategories(filtered)
      return
    }

    // Otherwise, fetch subcategories
    if (category && fetchCategorySubcategories) {
      setSubcategoriesLoading(true)
      fetchCategorySubcategories(category.slug)
        .then(subs => {
          const filtered = (subs || [])
            .filter(sub => sub && (sub.isActive !== false))
            .map(sub => ({
              name: sub.name || 'Unknown',
              slug: sub.slug || '',
              icon: '👕',
              image: sub.image || null
            }))
          setSubcategories(filtered)
        })
        .catch(err => {
          setSubcategories([])
        })
        .finally(() => {
          setSubcategoriesLoading(false)
        })
    } else {
      setSubcategories([])
    }
  }, [selectedCategory, categories, fetchCategorySubcategories])

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
    // Navigate to category/subcategory page
    router.push(`/category/${selectedCategory}/${subcategory.slug}`)
  }

  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white pb-24 md:pb-8 mt-12">
        {/* Page Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-gray-900">Categories</h1>
            <div className="flex items-center gap-3">
              <Link href="/wishlist" className="p-2">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
              <Link href="/cart" className="p-2">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-60px)] md:h-screen">
          {/* Left Sidebar - Categories */}
          <div
            ref={sidebarRef}
            className="w-20 md:w-24 fixed left-0 top-[60px] md:top-0 bottom-0 bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide z-20"
            style={{
              paddingTop: '60px',
              paddingBottom: '80px',
            }}
          >
            <div className="py-4 space-y-2">
              {categoryData.map((category) => {
                const isSelected = selectedCategory === category.slug
                const IconComponent = category.icon
                
                return (
                  <motion.button
                    key={category.slug}
                    ref={isSelected ? selectedRef : null}
                    onClick={() => setSelectedCategory(category.slug)}
                    whileHover={!isSelected ? { scale: 1.05 } : {}}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-full flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-250 overflow-hidden ${
                      isSelected
                        ? 'text-gray-900'
                        : 'text-gray-600'
                    }`}
                    suppressHydrationWarning
                  >
                    {/* Selected State - Gradient Background with Glow */}
                    {isSelected && (
                      <>
                        <motion.div
                          initial={false}
                          className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-50 rounded-xl"
                          layoutId="selectedCategoryBg"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                        {/* Left Border Indicator - Stays within bounds */}
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full shadow-sm" />
                        {/* Subtle ring effect */}
                        <div className="absolute inset-0 border-2 border-yellow-400/40 rounded-xl" />
                        {/* Inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 to-transparent rounded-xl" />
                      </>
                    )}
                    
                    {/* Unselected State - Soft Background */}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-gray-50/50 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-250" />
                    )}
                    
                    {/* Content */}
                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all duration-250 overflow-hidden ${
                      isSelected 
                        ? 'bg-gradient-to-br from-yellow-400/30 to-amber-500/20 shadow-inner scale-105 border border-yellow-300/30' 
                        : 'bg-gray-100/80'
                    }`}>
                      {(() => {
                        // Check both category.image (from mapped data) and categories array
                        const categoryData = categories?.find(c => c.slug === category.slug)
                        const imageUrl = category.image || categoryData?.image
                        if (imageUrl) {
                          return (
                            <img
                              src={imageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'block'
                                }
                              }}
                            />
                          )
                        }
                        return null
                      })()}
                      <motion.span 
                        className={`text-2xl ${(() => {
                          const categoryData = categories?.find(c => c.slug === category.slug)
                          const hasImage = category.image || categoryData?.image
                          return hasImage ? 'hidden' : ''
                        })()}`}
                        animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {category.emoji}
                      </motion.span>
                    </div>
                    <span className={`relative z-10 text-xs font-medium text-center leading-tight transition-all duration-250 ${
                      isSelected 
                        ? 'text-gray-900 font-semibold' 
                        : 'text-gray-700'
                    }`}>
                      {category.name.split(' ')[0]}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Right Content Area - Subcategories */}
          <div className="flex-1 ml-20 md:ml-24 overflow-y-auto pt-4 pb-24">
            <div className="px-2 md:px-6">
              {/* Category Title */}
              <motion.h2 
                key={selectedCategory}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 relative inline-block"
              >
                {categoryData.find(c => c.slug === selectedCategory)?.name}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 origin-left"
                />
              </motion.h2>

              {/* Subcategories Grid */}
              {showLoading || subcategoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
              ) : (
              <AnimatePresence mode="wait">
                {selectedCategory === 'all' ? (
                  <motion.div
                    key="all-categories"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                  >
                    {categoryData.filter(c => c.slug !== 'all').length > 0 ? (
                      categoryData.filter(c => c.slug !== 'all').map((category, index) => (
                        <motion.div
                          key={category.slug}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          onClick={() => setSelectedCategory(category.slug)}
                          whileHover={{ y: -4, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer flex flex-col items-center text-center transition-shadow duration-300 hover:shadow-xl hover:border-yellow-300"
                        >
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-3 shadow-sm overflow-hidden">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'block'
                                }}
                              />
                            ) : null}
                            <span className={`text-4xl ${category.image ? 'hidden' : ''}`}>{category.emoji}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                            {category.name}
                          </h4>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-12">
                        <p className="text-gray-500 text-center mb-2">No categories available</p>
                        {process.env.NODE_ENV === 'development' && (
                          <div className="text-xs text-gray-400 text-center space-y-1 mt-2">
                            <p>Categories loaded: {categories?.length || 0}</p>
                            <p>Loading: {categoriesLoading ? 'Yes' : 'No'}</p>
                            <p>Category data count: {categoryData.length}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : subcategories.length > 0 ? (
                  <motion.div
                    key={`subcategories-${selectedCategory}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {subcategories.map((subcategory, index) => (
                      <motion.div
                        key={subcategory.slug}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => handleSubcategoryClick(subcategory)}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer flex flex-col items-center text-center transition-shadow duration-300 hover:shadow-xl hover:border-yellow-300"
                      >
                        {/* Subcategory Icon/Image */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-3 overflow-hidden shadow-sm">
                          {subcategory.image ? (
                            <img
                              src={subcategory.image}
                              alt={subcategory.name}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                          ) : null}
                          <span className={`text-3xl ${subcategory.image ? 'hidden' : ''}`}>{subcategory.icon || '📦'}</span>
                        </div>
                        
                        {/* Subcategory Name */}
                        <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                          {subcategory.name}
                        </h4>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <p className="text-gray-500 text-center mb-2">No subcategories available</p>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-400 text-center space-y-1">
                        <p>Selected: {selectedCategory}</p>
                        <p>Categories loaded: {categories?.length || 0}</p>
                        <p>Loading: {categoriesLoading ? 'Yes' : 'No'}</p>
                        {(() => {
                          const cat = categories?.find(c => c.slug === selectedCategory)
                          return cat ? (
                            <p>Found category: {cat.name} | Subcategories: {cat.subcategories?.length || 0}</p>
                          ) : (
                            <p>Category not found in backend data</p>
                          )
                        })()}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        <CartPopup />
        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}
