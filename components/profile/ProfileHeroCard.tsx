// components/profile/ProfileHeroCard.tsx — the white profile card with an
// avatar poking above its top edge, name/bio, three stat tiles, and an Edit
// Profile button. Presentational only; the screen supplies the data.

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StatTile } from '../ui';
import { PressableScale } from '../ui';
import { colors, radius, spacing, fontFamily, shadows } from '../../theme';

export interface ProfileHeroCardProps {
  name: string;
  initial: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  stats: { posts: number; followers: number; following: number };
  onEdit: () => void;
}

export const ProfileHeroCard: React.FC<ProfileHeroCardProps> = ({
  name,
  initial,
  bio,
  website,
  avatarUrl,
  stats,
  onEdit,
}) => (
  <View style={styles.card}>
    <View style={styles.avatarWrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
    </View>

    <View style={styles.identity}>
      <Text style={styles.name}>{name}</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      {website ? <Text style={styles.website}>{website}</Text> : null}
    </View>

    <View style={styles.stats}>
      <StatTile value={stats.posts} label="POSTS" />
      <StatTile value={stats.followers} label="FOLLOWERS" />
      <StatTile value={stats.following} label="FOLLOWING" />
    </View>

    <PressableScale style={styles.editBtn} activeScale={0.98} onPress={onEdit}>
      <Text style={styles.editText}>Edit Profile</Text>
    </PressableScale>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.panel,
    paddingTop: spacing.x64,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    marginTop: 47,
    gap: spacing.xl,
    alignItems: 'center',
    ...shadows.float,
  },
  avatarWrap: {
    position: 'absolute',
    top: -47,
    alignSelf: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: colors.avatarBorder,
  },
  avatarPlaceholder: {
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: colors.muted,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.ink,
  },
  bio: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
  },
  website: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.ink,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.s10,
    alignSelf: 'stretch',
  },
  editBtn: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.ink,
  },
});
