// SignUpScreen — account creation with a consumer/brand role selector.
// Chrome comes from AuthScaffold; this file owns form state, validation, and
// the useAuth().signUp call.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/Ionicons';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { Button, Field, RoleChip, ErrorBanner } from '../components/ui';
import { colors, fontFamily, spacing } from '../theme';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  SignUp: undefined;
  Login: undefined;
  Home: undefined;
};

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  navigation: SignUpScreenNavigationProp;
}

type Role = 'consumer' | 'brand';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('consumer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const clearError = () => {
    if (error) setError(null);
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: signUpError } = await signUp(email, password, role);
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message || 'Sign up failed. Please try again.');
      } else {
        Alert.alert('Success', 'Account created successfully! Setting up your profile...', [
          { text: 'OK' },
        ]);
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Join the fashion community and start discovering your perfect style."
      footer={
        <Pressable style={styles.switch} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
      }
    >
      <View style={styles.roleBlock}>
        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          <RoleChip
            label="Fashion Enthusiast"
            selected={role === 'consumer'}
            onPress={() => setRole('consumer')}
          />
          <RoleChip
            label="Brand/Designer"
            selected={role === 'brand'}
            onPress={() => setRole('brand')}
          />
        </View>
      </View>

      <Field
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError();
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError();
        }}
        secureTextEntry
      />
      <Field
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={(t) => {
          setConfirmPassword(t);
          clearError();
        }}
        secureTextEntry
      />

      <ErrorBanner message={error} />

      <Button
        label="Create an Account"
        onPress={handleSignUp}
        loading={loading}
        trailing={<Icon name="arrow-forward" size={20} color={colors.onCta} />}
      />
    </AuthScaffold>
  );
};

const styles = StyleSheet.create({
  roleBlock: {
    gap: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
  switch: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.ink,
  },
  switchLink: {
    fontFamily: fontFamily.bold,
    textDecorationLine: 'underline',
  },
});
