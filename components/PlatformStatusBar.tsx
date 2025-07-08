import React from 'react';
import { StatusBar, Platform } from 'react-native';

interface PlatformStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
  translucent?: boolean;
}

export const PlatformStatusBar: React.FC<PlatformStatusBarProps> = ({
  backgroundColor = '#E8D5C4',
  barStyle = 'dark-content',
  translucent = Platform.OS === 'android',
}) => {
  return (
    <StatusBar
      barStyle={barStyle}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
};

// Usage example:
// <PlatformStatusBar backgroundColor="#E8D5C4" barStyle="dark-content" />
