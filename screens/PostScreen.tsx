import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { pickFullImage, uploadImage, getImageDimensions, calculateOptimalDimensions, takePhoto, pickImage } from '../lib/storage';
import { ArticleFilters, articleService } from '../services/articleService';
import { CategoryType, GenderType } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { OutfitTagger, OutfitTag } from '../components/OutfitTagger';
import { ArticleSearchModal } from '../components/ArticleSearchModal';
import { outfitService } from '../services/outfitService';
import { Article } from '../types';

const { width, height } = Dimensions.get('window');

const categories: CategoryType[] = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags'];
const genders: GenderType[] = ['male', 'female', 'unisex'];
const occasions = ['casual', 'formal', 'party', 'work', 'sport', 'beach'];

type PostType = 'article' | 'outfit';

export const PostScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, session } = useAuth();
  const [postType, setPostType] = useState<PostType>('article');
  
  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Article specific fields
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [category, setCategory] = useState<CategoryType>('tops');
  const [gender, setGender] = useState<GenderType>('unisex');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [tags, setTags] = useState('');
  const [purchaseUrl, setPurchaseUrl] = useState('');
  
  // Outfit specific fields
  const [occasion, setOccasion] = useState('casual');
  const [styleTags, setStyleTags] = useState('');
  const [taggedArticles, setTaggedArticles] = useState<{id: string; x: number; y: number}[]>([]);
  
  // Outfit tagging specific state
  const [outfitTags, setOutfitTags] = useState<OutfitTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<OutfitTag | null>(null);
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  
  // Handle image selection
  const handleImagePick = async () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        {
          text: 'Camera',
          onPress: handleTakePhoto,
        },
        {
          text: 'Gallery (Full Image)',
          onPress: handlePickFromGallery,
        },
        {
          text: 'Gallery (Crop)',
          onPress: handlePickWithCrop,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePickFromGallery = async () => {
    const result = await pickFullImage();
    if (!result?.canceled && result?.assets?.[0]?.uri) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (!result?.canceled && result?.assets?.[0]?.uri) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const handlePickWithCrop = async () => {
    const result = await pickImage({ allowsEditing: true });
    if (!result?.canceled && result?.assets?.[0]?.uri) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const processSelectedImage = async (uri: string) => {
    setImageUri(uri);
    
    try {
      const dimensions = await getImageDimensions(uri);
      const screenWidth = width * 0.85; // Match card width from OutfitCard
      const optimalDimensions = calculateOptimalDimensions(
        dimensions.width,
        dimensions.height,
        screenWidth,
        600,
        120
      );
      
      setImageDimensions(optimalDimensions);
      console.log('Original image dimensions:', dimensions);
      console.log('Optimal display dimensions:', optimalDimensions);
      console.log('Aspect ratio:', optimalDimensions.aspectRatio);
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      setImageDimensions({
        width: width * 0.85,
        height: 180,
        aspectRatio: 16/9
      });
    }
  };
  
  const togglePostType = (type: PostType) => {
    setPostType(type);
  };
  
  const handleImagePress = (x: number, y: number) => {
    if (postType !== 'outfit') return;
    
    console.log(`Adding tag at position: x=${x}%, y=${y}%`);
    
    const newTag: OutfitTag = {
      id: `tag_${Date.now()}`,
      x,
      y,
    };
    
    setOutfitTags(prev => [...prev, newTag]);
    setSelectedTag(newTag);
    setShowArticleSearch(true);
  };
  
  const handleTagPress = (tag: OutfitTag) => {
    setSelectedTag(tag);
    setShowArticleSearch(true);
  };
  
  const handleSearchModalClose = () => {
    setSelectedTag(null);
    setShowArticleSearch(false);
  };

  const handleArticleSelect = (article: Article) => {
    if (!selectedTag) return;
    
    console.log(`Tagging with article: ${article.title} (${article.id})`);
    
    setOutfitTags(prev =>
      prev.map(tag =>
        tag.id === selectedTag.id
          ? {
              ...tag,
              articleId: article.id,
              articleTitle: article.title,
            }
          : tag
      )
    );
    
    setShowArticleSearch(false);
    setTimeout(() => setSelectedTag(null), 300);
  };
  
  const handleTagDelete = (tagId: string) => {
    setOutfitTags(prev => prev.filter(tag => tag.id !== tagId));
  };
  
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
      
      const bucketName = postType === 'article' ? 'article_images' : 'outfit_images';
      const fileName = `${postType}_${Date.now()}`;
      
      const uploadResult = await uploadImage(
        imageUri,
        bucketName,
        fileName,
        user.id
      );
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Image upload failed');
      }
      
      if (postType === 'article') {
        const articleData = {
          brand_id: user.id,
          title,
          description,
          price: price ? parseFloat(price) : 0,
          currency,
          image_urls: [uploadResult.url],
          category,
          gender,
          sizes: sizes.split(',').map(s => s.trim()).filter(s => s.length > 0),
          colors: colors.split(',').map(c => c.trim()).filter(c => c.length > 0),
          tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          purchase_url: purchaseUrl,
          is_available: true
        };
        
        const { success, error } = await articleService.createArticle(articleData);
        
        if (!success) {
          throw new Error(error || 'Failed to create article');
        }
        
        Alert.alert('Success', 'Article posted successfully!');
      } else {
        const outfitData = {
          title,
          description,
          image_url: uploadResult.url,
          occasion,
          style_tags: styleTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          is_public: true,
        };
        
        const tagData = outfitTags
          .filter(tag => tag.articleId)
          .map(tag => ({
            article_id: tag.articleId!,
            x_position: tag.x,
            y_position: tag.y,
          }));
        
        const { success, error } = await outfitService.createOutfit(user.id, outfitData, tagData);
        
        if (!success) {
          throw new Error(error || 'Failed to create outfit');
        }
        
        Alert.alert('Success', 'Outfit posted successfully!');
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setImageUri(null);
      setImageDimensions(null);
      setPrice('');
      setSizes('');
      setColors('');
      setTags('');
      setPurchaseUrl('');
      setStyleTags('');
      setOutfitTags([]);
      
    } catch (error) {
      console.error('Post error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Platform-specific status bar */}
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#E8D5C4" 
        translucent={Platform.OS === 'android'}
      />
      
      {/* Static beige background */}
      <View style={styles.beigeBackground} />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>Create Post</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Post Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                postType === 'article' && styles.activeToggle,
              ]}
              onPress={() => togglePostType('article')}
            >
              <Text
                style={[
                  styles.toggleText,
                  postType === 'article' && styles.activeToggleText,
                ]}
              >
                Article
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                postType === 'outfit' && styles.activeToggle,
              ]}
              onPress={() => togglePostType('outfit')}
            >
              <Text
                style={[
                  styles.toggleText,
                  postType === 'outfit' && styles.activeToggleText,
                ]}
              >
                Outfit
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Image Upload Section */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Image</Text>
              <View style={[styles.imageSection, postType === 'outfit' && imageUri && styles.outfitImageSection]}>
                {postType === 'outfit' && imageUri ? (
                  <View style={imageDimensions ? { height: imageDimensions.height } : undefined}>
                    <OutfitTagger
                      imageUri={imageUri}
                      tags={outfitTags}
                      onTagPress={handleTagPress}
                      onImagePress={handleImagePress}
                      onTagDelete={handleTagDelete}
                    />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.imageUpload,
                      imageDimensions && imageUri ? {
                        height: imageDimensions.height,
                        minHeight: imageDimensions.aspectRatio > 1.5 ? 120 : 180,
                        maxHeight: 400,
                      } : undefined
                    ]}
                    onPress={handleImagePick}
                    disabled={uploading}
                  >
                    {imageUri ? (
                      <>
                        <Image 
                          source={{ uri: imageUri }} 
                          style={styles.previewImage}
                          resizeMode="contain"
                        />
                        {imageDimensions && (
                          <View style={styles.imageInfo}>
                            <Text style={styles.imageInfoText}>
                              {Math.round(imageDimensions.aspectRatio * 100) / 100}:1
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity style={styles.editImageButton} onPress={handleImagePick}>
                          <Icon name="pencil" size={16} color="#000000" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <View style={styles.placeholderIconContainer}>
                          <Icon name="camera" size={32} color="#E8D5C4" />
                        </View>
                        <Text style={styles.placeholderTitle}>Add Image</Text>
                        <Text style={styles.placeholderSubtitle}>Tap to select from gallery or take a photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Basic Information */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={postType === 'article' ? 'Enter article name' : 'Enter outfit title'}
                  placeholderTextColor="#999999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={postType === 'article' ? 'Describe the article...' : 'Describe your outfit...'}
                  placeholderTextColor="#999999"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Article Specific Fields */}
            {postType === 'article' && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Article Details</Text>
                
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Price</Text>
                    <TextInput
                      style={styles.input}
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0"
                      placeholderTextColor="#999999"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Currency</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={currency}
                        onValueChange={setCurrency}
                        style={styles.picker}
                        dropdownIconColor="#666666"
                      >
                        <Picker.Item label="PKR" value="PKR" color="#000000" />
                        <Picker.Item label="USD" value="USD" color="#000000" />
                        <Picker.Item label="EUR" value="EUR" color="#000000" />
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={category}
                        onValueChange={setCategory}
                        style={styles.picker}
                        dropdownIconColor="#666666"
                      >
                        {categories.map((cat) => (
                          <Picker.Item key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} color="#000000" />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={gender}
                        onValueChange={setGender}
                        style={styles.picker}
                        dropdownIconColor="#666666"
                      >
                        {genders.map((g) => (
                          <Picker.Item key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} value={g} color="#000000" />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Available Sizes</Text>
                  <TextInput
                    style={styles.input}
                    value={sizes}
                    onChangeText={setSizes}
                    placeholder="S, M, L, XL"
                    placeholderTextColor="#999999"
                  />
                  <Text style={styles.helpText}>Separate sizes with commas</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Colors</Text>
                  <TextInput
                    style={styles.input}
                    value={colors}
                    onChangeText={setColors}
                    placeholder="Red, Blue, Black"
                    placeholderTextColor="#999999"
                  />
                  <Text style={styles.helpText}>Separate colors with commas</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tags</Text>
                  <TextInput
                    style={styles.input}
                    value={tags}
                    onChangeText={setTags}
                    placeholder="casual, summer, trendy"
                    placeholderTextColor="#999999"
                  />
                  <Text style={styles.helpText}>Separate tags with commas</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Purchase URL</Text>
                  <TextInput
                    style={styles.input}
                    value={purchaseUrl}
                    onChangeText={setPurchaseUrl}
                    placeholder="https://example.com/product"
                    placeholderTextColor="#999999"
                    keyboardType="url"
                  />
                </View>
              </View>
            )}

            {/* Outfit Specific Fields */}
            {postType === 'outfit' && (
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Outfit Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Occasion</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={occasion}
                      onValueChange={setOccasion}
                      style={styles.picker}
                      dropdownIconColor="#666666"
                    >
                      {occasions.map((occ) => (
                        <Picker.Item key={occ} label={occ.charAt(0).toUpperCase() + occ.slice(1)} value={occ} color="#000000" />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Style Tags</Text>
                  <TextInput
                    style={styles.input}
                    value={styleTags}
                    onChangeText={setStyleTags}
                    placeholder="vintage, minimalist, streetwear"
                    placeholderTextColor="#999999"
                  />
                  <Text style={styles.helpText}>Separate tags with commas</Text>
                </View>

                {/* Tagged Articles List */}
                {outfitTags.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tagged Articles ({outfitTags.length})</Text>
                    <View style={styles.tagsList}>
                      {outfitTags.map((tag) => (
                        <View 
                          key={tag.id} 
                          style={[
                            styles.tagItem,
                            !tag.articleId && styles.untaggedItem
                          ]}
                        >
                          <View style={styles.tagItemContent}>
                            <View style={styles.tagItemInfo}>
                              <Text style={styles.tagText}>
                                {tag.articleTitle || 'Untagged'}
                              </Text>
                              <Text style={styles.tagStatus}>
                                Position: {Math.round(tag.x)}%, {Math.round(tag.y)}%
                              </Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.removeTagButton}
                              onPress={() => handleTagDelete(tag.id)}
                            >
                              <Icon name="close" size={16} color="#666666" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.submitText}>
                  {postType === 'article' ? 'Post Article' : 'Post Outfit'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Article Search Modal */}
      <ArticleSearchModal
        visible={showArticleSearch}
        onClose={handleSearchModalClose}
        onSelectArticle={handleArticleSelect}
        selectedArticle={selectedTag?.articleId ? { id: selectedTag.articleId, title: selectedTag.articleTitle || '' } as Article : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'android' && {
      paddingTop: StatusBar.currentHeight || 0,
    }),
  },
  beigeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200, // Increased from 160 for better coverage
    backgroundColor: '#E8D5C4',
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 15,
    zIndex: 1000,
  },
  backButton: {
    padding: 8,
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeToggle: {
    backgroundColor: '#000000',
  },
  toggleText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 16,
  },
  activeToggleText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 0,
  },
  imageUpload: {
    minHeight: 200,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    overflow: 'hidden',
    position: 'relative',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageInfoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  editImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  placeholderText: {
    color: '#666666',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderSubText: {
    color: '#999999',
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  placeholderIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E8D5C4',
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    color: '#000000',
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  helpText: {
    color: '#666666',
    marginTop: 4,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    color: '#000000',
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#000000',
    backgroundColor: '#f8f8f8',
  },
  submitButton: {
    backgroundColor: '#E8D5C4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#d4c4b0',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 80,
  },
  tagsList: {
    marginTop: 8,
  },
  tagItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  untaggedItem: {
    borderColor: '#ff6b35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  tagItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagItemInfo: {
    flex: 1,
  },
  tagText: {
    color: '#000000',
    fontWeight: '600',
  },
  tagStatus: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
  removeTagButton: {
    padding: 8,
    marginLeft: 12,
  },
  outfitImageSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'visible',
  },
});
