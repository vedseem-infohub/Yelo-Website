'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/sections/Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Pages where header should NOT be shown
  const excludedPaths = ['/cart', '/account', '/wishlist', '/notifications', '/orders', '/addresses', '/payments', '/settings', '/login', '/register', '/checkout', '/search' ]
  
  // Check if current path should exclude header
  // Exclude product detail pages (paths starting with /product/)
  // Exclude search page (paths starting with /search)
  // Exclude order detail pages (paths starting with /orders/)
  // Handle null pathname (during SSR) by defaulting to show header
  const isProductDetailPage = pathname?.startsWith('/product/')
  const isSearchPage = pathname?.startsWith('/search')
  const isOrderDetailPage = pathname?.startsWith('/orders/') && pathname !== '/orders'
  const shouldShowHeader = pathname 
    ? (!excludedPaths.includes(pathname) && !isProductDetailPage && !isSearchPage && !isOrderDetailPage)
    : true // Default to showing header during SSR to prevent hydration mismatch
  
  if (!shouldShowHeader) {
    return null
  }
  
  return <Header />
}

