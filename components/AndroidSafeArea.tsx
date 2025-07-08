import React from 'react';
import { View, Platform, StatusBar, StyleSheet } from 'react-native';

interface AndroidSafeAreaProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

/**
 * A component that only adds safe area padding on Android.
 * iOS apps should use SafeAreaView or handle safe areas as designed.
 * This component helps fix Android status bar overlap without affecting iOS.
 */
export const AndroidSafeArea: React.FC<AndroidSafeAreaProps> = ({ 
  children, 
  backgroundColor = 'transparent' 
}) => {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidContainer, { backgroundColor }]}>
        {children}
      </View>
    );
  }
  
  return <>{children}</>;
};

const styles = StyleSheet.create({
  androidContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
});
