'use client'

import React from 'react'
import Hero from '@/components/sections/Hero'
import Categories from '@/components/sections/Categories'
import QuickAccess from '@/components/sections/QuickAccess'
import PriceSpot from '@/components/sections/PriceSpot'
import SuperSavers from '@/components/sections/SuperSavers'
import FeaturedBrands from '@/components/sections/FeaturedBrands'
import TrendingProducts from '@/components/sections/TrendingProducts'
import WhyShopWithUs from '@/components/sections/WhyShopWithUs'
import SocialProof from '@/components/sections/SocialProof'
import MobileBottomNav from '@/components/navigation/MobileBottomNav'
import CartPopup from '@/components/mobile/CartPopup'
import PageWrapper from '@/components/common/PageWrapper'

function page() {
  return (
    <PageWrapper showLoader={false}>
      <div className="min-h-screen bg-white overflow-x-hidden py-16">
        <Hero />
        <Categories />
        <QuickAccess />
        <PriceSpot />
        <SuperSavers />
        {/* <FeaturedBrands /> */}
        <TrendingProducts />
        <WhyShopWithUs />
        <SocialProof />
        <CartPopup />
        <MobileBottomNav />
      </div>
    </PageWrapper>
  )
}

export default page