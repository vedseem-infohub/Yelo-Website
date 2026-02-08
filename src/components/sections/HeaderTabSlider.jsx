'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Home', path: '/', id: 'home' },
  { name: 'Categories', path: '/categories', id: 'categories' },
  { name: 'Trending', path: '/trending', id: 'trending' },
  // { name: 'Brands', path: '/brands', id: 'brands' },
]

export default function HeaderTabSlider({ 
}) {
  const pathname = usePathname()
  const tabRefs = useRef({})
  const containerRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })
  const isLuxuryPage = pathname === '/luxury' || pathname?.startsWith('/luxury/')

  // Find active tab based on current route
  const getActiveTab = () => {
    // Always use pathname to determine active tab
    // Special handling: /category and /shop routes should activate 'categories' tab
    if (pathname?.startsWith('/category') || pathname?.startsWith('/shop')) {
      return tabs.find(t => t.id === 'categories') || tabs[0]
    }
    
    return tabs.find(t => {
      if (t.path === '/') {
        return pathname === '/'
      }
      return pathname === t.path || pathname?.startsWith(t.path)
    }) || tabs[0]
  }

  const activeTab = getActiveTab()

  // Update indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeRef = tabRefs.current[activeTab.id]
      if (activeRef && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const activeRect = activeRef.getBoundingClientRect()
        
        setIndicatorStyle({
          width: activeRect.width,
          left: activeRect.left - containerRect.left,
        })
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab.id, pathname])

  const navLinkActiveClass = isLuxuryPage
    ? 'text-yellow-400'
    : 'text-yellow-600'
  
  const navLinkInactiveClass = isLuxuryPage
    ? 'text-gray-300 hover:text-yellow-400'
    : 'text-gray-700 hover:text-yellow-600'

  // Always navigate - no need to prevent default

  return (
    <nav 
      ref={containerRef}
      className={`relative flex items-cente0r bg-transparent gap-1 md:gap-8 overflow-x-auto scrollbar-hide`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab.id === tab.id
        
        return (
          <Link
            key={tab.id}
            href={tab.path}
            ref={(el) => {
              if (el) tabRefs.current[tab.id] = el
            }}
            className={`
              relative px-5 py-2.5 md:px-1 md:py-2
              text-sm md:text-base font-semibold
              whitespace-nowrap
              transition-colors duration-200
              ${isActive ? navLinkActiveClass : navLinkInactiveClass}
              ${isLuxuryPage ? 'text-yellow-400 ' : ' v'}
            `}
          >
            {tab.name}
          </Link>
        )
      })}

      {/* Sliding Background Indicator */}
      <motion.div
        className={`
          absolute bottom-0 h-0.5 md:h-1
          ${isLuxuryPage ? 'bg-yellow-400' : 'bg-gradient-to-r from-yellow-500 to-amber-600'}
          rounded-full
        `}
        initial={false}
        animate={{
          width: indicatorStyle.width,
          left: indicatorStyle.left,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.25,
        }}
        style={{
          willChange: 'width, left',
        }}
      />
    </nav>
  )
}

