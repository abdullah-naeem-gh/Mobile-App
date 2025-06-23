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
}

// Cache for image dimensions to avoid repeated requests
const dimensionCache: {
  [key: string]: ImageDimensions
} = {};

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

  // Check cache first
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
          reject(new Error(`Timeout getting image dimensions after ${maxRetries} attempts`));
        }
      }, timeout) as unknown as number; // Cast to number as React Native/JS uses number for timeouts
      
      // Attempt to get image size
      Image.getSize(
        imageUrl,
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
            // Wait before retrying
            setTimeout(attemptLoad, retryDelay);
          } else {
            reject(error);
          }
        }
      );
    };

    // Start loading
    attemptLoad();
  });
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
    
    // Just trigger Image.prefetch without waiting
    Image.prefetch(url).catch(() => {
      // Silently fail - this is just preloading
    });
  });
};
