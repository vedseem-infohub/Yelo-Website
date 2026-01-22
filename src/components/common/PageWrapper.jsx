'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import PageLoader from './PageLoader'

export default function PageWrapper({ children, showLoader = true }) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(showLoader)
  const [showContent, setShowContent] = useState(!showLoader)
  const contentRef = useRef(null)
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    // Early return handling - set state but don't return early
    if (!showLoader) {
      setIsLoading(false)
      setShowContent(true)
      return
    }
    // If pathname changed, show loader
    if (prevPathnameRef.current !== pathname) {
      if (showLoader) {
        setIsLoading(true)
        setShowContent(false)
        // Hide content immediately to prevent flash
        requestAnimationFrame(() => {
          if (contentRef.current) {
            contentRef.current.style.opacity = '0'
            contentRef.current.style.visibility = 'hidden'
            contentRef.current.style.pointerEvents = 'none'
          }
        })
      } else {
        // Ensure content is immediately visible if no loader
        if (contentRef.current) {
            contentRef.current.style.opacity = '1'
            contentRef.current.style.visibility = 'visible'
            contentRef.current.style.pointerEvents = 'auto'
        }
      }
      prevPathnameRef.current = pathname
    }
  }, [pathname, showLoader])

  const handleContentReady = () => {
    setIsLoading(false)
    // Show content after loader fades out
    setTimeout(() => {
      setShowContent(true)
      if (contentRef.current) {
        contentRef.current.style.opacity = '1'
        contentRef.current.style.visibility = 'visible'
      }
    }, 400)
  }

  // Early return after all hooks
  if (!showLoader) {
    return <>{children}</>
  }

  return (
    <>
      {showLoader && isLoading && <PageLoader onContentReady={handleContentReady} />}
      <div
        ref={contentRef}
        style={{
          opacity: showContent ? 1 : 0,
          visibility: showContent ? 'visible' : 'hidden',
          pointerEvents: showContent ? 'auto' : 'none',
          transition: 'opacity 0.3s ease-out, visibility 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </>
  )
}

