'use client'

import React from 'react'

const FilterOption = ({ 
  label, 
  value, 
  checked, 
  onChange, 
  type = 'checkbox',
  count,
  color,
  icon
}) => {
  if (type === 'color') {
    return (
      <button
        onClick={() => onChange(value)}
        className={`relative w-10 h-10 rounded-full border-2 transition-all ${
          checked
            ? 'border-yellow-500 scale-110 shadow-md'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        style={{ backgroundColor: color }}
        title={label}
        aria-label={label}
      >
        {checked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </span>
        )}
      </button>
    )
  }

  if (type === 'rating') {
    return (
      <label className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onChange(value)}
          className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
        />
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <span className="text-sm text-gray-700">{label}</span>
        </div>
        {count !== undefined && (
          <span className="text-xs text-gray-500">{count}</span>
        )}
      </label>
    )
  }

  return (
    <label className="flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(value)}
        className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
      />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">{count}</span>
      )}
    </label>
  )
}

export default FilterOption

