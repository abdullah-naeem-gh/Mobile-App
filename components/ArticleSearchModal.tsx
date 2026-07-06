// ArticleSearchModal — search-and-pick an article to attach to an outfit tag
// (used by the composer's OutfitTagger flow). Re-skinned to the design
// system: Input search field, tokenized result rows (ink fill when selected)
// and a FiltersModal-style footer (cream Cancel / amber Confirm). Search,
// selection and confirm/close behavior are unchanged.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { articleService } from '../services/articleService';
import { Article } from '../types';
import { Input, PressableScale } from './ui';
import { colors, radius, spacing, fontFamily } from '../theme';

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

  const renderArticleItem = ({ item }: { item: Article }) => {
    const selected = currentSelectedArticle?.id === item.id;
    return (
      <PressableScale
        style={[styles.articleItem, selected && styles.selectedArticleItem]}
        activeScale={0.98}
        onPress={() => handleSelectArticle(item)}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        {item.image_urls && item.image_urls[0] && (
          <Image source={{ uri: item.image_urls[0] }} style={styles.articleImage} />
        )}
        <View style={styles.articleInfo}>
          <Text
            style={[styles.articleTitle, selected && styles.selectedText]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={[styles.articlePrice, selected && styles.selectedText]}>
            {item.currency} {item.price}
          </Text>
          <Text style={[styles.articleCategory, selected && styles.selectedMuted]}>
            {item.category} • {item.gender}
          </Text>
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.cta} />
        )}
      </PressableScale>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select Article</Text>
            <PressableScale
              onPress={handleClose}
              activeScale={0.9}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </PressableScale>
          </View>

          <View style={styles.searchContainer}>
            <Input
              placeholder="Search articles…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              trailing={
                searchQuery.length > 0 ? (
                  <PressableScale
                    onPress={() => setSearchQuery('')}
                    activeScale={0.85}
                    hitSlop={8}
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </PressableScale>
                ) : (
                  <Ionicons name="search" size={20} color={colors.muted} />
                )
              }
            />
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={colors.ink} />
                <Text style={styles.stateText}>Searching…</Text>
              </View>
            ) : searchQuery.length < 2 ? (
              <View style={styles.stateContainer}>
                <Ionicons name="search" size={44} color={colors.tag} />
                <Text style={styles.stateText}>Type at least 2 characters to search</Text>
              </View>
            ) : articles.length === 0 && hasSearched ? (
              <View style={styles.stateContainer}>
                <Ionicons name="sad-outline" size={44} color={colors.tag} />
                <Text style={styles.stateText}>No articles found for "{searchQuery}"</Text>
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
            <PressableScale
              style={[styles.actionButton, styles.cancelButton]}
              activeScale={0.97}
              onPress={handleClose}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </PressableScale>
            <PressableScale
              style={[
                styles.actionButton,
                styles.confirmButton,
                !currentSelectedArticle && styles.disabledButton,
              ]}
              activeScale={0.97}
              onPress={handleConfirm}
              disabled={!currentSelectedArticle}
              accessibilityRole="button"
              accessibilityState={{ disabled: !currentSelectedArticle }}
            >
              <Text style={styles.confirmButtonText}>
                {currentSelectedArticle ? 'Confirm' : 'Select Article'}
              </Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.ink,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.x40,
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.input,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  selectedArticleItem: {
    backgroundColor: colors.ink,
  },
  articleImage: {
    width: 60,
    height: 60,
    borderRadius: radius.card,
    backgroundColor: colors.line,
  },
  articleInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  articleTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.ink,
  },
  articlePrice: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.ink,
  },
  articleCategory: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  selectedText: {
    color: colors.onDark,
  },
  selectedMuted: {
    color: colors.line,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actionButton: {
    height: 56,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.input,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.cta,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.ink,
  },
  confirmButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.onCta,
  },
});
