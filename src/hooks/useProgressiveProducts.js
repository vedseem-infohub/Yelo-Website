'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { shopAPI, productAPI } from '@/utils/api'

/**
 * Hook for progressive product loading with skeleton support
 * Fetches products in batches and updates UI progressively
 */
export const useProgressiveProducts = ({
  fetchFunction, // Function that returns a promise with products
  initialSkeletonCount = 6, // Number of skeleton cards to show initially
  batchSize = 6, // Products per batch
  autoFetch = true, // Automatically fetch on mount
  dependencies = [] // Dependencies that should trigger a reset
}) => {
  const [products, setProducts] = useState([])
  const [skeletons, setSkeletons] = useState(initialSkeletonCount)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const abortControllerRef = useRef(null)

  // Fetch a batch of products
  const fetchBatch = useCallback(async (page = 1, reset = false) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      if (reset) {
        setIsLoading(true)
        setProducts([])
        setSkeletons(initialSkeletonCount)
        setCurrentPage(1)
        setHasMore(true)
        setError(null)
      }

      const response = await fetchFunction(page, { signal: abortControllerRef.current.signal })

      if (abortControllerRef.current.signal.aborted) {
        return
      }

      if (response && response.success !== false) {
        // Handle different response formats
        const newProducts = response.products || response.data || response || []
        const pagination = response.pagination

        if (reset) {
          setProducts(newProducts)
        } else {
          setProducts(prev => [...prev, ...newProducts])
        }

        // Update skeleton count (decrease by number of products received)
        setSkeletons(prev => Math.max(0, prev - newProducts.length))

        // Update pagination info
        if (pagination) {
          setHasMore(pagination.hasMore !== false && pagination.pages > page)
        } else {
          // If no pagination info, assume hasMore if we got a full batch
          setHasMore(newProducts.length >= batchSize)
        }

        setCurrentPage(page)
      } else {
        setError(response?.message || 'Failed to fetch products')
        setHasMore(false)
        setSkeletons(0)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return // Request was cancelled, ignore
      }
      console.error('Error fetching products:', err)
      setError(err.message || 'Failed to fetch products')
      setHasMore(false)
      setSkeletons(0)
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [fetchFunction, initialSkeletonCount, batchSize])

  // Fetch products one by one for true progressive loading
  const fetchProgressive = useCallback(async () => {
    setIsLoading(true)
    setProducts([])
    setSkeletons(initialSkeletonCount)
    setError(null)
    setHasMore(true)
    setCurrentPage(1)

    try {
      let page = 1
      let totalLoaded = 0
      let hasMoreData = true

      while (hasMoreData && totalLoaded < initialSkeletonCount * 2) {
        const response = await fetchFunction(page)

        if (response && response.success !== false) {
          const newProducts = response.products || response.data || response || []
          const pagination = response.pagination

          if (newProducts.length === 0) {
            hasMoreData = false
            break
          }

          // Add products one by one with small delay for visual effect
          for (let i = 0; i < newProducts.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 100)) // 100ms delay between products

            setProducts(prev => [...prev, newProducts[i]])
            setSkeletons(prev => Math.max(0, prev - 1))
            totalLoaded++
          }

          // Check if more data available
          if (pagination) {
            hasMoreData = pagination.hasMore !== false && pagination.pages > page
          } else {
            hasMoreData = newProducts.length >= batchSize
          }

          page++
        } else {
          hasMoreData = false
        }
      }

      setHasMore(hasMoreData)
      setCurrentPage(page - 1)
    } catch (err) {
      console.error('Error in progressive fetch:', err)
      setError(err.message || 'Failed to fetch products')
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setSkeletons(0)
    }
  }, [fetchFunction, initialSkeletonCount, batchSize])

  // Load more products (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && skeletons === 0) {
      const newSkeletonCount = Math.min(batchSize, 6)
      setSkeletons(newSkeletonCount)
      fetchBatch(currentPage + 1, false)
    }
  }, [isLoading, hasMore, skeletons, currentPage, batchSize, fetchBatch])

  // Reset and fetch from beginning
  const reset = useCallback(() => {
    fetchBatch(1, true)
  }, [fetchBatch])

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchBatch(1, true)
    }

    return () => {
      // Cleanup: abort ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [autoFetch, ...dependencies])

  return {
    products,
    skeletons,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    refetch: () => fetchBatch(1, true),
    fetchProgressive // For true progressive loading (one by one)
  }
}

