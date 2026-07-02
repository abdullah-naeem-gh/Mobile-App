// components/post/ArticleFields.tsx — the article-specific portion of the
// composer (price, currency, category, gender, sizes, colors, tags,
// purchase URL). Controlled; the screen owns the state.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Field } from '../ui';
import { SelectRow } from './SelectRow';
import { CategoryType, GenderType } from '../../types';
import { spacing } from '../../theme';

const CATEGORIES: readonly CategoryType[] = [
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags',
];
const GENDERS: readonly GenderType[] = ['male', 'female', 'unisex'];
const CURRENCIES = ['PKR', 'USD', 'EUR'] as const;

export interface ArticleFieldsProps {
  price: string;
  onPrice: (v: string) => void;
  currency: string;
  onCurrency: (v: string) => void;
  category: CategoryType;
  onCategory: (v: CategoryType) => void;
  gender: GenderType;
  onGender: (v: GenderType) => void;
  sizes: string;
  onSizes: (v: string) => void;
  colorsValue: string;
  onColors: (v: string) => void;
  tags: string;
  onTags: (v: string) => void;
  purchaseUrl: string;
  onPurchaseUrl: (v: string) => void;
}

export const ArticleFields: React.FC<ArticleFieldsProps> = ({
  price,
  onPrice,
  currency,
  onCurrency,
  category,
  onCategory,
  gender,
  onGender,
  sizes,
  onSizes,
  colorsValue,
  onColors,
  tags,
  onTags,
  purchaseUrl,
  onPurchaseUrl,
}) => (
  <View style={styles.group}>
    <Field label="Price" value={price} onChangeText={onPrice} placeholder="0" keyboardType="numeric" />
    <SelectRow label="Currency" options={CURRENCIES} value={currency} onChange={onCurrency} capitalize={false} />
    <SelectRow label="Category" options={CATEGORIES} value={category} onChange={onCategory} />
    <SelectRow label="Gender" options={GENDERS} value={gender} onChange={onGender} />
    <Field label="Available sizes" value={sizes} onChangeText={onSizes} placeholder="S, M, L, XL" />
    <Field label="Colors" value={colorsValue} onChangeText={onColors} placeholder="Red, Blue, Black" />
    <Field label="Tags" value={tags} onChangeText={onTags} placeholder="casual, summer, trendy" />
    <Field
      label="Purchase URL"
      value={purchaseUrl}
      onChangeText={onPurchaseUrl}
      placeholder="https://example.com/product"
      keyboardType="url"
      autoCapitalize="none"
    />
  </View>
);

const styles = StyleSheet.create({
  group: { gap: spacing.lg },
});
