'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const WardrobeContext = createContext({
  savedItems: [],
  savedLooks: [],
  purchasedItems: [],
  addToWardrobe: () => {},
  removeFromWardrobe: () => {},
  isInWardrobe: () => false,
  addLook: () => {},
  removeLook: () => {},
  updateLook: () => {},
  addPurchasedItem: () => {},
  getPurchasedItemsByCategory: () => [],
})

export const useWardrobe = () => useContext(WardrobeContext)

export function WardrobeProvider({ children }) {
  const [savedItems, setSavedItems] = useState([])
  const [savedLooks, setSavedLooks] = useState([])
  const [purchasedItems, setPurchasedItems] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Helper to get consistent ID from product/item
  const getItemId = (item) => item?._id || item?.id

  // Load wardrobe from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedWardrobe = localStorage.getItem('yelo-wardrobe-items')
      if (savedWardrobe) {
        setSavedItems(JSON.parse(savedWardrobe))
      }

      const savedLooksData = localStorage.getItem('yelo-wardrobe-looks')
      if (savedLooksData) {
        setSavedLooks(JSON.parse(savedLooksData))
      }

      const savedPurchased = localStorage.getItem('yelo-purchased-items')
      if (savedPurchased) {
        setPurchasedItems(JSON.parse(savedPurchased))
      }
    } catch (error) {
      console.error('Error loading wardrobe data:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return
    localStorage.setItem('yelo-wardrobe-items', JSON.stringify(savedItems))
  }, [savedItems, isLoaded])

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return
    localStorage.setItem('yelo-wardrobe-looks', JSON.stringify(savedLooks))
  }, [savedLooks, isLoaded])

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return
    localStorage.setItem('yelo-purchased-items', JSON.stringify(purchasedItems))
  }, [purchasedItems, isLoaded])

  const addToWardrobe = (product) => {
    const productId = getItemId(product)
    if (!productId) return

    setSavedItems((prev) => {
      const exists = prev.find((item) => getItemId(item) === productId)
      if (exists) {
        return prev
      }
      return [...prev, { ...product, id: productId }]
    })
  }

  const removeFromWardrobe = (productId) => {
    setSavedItems((prev) => prev.filter((item) => getItemId(item) !== productId))
  }

  const isInWardrobe = (productId) => {
    return savedItems.some((item) => getItemId(item) === productId)
  }

  const addLook = (look) => {
    const newLook = {
      ...look,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setSavedLooks((prev) => [...prev, newLook])
    return newLook.id
  }

  const removeLook = (lookId) => {
    setSavedLooks((prev) => prev.filter((look) => look.id !== lookId))
  }

  const updateLook = (lookId, updates) => {
    setSavedLooks((prev) =>
      prev.map((look) => (look.id === lookId ? { ...look, ...updates } : look))
    )
  }

  const addPurchasedItem = (product, options = {}) => {
    const productId = getItemId(product)
    if (!productId) return

    const purchasedItem = {
      ...product,
      id: productId,
      purchasedAt: new Date().toISOString(),
      size: options.size || product.sizes?.[0] || 'M',
      color: options.color || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'),
      quantity: options.quantity || 1,
    }

    setPurchasedItems((prev) => {
      // Check if item already exists (same product, size, color)
      const exists = prev.find(
        (item) =>
          getItemId(item) === productId &&
          item.size === purchasedItem.size &&
          item.color === purchasedItem.color
      )
      if (exists) {
        // Update quantity if exists
        return prev.map((item) =>
          getItemId(item) === productId && item.size === exists.size && item.color === exists.color
            ? { ...item, quantity: item.quantity + purchasedItem.quantity }
            : item
        )
      }
      return [...prev, purchasedItem]
    })
  }

  const getPurchasedItemsByCategory = (category) => {
    // Map wardrobe category to product categories/tags
    const categoryMap = {
      'office-wear': ['office', 'formal', 'business'],
      'gym-wear': ['gym', 'sport', 'active', 'fitness'],
      'casual-wear': ['casual', 'everyday'],
      'party-wear': ['party', 'evening', 'cocktail', 'formal'],
      'ethnic-wear': ['ethnic', 'traditional', 'saree', 'kurta', 'sherwani'],
      'accessories': ['accessory', 'bag', 'watch', 'jewelry', 'belt'],
    }

    const keywords = categoryMap[category] || []
    return purchasedItems.filter((item) => {
      const itemCategory = item.category?.toLowerCase() || ''
      const itemName = item.name?.toLowerCase() || ''
      const itemTags = item.tags?.map((tag) => tag.toLowerCase()) || []
      return keywords.some(
        (keyword) =>
          itemCategory.includes(keyword) ||
          itemName.includes(keyword) ||
          itemTags.includes(keyword)
      )
    })
  }

  return (
    <WardrobeContext.Provider
      value={{
        savedItems,
        savedLooks,
        purchasedItems,
        addToWardrobe,
        removeFromWardrobe,
        isInWardrobe,
        addLook,
        removeLook,
        updateLook,
        addPurchasedItem,
        getPurchasedItemsByCategory,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  )
}

