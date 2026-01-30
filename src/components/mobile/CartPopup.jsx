'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

function CartPopup() {
  const { cartItems, getTotalItems } = useCart()
  const router = useRouter()
  const pathname = usePathname()

  const [isVisible, setIsVisible] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [popupWidth, setPopupWidth] = useState(200)
  const [newItemAdded, setNewItemAdded] = useState(false)
  const prevCartLengthRef = useRef(0)

  const totalItems = getTotalItems()

  const recentItems = useMemo(() => {
    const lastThree = cartItems.slice(-3)
    return lastThree.reverse() 
  }, [cartItems])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseWidth = 180 
      const imageWidth = 36 
      const calculatedWidth = baseWidth + (recentItems.length * imageWidth)
      const maxWidth = Math.min(calculatedWidth, window.innerWidth * 0.9)
      setPopupWidth(maxWidth)
    }
  }, [recentItems.length])

  useEffect(() => {
    if (cartItems.length > prevCartLengthRef.current) {
      setNewItemAdded(true)
      setTimeout(() => setNewItemAdded(false), 1000)
    }
    prevCartLengthRef.current = cartItems.length
  }, [cartItems.length])

  const getItemImage = (item) => {
    if (item.images && item.images[0]) {
      const firstImage = item.images[0]
      return typeof firstImage === 'string' ? firstImage : firstImage?.url
    }
    if (item.image) {
      return item.image
    }
    return null
  }


  const excludedPaths = [
    '/cart',
    '/wishlist',
    '/search',
    '/notifications',
    '/account',
    '/categories',
    '/wardrobe',
  ]

  const isProductDetailPage = pathname?.includes('/product/')

  const isExcludedPage =
    excludedPaths.includes(pathname || '') || isProductDetailPage


  useEffect(() => {
    const checkPanels = () => {
      const backdrops = document.querySelectorAll(
        '[class*="z-[70]"], [class*="z-70"]'
      )

      const hasOpenPanel =
        backdrops.length > 0 &&
        Array.from(backdrops).some(
          el =>
            el.classList.contains('fixed') ||
            el.classList.contains('bg-black')
        )

      const modals = document.querySelectorAll(
        '.fixed.inset-0[class*="z-50"], .fixed.inset-0[class*="z-[50]"]'
      )

      const hasOpenModal =
        modals.length > 0 &&
        Array.from(modals).some(
          el =>
            (el.classList.contains('bg-black') ||
             el.classList.contains('backdrop-blur') ||
             window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)')
        )

      setIsPanelOpen(hasOpenPanel || hasOpenModal)
    }

    checkPanels()

    const observer = new MutationObserver(checkPanels)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    const interval = setInterval(checkPanels, 100)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const show =
      totalItems > 0 &&
      !isExcludedPage &&
      !isPanelOpen

    setShouldShow(show)

    if (show) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [totalItems, isExcludedPage, isPanelOpen])

  if (!shouldShow) return null

  return (
    <div
      className={`
        fixed left-0 right-0 z-40
        flex justify-center
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
      style={{
        bottom: '5.5rem',
      }}
    >
      <button
        onClick={() => router.push('/cart')}
        className="
          bg-[#FFC907]
          border-2 border-white
          rounded-full
          px-2 py-2.5
          md:hidden
          flex items-center gap-3
          shadow-lg
          hover:shadow-xl
          active:scale-95
          transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          whitespace-nowrap
          overflow-hidden
        "
        style={{
          width: `${popupWidth}px`,
          maxWidth: '50%',
        }}
      >
        {recentItems.length > 0 && (
          <div className="flex items-center shrink-0" style={{ gap: recentItems.length > 1 ? '-8px' : '0' }}>
            {recentItems.map((item, index) => {
              const itemImage = getItemImage(item)
              const isNewest = index === 0 && newItemAdded 
              
              return (
                <div
                  key={`${item.id}-${item.size || ''}-${item.color || ''}-${index}`}
                  className={`
                    relative
                    w-9 h-9
                    rounded-full
                    overflow-hidden
                    border-2 border-white
                    bg-gray-100
                    shrink-0
                    ${index > 0 ? '-ml-4' : ''}
                  `}
                  style={{
                    animation: isNewest
                      ? `slideInFromRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0s`
                      : `fadeIn 0.3s ease-out ${index * 0.1}s`,
                    zIndex: recentItems.length - index, 
                  }}
                >
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={item.name || 'Cart item'}
                      className="w-full h-full object-cover"
                      loading="eager"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const parent = e.target.parentElement
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-100"><span class="text-sm">${item.emoji || '📦'}</span></div>`
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-sm">{item.emoji || '📦'}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-col items-start shrink-0">
          <span className="text-base font-semibold text-white leading-tight">
            View cart
          </span>
          
          <span className="text-sm font-semibold text-white leading-tight mt-[3px]">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <ChevronRight className="w-6 h-6 text-white shrink-0 ml-auto" />
      </button>
    </div>
  )
}

export default CartPopup
