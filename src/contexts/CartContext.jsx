'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotalItems: () => 0,
  getTotalPrice: () => 0,
})

export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const prevCartLengthRef = useRef(0)
  const lastAddedProductRef = useRef(null)
  const isInitialMountRef = useRef(true)
  const toastShownRef = useRef(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('yelo-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        setCartItems(parsed)
        prevCartLengthRef.current = parsed.length
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
    isInitialMountRef.current = false
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    try {
      localStorage.setItem('yelo-cart', JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [cartItems])

  // Show toast when item is added
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    // If we have a product to show toast for and haven't shown it yet
    if (lastAddedProductRef.current && !toastShownRef.current) {
      const productName = lastAddedProductRef.current.name || 'Item'
      toastShownRef.current = true
      toast.success(`${productName} added to cart!`, {
        icon: '🛍️',
        duration: 2000,
      })
      
      // Reset after a short delay
      setTimeout(() => {
        lastAddedProductRef.current = null
        toastShownRef.current = false
      }, 100)
    }
  }, [cartItems])

  const addToCart = (product, options = {}) => {
    // Check if user has a name (required for orders)
    if (typeof window !== 'undefined') {
      const backendUser = localStorage.getItem('yelo_backend_user')
      if (backendUser) {
        try {
          const user = JSON.parse(backendUser)
          if (!user.name || !user.name.trim()) {
            // User doesn't have a name, but we won't block adding to cart
            // Name will be required at checkout
            // Just continue with adding to cart
          }
        } catch (e) {
          // Failed to parse user, continue
        }
      }
    }

    if (!options.silent && !toastShownRef.current) {
      lastAddedProductRef.current = product
      toastShownRef.current = false // Reset flag for new action
    }
    
    setCartItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.id === product.id &&
          item.size === (options.size || product.sizes?.[0] || 'M') &&
          item.color === (options.color || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'))
      )

      if (existingItem) {
        return prev.map((item) =>
          item.id === existingItem.id &&
          item.size === existingItem.size &&
          item.color === existingItem.color
            ? { ...item, quantity: item.quantity + (options.quantity || 1) }
            : item
        )
      }

      return [
        ...prev,
        {
          ...product,
          quantity: options.quantity || 1,
          size: options.size || product.sizes?.[0] || 'M',
          color: options.color || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'),
        },
      ]
    })
  }

  const removeFromCart = (itemId, size, color) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(item.id === itemId && item.size === size && item.color === color)
      )
    )
  }

  const updateQuantity = (itemId, size, color, change) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.size === size && item.color === color) {
          const newQuantity = item.quantity + change
          if (newQuantity <= 0) {
            return null
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(Boolean)
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

