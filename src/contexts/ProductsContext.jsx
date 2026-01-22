'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { productAPI } from '@/utils/api'

const ProductsContext = createContext({
  allProducts: [],
  categoryNames: {},
  getCategoryProducts: () => [],
  getProductBySlug: () => null,
  getAllBrands: () => [],
  getShopProducts: () => [],
  isLoading: true,
  error: null,
})

export const useProducts = () => useContext(ProductsContext)

export function ProductsProvider({ children }) {
  const [allProducts, setAllProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Don't fetch all products on mount - products will be loaded per shop/category
  // This prevents loading all products unnecessarily
  useEffect(() => {
    // Set loading to false immediately - products will load on-demand per shop/category
    setIsLoading(false)
    setAllProducts([]) // Start with empty array
  }, [])

  // Helper functions that work with API products
  const categoryNames = {
    fashion: "Women's Wear",
    // Add more categories as needed based on your backend data
  }

  const getCategoryProducts = (categorySlug) => {
    if (!categorySlug || !Array.isArray(allProducts)) return []
    const normalizedSlug = categorySlug.toLowerCase().replace(/-/g, ' ')
    return allProducts.filter((product) => {
      if (!product) return false
      // Match by category (normalize both for comparison)
      const productCategory = product.category?.toLowerCase().replace(/-/g, ' ')
      if (productCategory === normalizedSlug || productCategory?.includes(normalizedSlug)) {
        return true
      }
      // Match by productType (for subcategories)
      const productType = product.productType?.toLowerCase().replace(/-/g, ' ')
      if (productType === normalizedSlug || productType?.includes(normalizedSlug)) {
        return true
      }
      // Match by name containing the category
      const productName = product.name?.toLowerCase()
      if (productName?.includes(normalizedSlug)) {
        return true
      }
      return false
    })
  }

  const getProductBySlug = (slug) => {
    if (!slug || !Array.isArray(allProducts)) return null
    // Handle vendor-slug/product-slug format
    if (slug.includes('/')) {
      const [vendorSlug, productSlug] = slug.split('/')
      return allProducts.find(
        (p) =>
          p &&
          ((p.vendorSlug === vendorSlug && p.baseSlug === productSlug) ||
          p.slug === slug)
      ) || null
    }
    return allProducts.find((p) => p && (p.slug === slug || p.baseSlug === slug)) || null
  }

  const getAllBrands = () => {
    if (!Array.isArray(allProducts)) return []
    const brands = new Set()
    allProducts.forEach((product) => {
      if (product && product.brand) {
        brands.add(product.brand)
      }
    })
    return Array.from(brands).sort()
  }

  // Get products assigned to a specific shop (uses backend assignment)
  const getShopProducts = (shopSlug) => {
    if (!shopSlug || !Array.isArray(allProducts)) return []
    return allProducts.filter(
      (product) => 
        product && 
        Array.isArray(product.assignedShops) && 
        product.assignedShops.includes(shopSlug)
    )
  }

  return (
    <ProductsContext.Provider
      value={{
        allProducts,
        categoryNames,
        getCategoryProducts,
        getProductBySlug,
        getAllBrands,
        getShopProducts,
        isLoading,
        error,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

