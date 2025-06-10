import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { OutfitFeedScreen } from '../screens/OutfitFeedScreen';
import { PostScreen } from '../screens/PostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#000000',
        borderTopColor: '#333333',
      },
      tabBarActiveTintColor: '#ffffff',
      tabBarInactiveTintColor: '#666666',
    }}
  >
    <Tab.Screen 
      name="Articles" 
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>🏷️</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Outfits" 
      component={OutfitFeedScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>👗</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Post" 
      component={PostScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>➕</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 18 }}>👤</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
    <Text style={{ color: '#ffffff' }}>Loading...</Text>
  </View>
);

// Debug component to show auth state (remove in production)
const DebugInfo = () => {
  const { session, isNewUser } = useAuth();
  
  if (__DEV__) {
    return (
      <View style={{ 
        position: 'absolute', 
        top: 50, 
        right: 10, 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        padding: 5, 
        borderRadius: 5,
        zIndex: 1000 
      }}>
        <Text style={{ fontSize: 10, color: 'black' }}>
          Session: {session ? '✓' : '✗'}
        </Text>
        <Text style={{ fontSize: 10, color: 'black' }}>
          New User: {isNewUser ? '✓' : '✗'}
        </Text>
      </View>
    );
  }
  return null;
};

export const AppNavigator = () => {
  const { session, loading, isNewUser } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <DebugInfo />
      {session ? (isNewUser ? <OnboardingStack /> : <MainTabs />) : <AuthStack />}
    </NavigationContainer>
  );
};
