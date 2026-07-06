// AccountSettingsScreen — opened from the Profile menu ("Account Settings").
// Rendered inline by ProfileScreen (same onBack pattern as SavedScreen).
// Shows the signed-in account, links to Edit Profile, an expandable
// change-password form (Supabase auth), and sign out.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SubHeader, PressableScale, Input, Button } from '../components/ui';
import { colors, radius, spacing, fontFamily, fontSize, typography } from '../theme';

interface AccountSettingsScreenProps {
  onBack: () => void;
  onEditProfile: () => void;
}

export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({
  onBack,
  onEditProfile,
}) => {
  const { user, userRole, signOut } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter the same password in both fields.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      Alert.alert('Could not update password', error.message);
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      Alert.alert('Password updated', 'Your password has been changed.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title="Account Settings" onBack={onBack} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Signed-in account card */}
          <View style={styles.accountCard}>
            <View style={styles.accountIconWrap}>
              <Icon name="person-outline" size={22} color={colors.ink} />
            </View>
            <View style={styles.accountMeta}>
              <Text style={styles.accountEmail} numberOfLines={1}>
                {user?.email ?? 'Signed in'}
              </Text>
              <Text style={styles.accountRole}>
                {userRole === 'brand' ? 'Brand account' : 'Consumer account'}
              </Text>
            </View>
          </View>

          {/* Settings rows */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.group}>
            <PressableScale
              style={styles.rowItem}
              activeScale={0.98}
              onPress={onEditProfile}
              accessibilityRole="button"
            >
              <Icon name="create-outline" size={20} color={colors.ink} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Edit Profile</Text>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </PressableScale>

            <PressableScale
              style={[styles.rowItem, !showPasswordForm && styles.rowItemLast]}
              activeScale={0.98}
              onPress={() => setShowPasswordForm((s) => !s)}
              accessibilityRole="button"
            >
              <Icon name="lock-closed-outline" size={20} color={colors.ink} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>Change Password</Text>
              <Icon
                name={showPasswordForm ? 'chevron-up' : 'chevron-forward'}
                size={18}
                color={colors.muted}
              />
            </PressableScale>

            {showPasswordForm && (
              <View style={styles.passwordForm}>
                <Input
                  placeholder="New password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <Input
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                {savingPassword ? (
                  <ActivityIndicator color={colors.ink} style={styles.passwordSpinner} />
                ) : (
                  <Button label="Update Password" onPress={handleChangePassword} />
                )}
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>SESSION</Text>
          <View style={styles.group}>
            <PressableScale
              style={[styles.rowItem, styles.rowItemLast]}
              activeScale={0.98}
              onPress={handleSignOut}
              accessibilityRole="button"
            >
              <Icon name="log-out-outline" size={20} color={colors.error} style={styles.rowIcon} />
              <Text style={[styles.rowLabel, styles.dangerLabel]}>Sign Out</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.x40 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: radius.panel,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  accountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountMeta: { flex: 1 },
  accountEmail: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.body,
    color: colors.ink,
  },
  accountRole: {
    ...typography.metaMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.micro,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  group: {
    backgroundColor: colors.input,
    borderRadius: radius.panel,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowItemLast: { borderBottomWidth: 0 },
  rowIcon: { marginRight: spacing.md, width: 24, textAlign: 'center' },
  rowLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: colors.ink,
  },
  dangerLabel: { color: colors.error },
  passwordForm: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  passwordSpinner: { paddingVertical: spacing.lg },
});
