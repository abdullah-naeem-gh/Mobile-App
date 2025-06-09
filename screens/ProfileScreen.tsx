import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export const ProfileScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Profile functionality will be implemented here
          </Text>
          <Text style={styles.subText}>
            • View/edit profile information{'\n'}
            • See posts, saved items, wardrobe{'\n'}
            • Follow/unfollow users{'\n'}
            • Followers and following counts
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
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
