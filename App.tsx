import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar 
          style="dark" 
          backgroundColor="#E8D5C4" 
          translucent={Platform.OS === 'android'}
        />
        <AppNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
}
