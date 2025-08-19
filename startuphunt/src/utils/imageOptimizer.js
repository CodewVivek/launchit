import { trackImageOptimization } from './performanceMonitor';

/**
 * Image Optimization Utility
 * Prevents massive image size issues like 2048x2048 logos displayed at 368x36
 */

// Maximum dimensions for different image types
const MAX_DIMENSIONS = {
  logo: { width: 128, height: 128 },      // For logos (36x36 display)
  thumbnail: { width: 400, height: 300 }, // For thumbnails (364x205 display)
  cover: { width: 800, height: 600 },     // For cover images
  avatar: { width: 64, height: 64 }       // For user avatars
};

/**
 * Optimize image dimensions before upload
 * @param {File} file - Original image file
 * @param {string} type - Image type (logo, thumbnail, cover, avatar)
 * @returns {Promise<Blob>} - Optimized image blob
 */
export const optimizeImage = async (file, type = 'thumbnail') => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const maxDims = MAX_DIMENSIONS[type] || MAX_DIMENSIONS.thumbnail;
      
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = maxDims;
      const aspectRatio = img.width / img.height;
      
      if (aspectRatio > 1) {
        // Landscape image
        height = width / aspectRatio;
      } else {
        // Portrait image
        width = height * aspectRatio;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw optimized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with quality optimization
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Track performance improvement
            trackImageOptimization(file.size, blob.size);
            resolve(blob);
          } else {
            reject(new Error('Failed to create optimized image'));
          }
        },
        'image/jpeg',
        0.85 // 85% quality for good balance
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image dimensions
 * @param {File} file - Image file
 * @param {string} type - Image type
 * @returns {boolean} - Whether dimensions are acceptable
 */
export const validateImageDimensions = (file, type = 'thumbnail') => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDims = MAX_DIMENSIONS[type] || MAX_DIMENSIONS.thumbnail;
      const isAcceptable = img.width <= maxDims.width && img.height <= maxDims.height;
      resolve(isAcceptable);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}; 