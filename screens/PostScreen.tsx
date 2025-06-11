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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { pickImage, uploadImage } from '../lib/storage';
import { ArticleFilters, articleService } from '../services/articleService';
import { CategoryType, GenderType } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { OutfitTagger, OutfitTag } from '../components/OutfitTagger';
import { ArticleSearchModal } from '../components/ArticleSearchModal';
import { outfitService } from '../services/outfitService';
import { Article } from '../types';

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
  const [uploading, setUploading] = useState(false);
  
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
    const result = await pickImage();
    if (!result?.canceled && result?.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // Switch between article and outfit
  const togglePostType = (type: PostType) => {
    setPostType(type);
  };
  
  // Handle adding a new tag on image press
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
  
  // Handle tag press (edit existing tag)
  const handleTagPress = (tag: OutfitTag) => {
    setSelectedTag(tag);
    setShowArticleSearch(true);
  };
  
  // Handle article search modal close
  const handleSearchModalClose = () => {
    // Don't remove untagged items when modal closes - let user decide
    setSelectedTag(null);
    setShowArticleSearch(false);
  };

  // Handle article selection from search modal
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
    
    // Simply hide the search modal but keep the selected tag
    // to ensure UI feedback is maintained
    setShowArticleSearch(false);
    setTimeout(() => setSelectedTag(null), 300);
  };
  
  // Handle tag deletion
  const handleTagDelete = (tagId: string) => {
    setOutfitTags(prev => prev.filter(tag => tag.id !== tagId));
  };
  
  // Submit post
  const handleSubmit = async () => {
    if (!title || !description || !imageUri) {
      Alert.alert('Error', 'Please fill all required fields and add an image');
      return;
    }
    
    // Check if user is logged in and has an ID
    if (!user?.id || !session) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }
    
    try {
      setUploading(true);
      
      // Upload image first
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
      
      // Create database entry based on post type
      if (postType === 'article') {
        // Handle article creation
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
        // Handle outfit creation with tags
        const outfitData = {
          user_id: user.id,
          title,
          description,
          image_url: uploadResult.url,
          occasion,
          style_tags: styleTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          is_public: true,
        };
        
        // Convert tags to the format expected by the service
        const tagData = outfitTags
          .filter(tag => tag.articleId)
          .map(tag => ({
            article_id: tag.articleId!,
            x_position: tag.x,
            y_position: tag.y,
          }));
        
        const { success, error } = await outfitService.createOutfit(outfitData, tagData);
        
        if (!success) {
          throw new Error(error || 'Failed to create outfit');
        }
        
        Alert.alert('Success', 'Outfit posted successfully!');
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setImageUri(null);
      setPrice('');
      setSizes('');
      setColors('');
      setTags('');
      setPurchaseUrl('');
      setStyleTags('');
      setOutfitTags([]);
      
    } catch (error) {
      console.error('Post error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Post</Text>
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
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Upload Section */}
          <View style={[styles.imageSection, postType === 'outfit' && imageUri && styles.outfitImageSection]}>
            {postType === 'outfit' && imageUri ? (
              <OutfitTagger
                imageUri={imageUri}
                tags={outfitTags}
                onTagPress={handleTagPress}
                onImagePress={handleImagePress}
                onTagDelete={handleTagDelete}
              />
            ) : (
              <TouchableOpacity 
                style={styles.imageUpload} 
                onPress={handleImagePick}
                disabled={uploading}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="camera-outline" size={40} color="#666" />
                    <Text style={styles.placeholderText}>
                      Tap to select image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {/* Common Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
            />
          </View>
          
          {/* Article specific fields */}
          {postType === 'article' && (
            <>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="Enter price"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Currency</Text>
                  <TextInput
                    style={styles.input}
                    value={currency}
                    onChangeText={setCurrency}
                    placeholder="e.g. PKR"
                    placeholderTextColor="#666"
                    defaultValue="PKR"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue as CategoryType)}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                  >
                    {categories.map((cat) => (
                      <Picker.Item 
                        key={cat} 
                        label={cat.charAt(0).toUpperCase() + cat.slice(1)} 
                        value={cat} 
                        color="#ffffff"
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => setGender(itemValue as GenderType)}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                  >
                    {genders.map((g) => (
                      <Picker.Item 
                        key={g} 
                        label={g.charAt(0).toUpperCase() + g.slice(1)} 
                        value={g}
                        color="#ffffff"
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sizes (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={sizes}
                  onChangeText={setSizes}
                  placeholder="e.g. S, M, L, XL"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Colors (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={colors}
                  onChangeText={setColors}
                  placeholder="e.g. Red, Blue, Black"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tags (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="e.g. trendy, casual, summer"
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Purchase URL</Text>
                <TextInput
                  style={styles.input}
                  value={purchaseUrl}
                  onChangeText={setPurchaseUrl}
                  placeholder="Enter website URL to purchase"
                  placeholderTextColor="#666"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </>
          )}
          
          {/* Outfit specific fields */}
          {postType === 'outfit' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Occasion</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={occasion}
                    onValueChange={(itemValue) => setOccasion(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                  >
                    {occasions.map((occ) => (
                      <Picker.Item 
                        key={occ} 
                        label={occ.charAt(0).toUpperCase() + occ.slice(1)} 
                        value={occ}
                        color="#ffffff"
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Style Tags (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={styleTags}
                  onChangeText={setStyleTags}
                  placeholder="e.g. casual, streetwear, vintage"
                  placeholderTextColor="#666"
                />
              </View>
              
              {imageUri && (
                <View style={styles.outfitTaggingSection}>
                  <Text style={styles.label}>Tagged Articles ({outfitTags.filter(tag => tag.articleId).length})</Text>
                  <Text style={styles.helpText}>
                    Tap on the image to tag clothing items. Tap tags to edit or remove them.
                  </Text>
                  {outfitTags.length > 0 && (
                    <View style={styles.tagsList}>
                      {outfitTags.map((tag) => (
                        <TouchableOpacity
                          key={tag.id}
                          style={[
                            styles.tagItem,
                            !tag.articleId && styles.untaggedItem,
                          ]}
                          onPress={() => handleTagPress(tag)}
                        >
                          <View style={styles.tagItemContent}>
                            <View style={styles.tagItemInfo}>
                              <Text style={styles.tagText}>
                                {tag.articleTitle || 'Untagged item'}
                              </Text>
                              {!tag.articleId && (
                                <Text style={styles.tagStatus}>
                                  Tap to select article
                                </Text>
                              )}
                            </View>
                            <TouchableOpacity
                              style={styles.removeTagButton}
                              onPress={() => handleTagDelete(tag.id)}
                            >
                              <Ionicons name="trash-outline" size={16} color="#ff4444" />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
          
          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>
                Post {postType === 'article' ? 'Article' : 'Outfit'}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Article Search Modal */}
      <ArticleSearchModal
        visible={showArticleSearch}
        onClose={handleSearchModalClose}
        onSelectArticle={handleArticleSelect}
        selectedArticle={selectedTag?.articleId ? { id: selectedTag.articleId, title: selectedTag.articleTitle || '' } as Article : null}
      />
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
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222222',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    color: '#bbbbbb',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageUpload: {
    height: 200,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    marginTop: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '500',
  },
  helpText: {
    color: '#666666',
    marginTop: 4,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    color: '#ffffff',
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#ffffff',
    backgroundColor: '#111111',
  },
  outfitTaggingSection: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 80,
  },
  tagsList: {
    marginTop: 12,
  },
  tagItem: {
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
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
    color: '#fff',
    fontWeight: '500',
  },
  tagStatus: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  removeTagButton: {
    padding: 8,
    marginLeft: 12,
  },
  outfitImageSection: {
    height: undefined, // Remove any fixed height
    aspectRatio: 1, // Maintain aspect ratio
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'visible', // Allow tags to appear outside the container
  },
});
