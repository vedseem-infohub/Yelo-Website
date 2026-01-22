'use client'

import React from 'react'
import { Truck, Shield, RotateCcw, Award } from 'lucide-react'

const features = [
  {
    id: 1,
    name: 'Fast Delivery',
    icon: Truck,
    description: 'Quick & reliable',
  },
  {
    id: 2,
    name: 'Secure Payments',
    icon: Shield,
    description: '100% protected',
  },
  {
    id: 3,
    name: 'Easy Returns',
    icon: RotateCcw,
    description: 'Hassle-free',
  },
  {
    id: 4,
    name: 'Quality Products',
    icon: Award,
    description: 'Premium quality',
  },
]

function WhyShopWithUs() {
  return (
    <div className="w-full bg-gray-50/50 px-4 py-10 md:px-8 md:py-14">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Shop With Us</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.id}
                className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
                  <IconComponent className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{feature.name}</h3>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WhyShopWithUs

