'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Minus, ShoppingBag, Info, X, Heart, Trash2, Truck, Tag } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '@/components/common/PageWrapper'

export default function CartPage() {
  const router = useRouter()
  const { cartItems, updateQuantity, removeFromCart } = useCart()
  const { addToWishlist } = useWishlist()
  const [showPriceBreakup, setShowPriceBreakup] = useState(false)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [itemToRemove, setItemToRemove] = useState(null)

  const handleUpdateQuantity = (item, change) => {
    const newQuantity = item.quantity + change
    if (newQuantity >= 1) {
      updateQuantity(item.id, item.size, item.color, change)
    }
  }

  const handleRemoveItem = (item) => {
    setItemToRemove(item)
  }

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id, itemToRemove.size, itemToRemove.color)
      setItemToRemove(null)
    }
  }

  const cancelRemoveItem = () => {
    setItemToRemove(null)
  }

  const handleMoveToWishlist = (item) => {
    addToWishlist(item)
    removeFromCart(item.id, item.size, item.color)
  }

  // Calculate prices
  const priceDetails = useMemo(() => {
    const totalMRP = cartItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0)
    const totalDiscount = cartItems.reduce(
      (sum, item) => sum + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0),
      0
    )
    const convenienceFee = 0
    const totalAmount = totalMRP - totalDiscount + convenienceFee

    return {
      totalMRP,
      totalDiscount,
      convenienceFee,
      totalAmount,
    }
  }, [cartItems])

  // Calculate delivery date
  const getDeliveryDate = () => {
    const today = new Date()
    const deliveryDate = new Date(today)
    deliveryDate.setDate(today.getDate() + 4)
    return deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Get item image
  const getItemImage = (item) => {
    if (item.images && item.images[0]) {
      const firstImage = item.images[0]
      return typeof firstImage === 'string' ? firstImage : firstImage?.url
    }
    if (item.image) return item.image
    return null
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
        {/* Page Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200/60 md:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Shopping Bag</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <ShoppingBag className="w-24 h-24 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your bag is empty</h2>
            <p className="text-gray-500 text-center mb-6">Add items to your bag to continue shopping</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items - Left Column */}
              <div className="lg:col-span-2 space-y-4">
                {/* Coupon Banner */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200/60 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Tag className="w-5 h-5 text-yellow-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">Apply Coupon</p>
                        <p className="text-xs text-gray-600 truncate">Get extra discounts on your order</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCouponInput(!showCouponInput)}
                      className="text-sm font-semibold text-yellow-600 hover:text-yellow-700 shrink-0 ml-2"
                    >
                      {showCouponInput ? 'Cancel' : 'Apply'}
                    </button>
                  </div>
                  {showCouponInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-yellow-200/60"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                        />
                        <button className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 font-semibold text-sm shrink-0">
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Cart Items List - Redesigned with Vertical Flow */}
                {cartItems.map((item, index) => {
                  const itemImage = getItemImage(item)
                  const discountPercentage = item.originalPrice && item.originalPrice > item.price
                    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                    : 0
                  
                  return (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="bg-white rounded-xl border border-gray-200/60 p-4 md:p-5 shadow-sm"
                    >
                      {/* Top Row: Image + Basic Info */}
                      <div className="flex gap-4 mb-4">
                        {/* Product Image - Fixed Size */}
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-3xl">{item.emoji || '📦'}</span>
                          )}
                        </div>

                        {/* Product Info - Vertical Stack */}
                        <div className="flex-1 min-w-0">
                          {/* Brand */}
                          <p className="text-xs font-semibold text-gray-500 mb-1 truncate">
                            {item.brand || 'Brand'}
                          </p>
                          
                          {/* Title */}
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
                            {item.name}
                          </h3>

                          {/* Price - Single Source of Truth */}
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base md:text-lg font-bold text-gray-900">
                              ₹{item.price.toFixed(2)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <>
                                <span className="text-xs text-gray-500 line-through">
                                  ₹{item.originalPrice.toFixed(2)}
                                </span>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {discountPercentage}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Size, Color, Delivery - Grid Layout */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200/60">
                        {/* Size */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Size:</span>
                            <span className="text-xs font-medium text-gray-900 truncate">{item.size}</span>
                          </div>
                          <button className="text-xs text-yellow-600 hover:text-yellow-700 font-medium mt-0.5">
                            Change
                          </button>
                        </div>

                        {/* Color */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Color:</span>
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                              style={{
                                backgroundColor: typeof item.color === 'string' && item.color.startsWith('#')
                                  ? item.color
                                  : 'transparent',
                              }}
                            />
                            <span className="text-xs font-medium text-gray-900 truncate">{item.color}</span>
                          </div>
                          <button className="text-xs text-yellow-600 hover:text-yellow-700 font-medium mt-0.5">
                            Change
                          </button>
                        </div>
                      </div>

                      {/* Delivery Estimate */}
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                        <Truck className="w-4 h-4 shrink-0" />
                        <span>Delivery within 89 minutes</span>
                      </div>

                      {/* Bottom Row: Quantity + Actions - Horizontal with No Wrap */}
                      <div className="flex items-center justify-between gap-3">
                        {/* Quantity Selector - Fixed Width */}
                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg shrink-0">
                          <button
                            onClick={() => handleUpdateQuantity(item, -1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 py-2 font-semibold text-gray-900 text-sm min-w-10 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action Buttons - Fixed Width Icons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            aria-label="Move to wishlist"
                          >
                            <Heart className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Price Details Panel - Right Column / Hidden on Mobile (shown in bottom bar) */}
              <div className="lg:col-span-1 hidden lg:block">
                <div className="sticky top-20 bg-white rounded-xl border border-gray-200/60 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Price Details</h3>
                    <button
                      onClick={() => setShowPriceBreakup(!showPriceBreakup)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Price Breakup"
                    >
                      <Info className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total MRP</span>
                      <span>₹{priceDetails.totalMRP.toFixed(2)}</span>
                    </div>
                    {priceDetails.totalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{priceDetails.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Convenience Fee</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="border-t border-gray-200/60 pt-3 mt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total Amount</span>
                        <span>₹{priceDetails.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mt-4"
                  >
                    Place Order
                  </button>

                  {priceDetails.totalDiscount > 0 && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                      You will save ₹{priceDetails.totalDiscount.toFixed(2)} on this order
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Bar - Mobile Only (Single Price Display) */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/60 z-40 shadow-lg md:hidden">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <button
                    onClick={() => setShowPriceBreakup(true)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="View price breakdown"
                  >
                    <Info className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <span className="text-xl font-bold text-gray-900">₹{priceDetails.totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={() => router.push('/checkout')}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg"
              >
                Place Order
              </button>
            </div>
          </div>
        )}

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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Item?</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Are you sure you want to remove <span className="font-semibold">{itemToRemove.name}</span> from your cart?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelRemoveItem}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRemoveItem}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Price Breakup Modal - Mobile Only */}
        <AnimatePresence>
          {showPriceBreakup && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPriceBreakup(false)}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col md:hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200/60">
                  <h3 className="text-xl font-bold text-gray-900">Price Breakup</h3>
                  <button
                    onClick={() => setShowPriceBreakup(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
                      <div key={index} className="border-b border-gray-100/60 pb-3 last:border-0">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <p className="text-xs text-green-600 mt-0.5">
                                Save ₹{((item.originalPrice - item.price) * item.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200/60 pt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                        <span>₹{priceDetails.totalMRP.toFixed(2)}</span>
                      </div>
                      {priceDetails.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Total Discount</span>
                          <span>-₹{priceDetails.totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Convenience Fee</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <div className="border-t border-gray-200/60 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Total Amount</span>
                          <span>₹{priceDetails.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
