import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface BrandOnboardingFormProps {
  onComplete: () => Promise<void>;
}

const BrandOnboardingForm: React.FC<BrandOnboardingFormProps> = ({ onComplete }) => {
  const [brandName, setBrandName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!brandName.trim() || !companyName.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Save brand-specific data to your profiles table or separate brand table
      // await supabase.from('profiles').update({...}).eq('user_id', userId);
      
      await onComplete();
    } catch (error) {
      console.error('Error completing brand onboarding:', error);
      alert('Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Brand Name *</Text>
      <TextInput
        style={styles.input}
        value={brandName}
        onChangeText={setBrandName}
        placeholder="Enter your brand name"
      />

      <Text style={styles.label}>Company Name *</Text>
      <TextInput
        style={styles.input}
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Enter your company name"
      />

      <Text style={styles.label}>Website</Text>
      <TextInput
        style={styles.input}
        value={website}
        onChangeText={setWebsite}
        placeholder="https://your-website.com"
        keyboardType="url"
      />

      <Text style={styles.label}>Brand Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Tell us about your brand..."
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

export default BrandOnboardingForm;
