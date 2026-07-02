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
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { useNavigation } from '@react-navigation/native';
import { FullScreenArticleScreen } from '../screens/FullScreenArticleScreen';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';

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

const SavedScreenWrapper = () => {
  const navigation = useNavigation();
  return <SavedScreen onBack={() => navigation.goBack()} />;
};

const SavedStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SavedScreen" component={SavedScreenWrapper} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e0e0e0',
        borderTopWidth: 1,
        paddingTop: 8,
        // Keep the tab bar clear of the Android gesture/nav bar and the iOS home indicator
        paddingBottom: Math.max(insets.bottom, 8),
        height: 64 + Math.max(insets.bottom, 8),
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
          <Icon name={focused ? "home" : "home-outline"} size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Outfits"
      component={OutfitStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "shirt" : "shirt-outline"} size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Post"
      component={PostStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "add-circle" : "add-circle-outline"} size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Saved"
      component={SavedStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "bookmark" : "bookmark-outline"} size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <Icon name={focused ? "person-circle" : "person-circle-outline"} size={26} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
    <Text style={{ color: '#000000' }}>Loading...</Text>
  </View>
);

export const AppNavigator = () => {
  const { session, loading, isNewUser } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {session ? (isNewUser ? <OnboardingStack /> : <MainTabs />) : <AuthStack />}
    </NavigationContainer>
  );
};
