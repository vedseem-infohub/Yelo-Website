'use client'

import React from 'react'
import Categories from '@/components/sections/Categories'
import TrendingProducts from '@/components/sections/TrendingProducts'
import FeaturedBrands from '@/components/sections/FeaturedBrands'
import { motion, AnimatePresence } from 'framer-motion'

export default function HeaderContentRenderer({ selectedTab }) {
  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const renderContent = () => {
    switch (selectedTab) {
      case 'categories':
        return <Categories />
      case 'trending':
        return <TrendingProducts />
      case 'brands':
        return <FeaturedBrands />
      case 'home':
      default:
        return null // Home shows all content, handled by page.js
    }
  }

  const content = renderContent()
  
  if (!content) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedTab}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={contentVariants}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}

