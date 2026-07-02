import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface InAppBrowserProps {
  url: string;
  title?: string;
  visible: boolean;
  onClose: () => void;
}

export const InAppBrowser: React.FC<InAppBrowserProps> = ({
  url,
  title,
  visible,
  onClose,
}) => {
  console.log('InAppBrowser props:', { url, title, visible });
  
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [pageTitle, setPageTitle] = useState(title || 'Loading...');
  const [webViewError, setWebViewError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Update currentUrl when url prop changes
  useEffect(() => {
    if (url && url !== currentUrl) {
      console.log('URL changed from', currentUrl, 'to', url);
      setCurrentUrl(url);
    }
  }, [url]);

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
  };

  const handleRefresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: currentUrl,
        title: pageTitle,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLoadStart = () => {
    console.log('WebView loading started for URL:', url);
    setLoading(true);
    setWebViewError(false);
    
    // Set a timeout to prevent infinite loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('WebView loading timeout');
      setLoading(false);
      setWebViewError(true);
    }, 30000); // 30 second timeout
  };

  const handleLoadEnd = () => {
    console.log('WebView loading ended successfully');
    setLoading(false);
    
    // Clear the timeout since loading completed
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const handleLoadProgress = (event: any) => {
    console.log('WebView loading progress:', event.nativeEvent.progress);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log('WebView should start load with request:', request.url);
    
    // Allow all requests for now, but log them
    return true;
  };

  const handleContentProcessDidTerminate = () => {
    console.log('WebView content process terminated');
    setLoading(false);
    setWebViewError(true);
    
    // Immediately fallback to external browser on crash
    Alert.alert(
      'Browser Error',
      'The in-app browser encountered an error. Opening link in your default browser instead.',
      [
        { text: 'Cancel', onPress: onClose },
        {
          text: 'Open in Browser',
          onPress: () => {
            import('react-native').then(({ Linking }) => {
              Linking.openURL(currentUrl);
              onClose();
            });
          }
        }
      ]
    );
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setPageTitle(navState.title || 'Loading...');
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView Error:', nativeEvent);
    
    // Set loading to false to prevent infinite loading state
    setLoading(false);
    setWebViewError(true);
    
    let errorMessage = 'Failed to load the page. Please check your internet connection and try again.';
    
    // Provide more specific error messages
    if (nativeEvent.description?.includes('net::ERR_NAME_NOT_RESOLVED')) {
      errorMessage = 'Website not found. Please check the URL and try again.';
    } else if (nativeEvent.description?.includes('net::ERR_INTERNET_DISCONNECTED')) {
      errorMessage = 'No internet connection. Please check your network and try again.';
    } else if (nativeEvent.description?.includes('net::ERR_CONNECTION_REFUSED')) {
      errorMessage = 'Connection refused by the website. The site might be temporarily unavailable.';
    } else if (nativeEvent.description?.includes('X-Frame-Options')) {
      errorMessage = 'This website cannot be displayed in the app browser. Opening in external browser instead.';
      // Fallback to external browser
      if (Platform.OS === 'ios') {
        import('react-native').then(({ Linking }) => {
          Linking.openURL(currentUrl);
          onClose();
        });
      }
    } else if (nativeEvent.description?.includes('ERR_UNKNOWN_URL_SCHEME')) {
      errorMessage = 'Unable to handle this URL format. Opening in external browser instead.';
      // Fallback to external browser
      import('react-native').then(({ Linking }) => {
        Linking.openURL(currentUrl);
        onClose();
      });
    }

    Alert.alert(
      'Error',
      errorMessage,
      [
        { text: 'Close', onPress: onClose },
        { text: 'Retry', onPress: () => {
          setWebViewError(false);
          handleRefresh();
        }},
        {
          text: 'Open in Browser',
          onPress: () => {
            import('react-native').then(({ Linking }) => {
              Linking.openURL(currentUrl);
              onClose();
            });
          }
        }
      ]
    );
  };

  if (!visible) return null;

  // Create a safe WebView wrapper that catches errors
  const SafeWebView = () => {
    try {
      return !webViewError ? (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onLoadProgress={handleLoadProgress}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onHttpError={handleError}
          onContentProcessDidTerminate={handleContentProcessDidTerminate}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          startInLoadingState={true}
          allowsBackForwardNavigationGestures={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          decelerationRate="normal"
          // Security settings
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Performance settings
          cacheEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // Additional settings for better compatibility
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          allowsFullscreenVideo={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={false}
          // Timeout settings
          originWhitelist={['*']}
          // Crash prevention
          injectedJavaScript={`
            try {
              // Prevent some common crashes
              window.addEventListener('error', function(e) {
                console.log('JavaScript error caught:', e);
                return false;
              });
              
              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                console.log('Unhandled promise rejection:', e);
                e.preventDefault();
              });
            } catch (e) {
              console.log('Error setting up error handlers:', e);
            }
          `}
        />
      ) : null;
    } catch (error) {
      console.error('WebView render error:', error);
      setWebViewError(true);
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="close" size={24} color="#000000" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {pageTitle}
          </Text>
          <Text style={styles.headerUrl} numberOfLines={1} ellipsizeMode="middle">
            {currentUrl}
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Icon name="share-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {loading && !webViewError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Error fallback */}
      {webViewError && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>
            Unable to load the webpage. Please check your internet connection or try opening in your browser.
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.errorButton} 
              onPress={() => {
                setWebViewError(false);
                handleRefresh();
              }}
            >
              <Text style={styles.errorButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.errorButton, styles.errorButtonSecondary]} 
              onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(currentUrl);
                  onClose();
                });
              }}
            >
              <Text style={[styles.errorButtonText, styles.errorButtonSecondaryText]}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* WebView */}
      <SafeWebView />

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          disabled={!canGoBack}
        >
          <Icon
            name="chevron-back"
            size={24}
            color={canGoBack ? "#007AFF" : "#C7C7CC"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoForward}
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          disabled={!canGoForward}
        >
          <Icon
            name="chevron-forward"
            size={24}
            color={canGoForward ? "#007AFF" : "#C7C7CC"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRefresh} style={styles.navButton}>
          <Icon name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity onPress={onClose} style={styles.navButton}>
          <Icon name="checkmark-done" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    backgroundColor: '#ffffff',
  },
  headerButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerUrl: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  webView: {
    flex: 1,
  },
  bottomNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  navButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  spacer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  errorButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorButtonSecondaryText: {
    color: '#007AFF',
  },
});
