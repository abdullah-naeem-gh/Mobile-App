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
import Slider from '@react-native-community/slider';
import { CategoryType, GenderType } from '../types';
import { ArticleFilters, articleService } from '../services/articleService';

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
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: currentFilters.priceRange?.min || 0,
    max: currentFilters.priceRange?.max || 100000,
  });
  const [dbPriceRange, setDbPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form to current filters when modal opens
      setSearchQuery(currentFilters.search || '');
      setSelectedGender(currentFilters.gender);
      setSelectedCategory(currentFilters.category);
      setSelectedColors(currentFilters.colors || []);
      setSelectedSizes(currentFilters.sizes || []);
      
      // Load price range from database if not already loaded
      if (!priceRangeLoaded) {
        loadPriceRange();
      }
      
      // Set current price range or use db range
      if (currentFilters.priceRange) {
        setPriceRange(currentFilters.priceRange);
      } else if (priceRangeLoaded) {
        setPriceRange(dbPriceRange);
      }
    }
  }, [visible, currentFilters, priceRangeLoaded, dbPriceRange]);

  const loadPriceRange = async () => {
    try {
      const result = await articleService.getPriceRange();
      if (result.success && result.data) {
        setDbPriceRange(result.data);
        if (!currentFilters.priceRange) {
          setPriceRange(result.data);
        }
        setPriceRangeLoaded(true);
      } else {
        console.error('Failed to load price range:', result.error);
        // Set default values if API fails
        const defaultRange = { min: 0, max: 100000 };
        setDbPriceRange(defaultRange);
        setPriceRange(defaultRange);
        setPriceRangeLoaded(true);
      }
    } catch (error) {
      console.error('Error loading price range:', error);
      // Set default values on error
      const defaultRange = { min: 0, max: 100000 };
      setDbPriceRange(defaultRange);
      setPriceRange(defaultRange);
      setPriceRangeLoaded(true);
    }
  };

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
      priceRange: (priceRange.min !== dbPriceRange.min || priceRange.max !== dbPriceRange.max) 
        ? priceRange 
        : undefined,
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
    setPriceRange(dbPriceRange);
  };

  const hasActiveFilters = searchQuery.trim() || selectedGender || selectedCategory || 
                          selectedColors.length > 0 || selectedSizes.length > 0 ||
                          (priceRange.min !== dbPriceRange.min || priceRange.max !== dbPriceRange.max);

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
              <Ionicons name="close" size={24} color="#000" />
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
                  placeholderTextColor="#999"
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

            {/* Price Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Price Range</Text>
                {(priceRange.min !== dbPriceRange.min || priceRange.max !== dbPriceRange.max) && (
                  <View style={styles.activeFilterIndicator}>
                    <Text style={styles.activeFilterText}>Active</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceLabels}>
                  <Text style={styles.priceLabel}>PKR {priceRange.min.toLocaleString()}</Text>
                  <Text style={styles.priceLabel}>PKR {priceRange.max.toLocaleString()}</Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Minimum Price</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={dbPriceRange.min}
                    maximumValue={priceRange.max}
                    value={priceRange.min}
                    onValueChange={(value) => setPriceRange(prev => ({ ...prev, min: Math.round(value) }))}
                    minimumTrackTintColor="#000000"
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor="#000000"
                  />
                  <Text style={styles.sliderLabel}>Maximum Price</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={priceRange.min}
                    maximumValue={dbPriceRange.max}
                    value={priceRange.max}
                    onValueChange={(value) => setPriceRange(prev => ({ ...prev, max: Math.round(value) }))}
                    minimumTrackTintColor="#000000"
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor="#000000"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Min</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={priceRange.min.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        if (value >= dbPriceRange.min && value <= priceRange.max) {
                          setPriceRange(prev => ({ ...prev, min: value }));
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Max</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={priceRange.max.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        if (value <= dbPriceRange.max && value >= priceRange.min) {
                          setPriceRange(prev => ({ ...prev, max: value }));
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="100000"
                    />
                  </View>
                </View>
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
    backgroundColor: '#E8D5C4', // Beige background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)', // Very subtle border
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  clearAllButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  clearAllText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#ffffff', // White card background
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeFilterIndicator: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeFilterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Soft gray border
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000000',
  },
  clearSearchButton: {
    padding: 4,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f8f8', // Light gray background
    borderWidth: 1,
    borderColor: '#e0e0e0', // Soft border
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterChip: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)', // Very subtle border
    gap: 12,
    backgroundColor: '#ffffff', // White background for button area
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#000000',
  },
  cancelButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceRangeContainer: {
    marginTop: 8,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    marginTop: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

/**
 * FiltersModal Component
 * 
 * A comprehensive filtering modal for articles with the following features:
 * - Search by title/description
 * - Filter by gender (male, female, unisex)
 * - Filter by category (tops, bottoms, dresses, etc.)
 * - Filter by colors (multiple selection)
 * - Filter by sizes (multiple selection)
 * - Filter by price range (dual slider + text inputs)
 * 
 * The price range filter integrates with Supabase to:
 * - Fetch actual min/max prices from the database
 * - Apply price filtering in SQL queries
 * - Handle edge cases (null prices, empty data)
 */
