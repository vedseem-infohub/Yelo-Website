// Utility functions to derive shop-specific product lists on the frontend
// This mirrors the rules documented in SHOP_STRUCTURE_ANALYSIS.md so that
// every shop page consistently filters products from the same base dataset.

export const SHOP_SLUGS = {
  AFFORDABLE: 'affordable',
  UNDER_999: 'under-999',
  BEST_SELLERS: 'best-sellers',
  DEALS: 'deals',
  NEW_ARRIVALS: 'new-arrivals',
  OFFERS: 'offers',
  TRENDING: 'trending',
  SUPER_SAVERS: 'super-savers',
  PRICE_SPOT: 'price-spot',
  LUXURY_SHOP: 'luxury-shop',
}

// Helper to compute an effective discount percentage for a product
const getEffectiveDiscount = (product) => {
  const direct = product.discount || 0
  if (product.originalPrice && product.price) {
    const calculated = Math.round(
      ((product.originalPrice - product.price) / product.originalPrice) * 100
    )
    return Math.max(direct, calculated || 0)
  }
  return direct
}

// Base predicate for whether a product has "any discount"
const hasAnyDiscount = (product) => {
  if (product.discount && product.discount > 0) return true
  if (product.originalPrice && product.price) {
    return product.originalPrice > product.price
  }
  return false
}

// Core function: given a shop slug and all products, return the base list
// before UI filters (FilterPanel / SortPanel) are applied.
export function getShopBaseProducts(shopSlug, allProducts) {
  const now = Date.now()
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

  return allProducts.filter((product) => {
    const price = product.price || 0
    const rating = product.rating || 0
    const reviews = product.reviews || 0
    const effectiveDiscount = getEffectiveDiscount(product)

    const dateAddedMs = product.dateAdded ? Date.parse(product.dateAdded) : NaN
    const ageMs = Number.isNaN(dateAddedMs) ? Infinity : now - dateAddedMs

    switch (shopSlug) {
      // Affordable umbrella
      case SHOP_SLUGS.AFFORDABLE:
        return price <= 1000

      case SHOP_SLUGS.UNDER_999:
        return price < 999

      case SHOP_SLUGS.BEST_SELLERS:
        return price <= 1000 && (rating >= 4.5 || reviews >= 500)

      case SHOP_SLUGS.DEALS:
        return price <= 1000 && hasAnyDiscount(product)

      case SHOP_SLUGS.NEW_ARRIVALS:
        return price <= 1000 && ageMs <= THIRTY_DAYS_MS

      case SHOP_SLUGS.OFFERS:
        return price <= 1000 && hasAnyDiscount(product)

      case SHOP_SLUGS.TRENDING:
        return (
          price <= 1000 &&
          (rating >= 4.0 || reviews >= 100 || effectiveDiscount > 20)
        )

      case SHOP_SLUGS.SUPER_SAVERS:
        // Super Savers: allow up to 1299 in general, but still mainly affordable
        return price <= 1299

      case SHOP_SLUGS.PRICE_SPOT:
        // Price Spot: broader price band, capped for frontend demo
        return price <= 1999

      // Luxury umbrella - products with brand name
      case SHOP_SLUGS.LUXURY_SHOP:
        return product.brand && product.brand.trim() !== ''

      default:
        // If we don't recognise the slug, don't filter out anything
        return true
    }
  })
}


