import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const genderOptions = ['male', 'female', 'unisex'];
const bodyTypeOptions = ['rectangle', 'pear', 'apple', 'hourglass', 'inverted_triangle'];
const styleOptions = ['streetwear', 'old_money', 'minimalist', 'boho', 'classic', 'trendy', 'traditional'];
const occasionOptions = ['casual', 'formal', 'party', 'work', 'sport', 'beach', 'eid'];

export const OnboardingScreen = () => {
  const { completeOnboarding, session } = useAuth();
  const [userType, setUserType] = useState<'consumer' | 'brand' | null>(null);
  const [loading, setLoading] = useState(false);

  // Consumer fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string>('');
  const [bodyType, setBodyType] = useState<string>('');
  const [preferredStyle, setPreferredStyle] = useState<string>('');
  const [preferredOccasions, setPreferredOccasions] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  // Brand fields
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const toggleOccasion = (occasion: string) => {
    setPreferredOccasions(prev =>
      prev.includes(occasion)
        ? prev.filter(o => o !== occasion)
        : [...prev, occasion]
    );
  };

  const handleConsumerComplete = async () => {
    if (!username || !fullName) {
      Alert.alert('Error', 'Please fill in required fields (username and full name)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: session?.user?.id,
          username,
          full_name: fullName,
          bio: bio || null,
          gender: gender || null,
          body_type: bodyType || null,
          preferred_style: preferredStyle || null,
          preferred_occasions: preferredOccasions.length > 0 ? preferredOccasions : null,
          location: location || null,
          is_brand: false,
        });

      if (error) throw error;
      await completeOnboarding();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandComplete = async () => {
    if (!username || !brandName) {
      Alert.alert('Error', 'Please fill in required fields (username and brand name)');
      return;
    }

    setLoading(true);
    try {
      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: session?.user?.id,
          username,
          full_name: brandName,
          bio: description || null,
          website: websiteUrl || null,
          is_brand: true,
        });

      if (userError) throw userError;

      // Create brand profile
      const { error: brandError } = await supabase
        .from('brands')
        .insert({
          name: brandName,
          description: description || null,
          website_url: websiteUrl || null,
          instagram_handle: instagramHandle || null,
          contact_email: contactEmail || null,
        });

      if (brandError) throw brandError;
      await completeOnboarding();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.description}>
          How would you like to use our app?
        </Text>
        
        <TouchableOpacity style={styles.typeButton} onPress={() => setUserType('consumer')}>
          <Text style={styles.typeButtonText}>👤 I'm here to discover fashion</Text>
          <Text style={styles.typeButtonSubtext}>Browse and get outfit inspiration</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.typeButton} onPress={() => setUserType('brand')}>
          <Text style={styles.typeButtonText}>🏢 I'm a fashion brand</Text>
          <Text style={styles.typeButtonSubtext}>Showcase products and connect with customers</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (userType === 'consumer') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Help us personalize your experience</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a unique username"
                placeholderTextColor="#666666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#666666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#666666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.optionsGrid}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      gender === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        gender === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Body Type</Text>
              <View style={styles.optionsGrid}>
                {bodyTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      bodyType === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setBodyType(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        bodyType === option && styles.optionTextSelected,
                      ]}
                    >
                      {option.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Preferred Style</Text>
              <View style={styles.optionsGrid}>
                {styleOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      preferredStyle === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setPreferredStyle(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        preferredStyle === option && styles.optionTextSelected,
                      ]}
                    >
                      {option.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Preferred Occasions (Select multiple)</Text>
              <View style={styles.optionsGrid}>
                {occasionOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      preferredOccasions.includes(option) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleOccasion(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        preferredOccasions.includes(option) && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor="#666666"
              />
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleConsumerComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Brand onboarding
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Brand</Text>
          <Text style={styles.subtitle}>Let's get your brand profile ready</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a unique username"
              placeholderTextColor="#666666"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand Name *</Text>
            <TextInput
              style={styles.input}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Your brand name"
              placeholderTextColor="#666666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Brand Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us about your brand..."
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://yourbrand.com"
              placeholderTextColor="#666666"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Instagram Handle</Text>
            <TextInput
              style={styles.input}
              value={instagramHandle}
              onChangeText={setInstagramHandle}
              placeholder="@yourbrand"
              placeholderTextColor="#666666"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="contact@yourbrand.com"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleBrandComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  typeButton: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  typeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeButtonSubtext: {
    color: '#666666',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  inputContainer: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    backgroundColor: '#111111',
  },
  optionButtonSelected: {
    borderColor: '#f5f5f5',
    backgroundColor: '#333333',
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  completeButton: {
    height: 60,
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});
