'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Shirt, Tag, User, Heart, X } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

function MobileBottomNav() {
  const pathname = usePathname()
  const { getTotalItems } = useCart()
  const { wishlistItems } = useWishlist()
  const cartCount = getTotalItems()
  const wishlistCount = wishlistItems.length
  const [showWardrobeModal, setShowWardrobeModal] = useState(false)

  // Pages where bottom nav should NOT be shown
  const excludedPaths = ['/new-arrivals', '/best-sellers', '/deals']
  if (excludedPaths.includes(pathname || '')) {
    return null
  }

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      href: '/',
      active: pathname === '/',
      isLink: true,
    },
    {
      name: 'Offers',
      icon: Tag,
      href: '/offers',
      active: pathname === '/offers',
      isLink: true,
    },
    {
      name: 'Wardrobe',
      icon: Shirt,
      href: '#',
      active: false,
      isLink: false,
    },
    {
      name: 'Wishlist',
      icon: Heart,
      href: '/wishlist',
      active: pathname === '/wishlist',
      isLink: true,
    },
    {
      name: 'Profile',
      icon: User,
      href: '/account',
      active: pathname === '/account',
      isLink: true,
    },
  ]

  // Calculate active tab index for sliding indicator (excluding wardrobe from calculation)
  const activeIndex = navItems.findIndex((item) => item.active && item.isLink)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 md:hidden shadow-sm">
        <div className="relative flex justify-around items-center py-2">
          {/* Sliding Active Indicator */}
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-yellow-500 rounded-t-full transition-all duration-250 ease-out"
            style={{
              width: `${98 / navItems.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {navItems.map((item, index) => {
            const IconComponent = item.icon
            const isWardrobe = item.name === 'Wardrobe'
            
            if (isWardrobe) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowWardrobeModal(true)}
                  className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 active:scale-95 text-yellow-600 bg-yellow-50/50 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-amber-700/20 rounded-xl blur-sm -z-10" />
                  <div className="relative transition-all duration-200 scale-100">
                    <IconComponent className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[10px] font-semibold transition-all duration-200">
                    {item.name}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                  item.active
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }`}
              >
                <div
                  className={`relative transition-all duration-200 ${
                    item.active ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <IconComponent className="w-5.5 h-5.5" />
                  {item.name === 'Wishlist' && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-all duration-200 ${
                    item.active ? 'font-semibold' : ''
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Wardrobe Coming Soon Modal */}
      {showWardrobeModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowWardrobeModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Wardrobe</h3>
              <button
                onClick={() => setShowWardrobeModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-4">
                <Shirt className="w-10 h-10 text-white" />
              </div>
              <p className="text-base font-semibold text-gray-900 mb-2">
                Your personal wardrobe is coming soon!
              </p>
              <p className="text-sm text-gray-600">
                We're working on something amazing. Stay tuned for updates.
              </p>
            </div>

            <button
              onClick={() => setShowWardrobeModal(false)}
              className="w-full mt-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileBottomNav

