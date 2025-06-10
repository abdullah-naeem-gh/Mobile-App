import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isNewUser: boolean;
  signUp: (email: string, password: string, role: 'consumer' | 'brand') => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkIfNewUser(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await checkIfNewUser(session);
      } else if (event === 'SIGNED_OUT') {
        setIsNewUser(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        return { error };
      }
      
      if (data.user && data.session) {
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
        throw error;
      }
      
      // checkIfNewUser will be called automatically by the auth state change
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setIsNewUser(false);
    } catch (error) {
      console.error('SignOut error:', error);
      throw error;
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
