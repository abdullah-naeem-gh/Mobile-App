import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

export interface OutfitTag {
  id: string;
  x: number;
  y: number;
  articleId?: string;
  articleTitle?: string;
}

interface OutfitTaggerProps {
  imageUri: string;
  tags: OutfitTag[];
  onTagPress: (tag: OutfitTag) => void;
  onImagePress: (x: number, y: number) => void;
  onTagDelete: (tagId: string) => void;
}

export const OutfitTagger: React.FC<OutfitTaggerProps> = ({
  imageUri,
  tags,
  onTagPress,
  onImagePress,
  onTagDelete,
}) => {
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [draggedTag, setDraggedTag] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const pulseAnimations = useRef(new Map<string, Animated.Value>()).current;

  // Set up pulse animations for untagged items
  useEffect(() => {
    tags.forEach((tag) => {
      if (!tag.articleId && !pulseAnimations.has(tag.id)) {
        const anim = new Animated.Value(0.8);
        pulseAnimations.set(tag.id, anim);

        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.8,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });
  }, [tags]);

  const handleImagePress = (event: any) => {
    if (!isImageLoaded) return;

    const { locationX, locationY } = event.nativeEvent;
    // We store coordinates as percentages for responsive positioning
    const relativeX = (locationX / imageLayout.width) * 100;
    const relativeY = (locationY / imageLayout.height) * 100;

    onImagePress(relativeX, relativeY);
  };

  const createPanResponder = (tag: OutfitTag) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggedTag(tag.id);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle tag dragging if needed in the future
      },
      onPanResponderRelease: () => {
        setDraggedTag(null);
      },
    });
  };

  const renderTagCard = (tag: OutfitTag) => {
    if (!tag.articleId || !tag.articleTitle) return null;

    // Position cards appropriately based on tag location
    const isLeft = tag.x > 50;
    const isTop = tag.y > 50;

    return (
      <View
        style={[
          styles.tagCard,
          {
            [isLeft ? 'right' : 'left']: `calc(${
              isLeft ? '100% - ' : ''
            }${tag.x}% + 20px)`,
            [isTop ? 'bottom' : 'top']: `calc(${
              isTop ? '100% - ' : ''
            }${tag.y}% + 20px)`,
          } as ViewStyle,
        ]}
      >
        <View style={styles.tagCardContent}>
          <Text style={styles.tagCardTitle} numberOfLines={1}>
            {tag.articleTitle}
          </Text>
          <TouchableOpacity
            style={styles.tagCardDelete}
            onPress={() => onTagDelete(tag.id)}
          >
            <Ionicons name="close" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.tagCardArrow,
            isLeft ? styles.tagCardArrowRight : styles.tagCardArrowLeft,
            isTop ? styles.tagCardArrowBottom : styles.tagCardArrowTop,
          ]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          onLoad={() => setIsImageLoaded(true)}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setImageLayout({ width, height });
          }}
        />

        {/* Instruction overlay for first tag */}
        {tags.length === 0 && isImageLoaded && (
          <View style={styles.instructionOverlay}>
            <View style={styles.instructionBubble}>
              <Text style={styles.instructionText}>
                Tap anywhere to tag items
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Render tags as a separate layer to ensure proper z-index */}
      {isImageLoaded &&
        tags.map((tag) => {
          // Get animation value safely with fallback
          const pulseAnim = pulseAnimations.get(tag.id);

          return (
            <View
              key={tag.id}
              style={[
                styles.tagContainer,
                {
                  left: `${tag.x}%`,
                  top: `${tag.y}%`,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.tag,
                  tag.articleId ? styles.tagFilled : styles.tagEmpty,
                  draggedTag === tag.id && styles.tagDragged,
                ]}
                onPress={() => onTagPress(tag)}
                {...createPanResponder(tag).panHandlers}
              >
                <Ionicons
                  name={tag.articleId ? 'checkmark' : 'add'}
                  size={14}
                  color={tag.articleId ? '#000' : '#fff'}
                />
              </TouchableOpacity>

              {/* Pulse animation for untagged items */}
              {!tag.articleId && pulseAnim && (
                <Animated.View
                  style={[
                    styles.tagPulse,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0.8, 1],
                        outputRange: [0.4, 0.1],
                      }),
                    },
                  ]}
                />
              )}

              {/* Render tag card */}
              {renderTagCard(tag)}
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    // Remove fixed aspectRatio to allow flexible dimensions
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed from 'cover' to 'contain' to show full image
  },
  tagContainer: {
    position: 'absolute',
    zIndex: 100,
    width: 30,
    height: 30,
    // Center the tag on the exact coordinate point
    transform: [{ translateX: -15 }, { translateY: -15 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderColor: '#fff',
  },
  tagFilled: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
  tagDragged: {
    transform: [{ scale: 1.2 }],
  },
  tagPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: -1,
  },
  tagCard: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    minWidth: 120,
    maxWidth: 160,
    zIndex: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tagCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagCardTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tagCardDelete: {
    marginLeft: 6,
    padding: 3,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderRadius: 10,
  },
  tagCardArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.85)',
  },
  tagCardArrowLeft: {
    left: 10,
  },
  tagCardArrowRight: {
    right: 10,
  },
  tagCardArrowTop: {
    bottom: -8,
    transform: [{ rotate: '0deg' }],
  },
  tagCardArrowBottom: {
    top: -8,
    transform: [{ rotate: '180deg' }],
  },
  instructionOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -90 }, { translateY: -20 }],
    zIndex: 100,
  },
  instructionBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
