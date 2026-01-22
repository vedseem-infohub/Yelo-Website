'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, CreditCard, CheckCircle2, ArrowRight, Plus, Edit, Truck, Shield, Lock, Home } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWardrobe } from '@/contexts/WardrobeContext'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import PageWrapper from '@/components/common/PageWrapper'
import { motion, AnimatePresence } from 'framer-motion'
import LocationModal from '@/components/LocationModal'
import SetupAccountModal from '@/components/SetupAccountModal'
import { orderAPI, paymentAPI } from '@/utils/api'

const STEPS = [
  { id: 1, name: 'Address', icon: MapPin },
  { id: 2, name: 'Delivery', icon: Truck },
  { id: 3, name: 'Payment', icon: CreditCard },
  { id: 4, name: 'Review', icon: CheckCircle2 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { addPurchasedItem } = useWardrobe()
  const { backendUser, setBackendUser } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showSetupAccountModal, setShowSetupAccountModal] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState(null)
  
  const totalPrice = getTotalPrice()
  
  // Use user's saved address from backend
  const userAddress = backendUser?.city && backendUser?.state && backendUser?.pincode
    ? {
        // New detailed fields
        fullName: backendUser.fullName || backendUser.name || "",
        phone: backendUser.phone || "",
        addressLine1: backendUser.addressLine1 || "",
        addressLine2: backendUser.addressLine2 || "",
        area: backendUser.area || "",
        block: backendUser.block || "",
        landmark: backendUser.landmark || "",
        city: backendUser.city,
        state: backendUser.state,
        pincode: backendUser.pincode,
        latitude: backendUser.latitude,
        longitude: backendUser.longitude,
        // Old field for backward compatibility
        address: backendUser.address || backendUser.addressLine1 || "",
      }
    : null


  // Check if user has address on mount
  useEffect(() => {
    if (!userAddress && backendUser) {
      // If user is logged in but has no address, suggest adding one
      // We'll show the modal when they try to proceed to next step
    }
  }, [backendUser, userAddress])


  const handleSaveAddress = () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.pincode || !addressForm.addressLine1) {
      toast.error('Please fill all required fields')
      return
    }

    const newAddress = {
      id: Date.now().toString(),
      ...addressForm,
    }

    const updated = [...savedAddresses, newAddress]
    setSavedAddresses(updated)
    localStorage.setItem('yelo-addresses', JSON.stringify(updated))
    setSelectedAddressId(newAddress.id)
    setShowAddAddressModal(false)
    setAddressForm({
      fullName: '',
      phone: '',
      pincode: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      landmark: '',
      addressType: 'home',
    })
    toast.success('Address saved successfully')
  }

  const handleStep1Continue = () => {
    if (!userAddress) {
      setShowLocationModal(true)
      return
    }
    setCurrentStep(2)
  }

  const handleStep2Continue = () => {
    setCurrentStep(3)
  }

  const handleStep3Continue = () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    // For Razorpay and COD, no additional validation needed
    // Razorpay handles payment on its own, COD requires no payment details
    setCurrentStep(4)
  }

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePlaceOrder = async () => {
    // Validate user has a name (required for orders)
    if (!backendUser || !backendUser.name || !backendUser.name.trim()) {
      setShowSetupAccountModal(true)
      toast.error('Please provide your name to place an order')
      return
    }

    // Validate address is present
    if (!userAddress) {
      toast.error('Please add a delivery address');
      setCurrentStep(1);
      setShowLocationModal(true);
      return;
    }

    // Validate payment method
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      setCurrentStep(3);
      return;
    }

    // Check for out of stock items
    const outOfStockItems = cartItems.filter(item => item.stock === 0 || item.stock === '0');
    if (outOfStockItems.length > 0) {
      toast.error(`Cannot place order: ${outOfStockItems.length} item(s) are out of stock. Please remove them from your cart.`);
      return;
    }

    toast.loading('Creating your order...', { id: 'order' })
    
    try {
      // Step 1: Create order in database
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId?._id || item.productId || item.id || item._id,
          quantity: item.quantity || 1,
          price: item.price || item.priceAtAdd || 0,
          color: item.color,
          size: item.size,
        })),
        deliveryAddress: {
          // New detailed fields
          fullName: userAddress.fullName,
          phone: userAddress.phone,
          addressLine1: userAddress.addressLine1,
          addressLine2: userAddress.addressLine2,
          area: userAddress.area,
          block: userAddress.block,
          landmark: userAddress.landmark,
          city: userAddress.city,
          state: userAddress.state,
          pincode: userAddress.pincode,
          latitude: userAddress.latitude || backendUser?.latitude,
          longitude: userAddress.longitude || backendUser?.longitude,
          // Old field for backward compatibility
          address: userAddress.address || userAddress.addressLine1 || "",
        },
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay',
        totalAmount: totalPrice,
      };

      const createOrderResponse = await orderAPI.create(orderData);

      if (!createOrderResponse.success) {
        throw new Error(createOrderResponse.message || 'Failed to create order');
      }

      const orderId = createOrderResponse.data._id;

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        // For COD, no payment gateway needed
        // Add all cart items to purchased items
        cartItems.forEach((item) => {
          for (let i = 0; i < (item.quantity || 1); i++) {
            addPurchasedItem(item, {
              size: item.size,
              color: item.color,
              quantity: 1,
            })
          }
        })
        
        toast.success('Order placed successfully! Pay on delivery.', { id: 'order' })
        clearCart()
        // Redirect to order detail page
        router.push(`/orders/${orderId}`)
        return;
      }

      // Handle Razorpay payment flow
      toast.loading('Initializing payment...', { id: 'order' })

      // Step 2: Create Razorpay order
      const razorpayResponse = await paymentAPI.createRazorpayOrder(orderId, totalPrice);

      if (!razorpayResponse.success) {
        throw new Error(razorpayResponse.message || 'Failed to initialize payment');
      }

      const razorpayData = razorpayResponse.data;

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayData.key,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: razorpayData.name,
        description: razorpayData.description,
        order_id: razorpayData.orderId,
        prefill: razorpayData.prefill,
        handler: async function (response) {
          // Payment successful, verify payment
          toast.loading('Verifying payment...', { id: 'payment' });
          
          try {
            const verifyResponse = await paymentAPI.verifyPayment(
              orderId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResponse.success) {
              // Add all cart items to purchased items
              cartItems.forEach((item) => {
                for (let i = 0; i < (item.quantity || 1); i++) {
                  addPurchasedItem(item, {
                    size: item.size,
                    color: item.color,
                    quantity: 1,
                  })
                }
              })
              
              toast.success('Payment successful! Order confirmed.', { id: 'payment' })
              clearCart()
              // Redirect to order detail page where user can download invoice
              router.push(`/orders/${orderId}`)
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.message || 'Payment verification failed. Please contact support.', { id: 'payment' });
          }
        },
        modal: {
          ondismiss: function() {
            toast.error('Payment cancelled', { id: 'order' });
          }
        },
        theme: {
          color: '#fbbf24'
        }
      };

      const razorpay = window.Razorpay(options);
      razorpay.open();
      toast.dismiss('order');

    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.', { id: 'order' });
    }
  }

  // Calculate prices
  const priceDetails = {
    totalMRP: cartItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0),
    totalDiscount: cartItems.reduce(
      (sum, item) => sum + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0),
      0
    ),
    convenienceFee: 0,
    totalAmount: getTotalPrice(),
  }

  if (cartItems.length === 0) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <button
              onClick={() => router.push('/')}
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center gap-2 ${isActive || isCompleted ? 'text-yellow-600' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                            : isActive
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white ring-4 ring-yellow-200'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="font-semibold">{step.id}</span>
                          )}
                        </div>
                        <span className={`font-medium hidden sm:inline ${isActive ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {step.name}
                        </span>
                      </div>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-all ${
                        isCompleted ? 'bg-yellow-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Address */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Delivery Address</h3>
                      </div>
                      <button
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                      >
                        {userAddress ? (
                          <>
                            <Edit className="w-4 h-4" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>

                    {/* Display Saved Address */}
                    {userAddress ? (
                      <div className="mb-6 p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Home className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">{userAddress.fullName || backendUser.name || "User"}</p>
                            {userAddress.phone && (
                              <p className="text-sm text-gray-600 mb-1">Phone: {userAddress.phone}</p>
                            )}
                            {userAddress.addressLine1 && (
                              <p className="text-sm text-gray-700 mb-1">{userAddress.addressLine1}</p>
                            )}
                            {userAddress.addressLine2 && (
                              <p className="text-sm text-gray-700 mb-1">{userAddress.addressLine2}</p>
                            )}
                            {(userAddress.area || userAddress.block) && (
                              <p className="text-sm text-gray-700 mb-1">
                                {[userAddress.area, userAddress.block].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {userAddress.landmark && (
                              <p className="text-sm text-gray-600 mb-1">Landmark: {userAddress.landmark}</p>
                            )}
                            <p className="text-sm text-gray-700">
                              {userAddress.city}, {userAddress.state} - {userAddress.pincode}
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 mb-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">No saved address</p>
                        <button
                          onClick={() => setShowLocationModal(true)}
                          className="text-yellow-600 hover:text-yellow-700 font-semibold"
                        >
                          Add delivery address
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleStep1Continue}
                      disabled={!userAddress}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Continue to Delivery
                      <ArrowRight className="w-5 h-5 inline-block ml-2" />
                    </button>
                  </motion.div>
                )}

                {/* Step 2: Delivery Options */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <Truck className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Delivery Options</h3>
                    </div>

                    <div className="space-y-4 mb-6">
                      {cartItems.map((item, index) => {
                        // Create unique key combining product ID, size, color, and index
                        const uniqueKey = `${item._id || item.id || 'item'}-${item.size || 'nosize'}-${item.color || 'nocolor'}-${index}`
                        return (
                        <div key={uniqueKey} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {(() => {
                                const firstImage = item.images?.[0]
                                const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span className="text-2xl">{item.emoji || '📦'}</span>
                                )
                              })()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="w-4 h-4" />
                            <span>Delivery within 89 minutes</span>
                          </div>
                        </div>
                        )
                      })}
                      </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-blue-800">
                        <strong>Easy Returns:</strong> 15 days return/exchange available. Free pickup for returns.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 inline-block mr-2" />
                        Back
                      </button>
                      <button
                        onClick={handleStep2Continue}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Continue to Payment
                        <ArrowRight className="w-5 h-5 inline-block ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 mb-6">
                      {/* Razorpay - Primary Payment Method */}
                      <div
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'razorpay'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              RP
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Razorpay</p>
                              <p className="text-xs text-gray-600">Cards, UPI, Wallets, Net Banking</p>
                            </div>
                          </div>
                          {paymentMethod === 'razorpay' && (
                            <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        {paymentMethod === 'razorpay' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                <strong>Secure Payment:</strong> All payments are processed securely through Razorpay. You'll be redirected to complete payment.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Cash on Delivery */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === 'cod'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                              ₹
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Cash on Delivery</p>
                              <p className="text-xs text-gray-600">Pay when you receive</p>
                            </div>
                          </div>
                          {paymentMethod === 'cod' && (
                            <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        {paymentMethod === 'cod' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800">
                                You will pay <strong>₹{totalPrice.toFixed(2)}</strong> when the order is delivered.
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-4 mb-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Secure Payment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Lock className="w-4 h-4" />
                        <span>SSL Encrypted</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 inline-block mr-2" />
                        Back
                      </button>
                      <button
                        onClick={handleStep3Continue}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Review Order
                        <ArrowRight className="w-5 h-5 inline-block ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Review Your Order</h3>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Items ({cartItems.length})</h4>
                      <div className="space-y-3">
                        {cartItems.map((item, index) => {
                          // Create unique key combining product ID, size, color, and index
                          const uniqueKey = `${item._id || item.id || 'item'}-${item.size || 'nosize'}-${item.color || 'nocolor'}-${index}`
                          return (
                          <div key={uniqueKey} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {(() => {
                                const firstImage = item.images?.[0]
                                const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url
                                return imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span className="text-2xl">{item.emoji || '📦'}</span>
                                )
                              })()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-600">Size: {item.size} | Qty: {item.quantity}</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      </div>
                    </div>

                    {/* Address Summary */}
                    {userAddress && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Delivery Address</h4>
                          <button
                            onClick={() => setShowLocationModal(true)}
                            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{userAddress.fullName || backendUser.name || "User"}</p>
                        {userAddress.phone && (
                          <p className="text-sm text-gray-700 mb-1">Phone: {userAddress.phone}</p>
                        )}
                        {userAddress.addressLine1 && (
                          <p className="text-sm text-gray-700 mb-1">{userAddress.addressLine1}</p>
                        )}
                        {userAddress.addressLine2 && (
                          <p className="text-sm text-gray-700 mb-1">{userAddress.addressLine2}</p>
                        )}
                        {(userAddress.area || userAddress.block) && (
                          <p className="text-sm text-gray-700 mb-1">
                            {[userAddress.area, userAddress.block].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {userAddress.landmark && (
                          <p className="text-sm text-gray-600 mb-1">Landmark: {userAddress.landmark}</p>
                        )}
                        <p className="text-sm text-gray-700">
                          {userAddress.city}, {userAddress.state} - {userAddress.pincode}
                        </p>
                      </div>
                    )}

                    {/* Payment Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Payment Method</h4>
                      <p className="text-sm text-gray-700 capitalize">
                        {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod?.toUpperCase()}
                      </p>
                    </div>

                    {/* Price Summary */}
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Total MRP</span>
                        <span>₹{priceDetails.totalMRP.toFixed(2)}</span>
                      </div>
                      {priceDetails.totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-₹{priceDetails.totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600">
                        <span>Convenience Fee</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                          <span>Total Amount</span>
                          <span>₹{priceDetails.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 inline-block mr-2" />
                        Back
                      </button>
                      <button
                        onClick={handlePlaceOrder}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Place Order
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              {/* <div className="sticky top-20 bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Total MRP</span>
                    <span>₹{priceDetails.totalMRP.toFixed(2)}</span>
                  </div>
                  {priceDetails.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{priceDetails.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Convenience Fee</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total Amount</span>
                      <span>₹{priceDetails.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {currentStep === 4 && (
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Place Order
                  </button>
                )}
              </div> */}
            </div>
          </div>
        </div>

      </div>
      
      {/* Location Modal for adding/editing address */}
      <LocationModal
        isOpen={showLocationModal}
        setIsOpen={setShowLocationModal}
        onSave={async (updatedUser) => {
          // Refresh user data from backend to ensure we have latest address with all fields
          try {
            const { userAPI } = await import("@/utils/api");
            const response = await userAPI.getMe();
            if (response.success && response.user) {
              setBackendUser(response.user);
              localStorage.setItem("yelo_backend_user", JSON.stringify(response.user));
            } else if (updatedUser) {
              // Fallback to use the updated user from callback
              setBackendUser(updatedUser);
              localStorage.setItem("yelo_backend_user", JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error("Error refreshing user data:", error);
            // Fallback to use the updated user from callback
            if (updatedUser) {
              setBackendUser(updatedUser);
              localStorage.setItem("yelo_backend_user", JSON.stringify(updatedUser));
            }
          }
        }}
        onSave={(user) => {
          // Update user state after saving address
          if (setBackendUser) {
            setBackendUser(user);
          }
        }}
      />
    </PageWrapper>
  )
}
