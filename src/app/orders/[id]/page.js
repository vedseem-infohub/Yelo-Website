'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, Home, User, HelpCircle, ChevronDown, Trophy, CheckCircle2, Package, Truck, Clock } from 'lucide-react'
import { orderAPI } from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/utils/config'
import toast from 'react-hot-toast'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { backendUser, loading: authLoading } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showFeesDetails, setShowFeesDetails] = useState(false)
  const [showDiscountDetails, setShowDiscountDetails] = useState(false)

  const orderId = params?.id

  useEffect(() => {
    const fetchOrder = async () => {
      if (authLoading || !backendUser || !orderId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await orderAPI.getById(orderId)
        
        if (response.success) {
          setOrder(response.data)
        } else {
          setError(response.message || 'Order not found')
        }
      } catch (err) {
        console.error('Error fetching order:', err)
        setError(err.message || 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [backendUser, authLoading, orderId])

  const handleDownloadInvoice = async () => {
    if (!order) return

    try {
      setDownloadingInvoice(true)
      
      const API_BASE_URL = getApiUrl()
      const token = localStorage.getItem('yelo_token')
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${order._id?.toString().slice(-8) || order.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setDownloadingInvoice(false)
      toast.success('Invoice downloaded successfully')
    } catch (err) {
      console.error('Error downloading invoice:', err)
      toast.error('Failed to download invoice. Please try again.')
      setDownloadingInvoice(false)
    }
  }

  // Calculate price breakdown
  const calculatePriceDetails = () => {
    if (!order || !order.items) return {
      listingPrice: 0,
      sellingPrice: 0,
      totalFees: 0,
      otherDiscount: 0,
      totalAmount: 0
    }

    let listingPrice = 0
    let sellingPrice = 0

    order.items.forEach((item) => {
      const product = item.productId || item
      const originalPrice = product?.originalPrice || item.price || item.priceAtAdd || 0
      const price = item.price || item.priceAtAdd || 0
      const quantity = item.quantity || 1

      listingPrice += originalPrice * quantity
      sellingPrice += price * quantity
    })

    const totalAmount = order.totalAmount || order.total || sellingPrice
    const totalFees = Math.max(0, totalAmount - sellingPrice)
    const otherDiscount = Math.max(0, listingPrice - sellingPrice - totalFees)

    return {
      listingPrice,
      sellingPrice,
      totalFees,
      otherDiscount,
      totalAmount
    }
  }

  const priceDetails = calculatePriceDetails()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-4">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  // Get user phone numbers
  const userPhones = backendUser?.phone ? [backendUser.phone] : []
  if (backendUser?.alternatePhone) {
    userPhones.push(backendUser.alternatePhone)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.push('/orders')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <HelpCircle className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Order Items List */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => {
                const product = item.productId || item
                const productName = product?.name || item.name || 'Product'
                const productImages = product?.images || item.images || []
                const imageUrl = typeof productImages[0] === 'string' 
                  ? productImages[0] 
                  : productImages[0]?.url || ''
                const itemPrice = item.price || item.priceAtAdd || 0
                const originalPrice = product?.originalPrice || item.originalPrice || itemPrice
                const quantity = item.quantity || 1
                const size = item.size || 'M'
                const color = item.color || 'Default'

                return (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {product?.emoji || item.emoji || '📦'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{productName}</h3>
                      <p className="text-xs text-gray-500 mb-2">Size: {size} • Color: {color} • Qty: {quantity}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">₹{(itemPrice * quantity).toLocaleString('en-IN')}</span>
                        {originalPrice > itemPrice && (
                          <span className="text-xs text-gray-500 line-through">₹{(originalPrice * quantity).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Status</h2>
          
          {/* Build timeline from status history - deduplicate to show each status only once */}
          {(() => {
            const statusHistory = order.statusHistory || [];
            const timelineMap = new Map();
            const currentOrderStatus = (order.orderStatus || 'PLACED').toUpperCase();
            
            // Add initial PLACED status if not present
            if (statusHistory.length === 0) {
              timelineMap.set('PLACED', { status: 'PLACED', updatedAt: order.createdAt });
            } else {
              // Process status history, keeping only the most recent entry for each status
              statusHistory.forEach(step => {
                const stepStatus = (step.status || step).toUpperCase();
                const existingEntry = timelineMap.get(stepStatus);
                const stepDate = step.updatedAt || step.createdAt;
                
                if (!existingEntry || !existingEntry.updatedAt || (stepDate && new Date(stepDate) > new Date(existingEntry.updatedAt))) {
                  timelineMap.set(stepStatus, {
                    status: stepStatus,
                    updatedAt: stepDate || step.updatedAt
                  });
                }
              });
            }
            
            // Ensure current status is in timeline if not already present
            if (!timelineMap.has(currentOrderStatus)) {
              timelineMap.set(currentOrderStatus, {
                status: currentOrderStatus,
                updatedAt: null
              });
            }
            
            // Convert map to array and sort by status order
            const statusOrder = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
            const timeline = Array.from(timelineMap.values()).sort((a, b) => {
              const indexA = statusOrder.indexOf(a.status);
              const indexB = statusOrder.indexOf(b.status);
              return indexA - indexB;
            });
            
            // Status icons mapping
            const statusIcons = {
              'PLACED': Clock,
              'CONFIRMED': CheckCircle2,
              'SHIPPED': Package,
              'DELIVERED': Truck,
              'COMPLETED': CheckCircle2,
              'CANCELLED': Clock
            };
            
            // Status labels
            const statusLabels = {
              'PLACED': 'Order Placed',
              'CONFIRMED': 'Order Confirmed',
              'SHIPPED': 'Order Shipped',
              'DELIVERED': 'Out for Delivery',
              'COMPLETED': 'Delivered',
              'CANCELLED': 'Cancelled'
            };
            
            return (
              <div className="relative">
                {timeline.map((step, index) => {
                  const stepStatus = step.status.toUpperCase();
                  const isCompleted = step.updatedAt !== null && step.updatedAt !== undefined;
                  const isActive = stepStatus === currentOrderStatus && isCompleted;
                  const isPending = stepStatus === currentOrderStatus && !isCompleted;
                  const date = step.updatedAt ? new Date(step.updatedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Pending';
                  
                  const Icon = statusIcons[stepStatus] || Clock;
                  
                  return (
                    <div key={stepStatus} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      {/* Vertical line */}
                      {index < timeline.length - 1 && (
                        <div className={`absolute left-5 top-10 w-0.5 h-full ${
                          isCompleted ? 'bg-yellow-500' : 'bg-gray-200'
                        }`} />
                      )}
                      
                      {/* Status Icon */}
                      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-yellow-500 text-white'
                          : isActive || isPending
                          ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-500'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className={`w-5 h-5 ${isCompleted ? '' : isActive || isPending ? '' : 'opacity-50'}`} />
                      </div>
                      
                      {/* Status Content */}
                      <div className="flex-1 pt-1">
                        <p className={`text-sm font-semibold ${
                          isCompleted ? 'text-gray-900' : isActive || isPending ? 'text-yellow-600' : 'text-gray-400'
                        }`}>
                          {statusLabels[stepStatus] || stepStatus}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          {date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Delivery Details */}
        {order.deliveryAddress && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Delivery details</h2>
            
            {/* Estimated Delivery Time */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Estimated delivery</p>
              <p className="text-base font-semibold text-gray-900">
                {order.orderStatus === 'DELIVERED' ? 'Delivered' : 'Delivery within 89 minutes'}
              </p>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-3 mb-4">
              <Home className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                {/* Full Name */}
                {(order.deliveryAddress.fullName || backendUser?.name) && (
                  <p className="text-sm font-semibold text-gray-900">
                    {order.deliveryAddress.fullName || backendUser?.name || 'User'}
                  </p>
                )}
                
                {/* Phone */}
                {(order.deliveryAddress.phone || backendUser?.phone) && (
                  <p className="text-sm text-gray-600">
                    Phone: {order.deliveryAddress.phone || backendUser?.phone}
                  </p>
                )}
                
                {/* Address Line 1 */}
                {order.deliveryAddress.addressLine1 && (
                  <p className="text-sm text-gray-900">
                    {order.deliveryAddress.addressLine1}
                  </p>
                )}
                
                {/* Address Line 2 */}
                {order.deliveryAddress.addressLine2 && (
                  <p className="text-sm text-gray-900">
                    {order.deliveryAddress.addressLine2}
                  </p>
                )}
                
                {/* Area and Block */}
                {(order.deliveryAddress.area || order.deliveryAddress.block) && (
                  <p className="text-sm text-gray-900">
                    {[order.deliveryAddress.area, order.deliveryAddress.block].filter(Boolean).join(', ')}
                  </p>
                )}
                
                {/* Landmark */}
                {order.deliveryAddress.landmark && (
                  <p className="text-sm text-gray-600">
                    Landmark: {order.deliveryAddress.landmark}
                  </p>
                )}
                
                {/* City, State, Pincode */}
                {(order.deliveryAddress.city || order.deliveryAddress.state || order.deliveryAddress.pincode) && (
                  <p className="text-sm text-gray-900">
                    {[
                      order.deliveryAddress.city,
                      order.deliveryAddress.state,
                      order.deliveryAddress.pincode
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                
                {/* Fallback to old address format if new fields not available */}
                {!order.deliveryAddress.addressLine1 && order.deliveryAddress.address && (
                  <p className="text-sm text-gray-900">
                    {order.deliveryAddress.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Price Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Price details</h2>
          
          <div className="space-y-3">
            {/* Listing Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Listing price</span>
              <span className="text-sm font-medium text-gray-900">₹{priceDetails.listingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Selling Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Selling price</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-900">₹{priceDetails.sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Total Fees */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total fees</span>
                <button
                  onClick={() => setShowFeesDetails(!showFeesDetails)}
                  className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFeesDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <span className="text-sm font-medium text-gray-900">₹{priceDetails.totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            {showFeesDetails && (
              <div className="pl-6 text-xs text-gray-500">
                <p>Delivery charges: ₹{priceDetails.totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            )}

            {/* Other Discount */}
            {priceDetails.otherDiscount > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Other discount</span>
                    <button
                      onClick={() => setShowDiscountDetails(!showDiscountDetails)}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDiscountDetails ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-green-600">-₹{priceDetails.otherDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {showDiscountDetails && (
                  <div className="pl-6 text-xs text-gray-500">
                    <p>Applied discounts and offers</p>
                  </div>
                )}
              </>
            )}

            {/* Divider */}
            <div className="border-t border-dashed border-gray-300 my-3"></div>

            {/* Total Amount */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total amount</span>
              <span className="text-lg font-bold text-gray-900">₹{priceDetails.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">Payment method</span>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {order.paymentMethod === 'razorpay' ? 'Online Payment' : order.paymentMethod === 'cod' ? 'Cash On Delivery' : order.paymentMethod || 'Cash On Delivery'}
            </span>
          </div>
        </div>

        {/* Download Invoice Button */}
        <button
          onClick={handleDownloadInvoice}
          disabled={downloadingInvoice}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-semibold text-gray-900">
            {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
          </span>
        </button>

        {/* Offers Earned */}
        <button
          onClick={() => {}}
          className="w-full flex items-center justify-between py-3 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-900">Offers earned</span>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3 mb-6">
              <div>
                <p className="font-semibold text-gray-900 mb-1">Customer Support</p>
                <p className="text-sm text-gray-600">Email: support@yeloindia.com</p>
                <p className="text-sm text-gray-600">Phone: +91-XXXX-XXXX</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Order Issues</p>
                <p className="text-sm text-gray-600">For order-related queries, our team will contact you within 24 hours.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
