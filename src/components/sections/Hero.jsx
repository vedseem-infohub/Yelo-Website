'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  '/hero1.jpg',
  '/hero2.jpg',
  '/hero3.jpg',
  '/hero4.jpg',
  '/hero5.jpg',
  '/hero6.jpg',
]

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const slideIntervalRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const slidesContainerRef = useRef(null)

  // Ensure component is mounted before applying client-side only features
  useEffect(() => {
    setMounted(true)
  }, [])

  const totalSlides = slides.length
  const slideDuration = 5000 // 5 seconds per slide
  const progressUpdateInterval = 50 // Update progress every 50ms for smooth animation

  // Progress bar animation - pauses on hover, doesn't restart
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    // Only reset progress when slide changes, not when pausing
    setProgress(0)
    
    if (!isPaused) {
      const progressSteps = slideDuration / progressUpdateInterval
      let currentStep = 0

      progressIntervalRef.current = setInterval(() => {
        currentStep++
        const newProgress = (currentStep / progressSteps) * 100
        setProgress(Math.min(newProgress, 100))

        if (currentStep >= progressSteps) {
          setProgress(100)
        }
      }, progressUpdateInterval)
    }
    // When paused, progress stays at current value - interval is cleared but progress state remains

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [currentSlide, isPaused, slideDuration, progressUpdateInterval])

  // Auto-slide functionality - pauses on hover, doesn't restart
  useEffect(() => {
    // Clear any existing interval
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current)
    }

    if (!isPaused) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides)
      }, slideDuration)
    }
    // When paused, don't create new interval - just pause

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current)
      }
    }
  }, [isPaused, totalSlides, slideDuration])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setProgress(0) // Reset progress when manually changing slide
    // Immediately resume timer after manual navigation
    setIsPaused(false)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
    setProgress(0) // Reset progress
    // Immediately resume timer after manual navigation
    setIsPaused(false)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
    setProgress(0) // Reset progress
    // Immediately resume timer after manual navigation
    setIsPaused(false)
  }

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Minimum distance for a swipe

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - go to next
        goToNext()
      } else {
        // Swipe right - go to previous
        goToPrevious()
      }
    } else {
      // If no swipe detected, resume timer immediately
      setIsPaused(false)
    }
    
    // Reset touch positions
    touchStartX.current = 0
    touchEndX.current = 0
  }

  return (
    <div className="w-full bg-white mt-56 md:mt-0">

      {/* Search Bar - Mobile Only */}
      {/* <div className="px-4 py-5 md:hidden">
        <div className="relative max-w-4xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Anything..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm shadow-sm hover:shadow-md transition-shadow duration-200"
          />
        </div>
      </div> */}

      {/* Promotional Banner Slider - Clean Gradient Design */}
      <div className="px-4 pb-6 md:px-8 md:pb-10">
        <div className="relative w-full max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {/* Slides Container */}
            <div 
              ref={slidesContainerRef}
              className="relative h-[280px] sm:h-[320px] md:h-[380px] overflow-hidden touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {slides.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100 z-10'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full scale-95 z-0'
                      : 'opacity-0 translate-x-full scale-95 z-0'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              suppressHydrationWarning={true}
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden md:flex items-center justify-center"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              suppressHydrationWarning={true}
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10 hidden md:flex items-center justify-center"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Progress Bar and Dots Indicator - Smaller, Subtle, Animated */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10 w-[85%] max-w-xs px-2">
              <div className="flex gap-1.5 items-center justify-center">
                {slides.map((_, index) => (
                  <div key={index} className="flex items-center justify-center">
                    {index === currentSlide ? (
                      // Progress bar for current slide
                      <button
                        suppressHydrationWarning={true}
                        onClick={() => goToSlide(index)}
                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden transition-all duration-200 hover:bg-white/40 group relative min-w-[40px]"
                        aria-label={`Go to slide ${index + 1}`}
                      >
                        {/* Progress fill */}
                        <div
                          className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </button>
                    ) : (
                      // Smaller dots for other slides
                      <button
                        suppressHydrationWarning={true}
                        onClick={() => goToSlide(index)}
                        className={`rounded-full transition-all duration-200 ${
                          index < currentSlide
                            ? 'bg-white/80 w-1.5 h-1.5'
                            : 'bg-white/40 hover:bg-white/60 w-1.5 h-1.5'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero

