import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, pickImage, takePhoto, BucketName } from '../lib/storage';

interface UseImageUploadResult {
  uploading: boolean;
  uploadProgress: number;
  uploadImage: (bucket: BucketName, fileName: string) => Promise<string | null>;
  selectFromGallery: () => Promise<string | null>;
  takePhotoWithCamera: () => Promise<string | null>;
}

export const useImageUpload = (): UseImageUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (
    bucket: BucketName, 
    fileName: string, 
    imageUri: string
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadImage(imageUri, bucket, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.url) {
        return result.url;
      } else {
        Alert.alert('Upload Error', result.error || 'Failed to upload image');
        return null;
      }
    } catch (error) {
      Alert.alert('Upload Error', 'An unexpected error occurred');
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const selectFromGallery = async (): Promise<string | null> => {
    const result = await pickImage();
    if (result && !result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const takePhotoWithCamera = async (): Promise<string | null> => {
    const result = await takePhoto();
    if (result && !result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  };

  const selectAndUpload = async (bucket: BucketName, fileName: string): Promise<string | null> => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: async () => {
          const uri = await takePhotoWithCamera();
          if (uri) {
            return await handleUpload(bucket, fileName, uri);
          }
        }},
        { text: 'Gallery', onPress: async () => {
          const uri = await selectFromGallery();
          if (uri) {
            return await handleUpload(bucket, fileName, uri);
          }
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    return null;
  };

  return {
    uploading,
    uploadProgress,
    uploadImage: selectAndUpload,
    selectFromGallery,
    takePhotoWithCamera,
  };
};
