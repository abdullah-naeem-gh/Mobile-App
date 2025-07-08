import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { articleService } from '../services/articleService';
import { Article } from '../types';

interface ArticleSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
  selectedArticle?: Article | null;
}

export const ArticleSearchModal: React.FC<ArticleSearchModalProps> = ({
  visible,
  onClose,
  onSelectArticle,
  selectedArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSelectedArticle, setCurrentSelectedArticle] = useState<Article | null>(selectedArticle || null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchArticles();
    } else {
      setArticles([]);
      setHasSearched(false);
    }
  }, [searchQuery]);

  const searchArticles = async () => {
    setLoading(true);
    try {
      const result = await articleService.getArticles({
        search: searchQuery,
        limit: 20,
      });
      
      if (result.success && result.data) {
        setArticles(result.data);
      }
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArticle = (article: Article) => {
    setCurrentSelectedArticle(article);
  };

  const handleConfirm = () => {
    if (currentSelectedArticle) {
      onSelectArticle(currentSelectedArticle);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setArticles([]);
    setHasSearched(false);
    setCurrentSelectedArticle(null);
    onClose();
  };

  const renderArticleItem = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={[
        styles.articleItem,
        currentSelectedArticle?.id === item.id && styles.selectedArticleItem,
      ]}
      onPress={() => handleSelectArticle(item)}
    >
      {item.image_urls && item.image_urls[0] && (
        <Image
          source={{ uri: item.image_urls[0] }}
          style={styles.articleImage}
        />
      )}
      <View style={styles.articleInfo}>
        <Text style={[styles.articleTitle, currentSelectedArticle?.id === item.id && styles.selectedArticleTitle]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.articlePrice, currentSelectedArticle?.id === item.id && styles.selectedArticlePrice]}>
          {item.currency} {item.price}
        </Text>
        <Text style={styles.articleCategory}>
          {item.category} • {item.gender}
        </Text>
      </View>
      {currentSelectedArticle?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
      )}
    </TouchableOpacity>
  );

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.title}>Select Article</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search articles..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchQuery.length < 2 ? (
              <View style={styles.instructionContainer}>
                <Ionicons name="search" size={48} color="#666" />
                <Text style={styles.instructionText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            ) : articles.length === 0 && hasSearched ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="sad-outline" size={48} color="#666" />
                <Text style={styles.noResultsText}>
                  No articles found for "{searchQuery}"
                </Text>
              </View>
            ) : (
              <FlatList
                data={articles}
                renderItem={renderArticleItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.confirmButton,
                !currentSelectedArticle && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!currentSelectedArticle}
            >
              <Text style={[
                styles.confirmButtonText,
                !currentSelectedArticle && styles.disabledButtonText,
              ]}>
                {currentSelectedArticle ? 'Confirm' : 'Select Article'}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000000', // Black border
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', // Black text
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // White background
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#000000', // Black border
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000000', // Black text
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
  instructionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  instructionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)', // Light black border
    backgroundColor: '#ffffff', // White background for list items
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  selectedArticleItem: {
    backgroundColor: '#000000', // Black when selected
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  articleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    color: '#000000', // Black text
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedArticleTitle: {
    color: '#ffffff', // White text when selected
  },
  articlePrice: {
    color: '#000000', // Black text
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedArticlePrice: {
    color: '#ffffff', // White text when selected
  },
  articleCategory: {
    color: '#666',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#000000', // Black border
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
    borderColor: '#000000', // Black border
  },
  confirmButton: {
    backgroundColor: '#000000', // Black button
  },
  disabledButton: {
    backgroundColor: '#999999', // Gray when disabled
  },
  cancelButtonText: {
    color: '#000000', // Black text
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff', // White text on black button
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#666',
  },
});
