/**
 * Frontend Image Compression Utility using ConvertAPI via Backend
 * This utility sends images to the backend API for compression
 * 
 * Backend endpoint required: /api/upload/compress-image
 */

// Get API URL from environment or use default
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Check for Next.js environment variable
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  return 'http://localhost:5000/api';
};

/**
 * Compress a single image file using backend ConvertAPI
 * @param {File} file - Image file to compress
 * @param {number} quality - Quality level 1-100 (default: 30)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
export async function compressImage(file, quality = 30) {
  try {
    const API_URL = getApiUrl();
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', file);
    formData.append('quality', quality.toString());

    // Send to backend for compression
    const response = await fetch(`${API_URL}/upload/compress-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data || !result.data.base64) {
      throw new Error('Invalid response from compression service');
    }

    // Return as data URL
    return `data:${result.data.mimeType};base64,${result.data.base64}`;
  } catch (error) {
    // Fallback to client-side compression if backend fails
    return fallbackCompressImage(file);
  }
}

/**
 * Fallback client-side compression (used if backend compression fails)
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
function fallbackCompressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (use WebP if supported, else JPEG)
        try {
          const compressedDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(compressedDataUrl);
        } catch (error) {
          // Fallback to JPEG if WebP not supported
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
