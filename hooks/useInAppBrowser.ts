import { useState, useCallback } from 'react';
import { cleanPurchaseUrl } from '../utils/urlUtils';

interface BrowserState {
  visible: boolean;
  url: string;
  title?: string;
}

export const useInAppBrowser = () => {
  const [browserState, setBrowserState] = useState<BrowserState>({
    visible: false,
    url: '',
    title: undefined,
  });

  const openBrowser = useCallback((url: string, title?: string) => {
    // Validate URL
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided to openBrowser');
      return;
    }

    // Clean the URL first
    const cleanedUrl = cleanPurchaseUrl(url);
    
    if (!cleanedUrl) {
      console.error('Unable to clean URL:', url);
      return;
    }

    // Additional URL validation
    try {
      new URL(cleanedUrl);
    } catch (error) {
      console.error('Invalid URL format after cleaning:', cleanedUrl, error);
      return;
    }

    console.log('Opening URL in browser:', cleanedUrl);

    setBrowserState({
      visible: true,
      url: cleanedUrl,
      title,
    });
  }, []);

  const closeBrowser = useCallback(() => {
    setBrowserState({
      visible: false,
      url: '',
      title: undefined,
    });
  }, []);

  return {
    browserState,
    openBrowser,
    closeBrowser,
  };
};
