import { Image, Platform } from 'react-native';

// Define type alias for image dimensions
type ImageDimensions = {
  width: number;
  height: number;
  aspectRatio: number;
};

// Define interface for image load options
interface ImageLoadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  cacheBuster?: boolean;
}

// Cache for image dimensions to avoid repeated requests
const dimensionCache: {
  [key: string]: ImageDimensions
} = {};

/**
 * Add cache busting parameter to URL to avoid stale cache issues
 */
const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
};

/**
 * Gets image dimensions with retry logic and caching
 */
export const getImageDimensions = async (
  imageUrl: string,
  options: ImageLoadOptions = {}
): Promise<ImageDimensions> => {
  // Extract options with defaults
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  const timeout = options.timeout || 10000;
  const cacheBuster = options.cacheBuster !== undefined ? options.cacheBuster : true;

  // Apply cache busting if enabled
  const processedUrl = cacheBuster ? addCacheBuster(imageUrl) : imageUrl;
  
  // Check cache first (using original URL for cache key)
  if (dimensionCache[imageUrl]) {
    return dimensionCache[imageUrl];
  }

  return new Promise((resolve, reject) => {
    let retries = 0;
    // Use simple number type for timeout ID
    let timeoutId: number;

    // Function to attempt loading image dimensions
    const attemptLoad = () => {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      // Set a new timeout for this attempt
      timeoutId = setTimeout(() => {
        if (retries < maxRetries) {
          console.log(`Image load timeout for ${imageUrl}, retrying (${retries + 1}/${maxRetries})...`);
          retries++;
          attemptLoad();
        } else {
          // Fallback to default dimensions on final failure
          const fallbackDimensions = getDefaultImageDimensions(imageUrl);
          dimensionCache[imageUrl] = fallbackDimensions;
          console.log(`Using fallback dimensions for ${imageUrl}:`, fallbackDimensions);
          resolve(fallbackDimensions);
        }
      }, timeout) as unknown as number; // Cast to number as React Native/JS uses number for timeouts
      
      // Attempt to get image size
      Image.getSize(
        processedUrl,
        (width, height) => {
          clearTimeout(timeoutId);
          const aspectRatio = width / height;
          
          // Cache the result
          const dimensions = { width, height, aspectRatio };
          dimensionCache[imageUrl] = dimensions;
          
          resolve(dimensions);
        },
        (error) => {
          clearTimeout(timeoutId);
          if (retries < maxRetries) {
            console.log(`Failed to get image dimensions, retrying (${retries + 1}/${maxRetries})...`);
            retries++;
            // Wait before retrying with longer delays for subsequent retries
            setTimeout(attemptLoad, retryDelay * (retries * 0.5 + 1));
          } else {
            console.error('Failed to get image dimensions after all retries:', error);
            // Fallback to default dimensions
            const fallbackDimensions = getDefaultImageDimensions(imageUrl);
            dimensionCache[imageUrl] = fallbackDimensions;
            console.log(`Using fallback dimensions for ${imageUrl}:`, fallbackDimensions);
            resolve(fallbackDimensions);
          }
        }
      );
    };

    // Start loading
    attemptLoad();
  });
};

/**
 * Get default dimensions based on image path/URL
 * This provides reasonable fallbacks when image loading fails
 */
const getDefaultImageDimensions = (imagePath: string): ImageDimensions => {
  const lowerPath = imagePath.toLowerCase();
  
  // Try to guess aspect ratio based on filename patterns or categories
  if (lowerPath.includes('_square') || lowerPath.includes('profile')) {
    // Square images (1:1)
    return { width: 600, height: 600, aspectRatio: 1 };
  } else if (lowerPath.includes('_banner') || lowerPath.includes('landscape')) {
    // Landscape/Banner images (16:9)
    return { width: 800, height: 450, aspectRatio: 16/9 };
  } else if (lowerPath.includes('product') || lowerPath.includes('article')) {
    // Product images typically 3:4 or 4:5 (portrait)
    return { width: 600, height: 800, aspectRatio: 3/4 };
  } else if (lowerPath.includes('outfit')) {
    // Outfit images often 4:5
    return { width: 600, height: 750, aspectRatio: 4/5 };
  } else {
    // General default - slightly portrait-oriented
    return { width: 600, height: 700, aspectRatio: 6/7 };
  }
};

/**
 * Calculate optimal dimensions based on original image and constraints
 */
export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  minHeight: number
): { width: number; height: number; aspectRatio: number } => {
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  // Start with maximum width
  let calculatedWidth = maxWidth;
  let calculatedHeight = calculatedWidth / aspectRatio;
  
  // If height is too tall, constrain by height instead
  if (calculatedHeight > maxHeight) {
    calculatedHeight = maxHeight;
    calculatedWidth = calculatedHeight * aspectRatio;
  }
  
  // If height is too short, enforce minimum height
  if (calculatedHeight < minHeight) {
    calculatedHeight = minHeight;
    calculatedWidth = calculatedHeight * aspectRatio;
  }
  
  return {
    width: calculatedWidth,
    height: calculatedHeight,
    aspectRatio
  };
};

/**
 * Create a pre-validated placeholder based on content type
 */
export const getPlaceholderDimensions = (
  contentType: 'article' | 'outfit' = 'article',
  screenWidth: number
): { width: number; height: number; aspectRatio: number } => {
  if (contentType === 'article') {
    // Article images are typically product shots, use 3:4 (portrait)
    return {
      width: screenWidth,
      height: screenWidth * 1.25,
      aspectRatio: 0.8 // 4:5 ratio
    };
  } else {
    // Outfits are typically square or slightly portrait
    return {
      width: screenWidth,
      height: screenWidth,
      aspectRatio: 1 // 1:1 ratio
    };
  }
};

/**
 * Preload multiple images to cache
 */
export const preloadImages = (urls: string[]) => {
  if (Platform.OS === 'web') return; // Not needed on web
  
  urls.forEach(url => {
    if (!url) return;
    
    // Add cache buster to URL for preloading
    const processedUrl = addCacheBuster(url);
    
    // Just trigger Image.prefetch without waiting
    Image.prefetch(processedUrl).catch(() => {
      // Silently fail - this is just preloading
    });
  });
};

/**
 * Clear image dimension cache
 */
export const clearImageCache = () => {
  for (const key in dimensionCache) {
    delete dimensionCache[key];
  }
};
