import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { colors } from './theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar
            style="dark"
            backgroundColor={colors.panel}
            translucent={Platform.OS === 'android'}
          />
          {fontsLoaded ? (
            <AppNavigator />
          ) : (
            // Hold on a blank branded surface until Inter is ready so the
            // UI never flashes the system font first.
            <View style={{ flex: 1, backgroundColor: colors.bg }} />
          )}
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
