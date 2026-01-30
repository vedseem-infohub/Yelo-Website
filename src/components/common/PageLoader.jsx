'use client'

import React, { useEffect, useState, useRef } from 'react'

function PageLoader({ onContentReady }) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(Date.now())
  const checkIntervalRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const isPageContentReady = () => {
    const pageContent = document.getElementById('page-content')
    if (!pageContent) return false

    const hasContent = pageContent.children.length > 0
    if (!hasContent) return false

    const hasMainElements =
      pageContent.querySelector('main') ||
      pageContent.querySelector('[class*="min-h-screen"]') ||
      pageContent.querySelector('header') ||
      pageContent.textContent.trim().length > 50

    const images = pageContent.querySelectorAll('img')
    const imagesLoaded =
      images.length === 0 ||
      Array.from(images).every(img => img.complete || img.naturalWidth > 0)

    return hasMainElements && imagesLoaded
  }

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)
    startTimeRef.current = Date.now()

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => (prev >= 95 ? prev : prev + Math.random() * 8))
    }, 120)

    const checkContentReady = () => {
      const isReady = isPageContentReady()
      const minTimeElapsed = Date.now() - startTimeRef.current >= 300

      if (isReady && minTimeElapsed) {
        setProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          onContentReady?.()
        }, 200)
        return true
      }
      return false
    }

    if (!checkContentReady()) {
      checkIntervalRef.current = setInterval(() => {
        if (checkContentReady()) {
          clearInterval(checkIntervalRef.current)
        }
      }, 100)
    }

    const maxWaitTimer = setTimeout(() => {
      if (isLoading) {
        setProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          onContentReady?.()
        }, 200)
      }
    }, 2000)

    return () => {
      clearTimeout(maxWaitTimer)
      clearInterval(progressIntervalRef.current)
      clearInterval(checkIntervalRef.current)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center backdrop-blur-sm">
      {/* Soft animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-200 rounded-full blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-200 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative flex flex-col items-center gap-6">
        {/* Brand name with breathing blink */}
        <h1 className="text-4xl font-semibold bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-600 bg-clip-text text-transparent animate-brand">
          YEAHLO
        </h1>

        {/* Progress bar */}
        <div className="w-52 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -40px) scale(1.1);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes brandPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.65;
            transform: scale(0.97);
          }
        }

        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-brand {
          animation: brandPulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default PageLoader
