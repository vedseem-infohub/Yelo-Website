'use client'

import React, { useState, useEffect, useMemo } from 'react'
import SubcategorySidebar from '@/components/shop/SubcategorySidebar'
import ProductCard from '@/components/common/ProductCard'
import { useProducts } from '@/contexts/ProductsContext'

function MobileShopLayout() {
  const { allProducts, categoryNames } = useProducts()
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [products, setProducts] = useState([])

  useEffect(() => {
    // Load all products
    setProducts(allProducts)
  }, [allProducts])

  // Filter products by selected subcategory (brand)
  const filteredProducts = useMemo(() => {
    if (!selectedSubcategory || selectedSubcategory === 'all') return products
    return products.filter(p => p.brand === selectedSubcategory)
  }, [products, selectedSubcategory])

  return (
    <div className="flex h-screen bg-gray-50 md:hidden">
      {/* Left Subcategory Bar */}
      <SubcategorySidebar
        products={products}
        selectedSubcategory={selectedSubcategory}
        onSubcategorySelect={setSelectedSubcategory}
        type="brand"
      />

      {/* Main Product Grid */}
      <div className="flex-1 ml-20 overflow-y-auto pb-24" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="px-1 pt-36 ">
          {/* Subcategory Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedSubcategory === 'all' ? 'All Products' : selectedSubcategory}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Product Grid - 2 columns */}
          {filteredProducts.length > 0 ? (
            <div className="px-0">
              <div className="grid grid-cols-2 gap-x-1 gap-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id || `product-${index}`}
                    product={product}
                    showAddToBag={true}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center">No products found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileShopLayout

