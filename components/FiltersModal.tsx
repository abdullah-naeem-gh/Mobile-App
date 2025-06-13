import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryType, GenderType } from '../types';
import { ArticleFilters } from '../services/articleService';

interface FiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ArticleFilters) => void;
  currentFilters: ArticleFilters;
}

const categories: CategoryType[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags'];
const genders: GenderType[] = ['male', 'female', 'unisex'];

// Common clothing colors
const colors = [
  'black', 'white', 'gray', 'navy', 'blue', 'red', 'pink', 'green', 
  'yellow', 'orange', 'purple', 'brown', 'beige', 'cream', 'gold', 'silver'
];

// Common clothing sizes  
const sizes = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
  '6', '7', '8', '9', '10', '11', '12'
];

export const FiltersModal: React.FC<FiltersModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '');
  const [selectedGender, setSelectedGender] = useState<GenderType | undefined>(currentFilters.gender);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | undefined>(currentFilters.category);
  const [selectedColors, setSelectedColors] = useState<string[]>(currentFilters.colors || []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(currentFilters.sizes || []);

  useEffect(() => {
    if (visible) {
      // Reset form to current filters when modal opens
      setSearchQuery(currentFilters.search || '');
      setSelectedGender(currentFilters.gender);
      setSelectedCategory(currentFilters.category);
      setSelectedColors(currentFilters.colors || []);
      setSelectedSizes(currentFilters.sizes || []);
    }
  }, [visible, currentFilters]);

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleApply = () => {
    const filters: ArticleFilters = {
      search: searchQuery.trim() || undefined,
      gender: selectedGender,
      category: selectedCategory,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    };
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedGender(undefined);
    setSelectedCategory(undefined);
    setSelectedColors([]);
    setSelectedSizes([]);
  };

  const hasActiveFilters = searchQuery.trim() || selectedGender || selectedCategory || 
                          selectedColors.length > 0 || selectedSizes.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleClear} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search</Text>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search articles..."
                  placeholderTextColor="#666"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Gender */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.filterGrid}>
                {genders.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.filterChip,
                      selectedGender === gender && styles.activeFilterChip,
                    ]}
                    onPress={() => setSelectedGender(selectedGender === gender ? undefined : gender)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedGender === gender && styles.activeFilterChipText,
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.filterGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      selectedCategory === category && styles.activeFilterChip,
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === category ? undefined : category)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === category && styles.activeFilterChipText,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Colors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Colors</Text>
              <View style={styles.filterGrid}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.filterChip,
                      selectedColors.includes(color) && styles.activeFilterChip,
                    ]}
                    onPress={() => handleColorToggle(color)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedColors.includes(color) && styles.activeFilterChipText,
                      ]}
                    >
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sizes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sizes</Text>
              <View style={styles.filterGrid}>
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.filterChip,
                      selectedSizes.includes(size) && styles.activeFilterChip,
                    ]}
                    onPress={() => handleSizeToggle(size)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSizes.includes(size) && styles.activeFilterChipText,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.bottomSpace} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>
                Apply{hasActiveFilters ? ' Filters' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  clearSearchButton: {
    padding: 4,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  activeFilterChip: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  activeFilterChipText: {
    color: '#000',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  applyButton: {
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
