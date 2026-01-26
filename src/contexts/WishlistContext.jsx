'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { wishlistAPI } from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'

const WishlistContext = createContext({
  wishlistItems: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
  clearWishlist: () => {},
})

export const useWishlist = () => useContext(WishlistContext)

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const lastActionRef = useRef({ type: null, product: null })
  const toastShownRef = useRef(false)
  const { backendUser } = useAuth() || {}

  // Helper to get consistent ID from product/item
  const getItemId = (item) => item?._id || item?.id || item?.productId?._id || item?.productId

  // Load wishlist from backend if user is logged in, otherwise from localStorage
  useEffect(() => {
    const loadWishlist = async () => {
      if (typeof window === 'undefined') return

      try {
        if (backendUser) {
          // Fetch from backend
          const response = await wishlistAPI.get()
          if (response.success && response.data) {
            // Backend returns a wishlist object with a 'products' array
            const backendData = response.data
            const items = Array.isArray(backendData.products) 
              ? backendData.products 
              : (Array.isArray(backendData) ? backendData : [])
              
            const standardized = items.map(item => ({
              ...item,
              id: getItemId(item)
            }))
            setWishlistItems(standardized)
          }
        } else {
          // Fetch from localStorage
          const savedWishlist = localStorage.getItem('yelo-wishlist')
          if (savedWishlist) {
            const parsed = JSON.parse(savedWishlist)
            const standardized = parsed.map(item => ({
              ...item,
              id: getItemId(item)
            }))
            setWishlistItems(standardized)
          }
        }
      } catch (error) {
        console.error('Error loading wishlist:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadWishlist()
  }, [backendUser])

  // Save to localStorage if not logged in
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || backendUser) return
    
    try {
      localStorage.setItem('yelo-wishlist', JSON.stringify(wishlistItems))
    } catch (error) {
      console.error('Error saving wishlist locally:', error)
    }
  }, [wishlistItems, isLoaded, backendUser])

  // Show toast when wishlist changes
  useEffect(() => {
    if (!isLoaded) return
    
    const action = lastActionRef.current

    if (!toastShownRef.current && action.type && action.product) {
      if (action.type === 'add') {
        const productName = action.product.name || 'Item'
        toastShownRef.current = true
        toast.success(`${productName} added to wishlist!`, {
          icon: '❤️',
        })
      } else if (action.type === 'remove') {
        const productName = action.product.name || 'Item'
        toastShownRef.current = true
        toast.success(`${productName} removed from wishlist`, {
          icon: '💔',
        })
      }
      
      if (toastShownRef.current) {
        setTimeout(() => {
          lastActionRef.current = { type: null, product: null }
          toastShownRef.current = false
        }, 100)
      }
    }
  }, [wishlistItems, isLoaded])

  const addToWishlist = async (product) => {
    const productId = getItemId(product)
    if (!productId) return

    lastActionRef.current = { type: 'add', product }
    
    // Optimistic update
    setWishlistItems((prev) => {
      const exists = prev.find((item) => getItemId(item) === productId)
      if (exists) return prev
      return [...prev, { ...product, id: productId }]
    })

    // Sync with backend if logged in
    if (backendUser) {
      try {
        await wishlistAPI.add(productId)
      } catch (error) {
        console.error('Error adding to wishlist backend:', error)
        // Revert on failure (optional, but good practice)
        // setWishlistItems(prev => prev.filter(item => getItemId(item) !== productId))
      }
    }
  }

  const removeFromWishlist = async (productId) => {
    // Optimistic update
    setWishlistItems((prev) => {
      const itemToRemove = prev.find((item) => getItemId(item) === productId)
      if (itemToRemove) {
        lastActionRef.current = { type: 'remove', product: itemToRemove }
      }
      return prev.filter((item) => getItemId(item) !== productId)
    })

    // Sync with backend if logged in
    if (backendUser) {
      try {
        await wishlistAPI.remove(productId)
      } catch (error) {
        console.error('Error removing from wishlist backend:', error)
      }
    }
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => getItemId(item) === productId)
  }

  const clearWishlist = () => {
    setWishlistItems([])
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        isLoaded,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

