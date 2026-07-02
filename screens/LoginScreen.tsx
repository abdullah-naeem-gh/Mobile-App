// LoginScreen — email/password sign-in. Chrome comes from AuthScaffold;
// this file owns the form state + the useAuth().signIn call.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { Button, Field } from '../components/ui';
import { colors, fontFamily, spacing, radius } from '../theme';
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
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
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
        <Pressable style={styles.switch} onPress={() => navigation.navigate('SignUp')}>
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
      />

      {error ? (
        <View style={styles.errorBox}>
          <Icon name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF5F5',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#FFD5D5',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.error,
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
