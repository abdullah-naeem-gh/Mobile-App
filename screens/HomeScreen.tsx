import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const HomeScreen: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Articles Feed</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Articles feed will be implemented here
          </Text>
          <Text style={styles.subText}>
            • Brand-uploaded clothing items{'\n'}
            • Like/dislike/save functionality{'\n'}
            • Filters by gender, category, brand{'\n'}
            • Direct links to brand websites
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: '#666666',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  placeholder: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    marginTop: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
