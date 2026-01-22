'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Star } from 'lucide-react'
import { useProducts } from '@/contexts/ProductsContext'
import FilterSection from '@/components/filters/FilterSection'
import FilterOption from '@/components/filters/FilterOption'

const LuxuryFilterPanel = ({ isOpen, onClose, filters, onApply, resultCount = 0 }) => {
  const { getAllBrands } = useProducts()
  const [localFilters, setLocalFilters] = useState(filters)
  const [brands, setBrands] = useState([])
  const [brandSearch, setBrandSearch] = useState('')

  useEffect(() => {
    setBrands(getAllBrands())
  }, [getAllBrands])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

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

  const materials = ['Cotton', 'Silk', 'Wool', 'Leather', 'Cashmere', 'Linen', 'Denim', 'Synthetic']
  const occasions = ['Casual', 'Formal', 'Party', 'Wedding', 'Office', 'Evening', 'Beach', 'Travel']
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Navy', value: '#1e3a8a' },
    { name: 'Beige', value: '#f5f5dc' },
    { name: 'Gold', value: '#ffd700' },
    { name: 'Silver', value: '#c0c0c0' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Brown', value: '#92400E' },
  ]

  const ratingOptions = [
    { label: '4.5 & above', value: '4.5+', icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
    { label: '4.0 & above', value: '4+', icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
    { label: '3.5 & above', value: '3.5+', icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> },
  ]

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands
    return brands.filter(brand =>
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    )
  }, [brands, brandSearch])

  const getSelectedCount = (key) => {
    const value = localFilters[key]
    if (Array.isArray(value)) return value.length
    if (key === 'priceRange') {
      return (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 100000) ? 1 : 0
    }
    return 0
  }

  const handleBrandToggle = (brand) => {
    setLocalFilters((prev) => ({
      ...prev,
      brands: prev.brands?.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...(prev.brands || []), brand],
    }))
  }

  const handleMaterialToggle = (material) => {
    setLocalFilters((prev) => ({
      ...prev,
      materials: prev.materials?.includes(material)
        ? prev.materials.filter((m) => m !== material)
        : [...(prev.materials || []), material],
    }))
  }

  const handleOccasionToggle = (occasion) => {
    setLocalFilters((prev) => ({
      ...prev,
      occasions: prev.occasions?.includes(occasion)
        ? prev.occasions.filter((o) => o !== occasion)
        : [...(prev.occasions || []), occasion],
    }))
  }

  const handleColorToggle = (color) => {
    setLocalFilters((prev) => ({
      ...prev,
      colors: prev.colors?.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...(prev.colors || []), color],
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
    const numValue = parseInt(value) || 0
    setLocalFilters((prev) => ({
      ...prev,
      priceRange: index === 0
        ? [numValue, prev.priceRange[1]]
        : [prev.priceRange[0], numValue],
    }))
  }

  const handleReset = () => {
    setLocalFilters({
      priceRange: [0, 100000],
      brands: [],
      materials: [],
      occasions: [],
      colors: [],
      ratings: [],
    })
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  const totalSelectedCount = 
    getSelectedCount('brands') +
    getSelectedCount('priceRange') +
    getSelectedCount('materials') +
    getSelectedCount('occasions') +
    getSelectedCount('colors') +
    getSelectedCount('ratings')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                        value={localFilters.priceRange[0]}
                        onChange={(e) => handlePriceChange(0, e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Max</label>
                      <input
                        type="number"
                        value={localFilters.priceRange[1]}
                        onChange={(e) => handlePriceChange(1, e.target.value)}
                        placeholder="100000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Material */}
              <FilterSection
                title="Material"
                count={getSelectedCount('materials')}
                defaultOpen={false}
              >
                <div className="space-y-1">
                  {materials.map((material) => (
                    <FilterOption
                      key={material}
                      label={material}
                      value={material}
                      checked={localFilters.materials?.includes(material) || false}
                      onChange={handleMaterialToggle}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Occasion */}
              <FilterSection
                title="Occasion"
                count={getSelectedCount('occasions')}
                defaultOpen={false}
              >
                <div className="space-y-1">
                  {occasions.map((occasion) => (
                    <FilterOption
                      key={occasion}
                      label={occasion}
                      value={occasion}
                      checked={localFilters.occasions?.includes(occasion) || false}
                      onChange={handleOccasionToggle}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Rating */}
              <FilterSection
                title="Rating"
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
                      icon={option.icon}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Color */}
              <FilterSection
                title="Color"
                count={getSelectedCount('colors')}
                defaultOpen={false}
              >
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorToggle(color.name)}
                      className={`relative aspect-square rounded-lg border-2 transition-all ${
                        localFilters.colors?.includes(color.name)
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      aria-label={color.name}
                    >
                      {localFilters.colors?.includes(color.name) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-900 rounded-full" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </FilterSection>
            </div>

            {/* Footer - Apply Button */}
            <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
              <button
                onClick={handleApply}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Apply Filters {resultCount > 0 && `(${resultCount})`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LuxuryFilterPanel

