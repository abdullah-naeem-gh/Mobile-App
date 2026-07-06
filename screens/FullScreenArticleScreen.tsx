// FullScreenArticleScreen — article detail, pushed from the feed with a list
// of articles + a start index. Each page shows the Reels ArticleCard above a
// detail sheet (About + description + tags + save). Floating top chrome
// (back / wordmark / options). Keeps the articleService like/save wiring.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { ArticleCard } from '../components/ArticleCard';
import { PressableScale, TagPill, Wordmark } from '../components/ui';
import { Article } from '../types';
import { articleService } from '../services/articleService';
import { colors, radius, spacing, fontFamily, typography, shadows } from '../theme';

interface FullScreenArticleParams {
  articles: Article[];
  initialIndex: number;
}

// Chrome button diameter + the vertical rhythm around it — derived from
// tokens so `chromeHeight` below can't silently drift from the actual
// rendered chrome height.
const CHROME_BTN_SIZE = spacing.x40;
const CHROME_VERTICAL_PADDING = spacing.sm + spacing.md;

// Tap target below 44x44 fails accessibility guidelines; the sheet's
// bookmark icon is only 20x20, so pad its hit area without changing size.
const SAVE_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// Typed loosely to satisfy the navigator's ScreenComponentType; params are
// narrowed to the real shape below.
export const FullScreenArticleScreen: React.FC<any> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { articles: initialArticles, initialIndex } = route.params as FullScreenArticleParams;
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [pageHeight, setPageHeight] = useState(0);

  const chromeHeight = insets.top + CHROME_VERTICAL_PADDING + CHROME_BTN_SIZE;

  const handleLikeChange = async (articleId: string, isLiked: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, is_liked: isLiked, likes_count: a.likes_count + (isLiked ? 1 : -1) }
          : a,
      ),
    );
    const result = await articleService.toggleLike(articleId);
    if (!result.success) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, is_liked: !isLiked, likes_count: a.likes_count + (isLiked ? -1 : 1) }
            : a,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update like');
    }
  };

  const handleSaveChange = async (articleId: string, isSaved: boolean) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, is_saved: isSaved, saves_count: a.saves_count + (isSaved ? 1 : -1) }
          : a,
      ),
    );
    const result = await articleService.toggleSave(articleId);
    if (!result.success) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, is_saved: !isSaved, saves_count: a.saves_count + (isSaved ? -1 : 1) }
            : a,
        ),
      );
      Alert.alert('Error', result.error || 'Failed to update save');
    }
  };

  const onListLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== pageHeight) setPageHeight(h);
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <View style={[styles.page, { height: pageHeight, paddingTop: chromeHeight }]}>
      <View style={styles.cardSlot}>
        <ArticleCard
          article={item}
          onLikeChange={handleLikeChange}
          onSaveChange={handleSaveChange}
        />
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>About this article</Text>
          <PressableScale
            onPress={() => handleSaveChange(item.id, !item.is_saved)}
            activeScale={0.85}
            accessibilityLabel="Save"
            hitSlop={SAVE_HIT_SLOP}
          >
            <Icon
              name={item.is_saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={colors.ink}
            />
          </PressableScale>
        </View>
        <Text style={styles.description}>
          {item.description || 'No description available for this article.'}
        </Text>
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tags}>
            {item.tags.map((t) => (
              <TagPill key={t} label={t} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          onLayout={onListLayout}
          initialScrollIndex={pageHeight > 0 ? initialIndex : undefined}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={pageHeight || undefined}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
        />
      </SafeAreaView>

      {/* Floating top chrome */}
      <View style={[styles.chrome, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <PressableScale
          style={styles.chromeBtn}
          activeScale={0.9}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <Icon name="chevron-back" size={22} color={colors.ink} />
        </PressableScale>
        <Wordmark size={30} />
        <PressableScale style={styles.chromeBtn} activeScale={0.9} accessibilityLabel="More options">
          <Icon name="ellipsis-horizontal" size={20} color={colors.ink} />
        </PressableScale>
      </View>
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
  page: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  cardSlot: {
    flex: 3,
  },
  sheet: {
    flex: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    padding: spacing.lg,
    gap: spacing.s10,
    ...shadows.soft,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...typography.label,
  },
  description: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  chromeBtn: {
    width: CHROME_BTN_SIZE,
    height: CHROME_BTN_SIZE,
    borderRadius: CHROME_BTN_SIZE / 2,
    backgroundColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.hairline,
  },
});
