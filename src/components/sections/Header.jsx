'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, ShoppingBag, Menu, X, Search, Heart, User, ChevronDown, MapPin } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSearch } from '@/contexts/SearchContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useHeader } from '@/contexts/HeaderContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import LocationModal from '@/components/LocationModal'
import HeaderTabSlider from './HeaderTabSlider'
import HeaderContentRenderer from './HeaderContentRenderer'

function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { searchQuery, setSearchQuery, searchMode, addRecentSearch } = useSearch()
  const { getTotalItems: getCartTotal } = useCart()
  const { wishlistItems } = useWishlist()
  const { selectedTab, setSelectedTab, isHomePage } = useHeader()
  const { backendUser, setBackendUser } = useAuth()
  const { unreadCount } = useNotifications()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  
  // Get location from user's saved address or show "Select Location"
  const getLocationDisplay = () => {
    if (backendUser?.city && backendUser?.state) {
      return `${backendUser.city}, ${backendUser.state}`
    }
    return 'Select Location'
  }
  
  const location = getLocationDisplay()
  
  // Initialize state based on pathname to prevent hydration mismatch
  const getInitialPriceRange = () => {
    if (!pathname) return 'all'
    if (pathname === '/affordable') return 'affordable'
    if (pathname === '/luxury') return 'luxury'
    return 'all'
  }
  
  const getInitialShowTopSection = () => pathname === '/' || !pathname
  const getInitialHeaderHeight = () => (pathname === '/' || !pathname) ? 1 : 0
  
  const [showTopSection, setShowTopSection] = useState(getInitialShowTopSection)
  const [headerHeight, setHeaderHeight] = useState(getInitialHeaderHeight) // 0 to 1, represents collapse amount
  const [selectedPriceRange, setSelectedPriceRange] = useState(getInitialPriceRange)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const menuRef = useRef(null)
  const lastScrollY = useRef(0)
  const TOP_HEIGHT = 120

  // Shop pages that should have fade-in animation
  const shopPages = ['/wardrobe', '/category', '/shop']
  const isShopPage = shopPages.some(page => pathname?.startsWith(page) || pathname === page)

  // Detect theme based on pathname
  const isLuxuryPage = pathname === '/luxury' || pathname?.startsWith('/luxury/')
  const isAffordablePage = pathname === '/affordable'
  const isShopPageWithSidebar = isLuxuryPage || isAffordablePage

  // Set mounted flag after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle fade-in animation for shop pages
  useEffect(() => {
    if (isShopPage) {
      setIsHeaderVisible(false)
      // Fade in header synchronously with content (0.4s delay + 0.6s animation = 1s total)
      const timer = setTimeout(() => {
        setIsHeaderVisible(true)
      }, 400) // Match door-content-enter delay
      return () => clearTimeout(timer)
    } else {
      setIsHeaderVisible(true)
    }
  }, [pathname, isShopPage])

  // Update selected price range based on current pathname (only after mount to prevent hydration issues)
  useEffect(() => {
    if (!mounted) return
    if (pathname === '/affordable') {
      setSelectedPriceRange('affordable')
    } else if (pathname === '/luxury') {
      setSelectedPriceRange('luxury')
    } else {
      setSelectedPriceRange('all')
    }
  }, [pathname, mounted])

  // Scroll-based collapse for routed pages (non-home pages)
  useEffect(() => {
    if (!mounted) return
    
    if (pathname === '/') {
      // Home page uses existing scroll logic (handled below)
      return
    }

    // For routed pages: collapse top section on scroll
    let ticking = false
    const SCROLL_THRESHOLD = 50 // Pixels to scroll before hiding top section
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          if (currentScrollY > SCROLL_THRESHOLD) {
            setShowTopSection(false)
          } else {
            setShowTopSection(true)
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    // Check initial scroll position
    if (typeof window !== 'undefined') {
      const initialScrollY = window.scrollY
      setShowTopSection(initialScrollY <= SCROLL_THRESHOLD)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [pathname, mounted])

  // Show/hide top section based on route
  // Only show top section on home page ('/'), hide on all other routes
  const MAX_SCROLL = 120

  useEffect(() => {
    // Only run scroll handler on home page
    if (pathname !== '/') {
      return
    }

    const onScroll = () => {
      const progress = Math.min(window.scrollY / MAX_SCROLL, 1)
      setHeaderHeight(1 - progress)
    }
  
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])
  
  

  // Scroll detection - only for home page ('/')
  useEffect(() => {
    // Only enable scroll detection on home page and after mount
    if (pathname !== '/' || !mounted) {
      return
    }

    let ticking = false
    const maxScroll = 100 // Maximum scroll distance for full collapse
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Calculate collapse amount based on scroll (0 = fully expanded, 1 = fully collapsed)
          const collapseAmount = Math.min(currentScrollY / maxScroll, 1)
          setHeaderHeight(1 - collapseAmount) // Invert so 1 = expanded, 0 = collapsed
          
          // Show/hide top section based on scroll
          if (currentScrollY <= 5) {
            setShowTopSection(true)
          } else {
            setShowTopSection(false)
          }
          
          lastScrollY.current = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    // Check initial scroll position
    if (typeof window !== 'undefined') {
      const initialScrollY = window.scrollY
      const collapseAmount = Math.min(initialScrollY / maxScroll, 1)
      setHeaderHeight(1 - collapseAmount)
      
      if (initialScrollY <= 5) {
        setShowTopSection(true)
      } else {
        setShowTopSection(false)
      }
      lastScrollY.current = initialScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pathname, mounted])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleNavigation = (path) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  // Handle search based on mode
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const query = searchQuery.trim()
      if (!query) return

      if (searchMode === 'globalSearch') {
        // Global search - navigate to search results
        addRecentSearch(query)
        router.push(`/search?q=${encodeURIComponent(query)}`)
        setSearchQuery('')
      }
      // For scoped searches, the search is handled by the page itself
    }
  }

  // Handle search input focus/click - always redirect to search page
  const handleSearchFocus = () => {
      router.push('/search')
  }

  // Theme-based classes
  const headerBgClass = isLuxuryPage 
    ? 'bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95'
    : isAffordablePage
    ? 'bg-white'
    : 'bg-white'
  
  const headerBorderClass = isLuxuryPage
    ? 'border-yellow-500/10'
    : 'border-gray-100'
  
  const textColorClass = isLuxuryPage
    ? 'text-yellow-400/80'
    : 'text-gray-700'
  
  const hoverBgClass = isLuxuryPage
    ? 'hover:bg-white/5'
    : 'hover:bg-gray-50'
  
  const searchBarBgClass = isLuxuryPage
    ? 'bg-gray-800/50 border-gray-700/50 focus:bg-gray-800/80'
    : 'bg-gray-50 focus:bg-white'
  
  const searchBarBorderClass = isLuxuryPage
    ? 'border-gray-700/50 focus:border-yellow-500/50'
    : 'border-gray-200 focus:border-yellow-500'
  
  const navLinkActiveClass = isLuxuryPage
    ? 'text-yellow-400 bg-yellow-500/10'
    : 'text-yellow-600 bg-yellow-50'
  
  const navLinkInactiveClass = isLuxuryPage
    ? 'text-gray-300 hover:text-yellow-400 hover:bg-white/5'
    : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-50'

  return (
    <>
      {/* Mobile Header - Hidden on desktop (md and up) */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-50 ${headerBgClass} overflow-hidden transition-opacity ease-out ${
          isHeaderVisible ? 'opacity-100' : 'opacity-0'
        } ${isLuxuryPage ? 'backdrop-blur-xl' : ''}`}
        style={{
          transitionDuration: '600ms',
          transitionDelay: isShopPage ? '400ms' : '0ms'
        }}
      >
        {/* Top Collapsible Section (Row 1 & 2) - Collapses on scroll */}
        <div
          style={{
            height: pathname === '/' ? `${TOP_HEIGHT * headerHeight}px` : '0px',
            opacity: pathname === '/' ? headerHeight : 0,
            transition: 'height 0.15s linear, opacity 0.15s linear',
            overflow: 'hidden',
          }}
        >
          {/* Row 1: Top Information Section: Logo + Location */}
          <div className={`px-4 py-2.5 border-b ${headerBorderClass} flex items-center justify-between`}>
            {/* Logo - Left Corner */}
            <Link href="/" className="flex items-center group shrink-0">
              <div className="relative">
                <h1 className={`text-2xl font-extrabold bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm ${
                  isLuxuryPage ? 'opacity-90' : ''
                }`}>
                  YEAHLO
                </h1>
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </Link>
            
            {/* Location - Right Corner - Enhanced */}
            <button 
              onClick={() => setShowLocationModal(true)}
              suppressHydrationWarning={true}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${
                isLuxuryPage 
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-yellow-500/50' 
                  : 'bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300'
              } group`}
            >
              <MapPin className={`w-4 h-4 shrink-0 transition-colors ${
                isLuxuryPage 
                  ? 'text-yellow-400 group-hover:text-yellow-300' 
                  : 'text-yellow-600 group-hover:text-yellow-700'
              }`} />
              <span className={`text-xs font-semibold truncate max-w-[120px] ${
                isLuxuryPage 
                  ? 'text-gray-200 group-hover:text-yellow-400' 
                  : 'text-gray-700 group-hover:text-yellow-700'
              } transition-colors`}>
                {location}
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform group-hover:rotate-180 ${
                isLuxuryPage ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </button>
          </div>

          {/* Row 2: Price Range Buttons (Luxury & Affordable) */}
          <div className={`flex items-center gap-3 px-4 py-2 border-b ${headerBorderClass} ${
            isLuxuryPage 
              ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50' 
              : 'bg-gradient-to-r from-gray-50 to-white'
          }`}>
            <button
              suppressHydrationWarning={true}
              onClick={() => {
                setSelectedPriceRange('affordable')
                handleNavigation('/affordable')
              }}
              className={`flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-center shadow-sm ${
                selectedPriceRange === 'affordable'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                  : isLuxuryPage
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Affordable
            </button>
            <button
              suppressHydrationWarning={true}
              onClick={() => {
                setSelectedPriceRange('luxury')
                handleNavigation('/luxury')
              }}
              className={`flex-1 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-center shadow-sm ${
                selectedPriceRange === 'luxury'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                  : isLuxuryPage
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Luxury
            </button>
          </div>
        </div>

        {/* Row 3: Primary Header Row: Search (60%) + Icons (40%) - Always Visible */}
        <div className={`px-4 py-2.5 flex items-center gap-3`}>
          {/* Search Bar - 60% width */}
          <div className="relative flex-[0.6] min-w-0">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isLuxuryPage ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <input
              suppressHydrationWarning={true}
              type="text"
              placeholder="Search for products, brands and more"
              readOnly
              onClick={handleSearchFocus}
              onFocus={handleSearchFocus}
              className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${searchBarBorderClass} focus:outline-none text-sm ${searchBarBgClass} transition-all duration-200 cursor-pointer ${
                isLuxuryPage ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
          </div>

          {/* Icons Section - 40% width, evenly spaced */}
          <div className="flex-[0.4] flex items-center justify-around gap-2">
            {/* Profile Icon */}
            <Link 
              href="/account" 
              className={`relative p-2 rounded-full ${hoverBgClass} transition-all duration-200 active:scale-95 shrink-0`}
            >
              <User className={`w-5 h-5 ${textColorClass}`} />
            </Link>

            {/* Wishlist Icon with Badge */}
            <Link 
              href="/wishlist" 
              className={`relative p-2 rounded-full ${hoverBgClass} transition-all duration-200 active:scale-95 shrink-0`}
            >
              <Heart className={`w-5 h-5 ${textColorClass}`} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                  {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart Icon with Badge */}
            <Link 
              href="/cart" 
              className={`relative p-2 rounded-full ${hoverBgClass} transition-all duration-200 active:scale-95 shrink-0`}
            >
              <ShoppingBag className={`w-5 h-5 ${textColorClass}`} />
              {getCartTotal() > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                  {getCartTotal() > 99 ? '99+' : getCartTotal()}
                </span>
              )}
            </Link>

            {/* Notifications Icon with Badge */}
            <Link 
              href="/notifications" 
              className={`relative p-2 rounded-full ${hoverBgClass} transition-all duration-200 active:scale-95 shrink-0`}
            >
              <Bell className={`w-5 h-5 ${textColorClass}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

        </div>

          {/* Row 4: Header Tab Slider - Always Visible, Sticky on scroll */}
        <div className={`sticky top-0 z-40 bo bg-white ${isLuxuryPage ? 'bg-gray-900/95' : ''} transition-all duration-300`}>
          <div className={`px-3 py-1.5 md:px-6 md:py-3 ${isLuxuryPage ? 'bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95' : ''}`}>
            <HeaderTabSlider
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
              isLuxuryPage={isLuxuryPage}
              isHomePage={isHomePage}
            />
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile, visible on desktop (md and up) */}
      <div className={`hidden md:block ${headerBgClass} border-b ${headerBorderClass} ${isLuxuryPage ? 'backdrop-blur-xl' : 'shadow-lg'} sticky top-0 z-50 transition-opacity ease-out ${
        isHeaderVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transitionDuration: '600ms',
        transitionDelay: isShopPage ? '400ms' : '0ms'
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Top Collapsible Section (Row 1 & 2) - Collapses on scroll */}
          <div 
            className={`transition-all duration-200 ease-out overflow-hidden ${
              showTopSection 
                ? 'opacity-100' 
                : 'opacity-0'
            }`}
            style={{
              maxHeight: showTopSection ? `${120 * headerHeight}px` : '0px',
              opacity: showTopSection ? 1 : 0,
              willChange: 'max-height, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)',
              transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out',
            }}
          >
            {/* Row 1: Top Information Section: Logo + Location */}
            <div className={`flex items-center justify-between py-3 border-b ${headerBorderClass}`}>
              {/* Logo - Left Corner */}
              <Link href="/" className="flex items-center group shrink-0">
                <div className="relative">
                  <h1 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                    Yelo
                  </h1>
                  <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </Link>
              
              {/* Location - Right Corner - Enhanced */}
              <div className="flex items-center gap-3">
                {/* Search Icon Button */}
                <button
                  onClick={handleSearchFocus}
                  className={`p-2 rounded-full ${hoverBgClass} transition-all duration-200 active:scale-95 shrink-0`}
                >
                  <Search className={`w-5 h-5 ${textColorClass}`} />
                </button>
                
                {/* Location Button - Enhanced */}
                <button 
                  onClick={() => setShowLocationModal(true)}
                  suppressHydrationWarning={true}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                    isLuxuryPage 
                      ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-yellow-500/50' 
                      : 'bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300'
                  } group shadow-sm hover:shadow-md`}
                >
                  <MapPin className={`w-4 h-4 shrink-0 transition-colors ${
                    isLuxuryPage 
                      ? 'text-yellow-400 group-hover:text-yellow-300' 
                      : 'text-yellow-600 group-hover:text-yellow-700'
                  }`} />
                  <span className={`text-sm font-semibold truncate max-w-[150px] ${
                    isLuxuryPage 
                      ? 'text-gray-200 group-hover:text-yellow-400' 
                      : 'text-gray-700 group-hover:text-yellow-700'
                  } transition-colors`}>
                    {location}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:rotate-180 ${
                    isLuxuryPage ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </button>
              </div>
            </div>

            {/* Row 2: Price Range Buttons (Luxury & Affordable) */}
            <div className={`flex items-center gap-3 py-2 border-b ${headerBorderClass} ${
              isLuxuryPage 
                ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50' 
                : 'bg-gradient-to-r from-gray-50 to-white'
            }`}>
              <button
                suppressHydrationWarning={true}
                onClick={() => {
                  setSelectedPriceRange('affordable')
                  handleNavigation('/affordable')
                }}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm ${
                  selectedPriceRange === 'affordable'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                    : isLuxuryPage
                    ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700/50 hover:border-yellow-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-yellow-400'
                }`}
              >
                Affordable
              </button>
              <button
                suppressHydrationWarning={true}
                onClick={() => {
                  setSelectedPriceRange('luxury')
                  handleNavigation('/luxury')
                }}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm ${
                  selectedPriceRange === 'luxury'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg scale-105'
                    : isLuxuryPage
                    ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700/50 hover:border-yellow-500/50'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-yellow-400'
                }`}
              >
                Luxury
              </button>
            </div>
          </div>

          {/* Row 3: Primary Header Row: Search (60%) + Icons (40%) - Always Visible */}
          <div className={`flex items-center gap-6 py-3 border-b ${headerBorderClass}`}>
            {/* Search Bar - 60% width */}
            <div className="relative flex-[0.6] min-w-0">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isLuxuryPage ? 'text-gray-400 group-focus-within:text-yellow-500' : 'text-gray-400 group-focus-within:text-yellow-600'
              } transition-colors`} />
              <input
                suppressHydrationWarning={true}
                type="text"
                placeholder="Search for products, brands and more"
                readOnly
                onClick={handleSearchFocus}
                onFocus={handleSearchFocus}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${searchBarBorderClass} focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${searchBarBgClass} ${
                  isLuxuryPage ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900'
                }`}
              />
            </div>

            {/* Icons Section - 40% width, evenly spaced */}
            <div className="flex-[0.4] flex items-center justify-around gap-4">
              {/* Profile Icon */}
              <Link 
                href="/account" 
                className="relative cursor-pointer group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <User className={`w-6 h-6 ${textColorClass} ${isLuxuryPage ? 'group-hover:text-yellow-400' : 'group-hover:text-yellow-600'} transition-colors`} />
                <span className={`text-xs mt-1 font-medium ${
                  isLuxuryPage ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600 group-hover:text-yellow-600'
                } transition-colors`}>Profile</span>
              </Link>

              {/* Wishlist Icon with Badge */}
              <Link 
                href="/wishlist" 
                className="relative cursor-pointer group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Heart className={`w-6 h-6 ${textColorClass} ${isLuxuryPage ? 'group-hover:text-yellow-400' : 'group-hover:text-yellow-600'} transition-colors`} />
                <span className={`text-xs mt-1 font-medium ${
                  isLuxuryPage ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600 group-hover:text-yellow-600'
                } transition-colors`}>Wishlist</span>
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 right-0 min-w-[20px] h-[20px] flex items-center justify-center px-1 bg-red-500 text-white text-[11px] font-bold rounded-full border-2 border-white">
                    {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon with Badge */}
              <Link 
                href="/cart" 
                className="relative cursor-pointer group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <ShoppingBag className={`w-6 h-6 ${textColorClass} ${isLuxuryPage ? 'group-hover:text-yellow-400' : 'group-hover:text-yellow-600'} transition-colors`} />
                <span className={`text-xs mt-1 font-medium ${
                  isLuxuryPage ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600 group-hover:text-yellow-600'
                } transition-colors`}>Cart</span>
                {getCartTotal() > 0 && (
                  <span className="absolute -top-1 right-0 min-w-[20px] h-[20px] flex items-center justify-center px-1 bg-red-500 text-white text-[11px] font-bold rounded-full border-2 border-white">
                    {getCartTotal() > 99 ? '99+' : getCartTotal()}
                  </span>
                )}
              </Link>

              {/* Notifications Icon with Badge */}
              <Link 
                href="/notifications" 
                className="relative cursor-pointer group flex flex-col items-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Bell className={`w-6 h-6 ${textColorClass} ${isLuxuryPage ? 'group-hover:text-yellow-400' : 'group-hover:text-yellow-600'} transition-colors`} />
                <span className={`text-xs mt-1 font-medium ${
                  isLuxuryPage ? 'text-gray-300 group-hover:text-yellow-400' : 'text-gray-600 group-hover:text-yellow-600'
                } transition-colors`}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 right-0 min-w-[20px] h-[20px] flex items-center justify-center px-1 bg-red-500 text-white text-[11px] font-bold rounded-full border-2 border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>

          </div>

          {/* Row 4: Header Tab Slider - Always Visible, Sticky on scroll */}
          <div className={`sticky top-0 z-40 border-b ${headerBorderClass} ${headerBgClass} transition-all duration-300`}>
            <div className="flex items-center justify-between py-3">
              <HeaderTabSlider
                isLuxuryPage={isLuxuryPage}
              />
              <div className="ml-auto flex items-center gap-4">
                <button
                  onClick={() => handleNavigation('/login')}
                  className={`${isLuxuryPage ? 'text-gray-300 hover:text-yellow-400 hover:bg-white/5' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'} font-semibold transition-all duration-200 px-5 py-2.5 rounded-xl`}
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/register')}
                  className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold px-7 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        setIsOpen={setShowLocationModal}
        initialData={backendUser}
        onSave={(user) => {
          setBackendUser(user) // Update backendUser in AuthContext
        }}
      />
    </>
  )
}

export default Header