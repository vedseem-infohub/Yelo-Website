'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpDown } from 'lucide-react'

const luxuryShopSortOptions = [
  { value: 'newest', label: 'New Arrivals' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'brand-az', label: 'Brand A-Z' },
]

const LuxuryShopSortPanel = ({ isOpen, onClose, selectedSort, onSelect }) => {
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
            className="fixed inset-0 bg-black/50 z-[70]"
            onClick={onClose}
          />

          {/* Sort Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-3xl shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-medium text-gray-900">Sort By</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                {luxuryShopSortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSelect(option.value)}
                    className={`w-full text-left py-4 px-4 rounded-lg transition-all ${
                      selectedSort === option.value
                        ? 'bg-gray-100 text-gray-900 font-medium border-2 border-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LuxuryShopSortPanel

