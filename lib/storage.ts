import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

export type BucketName = 'profile_pics' | 'article_images' | 'outfit_images' | 'wardrobe_images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to a specific bucket
 */
export const uploadImage = async (
  uri: string,
  bucket: BucketName,
  fileName: string,
  userId?: string
): Promise<UploadResult> => {
  try {
    // Create file path
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    let filePath: string;

    if (bucket === 'profile_pics' || bucket === 'outfit_images' || bucket === 'wardrobe_images') {
      // User-specific folders
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      if (!userId) throw new Error('User not authenticated');
      filePath = `${userId}/${fileName}_${timestamp}.${fileExt}`;
    } else {
      // Global folders for articles
      filePath = `${fileName}_${timestamp}.${fileExt}`;
    }

    // Create FormData for React Native
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: `image/${fileExt}`,
      name: `${fileName}_${timestamp}.${fileExt}`,
    } as any);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, formData, {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Delete an image from storage
 */
export const deleteImage = async (
  bucket: BucketName,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

/**
 * Get signed URL for private images (wardrobe images)
 */
export const getSignedUrl = async (
  bucket: BucketName,
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to get signed URL'
    };
  }
};

/**
 * Pick image from device gallery
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    return result;
  } catch (error) {
    console.error('Pick image error:', error);
    return null;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return null;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    return result;
  } catch (error) {
    console.error('Take photo error:', error);
    return null;
  }
};

/**
 * Helper to extract file path from Supabase URL
 */
export const getFilePathFromUrl = (url: string, bucket: BucketName): string | null => {
  try {
    const urlParts = url.split(`/storage/v1/object/public/${bucket}/`);
    return urlParts[1] || null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

/**
 * Resize image before upload (for better performance)
 */
export const resizeImage = (
  uri: string,
  width: number = 800,
  height: number = 800
): Promise<string> => {
  // This would typically use a library like expo-image-manipulator
  // For now, return the original URI
  return Promise.resolve(uri);
};
