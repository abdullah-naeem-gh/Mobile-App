import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

const genderOptions = ['male', 'female', 'unisex'];
const bodyTypeOptions = ['rectangle', 'pear', 'apple', 'hourglass', 'inverted_triangle'];
const styleOptions = ['streetwear', 'old_money', 'minimalist', 'boho', 'classic', 'trendy', 'traditional'];
const occasionOptions = ['casual', 'formal', 'party', 'work', 'sport', 'beach', 'eid'];

export const OnboardingScreen = () => {
  const { completeOnboarding, session } = useAuth();
  const { profile, loading, error, userRole } = useProfile();
  const [userType, setUserType] = useState<'consumer' | 'brand' | null>(null);
  const [loadingState, setLoading] = useState(false);

  // Consumer fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<string>('');
  const [bodyType, setBodyType] = useState<string>('');
  const [preferredStyle, setPreferredStyle] = useState<string>('');
  const [preferredOccasions, setPreferredOccasions] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  // Brand fields
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
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
          website: website || null,
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
    if (!brandName) {
      Alert.alert('Error', 'Please fill in required fields (brand name)');
      return;
    }

    setLoading(true);
    try {
      // Create brand profile only - brands don't need user profiles
      const { error: brandError } = await supabase
        .from('brands')
        .insert({
          id: session?.user?.id,
          name: brandName,
          description: description || null,
          logo_url: logoUrl || null,
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

  // Show loading while fetching profile
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // Show error if profile fetch failed
  if (error || !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Error loading profile: {error || 'Profile not found'}
        </Text>
      </View>
    );
  }

  // Render appropriate form based on user role
  const renderOnboardingForm = () => {
    switch (userRole) {
      case 'consumer':
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
                    placeholderTextColor="#999999"
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
                    placeholderTextColor="#999999"
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

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Website</Text>
                  <TextInput
                    style={styles.input}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://yourwebsite.com"
                    placeholderTextColor="#666666"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleConsumerComplete}
                  disabled={loadingState}
                >
                  {loadingState ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.completeButtonText}>Complete Setup</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        );
      
      case 'brand':
        return (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Setup Your Brand</Text>
                <Text style={styles.subtitle}>Let's get your brand profile ready</Text>
              </View>

              <View style={styles.form}>
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
                  <Text style={styles.label}>Logo URL</Text>
                  <TextInput
                    style={styles.input}
                    value={logoUrl}
                    onChangeText={setLogoUrl}
                    placeholder="https://yourbrand.com/logo.png"
                    placeholderTextColor="#666666"
                    keyboardType="url"
                    autoCapitalize="none"
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
                  disabled={loadingState}
                >
                  {loadingState ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <Text style={styles.completeButtonText}>Complete Setup</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        );
      
      default:
        return (
          <View>
            <Text style={styles.errorText}>
              Invalid user role: {userRole}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderOnboardingForm()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D5C4', // Beige background
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
    color: '#000000', // Black text on beige
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  typeButton: {
    backgroundColor: '#ffffff', // White cards
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#000000', // Black border
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  typeButtonText: {
    color: '#000000', // Black text
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
    color: '#000000', // Black labels
    letterSpacing: -0.2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Soft gray border
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000', // Black text
    backgroundColor: '#ffffff', // White input background
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Soft gray border
    borderRadius: 20,
    backgroundColor: '#ffffff', // White background
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionButtonSelected: {
    borderColor: '#000000',
    backgroundColor: '#000000', // Black when selected
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 14,
    color: '#000000',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff', // White text when selected
  },
  completeButton: {
    height: 60,
    backgroundColor: '#000000', // Black button
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff', // White text on black button
    letterSpacing: -0.2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
  },
});
