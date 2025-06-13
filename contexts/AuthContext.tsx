import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: 'consumer' | 'brand' | null;
  loading: boolean;
  isNewUser: boolean;
  signUp: (email: string, password: string, role: 'consumer' | 'brand') => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<{ error?: any }>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'consumer' | 'brand' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
      checkIfNewUser(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserRole(session.user.id);
        await checkIfNewUser(session);
      } else if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setIsNewUser(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        return;
      }

      if (profile) {
        setUserRole(profile.role as 'consumer' | 'brand');
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole(null);
    }
  };

  const checkIfNewUser = async (session: Session | null) => {
    if (!session?.user) {
      setIsNewUser(false);
      return;
    }

    try {
      // Check if user has completed onboarding before
      const hasCompletedOnboarding = await AsyncStorage.getItem(`onboarding_completed_${session.user.id}`);
      
      if (!hasCompletedOnboarding) {
        // Since email verification is disabled, new users get immediate session
        // Check if this is a recently created account (within last 10 minutes)
        const userCreatedAt = new Date(session.user.created_at);
        const now = new Date();
        const timeDifference = now.getTime() - userCreatedAt.getTime();
        const tenMinutesInMs = 10 * 60 * 1000;
        
        if (timeDifference < tenMinutesInMs) {
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
      } else {
        setIsNewUser(false);
      }
    } catch (error) {
      console.error('Error checking new user status:', error);
      setIsNewUser(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'consumer' | 'brand') => {
    try {
      console.log('Starting signup with role:', role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });
      
      if (error) {
        console.error('Supabase auth.signUp error:', error);
        return { error };
      }
      
      console.log('Auth signup successful, user created:', data.user?.id);
      
      if (data.user && data.session) {
        // Wait for the profile to be created by the trigger
        // Poll the profiles table to ensure the profile was created with correct role
        let profileCreated = false;
        let attempts = 0;
        const maxAttempts = 10; // Maximum 5 seconds (500ms * 10)
        
        console.log('Waiting for profile creation...');
        
        while (!profileCreated && attempts < maxAttempts) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role, user_id')
              .eq('user_id', data.user.id)
              .single();
            
            if (profile && profile.role === role) {
              profileCreated = true;
              console.log('Profile created successfully with role:', profile.role);
            } else if (profileError) {
              if (profileError.code === 'PGRST116') {
                // Not found error, expected while waiting
                console.log(`Profile not found yet, attempt ${attempts + 1}/${maxAttempts}`);
              } else {
                console.error('Profile creation error:', profileError);
                return { error: new Error(`Failed to create user profile: ${profileError.message}`) };
              }
            }
          } catch (err) {
            console.error('Error checking profile creation:', err);
            return { error: new Error(`Profile verification failed: ${err}`) };
          }
          
          if (!profileCreated) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          }
        }
        
        if (!profileCreated) {
          console.error('Profile creation timed out');
          // If profile creation failed, clean up by signing out
          await supabase.auth.signOut();
          return { error: new Error('Profile creation timed out. Please try again.') };
        }
        
        // User is automatically logged in after signup (no email verification)
        // Mark them as a new user so they go to onboarding
        setIsNewUser(true);
      }
      
      return {};
    } catch (error) {
      console.error('SignUp error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('SignIn error:', error);
        return { error };
      }
      
      // checkIfNewUser will be called automatically by the auth state change
      return {};
    } catch (error) {
      console.error('SignIn error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
        return { error };
      }
      setUserRole(null);
      setIsNewUser(false);
      return {};
    } catch (error) {
      console.error('SignOut error:', error);
      return { error };
    }
  };

  const completeOnboarding = async () => {
    if (session?.user) {
      try {
        await AsyncStorage.setItem(`onboarding_completed_${session.user.id}`, 'true');
        setIsNewUser(false);
      } catch (error) {
        console.error('Error saving onboarding completion:', error);
        setIsNewUser(false);
      }
    }
  };

  const value = {
    session,
    user: session?.user || null,
    userRole,
    loading,
    isNewUser,
    signUp,
    signIn,
    signOut,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
