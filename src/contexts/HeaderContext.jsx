'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const HeaderContext = createContext({
  selectedTab: 'home',
  setSelectedTab: () => {},
  isHomePage: false,
})

export const useHeader = () => useContext(HeaderContext)

export function HeaderProvider({ children }) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  // Determine active tab based on pathname
  const getActiveTab = (currentPathname) => {
    if (!currentPathname || currentPathname === '/') return 'home'
    if (currentPathname.startsWith('/category') || currentPathname.startsWith('/shop')) return 'categories'
    if (currentPathname.startsWith('/trending')) return 'trending'
    if (currentPathname.startsWith('/brand')) return 'brands'
    return 'home'
  }
  
  const [selectedTab, setSelectedTab] = useState(() => {
    // Initialize based on current pathname
    return getActiveTab(pathname)
  })

  // Update active tab when pathname changes
  useEffect(() => {
    const activeTab = getActiveTab(pathname)
    setSelectedTab(activeTab)
  }, [pathname])

  return (
    <HeaderContext.Provider
      value={{
        selectedTab,
        setSelectedTab,
        isHomePage,
      }}
    >
      {children}
    </HeaderContext.Provider>
  )
}

