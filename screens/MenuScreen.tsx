import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface MenuScreenProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ visible, onClose, onNavigate }) => {
  const { signOut } = useAuth();
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

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
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <Animated.View 
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <SafeAreaView style={styles.menuContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('AccountSettings')}
              activeOpacity={0.7}
            >
              <Icon name="settings-outline" size={20} color="#000000" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Account Settings</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('Saved')}
              activeOpacity={0.7}
            >
              <Icon name="bookmark-outline" size={20} color="#000000" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Saved</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('Likes')}
              activeOpacity={0.7}
            >
              <Icon name="heart-outline" size={20} color="#000000" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Likes</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('Followers')}
              activeOpacity={0.7}
            >
              <Icon name="people-outline" size={20} color="#000000" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Followers</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('Following')}
              activeOpacity={0.7}
            >
              <Icon name="person-add-outline" size={20} color="#000000" style={styles.menuItemIcon} />
              <Text style={styles.menuItemText}>Following</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: '#E8D5C4', // Beige background
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: -5,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  menuContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
  },
  menuItems: {
    flex: 1,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  menuItemIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  signOutButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
