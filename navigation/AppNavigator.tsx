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
import { FullScreenArticleScreen } from '../screens/FullScreenArticleScreen';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

// Create stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="FullScreenArticle" component={FullScreenArticleScreen} />
  </Stack.Navigator>
);

const OutfitStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OutfitFeedScreen" component={OutfitFeedScreen} />
  </Stack.Navigator>
);

const PostStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PostScreen" component={PostScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e0e0e0',
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: 8,
        height: 80,
      },
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#9e9e9e',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
      },
    }}
  >
    <Tab.Screen 
      name="Articles" 
      component={HomeStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "pricetag" : "pricetag-outline"} size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Outfits" 
      component={OutfitStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "shirt" : "shirt-outline"} size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Post" 
      component={PostStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "add-circle" : "add-circle-outline"} size={24} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "person" : "person-outline"} size={24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
    <Text style={{ color: '#000000' }}>Loading...</Text>
  </View>
);

// Debug component to show auth state (remove in production)
// const DebugInfo = () => {
//   const { session, isNewUser } = useAuth();
  
//   if (__DEV__) {
//     return (
//       <View style={{ 
//         position: 'absolute', 
//         top: 50, 
//         right: 10, 
//         backgroundColor: 'rgba(255,255,255,0.8)', 
//         padding: 5, 
//         borderRadius: 5,
//         zIndex: 1000 
//       }}>
//         <Text style={{ fontSize: 10, color: 'black' }}>
//           Session: {session ? '✓' : '✗'}
//         </Text>
//         <Text style={{ fontSize: 10, color: 'black' }}>
//           New User: {isNewUser ? '✓' : '✗'}
//         </Text>
//       </View>
//     );
//   }
//   return null;
// };

export const AppNavigator = () => {
  const { session, loading, isNewUser } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {/* <DebugInfo /> */}
      {session ? (isNewUser ? <OnboardingStack /> : <MainTabs />) : <AuthStack />}
    </NavigationContainer>
  );
};
