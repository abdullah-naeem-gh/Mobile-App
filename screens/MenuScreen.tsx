// MenuScreen — the settings drawer that slides in from the right of the
// Profile tab. Re-skinned to the design system: sand panel, Inter type,
// tokenized dividers, and an ink sign-out button. Behavior (slide animation,
// onNavigate routing, sign out) is unchanged.

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { PressableScale } from '../components/ui';
import { colors, radius, spacing, fontFamily, shadows } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

interface MenuScreenProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const MENU_ITEMS: { screen: string; label: string; icon: string }[] = [
  { screen: 'AccountSettings', label: 'Account Settings', icon: 'settings-outline' },
  { screen: 'Saved', label: 'Saved', icon: 'bookmark-outline' },
  { screen: 'Likes', label: 'Likes', icon: 'heart-outline' },
  { screen: 'Followers', label: 'Followers', icon: 'people-outline' },
  { screen: 'Following', label: 'Following', icon: 'person-add-outline' },
];

export const MenuScreen: React.FC<MenuScreenProps> = ({ visible, onClose, onNavigate }) => {
  const { signOut } = useAuth();
  const { width } = useResponsive();
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, width, slideAnim]);

  const handleMenuItemPress = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <PressableScale style={styles.backdrop} activeScale={1} onPress={onClose} />
      <Animated.View
        style={[styles.menuContainer, { width: width * 0.85, transform: [{ translateX: slideAnim }] }]}
      >
        <SafeAreaView style={styles.menuContent} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <PressableScale
              onPress={onClose}
              activeScale={0.9}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <Icon name="close" size={20} color={colors.ink} />
            </PressableScale>
          </View>

          <View style={styles.menuItems}>
            {MENU_ITEMS.map((item) => (
              <PressableScale
                key={item.screen}
                style={styles.menuItem}
                activeScale={0.98}
                onPress={() => handleMenuItemPress(item.screen)}
                accessibilityRole="button"
              >
                <Icon name={item.icon as any} size={20} color={colors.ink} style={styles.menuItemIcon} />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Icon name="chevron-forward" size={18} color={colors.muted} />
              </PressableScale>
            ))}
          </View>

          <View style={styles.footer}>
            <PressableScale
              style={styles.signOutButton}
              activeScale={0.98}
              onPress={handleSignOut}
              accessibilityRole="button"
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.panel,
    borderTopLeftRadius: radius.panel,
    borderBottomLeftRadius: radius.panel,
    ...shadows.float,
  },
  menuContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItems: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  menuItemIcon: {
    marginRight: spacing.lg,
    width: 24,
    textAlign: 'center',
  },
  menuItemText: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.ink,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  signOutButton: {
    backgroundColor: colors.ink,
    height: 52,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: colors.onDark,
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
});
