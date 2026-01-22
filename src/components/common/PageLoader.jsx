'use client'

import React, { useEffect, useState, useRef } from 'react'

function PageLoader({ onContentReady }) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(Date.now())
  const checkIntervalRef = useRef(null)
  const progressIntervalRef = useRef(null)

  // Check if page content is actually loaded
  const isPageContentReady = () => {
    const pageContent = document.getElementById('page-content')
    if (!pageContent) return false

    const hasContent = pageContent.children.length > 0
    if (!hasContent) return false

    const hasMainElements = 
      pageContent.querySelector('main') ||
      pageContent.querySelector('[class*="min-h-screen"]') ||
      pageContent.querySelector('div > div') ||
      pageContent.querySelector('header') ||
      pageContent.textContent.trim().length > 50

    const images = pageContent.querySelectorAll('img')
    const imagesLoaded = images.length === 0 || 
      Array.from(images).every(img => img.complete || img.naturalWidth > 0)

    return hasMainElements && imagesLoaded
  }

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)
    startTimeRef.current = Date.now()

    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 10
      })
    }, 100)

    // Check if content is ready
    const checkContentReady = () => {
      const isReady = isPageContentReady()
      const minTimeElapsed = Date.now() - startTimeRef.current >= 300

      if (isReady && minTimeElapsed) {
        setProgress(100)
        
        setTimeout(() => {
          setIsLoading(false)
          if (onContentReady) {
            onContentReady()
          }
        }, 200)
        return true
      }
      return false
    }

    // Check immediately and periodically
    if (!checkContentReady()) {
      checkIntervalRef.current = setInterval(() => {
        if (checkContentReady()) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
        }
      }, 100)
    }

    // Fallback: maximum wait time (2 seconds)
    const maxWaitTimer = setTimeout(() => {
      if (isLoading) {
        setProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          if (onContentReady) {
            onContentReady()
          }
        }, 200)
      }
    }, 2000)

    return () => {
      clearTimeout(maxWaitTimer)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  if (!isLoading) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center backdrop-blur-sm"
      style={{
        transition: 'opacity 0.4s ease-out, visibility 0.4s ease-out',
        opacity: isLoading ? 1 : 0,
        visibility: isLoading ? 'visible' : 'hidden',
        pointerEvents: isLoading ? 'auto' : 'none'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Main loader */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-24 h-24 -m-2">
            <div className="w-full h-full border-4 border-yellow-400/30 rounded-full animate-ping"></div>
          </div>
          
          {/* Spinning gradient ring */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 animate-spin"></div>
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-amber-50 via-white to-yellow-50"></div>
          </div>
          
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <h1 className="text-3xl font-black bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-600 bg-clip-text text-transparent animate-pulse">
                Yelo
              </h1>
              {/* Sparkle effect */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center gap-1">
          <p className="text-gray-600 text-sm font-medium">Loading</p>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

export default PageLoader
