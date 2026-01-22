/**
 * Product URL utilities
 * Supports vendor-slug/product-slug format for SEO
 */

/**
 * Generate product URL with vendor slug for SEO
 * Format: /product/vendor-slug/product-slug (for better SEO)
 * Falls back to: /product/product-slug if vendorSlug not available
 */
export function getProductUrl(product) {
  if (!product) return "/";
  
  // If product has seoUrl (from API), use it
  if (product.seoUrl) {
    return `/product/${product.seoUrl}`;
  }
  
  // If product has vendorSlug and baseSlug, use vendor-slug/product-slug format
  if (product.vendorSlug && product.baseSlug) {
    return `/product/${product.vendorSlug}/${product.baseSlug}`;
  }
  
  // If product has vendorSlug but no baseSlug, try to extract from slug
  if (product.vendorSlug && product.slug) {
    // Check if slug already contains vendor slug
    const slugLower = product.slug.toLowerCase();
    const vendorLower = product.vendorSlug.toLowerCase();
    
    if (slugLower.includes(vendorLower)) {
      // Extract base slug by removing vendor slug
      const baseSlug = slugLower.replace(`-${vendorLower}`, '').replace(`${vendorLower}-`, '');
      return `/product/${product.vendorSlug}/${baseSlug}`;
    }
    // Use full slug if we can't extract
    return `/product/${product.slug}`;
  }
  
  // Fallback to simple slug
  return `/product/${product.slug || product.id}`;
}

/**
 * Parse product slug from URL
 * Handles both formats:
 * - vendor-slug/product-slug
 * - simple-product-slug
 */
export function parseProductSlug(urlSlug) {
  if (!urlSlug) return null;
  
  // Check if it's in vendor-slug/product-slug format
  if (urlSlug.includes('/')) {
    const [vendorSlug, productSlug] = urlSlug.split('/');
    return {
      vendorSlug,
      productSlug,
      fullSlug: urlSlug,
      isVendorFormat: true
    };
  }
  
  // Simple slug format
  return {
    slug: urlSlug,
    isVendorFormat: false
  };
}

/**
 * Extract vendor slug from product
 */
export function getVendorSlug(product) {
  return product?.vendorSlug || null;
}
