// OutfitTagger — the interactive tag editor used in the outfit composer.
// Tap the photo to drop a tag, tap a tag to attach an article. Re-skinned to
// the design system (sand tag circles, tokenized overlay card). Behavior
// (percent-based coordinates, pulse on untagged markers) is unchanged; the
// tag card positioning was also fixed to use RN-valid percent offsets
// (the previous CSS calc() strings are not supported by React Native).

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontFamily, spacing, shadows } from '../theme';

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
      onPanResponderMove: () => {
        // Handle tag dragging if needed in the future
      },
      onPanResponderRelease: () => {
        setDraggedTag(null);
      },
    });
  };

  const renderTagCard = (tag: OutfitTag) => {
    if (!tag.articleId || !tag.articleTitle) return null;

    // Flip the card to whichever side of the marker has room.
    const isLeft = tag.x > 50;
    const isTop = tag.y > 50;

    return (
      <View
        style={[
          styles.tagCard,
          {
            left: isLeft ? undefined : `${tag.x + 2}%`,
            right: isLeft ? `${100 - tag.x + 2}%` : undefined,
            top: isTop ? undefined : `${tag.y + 2}%`,
            bottom: isTop ? `${100 - tag.y + 2}%` : undefined,
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
            <Ionicons name="close" size={12} color={colors.onDark} />
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
                  color={tag.articleId ? colors.ink : colors.onDark}
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
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // show the full image, no crop
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
    ...shadows.soft,
  },
  tagEmpty: {
    backgroundColor: colors.overlayMute,
    borderColor: colors.onDark,
  },
  tagFilled: {
    backgroundColor: colors.tag,
    borderColor: colors.ink,
  },
  tagDragged: {
    transform: [{ scale: 1.2 }],
  },
  tagPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.frost,
    zIndex: -1,
  },
  tagCard: {
    position: 'absolute',
    backgroundColor: colors.overlayMute,
    borderRadius: radius.card,
    minWidth: 120,
    maxWidth: 160,
    zIndex: 200,
    ...shadows.float,
  },
  tagCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.sm,
  },
  tagCardTitle: {
    flex: 1,
    color: colors.onDark,
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  tagCardDelete: {
    marginLeft: spacing.xs,
    padding: 3,
    backgroundColor: colors.error,
    borderRadius: radius.round,
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
    borderTopColor: colors.overlayMute,
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
    backgroundColor: colors.overlayMute,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.card,
  },
  instructionText: {
    color: colors.onDark,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    textAlign: 'center',
  },
});
