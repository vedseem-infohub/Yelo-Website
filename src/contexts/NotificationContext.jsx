'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { notificationAPI } from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'

const NotificationContext = createContext({
  unreadCount: 0,
  refreshNotifications: () => {},
  isLoading: false,
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }) {
  const { backendUser, loading: authLoading } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUnreadCount = async () => {
    if (authLoading || !backendUser) {
      setUnreadCount(0)
      return
    }

    try {
      setIsLoading(true)
      const response = await notificationAPI.getRelatedProducts(7, 50)
      
      if (response.success) {
        // Load read status from localStorage
        const readNotifications = JSON.parse(
          localStorage.getItem('yelo_read_notifications') || '[]'
        )
        
        // Count unread notifications
        const unread = (response.data || []).filter(
          notification => !readNotifications.includes(notification.id)
        ).length
        
        setUnreadCount(unread)
      } else {
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error fetching notification count:', err)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch count when user changes or on mount
  useEffect(() => {
    fetchUnreadCount()
    
    // Refresh count every 5 minutes
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [backendUser, authLoading])

  // Listen for storage changes (when notifications are marked as read in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'yelo_read_notifications') {
        fetchUnreadCount()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when notifications are marked as read in same tab
    const handleNotificationRead = () => {
      fetchUnreadCount()
    }
    
    window.addEventListener('notification-read', handleNotificationRead)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notification-read', handleNotificationRead)
    }
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshNotifications: fetchUnreadCount,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

