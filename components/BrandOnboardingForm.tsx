import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';

interface BrandOnboardingFormProps {
  onComplete: () => Promise<void>;
}

const BrandOnboardingForm: React.FC<BrandOnboardingFormProps> = ({ onComplete }) => {
  const [brandName, setBrandName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!brandName.trim() || !companyName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Save brand-specific data to your profiles table or separate brand table
      // await supabase.from('profiles').update({...}).eq('user_id', userId);
      
      await onComplete();
    } catch (error) {
      console.error('Error completing brand onboarding:', error);
      setError('Error completing onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.label}>Brand Name *</Text>
          <TextInput
            style={styles.input}
            value={brandName}
            onChangeText={(text) => {
              setBrandName(text);
              if (error) setError(null);
            }}
            placeholder="Enter your brand name"
            placeholderTextColor="#666666"
          />

          <Text style={styles.label}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={(text) => {
              setCompanyName(text);
              if (error) setError(null);
            }}
            placeholder="Enter your company name"
            placeholderTextColor="#666666"
          />

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={(text) => {
              setWebsite(text);
              if (error) setError(null);
            }}
            placeholder="https://your-website.com"
            placeholderTextColor="#666666"
            keyboardType="url"
          />

          <Text style={styles.label}>Brand Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (error) setError(null);
            }}
            placeholder="Tell us about your brand..."
            placeholderTextColor="#666666"
            multiline
            numberOfLines={4}
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#ffffff',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#ffffff',
    backgroundColor: '#111111',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  errorContainer: {
    backgroundColor: '#ff0000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    height: 60,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BrandOnboardingForm;
