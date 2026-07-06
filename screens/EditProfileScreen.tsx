// EditProfileScreen — edit the current user's name, bio, and avatar. Pushed
// from ProfileScreen with the current values as route params. Writes back to
// the role-appropriate table (brands / users) and uploads a new avatar to the
// profile_pics bucket.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { SubHeader, Field, Button, PressableScale } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { pickSquareImage, uploadImage } from '../lib/storage';
import { colors, spacing, fontFamily, fontSize } from '../theme';

interface EditProfileParams {
  name: string;
  bio: string;
  avatarUrl: string | null;
  isBrand: boolean;
}

export const EditProfileScreen: React.FC<any> = ({ route, navigation }) => {
  const { user } = useAuth();
  const params = route.params as EditProfileParams;
  const [name, setName] = useState(params.name);
  const [bio, setBio] = useState(params.bio);
  const [avatarUri, setAvatarUri] = useState<string | null>(params.avatarUrl);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const result = await pickSquareImage();
    if (result && !result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    setSaving(true);
    try {
      // Upload a freshly-picked local avatar (skip if it's still the remote URL).
      let avatarUrl = avatarUri;
      const isNewLocal = avatarUri && !avatarUri.startsWith('http');
      if (isNewLocal) {
        const upload = await uploadImage(avatarUri!, 'profile_pics', `avatar_${user.id}`, user.id);
        if (upload.success && upload.url) avatarUrl = upload.url;
        else throw new Error(upload.error || 'Failed to upload image');
      }

      const table = params.isBrand ? 'brands' : 'users';
      const payload = params.isBrand
        ? { name: name.trim(), description: bio.trim() || null, logo_url: avatarUrl }
        : { username: name.trim(), bio: bio.trim() || null, profile_pic_url: avatarUrl };

      const { error } = await supabase.from(table).update(payload).eq('id', user.id);
      if (error) throw new Error(error.message);

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title="Edit Profile" onBack={() => navigation.goBack()} centered />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <PressableScale style={styles.avatarWrap} activeScale={0.95} onPress={pickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Icon name="camera-outline" size={26} color={colors.muted} />
                </View>
              )}
              <View style={styles.editBadge}>
                <Icon name="camera" size={14} color={colors.onCta} />
              </View>
            </PressableScale>
            <Text style={styles.avatarHint}>Edit Profile Image</Text>

            <View style={styles.form}>
              <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
              <Field
                label="Bio / Description"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people about yourself"
                multiline
              />
            </View>

            <Button label="Save Changes" onPress={handleSave} loading={saving} style={styles.save} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    alignItems: 'center',
  },
  avatarWrap: {
    marginTop: spacing.sm,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: colors.avatarBorder,
  },
  avatarPlaceholder: {
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  avatarHint: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.meta,
    color: colors.muted,
    marginTop: spacing.md,
  },
  form: {
    alignSelf: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  save: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
  },
});
