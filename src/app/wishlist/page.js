'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ShoppingBag, X, Filter, SlidersHorizontal, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const router = useRouter()
  const { wishlistItems, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [selectedSort, setSelectedSort] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showSizeModal, setShowSizeModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [filters, setFilters] = useState({
    category: [],
    brand: [],
    priceRange: [0, 100000],
  })

  // Filter and sort wishlist items
  const filteredItems = useMemo(() => {
    let filtered = [...wishlistItems]

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(item => filters.category.includes(item.category))
    }

    // Apply brand filter
    if (filters.brand.length > 0) {
      filtered = filtered.filter(item => filters.brand.includes(item.brand))
    }

    // Apply price filter
    filtered = filtered.filter(item => {
      const price = item.price || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Apply sorting
    switch (selectedSort) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'discount':
        filtered.sort((a, b) => {
          const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0
          const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0
          return discountB - discountA
        })
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0))
        break
    }

    return filtered
  }, [wishlistItems, filters, selectedSort])

  // Get unique categories and brands for filters
  const categories = useMemo(() => {
    const unique = [...new Set(wishlistItems.map(item => item.category).filter(Boolean))]
    return unique
  }, [wishlistItems])

  const brands = useMemo(() => {
    const unique = [...new Set(wishlistItems.map(item => item.brand).filter(Boolean))]
    return unique
  }, [wishlistItems])

  const handleMoveToBag = (product) => {
    if (!product.sizes || product.sizes.length === 0) {
      // No size selection needed
      addToCart(product, {
        size: 'M',
        color: typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White',
      })
      toast.success('Item moved to bag!')
    } else {
      // Show size selection modal
      setSelectedProduct(product)
      setSelectedSize(null)
      setShowSizeModal(true)
    }
  }

  const handleSizeSelect = (size) => {
    setSelectedSize(size)
  }

  const handleConfirmAddToCart = () => {
    if (!selectedProduct || !selectedSize) {
      toast.error('Please select a size')
      return
    }

    addToCart(selectedProduct, {
      size: selectedSize,
      color: typeof selectedProduct.colors?.[0] === 'string' ? selectedProduct.colors[0] : selectedProduct.colors?.[0]?.name || 'White',
    })
    toast.success('Item moved to bag!')
    setShowSizeModal(false)
    setSelectedProduct(null)
    setSelectedSize(null)
  }

  const handleAddAllToCart = () => {
    if (filteredItems.length === 0) {
      toast.error('No items to add')
      return
    }
    
    filteredItems.forEach((item) => {
      addToCart(item, {
        size: item.sizes?.[0] || 'M',
        color: typeof item.colors?.[0] === 'string' ? item.colors[0] : item.colors?.[0]?.name || 'White',
        silent: true,
      })
    })
    
    toast.success(`Added ${filteredItems.length} item${filteredItems.length > 1 ? 's' : ''} to bag!`)
  }

  const [itemToRemove, setItemToRemove] = useState(null)

  const handleRemoveItem = (productId) => {
    const item = wishlistItems.find(i => i.id === productId)
    setItemToRemove(item)
  }

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      removeFromWishlist(itemToRemove.id)
      setItemToRemove(null)
    }
  }

  const cancelRemoveItem = () => {
    setItemToRemove(null)
  }

  const activeFiltersCount = filters.category.length + filters.brand.length + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0)

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 mt-20">
        {/* Page Header */}
        <div className="fixed w-full top-0 z-30 bg-white border-b border-gray-200">
         <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Wishlist</h1>
            <div className="w-10"></div>
          {/* Mobile: Add All to Cart Button */}
          {filteredItems.length > 0 && (
            <div className=" md:hidden bg-white border-t border-gray-200 z-40">
              <button
                onClick={handleAddAllToCart}
                className="w-full bg-gradient-to-r from-yellow-500 px-3 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white text-md font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
              >
                {/* <ShoppingBag className="w-5 h-5" /> */}
                Move All to Bag 
                {/* ({filteredItems.length}) */}
              </button>
            </div>
          )}
         </div>
        </div>

        {filteredItems.length === 0 && wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-1 mt-24">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Heart className="w-24 h-24 text-gray-300 mb-4 mx-auto" />
            </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 text-center mb-6">Add items to your wishlist to save them for later</p>
          <Link
            href="/"
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
              Continue Shopping
          </Link>
        </div>
        ) : (
        <>
            {/* Products Grid */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] px-1">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No items match your filters</h3>
                <p className="text-gray-500 text-center mb-6">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setFilters({ category: [], brand: [], priceRange: [0, 100000] })
                    setSelectedSort('newest')
                  }}
                  className="text-yellow-600 hover:text-yellow-700 font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
          <div className="px-1 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-4 md:gap-6">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => {
                      const isOutOfStock = item.stock === 0
                      const discountPercentage = item.originalPrice
                        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                        : 0
                      const availableSizes = item.sizes?.length || 0

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group relative"
                        >
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all opacity-100"
                            aria-label="Remove from wishlist"
                          >
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          </button>

                          {/* Product Image */}
                          <Link href={item.vendorSlug ? `/product/${item.vendorSlug}/${item.baseSlug || item.slug}` : `/product/${item.slug}`} className="block relative">
                            <div className={`aspect-square bg-gray-100 overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
                              {(() => {
                                const firstImage = item.images?.[0]
                                const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-6xl">{item.emoji || '📦'}</span>
                                  </div>
                                )
                              })()}
                            </div>
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                            {discountPercentage > 0 && !isOutOfStock && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                                {discountPercentage}% OFF
                              </div>
                            )}
                          </Link>

                          {/* Product Details */}
                          <div className="p-3">
                            {/* Brand */}
                            <p className="text-xs font-bold text-gray-900 uppercase mb-1">{item.brand || 'Brand'}</p>

                            {/* Product Title */}
                            <Link href={item.vendorSlug ? `/product/${item.vendorSlug}/${item.baseSlug || item.slug}` : `/product/${item.slug}`}>
                              <h3 className="text-sm font-medium text-gray-900 truncate mb-2 hover:text-yellow-600 transition-colors">
                                {item.name}
                              </h3>
                            </Link>

                            {/* Size Availability */}
                            {item.sizes && item.sizes.length > 0 && (
                              <p className="text-xs text-gray-600 mb-2">
                                {item.sizes.length === 1 ? 'Only 1 size left' : `${item.sizes.length} sizes available`}
                              </p>
                            )}

                            {/* Price */}
                            <div className="mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-xs text-gray-500 line-through">₹{item.originalPrice.toFixed(2)}</span>
                                )}
                              </div>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <div className="mt-1">
                                  <span className="text-xs font-semibold text-green-600">
                                    {discountPercentage}% OFF
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {isOutOfStock ? (
                              <button
                                className="w-full py-2 px-4 bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold cursor-not-allowed"
                                disabled
                              >
                                Out of Stock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMoveToBag(item)}
                                className="w-full py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100"
                              >
                                Move to Bag
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}

        {/* Size Selection Modal */}
        <AnimatePresence>
          {showSizeModal && selectedProduct && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSizeModal(false)}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Select Size</h3>
                  <button
                    onClick={() => setShowSizeModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {(() => {
                        const firstImage = selectedProduct.images?.[0]
                        const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                        return imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{selectedProduct.emoji || '📦'}</span>
                        )
                      })()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900 uppercase mb-1">{selectedProduct.brand}</p>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
                      <p className="text-base font-bold text-gray-900">₹{selectedProduct.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-3">Select Size</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.sizes?.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          className={`py-3 px-4 border-2 rounded-lg font-semibold transition-all ${
                            selectedSize === size
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={handleConfirmAddToCart}
                    disabled={!selectedSize}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Move to Bag
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Filter Modal */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilters(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <label key={category} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.category.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, category: [...prev.category, category] }))
                                } else {
                                  setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category) }))
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brand Filter */}
                  {brands.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Brand</h4>
                      <div className="space-y-2">
                        {brands.map(brand => (
                          <label key={brand} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.brand.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(prev => ({ ...prev, brand: [...prev.brand, brand] }))
                                } else {
                                  setFilters(prev => ({ ...prev, brand: prev.brand.filter(b => b !== brand) }))
                                }
                              }}
                              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm text-gray-700">{brand}</span>
                          </label>
              ))}
            </div>
          </div>
                  )}

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min</label>
                        <input
                          type="number"
                          value={filters.priceRange[0]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: [Number(e.target.value), prev.priceRange[1]]
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max</label>
                        <input
                          type="number"
                          value={filters.priceRange[1]}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: [prev.priceRange[0], Number(e.target.value)]
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="100000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      setFilters({ category: [], brand: [], priceRange: [0, 100000] })
                    }}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
        </>
      )}
        </AnimatePresence>

        {/* Confirmation Modal for Remove Item */}
        <AnimatePresence>
          {itemToRemove && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancelRemoveItem}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Item?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove <span className="font-semibold">{itemToRemove.name}</span> from your wishlist?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelRemoveItem}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveItem}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <CartPopup />
        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}
