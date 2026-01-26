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
  const [isLoaded, setIsLoaded] = useState(false)
  const lastAddedProductRef = useRef(null)
  const toastShownRef = useRef(false)

  // Helper to get consistent ID from product/item
  const getItemId = (item) => item?._id || item?.id || item?.productId?._id || item?.productId

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedCart = localStorage.getItem('yelo-cart')
      if (savedCart) {
        const parsed = JSON.parse(savedCart)
        // Standardize IDs when loading
        const standardized = parsed.map(item => ({
          ...item,
          id: getItemId(item)
        }))
        setCartItems(standardized)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return
    
    try {
      localStorage.setItem('yelo-cart', JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [cartItems, isLoaded])

  // Show toast when item is added
  useEffect(() => {
    if (!isLoaded) return
    
    // If we have a product to show toast for and haven't shown it yet
    if (lastAddedProductRef.current && !toastShownRef.current) {
      const productName = lastAddedProductRef.current.name || 'Item'
      toastShownRef.current = true
      toast.success(`${productName} added to cart!`, {
        icon: '🛍️',
      })
      
      // Reset after a short delay
      setTimeout(() => {
        lastAddedProductRef.current = null
        toastShownRef.current = false
      }, 100)
    }
  }, [cartItems, isLoaded])

  const addToCart = (product, options = {}) => {
    const productId = getItemId(product)
    
    if (!productId) {
      console.error('Product missing ID:', product)
      return
    }

    if (!options.silent && !toastShownRef.current) {
      lastAddedProductRef.current = product
      toastShownRef.current = false // Reset flag for new action
    }
    
    setCartItems((prev) => {
      const existingItem = prev.find(
        (item) =>
          getItemId(item) === productId &&
          item.size === (options.size || product.sizes?.[0] || 'M') &&
          item.color === (options.color || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'))
      )

      if (existingItem) {
        return prev.map((item) =>
          getItemId(item) === productId &&
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
          id: productId, // Ensure it has a standardized ID
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
          !(getItemId(item) === itemId && item.size === size && item.color === color)
      )
    )
  }

  const updateQuantity = (itemId, size, color, change) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (getItemId(item) === itemId && item.size === size && item.color === color) {
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
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoaded,
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

