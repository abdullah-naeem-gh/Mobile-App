// components/post/OutfitFields.tsx — the outfit-specific portion of the
// composer (occasion, style tags, and the list of tagged articles placed via
// the OutfitTagger). Controlled; the screen owns the state.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { Field, PressableScale } from '../ui';
import { SelectRow } from './SelectRow';
import { OutfitTag } from '../OutfitTagger';
import { colors, radius, spacing, fontFamily } from '../../theme';

const OCCASIONS = ['casual', 'formal', 'party', 'work', 'sport', 'beach'] as const;

export interface OutfitFieldsProps {
  occasion: string;
  onOccasion: (v: string) => void;
  styleTags: string;
  onStyleTags: (v: string) => void;
  tags: OutfitTag[];
  onDeleteTag: (id: string) => void;
}

export const OutfitFields: React.FC<OutfitFieldsProps> = ({
  occasion,
  onOccasion,
  styleTags,
  onStyleTags,
  tags,
  onDeleteTag,
}) => (
  <View style={styles.group}>
    <SelectRow label="Occasion" options={OCCASIONS} value={occasion} onChange={onOccasion} />
    <Field
      label="Style tags"
      value={styleTags}
      onChangeText={onStyleTags}
      placeholder="vintage, minimalist, streetwear"
    />

    {tags.length > 0 ? (
      <View style={styles.tagsBlock}>
        <Text style={styles.label}>Tagged articles ({tags.length})</Text>
        {tags.map((tag) => (
          <View key={tag.id} style={[styles.tagItem, !tag.articleId && styles.untagged]}>
            <View style={styles.tagInfo}>
              <Text style={styles.tagTitle}>{tag.articleTitle || 'Untagged'}</Text>
              <Text style={styles.tagPos}>
                Position: {Math.round(tag.x)}%, {Math.round(tag.y)}%
              </Text>
            </View>
            <PressableScale activeScale={0.85} onPress={() => onDeleteTag(tag.id)} hitSlop={8}>
              <Icon name="close" size={16} color={colors.muted} />
            </PressableScale>
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  label: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  tagsBlock: { gap: spacing.sm },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s10,
  },
  untagged: {
    borderWidth: 1,
    borderColor: colors.tag,
    borderStyle: 'dashed',
  },
  tagInfo: { flex: 1 },
  tagTitle: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.ink },
  tagPos: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.muted, marginTop: 2 },
});
