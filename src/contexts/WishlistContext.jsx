'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

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
  const prevWishlistLengthRef = useRef(0)
  const lastActionRef = useRef({ type: null, product: null })
  const isInitialMountRef = useRef(true)
  const toastShownRef = useRef(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('yelo-wishlist')
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist)
        setWishlistItems(parsed)
        prevWishlistLengthRef.current = parsed.length
      }
    } catch (error) {
      console.error('Error loading wishlist:', error)
    }
    isInitialMountRef.current = false
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    try {
      localStorage.setItem('yelo-wishlist', JSON.stringify(wishlistItems))
    } catch (error) {
      console.error('Error saving wishlist:', error)
    }
  }, [wishlistItems])

  // Show toast when wishlist changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    const currentLength = wishlistItems.length
    const prevLength = prevWishlistLengthRef.current
    const action = lastActionRef.current

    if (!toastShownRef.current && action.type && action.product) {
      if (action.type === 'add' && currentLength > prevLength) {
        const productName = action.product.name || 'Item'
        toastShownRef.current = true
        toast.success(`${productName} added to wishlist!`, {
          icon: '❤️',
          duration: 2000,
        })
      } else if (action.type === 'add' && currentLength === prevLength) {
        // Item already exists
        toastShownRef.current = true
        toast.success('Already in wishlist!', {
          icon: '❤️',
          duration: 2000,
        })
      } else if (action.type === 'remove' && currentLength < prevLength) {
        const productName = action.product.name || 'Item'
        toastShownRef.current = true
        toast.success(`${productName} removed from wishlist`, {
          icon: '💔',
          duration: 2000,
        })
      }
      
      // Reset after a short delay
      if (toastShownRef.current) {
        setTimeout(() => {
          lastActionRef.current = { type: null, product: null }
          toastShownRef.current = false
        }, 100)
      }
    }
    
    prevWishlistLengthRef.current = currentLength
  }, [wishlistItems])

  const addToWishlist = (product) => {
    lastActionRef.current = { type: 'add', product }
    
    setWishlistItems((prev) => {
      const exists = prev.find((item) => item.id === product.id)
      if (exists) {
        return prev
      }
      return [...prev, product]
    })
  }

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === productId)
      if (itemToRemove) {
        lastActionRef.current = { type: 'remove', product: itemToRemove }
      }
      return prev.filter((item) => item.id !== productId)
    })
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId)
  }

  const clearWishlist = () => {
    setWishlistItems([])
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
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

