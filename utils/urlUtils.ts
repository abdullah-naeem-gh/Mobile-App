/**
 * Utility functions for URL validation and cleanup
 */

/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Checks if a URL contains suspicious patterns that might indicate concatenated titles
 */
export const hasSuspiciousPatterns = (url: string): boolean => {
  const suspiciousPatterns = [
    /[A-Z][a-z]+[A-Z]/,  // CamelCase in the URL path (like "shoesTerron")
    /[a-z][A-Z][a-z]/,   // Mixed case that's not normal URL format
    /\w+[A-Z]\w+/,       // Words with capital letters in the middle
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      console.log('URL contains suspicious pattern:', pattern, url);
      return true;
    }
  }
  
  return false;
};

/**
 * Extracts and cleans up a URL from a potentially malformed purchase_url string
 * This handles cases where the URL might be concatenated with the article title
 */
export const cleanPurchaseUrl = (purchaseUrl: string): string | null => {
  if (!purchaseUrl || typeof purchaseUrl !== 'string') {
    return null;
  }

  // Log the input for debugging
  console.log('Cleaning purchase URL:', purchaseUrl);

  // First, check if it's already a valid URL
  if (isValidUrl(purchaseUrl)) {
    console.log('URL is already valid:', purchaseUrl);
    return purchaseUrl;
  }

  // Common patterns for URL + title concatenation
  // Pattern 1: URL ends with a product identifier then has title appended
  // Example: https://fittedshop.com/products/terron-field-shoesTerron
  const urlWithProductPattern = /(https?:\/\/[^\/]+\/[^\/]+\/[^\/]+\/[a-zA-Z0-9\-_]+)([A-Z][a-zA-Z\s&\-()]+)/;
  const productMatch = purchaseUrl.match(urlWithProductPattern);
  
  if (productMatch) {
    const extractedUrl = productMatch[1];
    console.log('Extracted URL from product pattern:', extractedUrl);
    
    if (isValidUrl(extractedUrl)) {
      return extractedUrl;
    }
  }

  // Pattern 2: More general URL + title concatenation
  // Look for URLs that might be followed by non-URL characters
  const urlWithTitlePattern = /(https?:\/\/[^\s]+?)([A-Z][^/?#]*)/;
  const titleMatch = purchaseUrl.match(urlWithTitlePattern);
  
  if (titleMatch) {
    const extractedUrl = titleMatch[1];
    console.log('Extracted URL from title pattern:', extractedUrl);
    
    if (isValidUrl(extractedUrl)) {
      return extractedUrl;
    }
  }

  // Pattern 3: Find the longest valid URL at the beginning
  const urlStartPattern = /^(https?:\/\/[^\s]*)/;
  const startMatch = purchaseUrl.match(urlStartPattern);
  
  if (startMatch) {
    let potentialUrl = startMatch[1];
    
    // Try to find the end of the URL by looking for common URL ending patterns
    // Remove everything after the last valid URL character
    const validUrlEnd = potentialUrl.match(/^(https?:\/\/[^\/]+(?:\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*[a-zA-Z0-9\-._~\/$])?)/);
    
    if (validUrlEnd) {
      potentialUrl = validUrlEnd[1];
      console.log('Extracted URL from start pattern:', potentialUrl);
      
      if (isValidUrl(potentialUrl)) {
        return potentialUrl;
      }
    }
  }

  // Try to extract any URL pattern from the string
  const urlPatterns = [
    /https?:\/\/[^\s]+/g,
    /www\.[^\s]+/g,
  ];

  for (const pattern of urlPatterns) {
    const matches = purchaseUrl.match(pattern);
    if (matches && matches.length > 0) {
      const potentialUrl = matches[0];
      
      // Clean up the URL by removing any trailing characters that might not be part of the URL
      const cleanedUrl = potentialUrl.replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=.%]+$/, '');
      
      // Ensure it has a protocol
      const finalUrl = cleanedUrl.startsWith('http') ? cleanedUrl : `https://${cleanedUrl}`;
      
      console.log('Extracted and cleaned URL:', finalUrl);
      
      if (isValidUrl(finalUrl)) {
        return finalUrl;
      }
    }
  }

  // If no valid URL found, return null
  console.log('No valid URL found in:', purchaseUrl);
  return null;
};

/**
 * Validates and formats a URL for use in the app
 */
export const validateAndFormatUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // First try to clean the URL
  const cleanedUrl = cleanPurchaseUrl(url);
  
  if (!cleanedUrl) {
    return null;
  }

  // Ensure the URL is properly formatted
  try {
    const urlObj = new URL(cleanedUrl);
    return urlObj.href;
  } catch {
    return null;
  }
};
