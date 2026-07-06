// LoginScreen — email/password sign-in. Chrome comes from AuthScaffold;
// this file owns the form state + the useAuth().signIn call.

import React, { useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { Button, Field, ErrorBanner } from '../components/ui';
import { colors, fontFamily, fontSize, spacing } from '../theme';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: { navigate: (screen: 'SignUp') => void; goBack: () => void };
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(trimmedEmail, password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message || 'Login failed. Please try again.');
    }
  };

  return (
    <AuthScaffold
      title="Sign in to continue"
      subtitle="Discover your perfect style and explore fashion brands."
      footer={
        <Pressable
          style={styles.switch}
          hitSlop={spacing.md}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchLink}>Sign Up</Text>
          </Text>
        </Pressable>
      }
    >
      <Field
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (error) setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (error) setError(null);
        }}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <ErrorBanner message={error} />

      <Button
        label="Sign In"
        onPress={handleLogin}
        loading={loading}
        trailing={<Icon name="arrow-forward" size={20} color={colors.onCta} />}
      />
    </AuthScaffold>
  );
};

const styles = StyleSheet.create({
  switch: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: colors.ink,
  },
  switchLink: {
    fontFamily: fontFamily.bold,
    textDecorationLine: 'underline',
  },
});
