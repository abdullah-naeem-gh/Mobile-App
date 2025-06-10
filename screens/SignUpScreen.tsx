import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'consumer' | 'brand'>('consumer');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, role);
      setLoading(false);

      if (error) {
        Alert.alert('Sign Up Error', error.message);
      } else {
        // Since email verification is disabled, user is automatically signed in
        // Navigation will happen automatically via AuthContext
        Alert.alert(
          'Success',
          'Account created successfully! Setting up your profile...',
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Sign Up Error', 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'consumer' && styles.roleOptionSelected,
              ]}
              onPress={() => setRole('consumer')}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'consumer' && styles.roleOptionTextSelected,
                ]}
              >
                Fashion Enthusiast
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'brand' && styles.roleOptionSelected,
              ]}
              onPress={() => setRole('brand')}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'brand' && styles.roleOptionTextSelected,
                ]}
              >
                Brand/Designer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#666666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#666666"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor="#666666"
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.brushStrokeContainer}>
            <View style={styles.brushStroke} />
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.signUpButtonText}>Create account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    flex: 1,
    paddingHorizontal: 40,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#111111',
  },
  buttonContainer: {
    marginTop: 40,
  },
  brushStrokeContainer: {
    position: 'relative',
    height: 60,
  },
  brushStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    transform: [{ skewX: '-5deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signUpButton: {
    height: 60,
    backgroundColor: 'transparent',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  switchText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 20,
  },
  switchLink: {
    color: '#ffffff',
    fontWeight: '600',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  roleOptionSelected: {
    borderColor: '#f5f5f5',
    backgroundColor: '#222222',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
  },
});
