import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';

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
 * Pick image from device gallery with flexible aspect ratio
 */
export const pickImage = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    // Pick image with flexible options
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? false, // Don't force cropping by default
      aspect: options?.aspect, // Allow any aspect ratio by default
      quality: options?.quality ?? 0.8,
      exif: false, // Don't include EXIF data to reduce file size
      allowsMultipleSelection: false,
      base64: false,
    });

    return result;
  } catch (error) {
    console.error('Pick image error:', error);
    return null;
  }
};

/**
 * Pick image with square cropping (for profile pics, etc.)
 */
export const pickSquareImage = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  return pickImage({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
};

/**
 * Pick image without any cropping (for articles and outfits)
 */
export const pickFullImage = async (): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    // Pick image without any editing or cropping
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Absolutely no editing
      quality: 0.8,
      exif: false,
      allowsMultipleSelection: false,
      base64: false,
      // Don't specify aspect ratio to allow any ratio
    });

    return result;
  } catch (error) {
    console.error('Pick full image error:', error);
    return null;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<ImagePicker.ImagePickerResult | null> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return null;
    }

    // Take photo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: options?.allowsEditing ?? false,
      aspect: options?.aspect,
      quality: options?.quality ?? 0.8,
      exif: false,
      base64: false,
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
 * Get image dimensions from URI
 */
export const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

/**
 * Calculate optimal display dimensions for an image
 */
export const calculateOptimalDimensions = (
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number = 500, // Increased for wider images
  minHeight: number = 150  // Reduced minimum for wide images
): { width: number; height: number; aspectRatio: number } => {
  const aspectRatio = imageWidth / imageHeight;
  
  let displayWidth = maxWidth;
  let displayHeight = displayWidth / aspectRatio;
  
  // For very wide images (like 16:9), ensure we don't make them too short
  if (aspectRatio > 1.5) { // Wide image
    // For wide images, prioritize showing the full width
    if (displayHeight < minHeight) {
      displayHeight = Math.max(minHeight, maxWidth / 3); // At least 1/3 of width
      displayWidth = displayHeight * aspectRatio;
      // If width exceeds maxWidth, scale down proportionally
      if (displayWidth > maxWidth) {
        displayWidth = maxWidth;
        displayHeight = displayWidth / aspectRatio;
      }
    }
  } else {
    // For square or tall images, use original logic
    if (displayHeight < minHeight) {
      displayHeight = minHeight;
      displayWidth = displayHeight * aspectRatio;
    }
  }
  
  // Ensure maximum height
  if (displayHeight > maxHeight) {
    displayHeight = maxHeight;
    displayWidth = displayHeight * aspectRatio;
  }
  
  return {
    width: displayWidth,
    height: displayHeight,
    aspectRatio,
  };
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
