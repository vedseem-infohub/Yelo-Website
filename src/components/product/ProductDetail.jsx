'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Heart, Share2, ShoppingBag, Star, Check, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useProducts } from '@/contexts/ProductsContext'
import { useAuth } from '@/contexts/AuthContext'
import SetupAccountModal from '@/components/SetupAccountModal'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getProductUrl } from '@/utils/productUrl'
import ProductCard from '@/components/common/ProductCard'
import ProductCardSkeleton from '@/components/common/ProductCardSkeleton'
import { reviewAPI, productAPI } from '@/utils/api'
import { saveProductData, saveRoute, getShopContext } from '@/utils/routePersistence'
import { usePathname } from 'next/navigation'

const ProductDetail = ({ product }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { addToCart, getTotalItems } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { allProducts, getShopProducts } = useProducts()
  const { backendUser, openLoginModal } = useAuth()
  const cartItemCount = getTotalItems()

  const [showSetupAccountModal, setShowSetupAccountModal] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '')
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
  const [isFavorite, setIsFavorite] = useState(false)
  const [pinCode, setPinCode] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [localProductRating, setLocalProductRating] = useState(product?.rating || null)
  const [localReviewCount, setLocalReviewCount] = useState(product?.reviews || 0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [imageZoom, setImageZoom] = useState(1)
  const [apiRelatedProducts, setApiRelatedProducts] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [relatedPage, setRelatedPage] = useState(1)
  const [hasMoreRelated, setHasMoreRelated] = useState(true)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)
  const imageContainerRef = useRef(null)
  const isDraggingImage = useRef(false)
  const modalImageRef = useRef(null)
  const pinchStartDistance = useRef(0)
  const pinchStartZoom = useRef(1)
  const lastTouchTime = useRef(0)
  const [swipeDirection, setSwipeDirection] = useState('right') // Track swipe direction for animation
  const [readyToLoadRelated, setReadyToLoadRelated] = useState(false)

  // Wait for initial render and details to appear before loading related products
  useEffect(() => {
    if (product) {
      const timer = setTimeout(() => {
        setReadyToLoadRelated(true)
      }, 600) // 600ms delay to let the main UI settle
      return () => clearTimeout(timer)
    }
  }, [product?.id, product?._id])

  // Fetch related products from API with progressive loading
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      const category = product?.category
      const subcategory = product?.subcategory
      
      if (!category || !hasMoreRelated || !readyToLoadRelated) return

      try {
        setLoadingRelated(true)
        // Use limit of 5 from API
        const response = await productAPI.getByCategory(category, subcategory, { 
          page: relatedPage, 
          limit: 5 
        })
        
        if (response.success && response.data) {
          const currentId = product._id || product.id
          // Filter out the current product
          const filtered = response.data.filter(p => (p._id || p.id) !== currentId)
          
          setApiRelatedProducts(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(p => p._id || p.id))
            const newProducts = filtered.filter(p => !existingIds.has(p._id || p.id))
            return [...prev, ...newProducts]
          })

          // Check if there are more products to fetch
          const totalFetched = (relatedPage - 1) * 5 + response.data.length
          const totalAvailable = response.pagination?.total || 0
          
          if (totalFetched < totalAvailable && response.data.length > 0) {
            // Trigger next page fetch after a short delay for "progressive" feel
            setTimeout(() => {
              setRelatedPage(prev => prev + 1)
            }, 1000)
          } else {
            setHasMoreRelated(false)
          }
        } else {
          setHasMoreRelated(false)
        }
      } catch (error) {
        console.error('Error fetching related products:', error)
        setHasMoreRelated(false)
      } finally {
        setLoadingRelated(false)
      }
    }

    if (product && readyToLoadRelated) {
      fetchRelatedProducts()
    }
  }, [product, relatedPage, readyToLoadRelated])

  // Save product data and route to localStorage when product loads
  useEffect(() => {
    if (product && (product._id || product.id)) {
      const productId = product._id || product.id
      saveProductData(productId, product)
      if (pathname) {
        saveRoute(pathname, {})
      }
    }
  }, [product, pathname])

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?._id && !product?.id) return

      try {
        setLoadingReviews(true)
        const productId = product._id || product.id
        const response = await reviewAPI.getByProduct(productId)
        // Handle both array response and object response
        let fetchedReviews = []
        if (Array.isArray(response)) {
          fetchedReviews = response
        } else if (response && Array.isArray(response.data)) {
          fetchedReviews = response.data
        } else if (response && response.success && Array.isArray(response.data)) {
          fetchedReviews = response.data
        }

        setReviews(fetchedReviews)

        // Calculate and update rating from reviews
        if (fetchedReviews.length > 0) {
          const totalRating = fetchedReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
          const averageRating = totalRating / fetchedReviews.length
          setLocalProductRating(averageRating)
          setLocalReviewCount(fetchedReviews.length)
        } else {
          // If no reviews, use product's rating if available
          if (product?.rating !== undefined && product?.rating !== null) {
            setLocalProductRating(product.rating)
          } else {
            setLocalProductRating(null)
          }
          if (product?.reviews !== undefined && product?.reviews !== null) {
            setLocalReviewCount(product.reviews)
          } else {
            setLocalReviewCount(0)
          }
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()

    // Update local rating and review count when product changes
    if (product?.rating) {
      setLocalProductRating(product.rating)
    }
    if (product?.reviews) {
      setLocalReviewCount(product.reviews)
    }
  }, [product?._id, product?.id, product?.rating, product?.reviews])

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!product?._id && !product?.id) return
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) return

    try {
      setSubmittingReview(true)
      const productId = product._id || product.id
      await reviewAPI.create(productId, reviewRating, reviewComment)

      // Refresh reviews
      const response = await reviewAPI.getByProduct(productId)
      let updatedReviews = []
      if (Array.isArray(response)) {
        updatedReviews = response
      } else if (response && Array.isArray(response.data)) {
        updatedReviews = response.data
      } else if (response && response.success && Array.isArray(response.data)) {
        updatedReviews = response.data
      }

      setReviews(updatedReviews)

      // Calculate new average rating from reviews
      if (updatedReviews.length > 0) {
        const totalRating = updatedReviews.reduce((sum, review) => sum + (review.rating || 0), 0)
        const averageRating = totalRating / updatedReviews.length
        setLocalProductRating(averageRating)
        setLocalReviewCount(updatedReviews.length)
      }

      // Reset form
      setReviewRating(5)
      setReviewComment('')
      setShowReviewForm(false)
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Get related products from the shop the user came from
  const relatedProducts = useMemo(() => {
    if (!product || !allProducts.length) return []

    const currentProductId = product._id || product.id

    // Get the shop slug from localStorage (which shop the user was viewing)
    const sourceShopSlug = getShopContext()

    // If we have a source shop, filter products from that shop
    if (sourceShopSlug) {
      const shopProducts = getShopProducts(sourceShopSlug) || []
      const filtered = shopProducts.filter((p) => {
        const pId = p._id || p.id
        return pId !== currentProductId // Exclude current product
      })

      // Ensure at least 8 products (or as many as available)
      return filtered.slice(0, Math.max(8, filtered.length))
    }

    // Fallback: Use product's assigned shops if no source shop context
    const currentProductShops = product.assignedShops || []

    if (currentProductShops.length > 0) {
      const filtered = allProducts.filter((p) => {
        const pId = p._id || p.id
        if (pId === currentProductId) return false

        const pShops = p.assignedShops || []
        return pShops.some(shopSlug => currentProductShops.includes(shopSlug))
      })

      return filtered.slice(0, Math.max(8, filtered.length))
    }

    // Final fallback: Filter by same vendor if available, otherwise by same major category
    const vendorSlug = product.vendorSlug
    const majorCategory = (product.brand && product.brand.trim() !== '') ? 'LUXURY' : 'AFFORDABLE'

    const filtered = allProducts.filter((p) => {
      const pId = p._id || p.id
      if (pId === currentProductId) return false

      if (vendorSlug && p.vendorSlug === vendorSlug) return true
      if (!vendorSlug) {
        const pCategory = (p.brand && p.brand.trim() !== '') ? 'LUXURY' : 'AFFORDABLE'
        return pCategory === majorCategory
      }
      return false
    })

    return filtered.slice(0, Math.max(8, filtered.length))
  }, [product, allProducts, getShopProducts])

  const handleSizeSelect = (size) => {
    setSelectedSize(size)
  }

  // Check if product is in wishlist
  React.useEffect(() => {
    setIsFavorite(isInWishlist(product.id))
  }, [product.id, isInWishlist])

  const handleWishlistToggle = () => {
    if (isFavorite) {
      removeFromWishlist(product.id)
      setIsFavorite(false)
    } else {
      addToWishlist(product)
      setIsFavorite(true)
    }
  }

  const handleAddToCart = async () => {
    if (!backendUser) {
      openLoginModal()
      return
    }

    // Check if product is out of stock
    if (product.stock === 0 || product.stock === '0') {
      alert('This product is currently out of stock.')
      return
    }

    setIsAddingToCart(true)

    // Simulate async operation with animation
    await new Promise(resolve => setTimeout(resolve, 600))

    addToCart(product, {
      size: selectedSize || product.sizes?.[0] || 'M',
      color: selectedColor || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'),
    })

    setIsAddingToCart(false)
    setIsAddedToCart(true)

    // Reset after 2 seconds
    setTimeout(() => {
      setIsAddedToCart(false)
    }, 2000)
  }

  const handleBuyNow = () => {
    if (!backendUser) {
      openLoginModal()
      return
    }

    // Validate user has a name (required for orders)
    if (!backendUser.name || !backendUser.name.trim()) {
      setShowSetupAccountModal(true)
      toast.error('Please provide your name to place an order')
      return
    }

    // Check if product is out of stock
    if (product.stock === 0 || product.stock === '0') {
      alert('This product is currently out of stock.')
      return
    }

    // Add to cart first (silently)
    addToCart(product, {
      size: selectedSize || product.sizes?.[0] || 'M',
      color: selectedColor || (typeof product.colors?.[0] === 'string' ? product.colors[0] : product.colors?.[0]?.name || 'White'),
      silent: true,
    })
    // Navigate to checkout page
    router.push('/checkout')
  }

  // Check if product is out of stock
  const isOutOfStock = product.stock === 0 || product.stock === '0'

  const handleShare = async () => {
    const productUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${product.price}`,
      url: productUrl,
    }

    try {
      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(productUrl)
        alert('Product link copied to clipboard!')
      }
    } catch (error) {
      // User cancelled or error occurred - try fallback
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(productUrl)
          alert('Product link copied to clipboard!')
        } catch (clipboardError) {
          // Final fallback: show alert with URL
          prompt('Copy this link to share:', productUrl)
        }
      }
    }
  }

  // Swipe gesture handlers for image gallery - works in any direction
  const handleImageTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDraggingImage.current = false
  }

  const handleImageTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
    const deltaX = Math.abs(touchStartX.current - touchEndX.current)
    const deltaY = Math.abs(touchStartY.current - touchEndY.current)
    if (deltaX > 5 || deltaY > 5) {
      isDraggingImage.current = true
    }
  }

  const handleImageTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) {
      isDraggingImage.current = false
      return
    }

    const deltaX = touchStartX.current - touchEndX.current
    const deltaY = touchStartY.current - touchEndY.current
    const minSwipeDistance = 50 // Minimum distance for a swipe

    // Calculate the dominant direction (horizontal vs vertical)
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Check if swipe is significant in any direction
    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      // Determine if horizontal or vertical swipe is dominant
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && selectedImageIndex < productImages.length - 1) {
          // Swipe left - go to next image (one by one)
          setSwipeDirection('left')
          setSelectedImageIndex(prev => prev + 1)
        } else if (deltaX < 0 && selectedImageIndex > 0) {
          // Swipe right - go to previous image (one by one)
          setSwipeDirection('right')
          setSelectedImageIndex(prev => prev - 1)
        }
      } else {
        // Vertical swipe - treat as next/previous based on direction
        if (deltaY > 0 && selectedImageIndex < productImages.length - 1) {
          // Swipe up - go to next image (one by one)
          setSwipeDirection('left')
          setSelectedImageIndex(prev => prev + 1)
        } else if (deltaY < 0 && selectedImageIndex > 0) {
          // Swipe down - go to previous image (one by one)
          setSwipeDirection('right')
          setSelectedImageIndex(prev => prev - 1)
        }
      }
    }

    // Reset touch positions
    touchStartX.current = 0
    touchStartY.current = 0
    touchEndX.current = 0
    touchEndY.current = 0
    setTimeout(() => {
      isDraggingImage.current = false
    }, 100)
  }

  // Mouse drag handlers for desktop - changes images one by one
  const handleImageMouseDown = (e) => {
    e.preventDefault()
    touchStartX.current = e.clientX
    touchStartY.current = e.clientY
    isDraggingImage.current = false
  }

  const handleImageMouseMove = (e) => {
    if (!touchStartX.current) return
    touchEndX.current = e.clientX
    touchEndY.current = e.clientY
    const deltaX = Math.abs(touchStartX.current - touchEndX.current)
    const deltaY = Math.abs(touchStartY.current - touchEndY.current)
    if (deltaX > 5 || deltaY > 5) {
      isDraggingImage.current = true
    }
  }

  const handleImageMouseUp = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) {
      isDraggingImage.current = false
      return
    }

    const deltaX = touchStartX.current - touchEndX.current
    const deltaY = touchStartY.current - touchEndY.current
    const minSwipeDistance = 50

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > minSwipeDistance || absY > minSwipeDistance) {
      if (absX > absY) {
        // Horizontal drag
        if (deltaX > 0 && selectedImageIndex < productImages.length - 1) {
          // Drag left - go to next image (one by one)
          setSwipeDirection('left')
          setSelectedImageIndex(prev => prev + 1)
        } else if (deltaX < 0 && selectedImageIndex > 0) {
          // Drag right - go to previous image (one by one)
          setSwipeDirection('right')
          setSelectedImageIndex(prev => prev - 1)
        }
      } else {
        // Vertical drag
        if (deltaY > 0 && selectedImageIndex < productImages.length - 1) {
          // Drag up - go to next image (one by one)
          setSwipeDirection('left')
          setSelectedImageIndex(prev => prev + 1)
        } else if (deltaY < 0 && selectedImageIndex > 0) {
          // Drag down - go to previous image (one by one)
          setSwipeDirection('right')
          setSelectedImageIndex(prev => prev - 1)
        }
      }
    }

    touchStartX.current = 0
    touchStartY.current = 0
    touchEndX.current = 0
    touchEndY.current = 0
    setTimeout(() => {
      isDraggingImage.current = false
    }, 100)
  }

  const handleImageMouseLeave = () => {
    touchStartX.current = 0
    touchStartY.current = 0
    touchEndX.current = 0
    touchEndY.current = 0
    isDraggingImage.current = false
  }

  // Handle navigation buttons (also track direction)
  const goToNextImage = () => {
    setSwipeDirection('left')
    setSelectedImageIndex(prev => (prev + 1) % productImages.length)
  }

  const goToPrevImage = () => {
    setSwipeDirection('right')
    setSelectedImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)
  }

  const goToImage = (index) => {
    // Determine direction based on current index
    setSwipeDirection(index > selectedImageIndex ? 'left' : 'right')
    setSelectedImageIndex(index)
  }

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  // Helper to extract image URL (handles both string and object formats)
  const getImageUrl = (image) => {
    if (!image) return null
    if (typeof image === 'string') return image
    if (typeof image === 'object' && image.url) return image.url
    return null
  }

  // Helper function to check if a string is a URL or base64 data URL
  const isImageUrl = (str) => {
    if (!str || typeof str !== 'string') return false
    return str.startsWith('http://') ||
      str.startsWith('https://') ||
      str.startsWith('/') ||
      str.startsWith('data:image/') // Support base64 data URLs
  }

  // Get all product images (extract URLs from objects if needed)
  const productImages = product.images && product.images.length > 0
    ? product.images.map(img => getImageUrl(img) || product.emoji || '🛍️')
    : [product.emoji || '🛍️']

  // Image modal handlers
  const openImageModal = (index) => {
    setModalImageIndex(index)
    setShowImageModal(true)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const closeImageModal = () => {
    setShowImageModal(false)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(imageZoom + 0.5, 3)
    setImageZoom(newZoom)
    // Reset position when zooming in to center the image
    if (newZoom === 1) {
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(imageZoom - 0.5, 1)
    setImageZoom(newZoom)
    // Reset position when zooming out to 1
    if (newZoom === 1) {
      setImagePosition({ x: 0, y: 0 })
    }
  }

  const handleResetZoom = () => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
  }

  // Handle mouse drag for zoomed image
  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 1) {
      e.preventDefault()
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Constrain position to prevent dragging too far
      const maxX = (imageZoom - 1) * 200
      const maxY = (imageZoom - 1) * 200

      setImagePosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Calculate distance between two touches
  const getTouchDistance = (touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Handle touch for zoomed image (supports pinch zoom and drag)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      e.preventDefault()
      const distance = getTouchDistance(e.touches[0], e.touches[1])
      pinchStartDistance.current = distance
      pinchStartZoom.current = imageZoom
      setIsDragging(false)
    } else if (e.touches.length === 1 && imageZoom > 1) {
      // Single touch drag start
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y
      })
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault()
      const distance = getTouchDistance(e.touches[0], e.touches[1])
      const scale = distance / pinchStartDistance.current
      const newZoom = Math.max(1, Math.min(3, pinchStartZoom.current * scale))
      setImageZoom(newZoom)

      // Reset position when zooming
      if (newZoom === 1) {
        setImagePosition({ x: 0, y: 0 })
      }
    } else if (isDragging && imageZoom > 1 && e.touches.length === 1) {
      // Single touch drag
      e.preventDefault()
      const newX = e.touches[0].clientX - dragStart.x
      const newY = e.touches[0].clientY - dragStart.y

      // Constrain position to prevent dragging too far
      const maxX = (imageZoom - 1) * 200
      const maxY = (imageZoom - 1) * 200

      setImagePosition({
        x: Math.max(-maxX, Math.min(maxX, newX)),
        y: Math.max(-maxY, Math.min(maxY, newY))
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    pinchStartDistance.current = 0
  }

  // Handle wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setImageZoom(prev => Math.max(1, Math.min(3, prev + delta)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50/30 to-white pb-32">
      {/* Product Image Section - 65vh Height with Overlay Header */}
      <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 w-full">
        {/* Header Overlay - Positioned over image */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none active:scale-95"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className="p-2.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none active:scale-95"
              suppressHydrationWarning
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-800'
                  }`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 bg-white/90 backdrop-blur-md hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none active:scale-95"
              suppressHydrationWarning
              title="Share product"
            >
              <Share2 className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Image Container - 65vh Height */}
        <div
          ref={imageContainerRef}
          className="h-[65vh] flex items-center justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing relative"
          onTouchStart={handleImageTouchStart}
          onTouchMove={handleImageTouchMove}
          onTouchEnd={handleImageTouchEnd}
          onMouseDown={handleImageMouseDown}
          onMouseMove={handleImageMouseMove}
          onMouseUp={handleImageMouseUp}
          onMouseLeave={handleImageMouseLeave}
          onClick={(e) => {
            // Only open modal if it wasn't a drag gesture
            if (!isDraggingImage.current && isImageUrl(productImages[selectedImageIndex])) {
              openImageModal(selectedImageIndex)
            }
          }}
        >
          {/* Smooth Carousel Container with Framer Motion Slide Animation */}
          <div className="relative w-full h-full overflow-hidden">
            {productImages.map((image, index) => {
              const offset = index - selectedImageIndex
              const isActive = index === selectedImageIndex

              return (
                <motion.div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={false}
                  animate={{
                    x: `${offset * 100}%`,
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 0.95,
                    zIndex: isActive ? 10 : 0
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }}
                  style={{
                    pointerEvents: isActive ? 'auto' : 'none'
                  }}
                >
                  {isImageUrl(image) ? (
                    <>
                      <img
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center pointer-events-none">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <span className="text-9xl">{image}</span>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Image Dots Indicator - Overlay on Image (no background) */}
          {productImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    goToImage(index)
                  }}
                  className={`rounded-full transition-all duration-300 focus:outline-none ${index === selectedImageIndex
                      ? 'bg-yellow-500 w-8 h-2 shadow-md shadow-yellow-200'
                      : 'bg-white/60 hover:bg-white/80 w-2 h-2'
                    }`}
                  suppressHydrationWarning
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Info Section - Below Image */}
      <div className="px-5 pt-6 pb- bg-white">
        {/* Brand and Product Name */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{product.name}</h1>
          {product.brand && (
            <p className="text-base font-medium text-gray-600 mb-3">{product.brand}</p>
          )}

          {/* Rating and Reviews */}
          {(localProductRating !== null && localProductRating > 0) || localReviewCount > 0 ? (
            <div className="flex items-center gap-2 mb-4">
              {localProductRating !== null && localProductRating > 0 && (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-yellow-800" />
                  <span className="font-semibold text-yellow-800">{localProductRating.toFixed(1)}</span>
                </>
              )}
              {localReviewCount > 0 && (
                <span className="text-gray-800 text-sm">({localReviewCount} {localReviewCount === 1 ? 'Review' : 'Reviews'})</span>
              )}
            </div>
          ) : null}

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-yellow-600">₹{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-sm font-semibold rounded-md">
                  {discountPercentage}% OFF
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="px-5 py-6 space-y-6 bg-white">

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
          <div className="border-t border-yellow-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                  Select Color
                </p>
                <div className="flex gap-3 flex-wrap">
                  {product.colors.map((color, index) => {
                    const colorObj = typeof color === 'string'
                      ? { name: color, value: color, image: product.emoji }
                      : color
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(colorObj.name)}
                        className={`w-14 h-14 rounded-xl border-2 transition-all overflow-hidden shadow-sm focus:outline-none active:scale-95 ${selectedColor === colorObj.name
                            ? 'border-yellow-500 border-3 scale-110 shadow-lg shadow-yellow-200 ring-2 ring-yellow-100'
                            : 'border-gray-200 hover:border-yellow-300'
                          }`}
                        style={{ backgroundColor: colorObj.value }}
                        title={colorObj.name}
                        suppressHydrationWarning
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs">{colorObj.image || product.emoji}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="border-t border-yellow-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                Size
              </h3>
              <button className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold underline focus:outline-none transition-colors" suppressHydrationWarning>
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={size === 'XXL' && product.stock < 5}
                  className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all focus:outline-none ${selectedSize === size
                      ? 'border-yellow-500 bg-yellow-500 text-white shadow-md shadow-yellow-200'
                      : 'border-gray-200 text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                    } ${size === 'XXL' && product.stock < 5
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                    }`}
                  suppressHydrationWarning
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Options */}
        <div className="border-t border-yellow-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
            Delivery
          </h3>
          <div className="flex gap-2 bg-yellow-50/50 rounded-xl p-4 mb-3">
            <input
              type="text"
              placeholder="Enter PIN Code"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="flex-1 px-4 py-3 border text-gray-700 border-yellow-200 bg-white rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-sm"
              suppressHydrationWarning
            />
            <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors text-sm focus:outline-none shadow-md hover:shadow-lg" suppressHydrationWarning>
              Check
            </button>
          </div>
          <p className="text-sm text-gray-700 font-medium">Delivery within 89 minutes</p>
        </div>

        {/* Description */}
        {product.description && (
          <div className="border-t border-yellow-100 pt-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-5 bg-yellow-500 rounded-full"></span>
              Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* Product Details */}
        {/* <div className="border-t border-yellow-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1 h-5 bg-yellow-500 rounded-full"></span>
            Product Details
          </h3>
          <div className="space-y-2.5 text-sm text-gray-700 bg-yellow-50/50 rounded-xl p-4">
            {product.description && (
              <p className="flex justify-between py-2 border-b border-yellow-100 last:border-0">
                <span className="text-gray-600 font-medium">Fabric</span>
                <span className="text-gray-900 font-semibold">{product.description.includes('Cotton') ? 'Cotton' : 'Mixed'}</span>
              </p>
            )}
            <p className="flex justify-between py-2 border-b border-yellow-100 last:border-0">
              <span className="text-gray-600 font-medium">Length</span>
              <span className="text-gray-900 font-semibold">Regular</span>
            </p>
            <p className="flex justify-between py-2 border-b border-yellow-100 last:border-0">
              <span className="text-gray-600 font-medium">Neck</span>
              <span className="text-gray-900 font-semibold">Round Neck</span>
            </p>
            <p className="flex justify-between py-2">
              <span className="text-gray-600 font-medium">Pattern</span>
              <span className="text-gray-900 font-semibold">{product.description?.includes('Graphic') ? 'Graphic Print' : 'Solid'}</span>
            </p>
          </div>
        </div> */}

        {/* Ratings & Reviews Section */}
        <div className="border-t border-yellow-100 pt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
              Ratings & Reviews
            </h3>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-yellow-700 hover:text-yellow-800 text-xs font-semibold px-4 py-2 border-2 border-yellow-300 rounded-lg transition-colors hover:bg-yellow-50 focus:outline-none shadow-sm"
              suppressHydrationWarning
            >
              {showReviewForm ? 'Cancel' : 'Write Review'}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-6 p-5 bg-yellow-50/50 rounded-xl border-2 border-yellow-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                Write Your Review
              </h4>

              {/* Rating Selection */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none ${reviewRating >= star ? 'text-amber-400' : 'text-gray-300'}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-700 mb-2 block uppercase tracking-wide">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full p-3 border-2 border-yellow-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 resize-none text-gray-800 bg-white text-sm"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || reviewRating < 1}
                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm focus:outline-none shadow-md hover:shadow-lg"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}

          {/* Rating Summary */}
          {(localProductRating !== null && localProductRating > 0) || localReviewCount > 0 ? (
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl font-bold text-yellow-600">
                  {localProductRating !== null && localProductRating > 0 ? localProductRating.toFixed(1) : '0.0'}
                </div>
                <div className="text-gray-400">/</div>
                <div className="text-lg text-gray-400">5</div>
              </div>
              {localReviewCount > 0 && (
                <div className="text-sm text-gray-500">{localReviewCount} {localReviewCount === 1 ? 'Review' : 'Reviews'}</div>
              )}
            </div>
          ) : null}

          {/* Reviews List */}
          <div className="pt-5">
            {loadingReviews ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12 bg-yellow-50/50 rounded-xl p-6">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review._id || review.id} className="pb-6 border-b border-yellow-100 last:border-0 last:pb-0 bg-yellow-50/30 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                          {review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 mb-1.5">
                            {review.userName || 'Anonymous User'}
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${review.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 font-medium">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed pl-14">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section - Products from Same Category & Subcategory */}
      {(loadingRelated || apiRelatedProducts.length > 0) && (
        <div className="px-2 py-6 bg-white border-t border-yellow-100">
          <div className="flex items-center justify-between mb-5 px-3">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
              Related Products
            </h3>
            {product?.category && (
              <Link 
                href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}${product.subcategory ? `/${product.subcategory.toLowerCase().replace(/\s+/g, '-')}` : ''}`}
                className="text-xs font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1 group/link"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-4 scrollbar-hide snap-x touch-pan-x">
            {apiRelatedProducts.map((relatedProduct) => (
              <div 
                key={relatedProduct._id || relatedProduct.id} 
                className="min-w-[150px] w-[150px] sm:min-w-[220px] sm:w-[220px] snap-start"
              >
                <ProductCard product={relatedProduct} compact={true} />
              </div>
            ))}
            
            {/* Shimmer loading for progressive batches */}
            {loadingRelated && (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={`shim-${i}`} className="min-w-[150px] w-[150px] sm:min-w-[220px] sm:w-[220px] snap-start">
                    <ProductCardSkeleton compact={true} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-yellow-200 px-4 py-2 z-40 flex gap-3 shadow-lg">
        <motion.button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isAddedToCart || isOutOfStock}
          className={`flex-1 px-4 py-2.5 border-2 font-bold rounded-xl transition-colors relative overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none shadow-sm text-sm ${isOutOfStock
              ? 'border-gray-300 text-gray-500 bg-gray-100'
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
            }`}
          suppressHydrationWarning
          whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
          animate={isAddedToCart ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {isAddingToCart ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <motion.div
                  className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm">Adding...</span>
              </motion.div>
            ) : isAddedToCart ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Added ✓</span>
              </motion.div>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Add to cart
              </motion.span>
            )}
          </AnimatePresence>

          {/* Ripple effect */}
          {isAddedToCart && (
            <motion.div
              className="absolute inset-0 bg-yellow-500 rounded-xl"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </motion.button>
        <motion.button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`flex-1 py-2.5 px-4 font-bold rounded-xl transition-all focus:outline-none shadow-md text-sm ${isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white hover:shadow-lg'
            }`}
          suppressHydrationWarning
          whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
        >
          {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
        </motion.button>
      </div>

      {/* Image Modal with Zoom */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={closeImageModal}
            onWheel={handleWheel}
          >
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
              suppressHydrationWarning
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
                suppressHydrationWarning
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
                suppressHydrationWarning
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
                suppressHydrationWarning
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Image Navigation */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setModalImageIndex(prev => prev > 0 ? prev - 1 : productImages.length - 1); setImageZoom(1); setImagePosition({ x: 0, y: 0 }); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
                  suppressHydrationWarning
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setModalImageIndex(prev => prev < productImages.length - 1 ? prev + 1 : 0); setImageZoom(1); setImagePosition({ x: 0, y: 0 }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors focus:outline-none"
                  suppressHydrationWarning
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <div
              className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={(e) => { e.stopPropagation(); handleWheel(e); }}
              style={{ touchAction: 'none' }}
            >
              {isImageUrl(productImages[modalImageIndex]) ? (
                <motion.img
                  ref={modalImageRef}
                  key={modalImageIndex}
                  src={productImages[modalImageIndex]}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: imageZoom }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageZoom})`,
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    cursor: imageZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                  }}
                  className="select-none"
                />
              ) : (
                <div className="text-9xl">{productImages[modalImageIndex]}</div>
              )}
            </div>

            {/* Image Indicators */}
            {productImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => { e.stopPropagation(); setModalImageIndex(index); setImageZoom(1); setImagePosition({ x: 0, y: 0 }); }}
                    className={`h-2 rounded-full transition-all focus:outline-none ${index === modalImageIndex
                        ? 'bg-yellow-500 w-6'
                        : 'bg-white/60 hover:bg-white/80 w-2'
                      }`}
                    suppressHydrationWarning
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductDetail
