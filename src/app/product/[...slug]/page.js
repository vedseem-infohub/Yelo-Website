'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { productAPI } from '@/utils/api'
import ProductDetail from '@/components/product/ProductDetail'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  
  // Handle catch-all route: [...slug] can be ['vendor-slug', 'product-slug'] or ['product-slug']
  const slugParam = params?.slug
  const slugArray = Array.isArray(slugParam) ? slugParam : [slugParam]
  const slug = slugArray.join('/') // Join to create vendor-slug/product-slug or just product-slug

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch from API only - no fallback to static data
        const response = await productAPI.getBySlug(slug)
        
        if (response.success && response.data) {
          setProduct(response.data)
        } else {
          throw new Error("Product not found")
        }
      } catch (apiError) {
        console.error("Product fetch error:", apiError)
        setError(apiError.message || "Product not found")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <ProductDetail product={product} />
}

