import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface ConsumerOnboardingFormProps {
  onComplete: () => Promise<void>;
}

const ConsumerOnboardingForm: React.FC<ConsumerOnboardingFormProps> = ({ onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Save consumer-specific data to your profiles table or separate consumer table
      // await supabase.from('profiles').update({...}).eq('user_id', userId);
      
      await onComplete();
    } catch (error) {
      console.error('Error completing consumer onboarding:', error);
      alert('Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>First Name *</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter your first name"
      />

      <Text style={styles.label}>Last Name *</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter your last name"
      />

      <Text style={styles.label}>Shopping Preferences</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={preferences}
        onChangeText={setPreferences}
        placeholder="Tell us about your shopping preferences..."
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Completing...' : 'Complete Setup'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsumerOnboardingForm;
