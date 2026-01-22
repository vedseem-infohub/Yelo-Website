'use client'

import React from 'react'
import MobileShopLayout from '@/components/mobile/MobileShopLayout'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'

export default function ShopPage() {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-white md:hidden">
        <MobileShopLayout />
        <CartPopup />
        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}

