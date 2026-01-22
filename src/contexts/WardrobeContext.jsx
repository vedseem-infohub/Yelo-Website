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
  const isInitialMountRef = useRef(true)

  // Load wardrobe from localStorage on mount
  useEffect(() => {
    try {
      const savedWardrobe = localStorage.getItem('yelo-wardrobe-items')
      if (savedWardrobe) {
        const parsed = JSON.parse(savedWardrobe)
        setSavedItems(parsed)
      }
    } catch (error) {
      console.error('Error loading wardrobe:', error)
    }

    try {
      const savedLooksData = localStorage.getItem('yelo-wardrobe-looks')
      if (savedLooksData) {
        const parsed = JSON.parse(savedLooksData)
        setSavedLooks(parsed)
      }
    } catch (error) {
      console.error('Error loading looks:', error)
    }

    try {
      const savedPurchased = localStorage.getItem('yelo-purchased-items')
      if (savedPurchased) {
        const parsed = JSON.parse(savedPurchased)
        setPurchasedItems(parsed)
      }
    } catch (error) {
      console.error('Error loading purchased items:', error)
    }

    isInitialMountRef.current = false
  }, [])

  // Save wardrobe to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    try {
      localStorage.setItem('yelo-wardrobe-items', JSON.stringify(savedItems))
    } catch (error) {
      console.error('Error saving wardrobe:', error)
    }
  }, [savedItems])

  // Save looks to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    try {
      localStorage.setItem('yelo-wardrobe-looks', JSON.stringify(savedLooks))
    } catch (error) {
      console.error('Error saving looks:', error)
    }
  }, [savedLooks])

  // Save purchased items to localStorage whenever it changes
  useEffect(() => {
    if (isInitialMountRef.current) return
    
    try {
      localStorage.setItem('yelo-purchased-items', JSON.stringify(purchasedItems))
    } catch (error) {
      console.error('Error saving purchased items:', error)
    }
  }, [purchasedItems])

  const addToWardrobe = (product) => {
    setSavedItems((prev) => {
      const exists = prev.find((item) => item.id === product.id)
      if (exists) {
        return prev
      }
      return [...prev, product]
    })
  }

  const removeFromWardrobe = (productId) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const isInWardrobe = (productId) => {
    return savedItems.some((item) => item.id === productId)
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
    const purchasedItem = {
      ...product,
      purchasedAt: new Date().toISOString(),
      size: options.size || product.sizes?.[0] || 'M',
      color: options.color || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'),
      quantity: options.quantity || 1,
    }
    setPurchasedItems((prev) => {
      // Check if item already exists (same product, size, color)
      const exists = prev.find(
        (item) =>
          item.id === product.id &&
          item.size === purchasedItem.size &&
          item.color === purchasedItem.color
      )
      if (exists) {
        // Update quantity if exists
        return prev.map((item) =>
          item.id === exists.id && item.size === exists.size && item.color === exists.color
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

