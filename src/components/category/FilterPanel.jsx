'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Star } from 'lucide-react'
import { useProducts } from '@/contexts/ProductsContext'
import FilterSection from '@/components/filters/FilterSection'
import FilterOption from '@/components/filters/FilterOption'

const FilterPanel = ({ isOpen, onClose, filters, onApply, resultCount = 0, showCategories = true }) => {
  const { allProducts, getAllBrands } = useProducts()
  const [localFilters, setLocalFilters] = useState(filters)
  const [brands, setBrands] = useState([])
  const [brandSearch, setBrandSearch] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setBrands(getAllBrands())
    // Get unique categories from products
    const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
    setCategories(uniqueCategories.sort())
  }, [allProducts, getAllBrands])

  // Sync local filters when filters prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Brown', value: '#92400E' },
  ]

  const discountOptions = [
    { label: '10% and above', value: '10+' },
    { label: '20% and above', value: '20+' },
    { label: '40% and above', value: '40+' },
    { label: '60% and above', value: '60+' },
  ]

  const ratingOptions = [
    { label: '4 & above', value: '4+', icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
    { label: '3 & above', value: '3+', icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
  ]

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands
    return brands.filter(brand =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    )
  }, [brands, brandSearch])

  // Calculate selected counts
  const getSelectedCount = (key) => {
    const value = localFilters[key]
    if (Array.isArray(value)) return value.length
    if (key === 'priceRange') {
      return (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 100000) ? 1 : 0
    }
    if (key === 'ratings' && value?.length > 0) return value.length
    return 0
  }

  const handleCategoryToggle = (category) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...(prev.categories || []), category],
    }))
  }

  const handleBrandToggle = (brand) => {
    setLocalFilters((prev) => ({
      ...prev,
      brands: prev.brands?.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...(prev.brands || []), brand],
    }))
  }

  const handleSizeToggle = (size) => {
    setLocalFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const handleColorToggle = (color) => {
    setLocalFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }

  const handleDiscountToggle = (range) => {
    setLocalFilters((prev) => ({
      ...prev,
      discountRanges: prev.discountRanges?.includes(range)
        ? prev.discountRanges.filter((r) => r !== range)
        : [...(prev.discountRanges || []), range],
    }))
  }

  const handleRatingToggle = (rating) => {
    setLocalFilters((prev) => ({
      ...prev,
      ratings: prev.ratings?.includes(rating)
        ? prev.ratings.filter((r) => r !== rating)
        : [...(prev.ratings || []), rating],
    }))
  }

  const handlePriceChange = (index, value) => {
    // Ensure we always have a valid base range
    const currentRange = Array.isArray(localFilters.priceRange)
      ? localFilters.priceRange
      : [0, 100000]

    const newRange = [...currentRange]

    // Allow the user to temporarily clear the field, but keep internal range sane
    if (value === '') {
      // When cleared, fall back to the extreme default for that side
      newRange[index] = index === 0 ? 0 : 100000
    } else {
      const numericValue = Math.max(0, parseInt(value, 10) || 0)
      newRange[index] = numericValue
    }

    setLocalFilters((prev) => ({
      ...prev,
      priceRange: newRange,
    }))
  }

  const handleReset = () => {
    const defaultFilters = {
      priceRange: [0, 100000],
      sizes: [],
      colors: [],
      brands: [],
      discountRanges: [],
      categories: [],
      ratings: [],
    }
    setLocalFilters(defaultFilters)
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  const totalSelectedCount = useMemo(() => {
    return (
      getSelectedCount('categories') +
      getSelectedCount('brands') +
      getSelectedCount('sizes') +
      getSelectedCount('colors') +
      getSelectedCount('discountRanges') +
      getSelectedCount('priceRange') +
      getSelectedCount('ratings')
    )
  }, [localFilters])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Mobile only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-[70] md:hidden"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              fixed z-[70] bg-white shadow-xl overflow-hidden
              md:sticky md:top-20 md:h-[calc(100vh-5rem)]
              md:w-80 md:border-r md:border-gray-200
              md:shadow-none
              w-80 max-w-[90vw] h-full md:h-[calc(100vh-5rem)]
              flex flex-col
              left-0 top-0
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {totalSelectedCount > 0 && (
                  <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalSelectedCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalSelectedCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Categories - Only show if showCategories is true */}
              {showCategories && localFilters.categories !== undefined && (
                <FilterSection
                  title="Categories"
                  count={getSelectedCount('categories')}
                  defaultOpen={true}
                >
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <FilterOption
                        key={category}
                        label={category.charAt(0).toUpperCase() + category.slice(1)}
                        value={category}
                        checked={localFilters.categories?.includes(category) || false}
                        onChange={handleCategoryToggle}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Brand */}
              <FilterSection
                title="Brand"
                count={getSelectedCount('brands')}
                defaultOpen={true}
              >
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search brand"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                </div>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                      <FilterOption
                        key={brand}
                        label={brand}
                        value={brand}
                        checked={localFilters.brands?.includes(brand) || false}
                        onChange={handleBrandToggle}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 py-2">No brands found</p>
                  )}
                </div>
              </FilterSection>

              {/* Price Range */}
              <FilterSection
                title="Price"
                count={getSelectedCount('priceRange')}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Min</label>
                      <input
                        type="number"
                        value={
                          localFilters.priceRange?.[0] === 0
                            ? ''
                            : localFilters.priceRange?.[0] ?? ''
                        }
                        onChange={(e) => handlePriceChange(0, e.target.value)}
                        placeholder="Min price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Max</label>
                      <input
                        type="number"
                        value={
                          localFilters.priceRange?.[1] === 100000
                            ? ''
                            : localFilters.priceRange?.[1] ?? ''
                        }
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                        placeholder="Max price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Discount */}
              {localFilters.discountRanges !== undefined && (
                <FilterSection
                  title="Discount"
                  count={getSelectedCount('discountRanges')}
                  defaultOpen={false}
                >
                  <div className="space-y-1">
                    {discountOptions.map((option) => (
                      <FilterOption
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        checked={localFilters.discountRanges?.includes(option.value) || false}
                        onChange={handleDiscountToggle}
                      />
                    ))}
                  </div>
                </FilterSection>
              )}

              {/* Size */}
              <FilterSection
                title="Size"
                count={getSelectedCount('sizes')}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        localFilters.sizes.includes(size)
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Color */}
              <FilterSection
                title="Color"
                count={getSelectedCount('colors')}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <FilterOption
                      key={color.name}
                      label={color.name}
                      value={color.name}
                      checked={localFilters.colors.includes(color.name)}
                      onChange={handleColorToggle}
                      type="color"
                      color={color.value}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Customer Ratings */}
              <FilterSection
                title="Customer Ratings"
                count={getSelectedCount('ratings')}
                defaultOpen={false}
              >
                <div className="space-y-1">
                  {ratingOptions.map((option) => (
                    <FilterOption
                      key={option.value}
                      label={option.label}
                      value={option.value}
                      checked={localFilters.ratings?.includes(option.value) || false}
                      onChange={handleRatingToggle}
                      type="rating"
                      icon={option.icon}
                    />
                  ))}
                </div>
              </FilterSection>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 bg-white p-4 flex gap-3 flex-shrink-0">
              <button
                onClick={handleReset}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 px-4 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
              >
                Apply {resultCount > 0 && `(${resultCount})`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FilterPanel
