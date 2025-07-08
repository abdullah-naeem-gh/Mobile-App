import { Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Platform-specific constants
export const PLATFORM_CONSTANTS = {
  // Status bar height
  STATUS_BAR_HEIGHT: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  
  // Safe area top padding
  SAFE_AREA_TOP: Platform.OS === 'ios' ? 44 : 0, // iPhone notch area
  
  // Header heights
  HEADER_HEIGHT: Platform.OS === 'ios' ? 88 : 56, // Standard header heights
  
  // Content padding adjustments
  CONTENT_PADDING_TOP: Platform.OS === 'ios' ? 120 : 100,
  PROFILE_CARD_MARGIN_TOP: Platform.OS === 'ios' ? 0 : 10,
  
  // Header padding
  HEADER_PADDING_TOP: Platform.OS === 'ios' ? 60 : 20,
  HEADER_PADDING_TOP_SMALL: Platform.OS === 'ios' ? 20 : 10,
  
  // Card positioning
  ARTICLE_CARD_MARGIN_TOP: Platform.OS === 'ios' ? 100 : 55, // iOS: 100, Android: 55 (increased from 10 to move card down more)

  // Shadow/elevation differences
  SHADOW_PROPS: Platform.OS === 'ios' 
    ? {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }
    : {
        elevation: 8,
      },
};

// Platform-specific style helpers
export const createPlatformStyle = (iosStyle: any, androidStyle: any) => {
  return Platform.OS === 'ios' ? iosStyle : androidStyle;
};

// Safe area style helper
export const createSafeAreaStyle = (baseStyle: any) => {
  return {
    ...baseStyle,
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + (baseStyle.paddingTop || 0)
      : baseStyle.paddingTop || 0,
  };
};

// Header style helper
export const createHeaderStyle = (baseStyle: any) => {
  return {
    ...baseStyle,
    paddingTop: PLATFORM_CONSTANTS.HEADER_PADDING_TOP,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  };
};

// Container style helper with proper status bar handling
export const createContainerStyle = (baseStyle: any) => {
  return {
    ...baseStyle,
    ...createSafeAreaStyle(baseStyle),
  };
};

// Card style helper with platform-specific shadows
export const createCardStyle = (baseStyle: any) => {
  return {
    ...baseStyle,
    ...PLATFORM_CONSTANTS.SHADOW_PROPS,
  };
};

export default PLATFORM_CONSTANTS;
