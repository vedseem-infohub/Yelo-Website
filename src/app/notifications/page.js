'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Package, ShoppingBag, Heart, Sparkles } from 'lucide-react'
import { notificationAPI } from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'
import { getProductUrl } from '@/utils/productUrl'
import Link from 'next/link'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'

export default function NotificationsPage() {
  const router = useRouter()
  const { backendUser, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch notifications when component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      if (authLoading) {
        return
      }

      // If user is not logged in, show empty state
      if (!backendUser) {
        setLoading(false)
        setNotifications([])
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await notificationAPI.getRelatedProducts(7, 50)
        
        if (response.success) {
          // Load read status from localStorage
          const readNotifications = JSON.parse(
            localStorage.getItem('yelo_read_notifications') || '[]'
          )
          
          // Mark notifications as read if they're in localStorage
          const notificationsWithReadStatus = (response.data || []).map(notification => ({
            ...notification,
            read: readNotifications.includes(notification.id)
          }))
          
          setNotifications(notificationsWithReadStatus)
        } else {
          setError(response.message || 'Failed to load notifications')
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
        setError(err.message || 'Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [backendUser, authLoading])

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    
    // Save to localStorage
    const readNotifications = JSON.parse(
      localStorage.getItem('yelo_read_notifications') || '[]'
    )
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId)
      localStorage.setItem('yelo_read_notifications', JSON.stringify(readNotifications))
      
      // Dispatch custom event to update badge count
      window.dispatchEvent(new Event('notification-read'))
    }
  }

  // Mark all as read
  const markAllAsRead = () => {
    const allIds = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    
    // Save to localStorage
    const readNotifications = JSON.parse(
      localStorage.getItem('yelo_read_notifications') || '[]'
    )
    allIds.forEach(id => {
      if (!readNotifications.includes(id)) {
        readNotifications.push(id)
      }
    })
    localStorage.setItem('yelo_read_notifications', JSON.stringify(readNotifications))
    
    // Dispatch custom event to update badge count
    window.dispatchEvent(new Event('notification-read'))
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Helper to get product image
  const getProductImage = (product) => {
    if (!product) return null
    
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0]
      if (typeof firstImage === 'string') {
        return firstImage
      } else if (firstImage?.url) {
        return firstImage.url
      }
    }
    
    return null
  }

  // Helper to get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_product':
        return <Sparkles className="w-5 h-5" />
      case 'purchase':
        return <ShoppingBag className="w-5 h-5" />
      case 'wishlist':
        return <Heart className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-white pb-20 md:pb-8">
        {/* Page Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block border-b border-gray-200 bg-white sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500">{unreadCount} new notification{unreadCount !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="px-4 py-6 max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Bell className="w-24 h-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading notifications</h2>
              <p className="text-gray-500 text-center mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !backendUser ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Bell className="w-24 h-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to see notifications</h2>
              <p className="text-gray-500 text-center mb-4">Get notified about new products related to your purchases, cart, and wishlist</p>
              <button
                onClick={() => router.push('/account')}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Bell className="w-24 h-24 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No notifications</h2>
              <p className="text-gray-500 text-center">We'll notify you when new products arrive that match your interests!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const productUrl = notification.product 
                  ? getProductUrl(notification.product) 
                  : null
                const productImage = getProductImage(notification.product)

                return (
                  <Link
                    key={notification.id}
                    href={productUrl || '#'}
                    onClick={() => markAsRead(notification.id)}
                    className={`block p-4 rounded-lg border transition-all ${
                      notification.read
                        ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        : 'bg-yellow-50 border-yellow-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Image or Icon */}
                      {productImage ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={productImage}
                            alt={notification.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center ${
                          notification.read ? 'bg-gray-200' : 'bg-yellow-500'
                        }`}>
                          {notification.product?.emoji ? (
                            <span className="text-2xl">{notification.product.emoji}</span>
                          ) : (
                            <div className={`${
                              notification.read ? 'text-gray-600' : 'text-white'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-base ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className={`text-sm mb-2 line-clamp-2 ${
                          notification.read ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message || notification.product?.name}
                        </p>
                        {notification.product && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base font-bold text-yellow-600">
                              ₹{notification.product.price}
                            </span>
                            {notification.product.originalPrice && notification.product.originalPrice > notification.product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₹{notification.product.originalPrice}
                              </span>
                            )}
                            {notification.product.brand && (
                              <span className="text-xs text-gray-500">
                                • {notification.product.brand}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">{notification.timeAgo || notification.createdAt}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}