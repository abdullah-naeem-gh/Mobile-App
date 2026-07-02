// PostScreen — the "+" tab composer. Supports two post types: Article (brand
// listing with full metadata) and Outfit (a look with an interactive tagger).
// Presentation uses the design system; the article/outfit field blocks are
// split into components/post/. All create/upload wiring is preserved.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import {
  pickFullImage,
  uploadImage,
  getImageDimensions,
  calculateOptimalDimensions,
  takePhoto,
  pickImage,
} from '../lib/storage';
import { articleService } from '../services/articleService';
import { outfitService } from '../services/outfitService';
import { CategoryType, GenderType, Article } from '../types';
import { OutfitTagger, OutfitTag } from '../components/OutfitTagger';
import { ArticleSearchModal } from '../components/ArticleSearchModal';
import { SubHeader, Field, Button, Chip, PressableScale } from '../components/ui';
import { ArticleFields } from '../components/post/ArticleFields';
import { OutfitFields } from '../components/post/OutfitFields';
import { useResponsive } from '../hooks/useResponsive';
import { colors, radius, spacing, fontFamily, shadows } from '../theme';

type PostType = 'article' | 'outfit';
type ImageDims = { width: number; height: number; aspectRatio: number };

export const PostScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, session } = useAuth();
  const { width } = useResponsive();
  const [postType, setPostType] = useState<PostType>('article');

  // Common
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDims | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Article
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [category, setCategory] = useState<CategoryType>('tops');
  const [gender, setGender] = useState<GenderType>('unisex');
  const [sizes, setSizes] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [tags, setTags] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');

  // Outfit
  const [occasion, setOccasion] = useState('casual');
  const [styleTags, setStyleTags] = useState('');
  const [outfitTags, setOutfitTags] = useState<OutfitTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<OutfitTag | null>(null);
  const [showArticleSearch, setShowArticleSearch] = useState(false);

  const processSelectedImage = async (uri: string) => {
    setImageUri(uri);
    try {
      const dims = await getImageDimensions(uri);
      setImageDimensions(calculateOptimalDimensions(dims.width, dims.height, width * 0.85, 600, 120));
    } catch {
      setImageDimensions({ width: width * 0.85, height: 180, aspectRatio: 16 / 9 });
    }
  };

  const handleImagePick = () => {
    Alert.alert('Select Image', 'Choose how you want to add an image', [
      {
        text: 'Camera',
        onPress: async () => {
          const r = await takePhoto();
          if (!r?.canceled && r?.assets?.[0]?.uri) processSelectedImage(r.assets[0].uri);
        },
      },
      {
        text: 'Gallery (Full Image)',
        onPress: async () => {
          const r = await pickFullImage();
          if (!r?.canceled && r?.assets?.[0]?.uri) processSelectedImage(r.assets[0].uri);
        },
      },
      {
        text: 'Gallery (Crop)',
        onPress: async () => {
          const r = await pickImage({ allowsEditing: true });
          if (!r?.canceled && r?.assets?.[0]?.uri) processSelectedImage(r.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleImagePress = (x: number, y: number) => {
    if (postType !== 'outfit') return;
    const newTag: OutfitTag = { id: `tag_${Date.now()}`, x, y };
    setOutfitTags((prev) => [...prev, newTag]);
    setSelectedTag(newTag);
    setShowArticleSearch(true);
  };

  const handleTagPress = (tag: OutfitTag) => {
    setSelectedTag(tag);
    setShowArticleSearch(true);
  };

  const handleArticleSelect = (article: Article) => {
    if (!selectedTag) return;
    setOutfitTags((prev) =>
      prev.map((t) =>
        t.id === selectedTag.id ? { ...t, articleId: article.id, articleTitle: article.title } : t,
      ),
    );
    setShowArticleSearch(false);
    setTimeout(() => setSelectedTag(null), 300);
  };

  const handleTagDelete = (tagId: string) =>
    setOutfitTags((prev) => prev.filter((t) => t.id !== tagId));

  const splitList = (v: string) => v.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

  const handleSubmit = async () => {
    if (!title || !description || !imageUri) {
      setError('Please fill all required fields and add an image');
      return;
    }
    if (!user?.id || !session) {
      setError('You must be logged in to create a post');
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const bucket = postType === 'article' ? 'article_images' : 'outfit_images';
      const upload = await uploadImage(imageUri, bucket, `${postType}_${Date.now()}`, user.id);
      if (!upload.success || !upload.url) throw new Error('Image upload failed');

      if (postType === 'article') {
        const { success, error: err } = await articleService.createArticle({
          brand_id: user.id,
          title,
          description,
          price: price ? parseFloat(price) : 0,
          currency,
          image_urls: [upload.url],
          category,
          gender,
          sizes: splitList(sizes),
          colors: splitList(colorInput),
          tags: splitList(tags),
          purchase_url: purchaseUrl,
          is_available: true,
        });
        if (!success) throw new Error(err || 'Failed to create article');
        Alert.alert('Success', 'Article posted successfully!');
      } else {
        const tagData = outfitTags
          .filter((t) => t.articleId)
          .map((t) => ({ article_id: t.articleId!, x_position: t.x, y_position: t.y }));
        const { success, error: err } = await outfitService.createOutfit(
          user.id,
          {
            title,
            description,
            image_url: upload.url,
            occasion,
            style_tags: splitList(styleTags),
            is_public: true,
          },
          tagData,
        );
        if (!success) throw new Error(err || 'Failed to create outfit');
        Alert.alert('Success', 'Outfit posted successfully!');
      }

      // Reset
      setTitle('');
      setDescription('');
      setImageUri(null);
      setImageDimensions(null);
      setPrice('');
      setSizes('');
      setColorInput('');
      setTags('');
      setPurchaseUrl('');
      setStyleTags('');
      setOutfitTags([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const showTagger = postType === 'outfit' && imageUri;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SubHeader title="Create Post" onBack={() => navigation.goBack()} centered />

        {/* Post type toggle */}
        <View style={styles.toggle}>
          <Chip label="Article" active={postType === 'article'} onPress={() => setPostType('article')} />
          <Chip label="Outfit" active={postType === 'outfit'} onPress={() => setPostType('outfit')} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle-outline" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Image */}
            {showTagger ? (
              <View style={imageDimensions ? { height: imageDimensions.height } : undefined}>
                <OutfitTagger
                  imageUri={imageUri!}
                  tags={outfitTags}
                  onTagPress={handleTagPress}
                  onImagePress={handleImagePress}
                  onTagDelete={handleTagDelete}
                />
              </View>
            ) : (
              <PressableScale style={styles.imageCard} activeScale={0.99} onPress={handleImagePick}>
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                    <View style={styles.editImage}>
                      <Icon name="pencil" size={16} color={colors.ink} />
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.cameraCircle}>
                      <Icon name="camera" size={28} color={colors.ink} />
                    </View>
                    <Text style={styles.placeholderTitle}>Add Image</Text>
                    <Text style={styles.placeholderSub}>Tap to select from gallery or take a photo</Text>
                  </View>
                )}
              </PressableScale>
            )}

            {/* Basic info */}
            <Field
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder={postType === 'article' ? 'Enter article name' : 'Enter outfit title'}
            />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder={postType === 'article' ? 'Describe the article…' : 'Describe your outfit…'}
              multiline
            />

            {postType === 'article' ? (
              <ArticleFields
                price={price}
                onPrice={setPrice}
                currency={currency}
                onCurrency={setCurrency}
                category={category}
                onCategory={setCategory}
                gender={gender}
                onGender={setGender}
                sizes={sizes}
                onSizes={setSizes}
                colorsValue={colorInput}
                onColors={setColorInput}
                tags={tags}
                onTags={setTags}
                purchaseUrl={purchaseUrl}
                onPurchaseUrl={setPurchaseUrl}
              />
            ) : (
              <OutfitFields
                occasion={occasion}
                onOccasion={setOccasion}
                styleTags={styleTags}
                onStyleTags={setStyleTags}
                tags={outfitTags}
                onDeleteTag={handleTagDelete}
              />
            )}

            <Button
              label={postType === 'article' ? 'Post Article' : 'Post Outfit'}
              onPress={handleSubmit}
              loading={uploading}
              style={styles.submit}
            />
            <View style={styles.bottomSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ArticleSearchModal
        visible={showArticleSearch}
        onClose={() => {
          setSelectedTag(null);
          setShowArticleSearch(false);
        }}
        onSelectArticle={handleArticleSelect}
        selectedArticle={
          selectedTag?.articleId
            ? ({ id: selectedTag.articleId, title: selectedTag.articleTitle || '' } as Article)
            : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  toggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFF5F5',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#FFD5D5',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: { flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: colors.error },
  imageCard: {
    height: 220,
    borderRadius: radius.panel,
    backgroundColor: colors.input,
    overflow: 'hidden',
    ...shadows.hairline,
  },
  preview: { width: '100%', height: '100%' },
  editImage: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  cameraCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  placeholderTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.ink },
  placeholderSub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  submit: { marginTop: spacing.sm },
  bottomSpace: { height: spacing.xxl },
});
