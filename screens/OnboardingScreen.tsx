// OnboardingScreen — role-specific profile setup shown right after signup.
// Consumers fill identity + style preferences and continue into the Style
// Quiz (step 2); brands fill their brand profile and finish onboarding.
// Re-skinned to the design system (Field / Chip / Button + theme tokens);
// the Supabase insert + completeOnboarding wiring is unchanged.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { Field, Chip, Button } from '../components/ui';
import { colors, spacing, fontFamily } from '../theme';

const genderOptions = ['male', 'female', 'unisex'];
const bodyTypeOptions = ['rectangle', 'pear', 'apple', 'hourglass', 'inverted_triangle'];
const styleOptions = ['streetwear', 'old_money', 'minimalist', 'boho', 'classic', 'trendy', 'traditional'];
const occasionOptions = ['casual', 'formal', 'party', 'work', 'sport', 'beach', 'eid'];

const pretty = (option: string) =>
  option.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// A labelled wrap of single- or multi-select chips.
const OptionGroup: React.FC<{
  label: string;
  options: string[];
  isSelected: (option: string) => boolean;
  onToggle: (option: string) => void;
}> = ({ label, options, isSelected, onToggle }) => (
  <View style={styles.group}>
    <Text style={styles.groupLabel}>{label}</Text>
    <View style={styles.chipWrap}>
      {options.map((option) => (
        <Chip
          key={option}
          label={pretty(option)}
          active={isSelected(option)}
          onPress={() => onToggle(option)}
        />
      ))}
    </View>
  </View>
);

export const OnboardingScreen = () => {
  const { completeOnboarding, session } = useAuth();
  const navigation = useNavigation<any>();
  const { profile, loading, error, userRole } = useProfile();
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
    setPreferredOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion],
    );
  };

  const handleConsumerComplete = async () => {
    if (!username || !fullName) {
      Alert.alert('Error', 'Please fill in required fields (username and full name)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('users').insert({
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
      // Consumers get the style quiz (taste seeding) before entering the feed.
      // The quiz completes onboarding when finished/skipped.
      navigation.navigate('StyleQuiz');
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
      const { error: brandError } = await supabase.from('brands').insert({
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
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.ink} />
        <Text style={styles.centeredText}>Loading your profile…</Text>
      </View>
    );
  }

  // Show error if profile fetch failed
  if (error || !profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          Error loading profile: {error || 'Profile not found'}
        </Text>
      </View>
    );
  }

  const isConsumer = userRole === 'consumer';
  const isBrand = userRole === 'brand';

  if (!isConsumer && !isBrand) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Invalid user role: {userRole}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {isConsumer ? <Text style={styles.step}>STEP 1 OF 2</Text> : null}
            <Text style={styles.title}>
              {isConsumer ? 'Complete your profile' : 'Set up your brand'}
            </Text>
            <Text style={styles.subtitle}>
              {isConsumer
                ? 'Help us personalize your experience.'
                : "Let's get your brand profile ready."}
            </Text>
          </View>

          {isConsumer ? (
            <View style={styles.form}>
              <Field
                label="Username *"
                value={username}
                onChangeText={setUsername}
                placeholder="Choose a unique username"
                autoCapitalize="none"
              />
              <Field
                label="Full Name *"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
              />
              <Field
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself…"
                multiline
              />

              <OptionGroup
                label="Gender"
                options={genderOptions}
                isSelected={(o) => gender === o}
                onToggle={setGender}
              />
              <OptionGroup
                label="Body Type"
                options={bodyTypeOptions}
                isSelected={(o) => bodyType === o}
                onToggle={setBodyType}
              />
              <OptionGroup
                label="Preferred Style"
                options={styleOptions}
                isSelected={(o) => preferredStyle === o}
                onToggle={setPreferredStyle}
              />
              <OptionGroup
                label="Preferred Occasions (select multiple)"
                options={occasionOptions}
                isSelected={(o) => preferredOccasions.includes(o)}
                onToggle={toggleOccasion}
              />

              <Field
                label="Location"
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
              />
              <Field
                label="Website"
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                keyboardType="url"
                autoCapitalize="none"
              />

              <Button
                label="Complete Setup"
                onPress={handleConsumerComplete}
                loading={loadingState}
                style={styles.submit}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Field
                label="Brand Name *"
                value={brandName}
                onChangeText={setBrandName}
                placeholder="Your brand name"
              />
              <Field
                label="Brand Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your brand…"
                multiline
              />
              <Field
                label="Logo URL"
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://yourbrand.com/logo.png"
                keyboardType="url"
                autoCapitalize="none"
              />
              <Field
                label="Website URL"
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                placeholder="https://yourbrand.com"
                keyboardType="url"
                autoCapitalize="none"
              />
              <Field
                label="Instagram Handle"
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                placeholder="@yourbrand"
                autoCapitalize="none"
              />
              <Field
                label="Contact Email"
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="contact@yourbrand.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Button
                label="Complete Setup"
                onPress={handleBrandComplete}
                loading={loadingState}
                style={styles.submit}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  centeredText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.muted,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  step: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.muted,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  form: {
    gap: spacing.xl,
  },
  group: {
    gap: spacing.s10,
  },
  groupLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
