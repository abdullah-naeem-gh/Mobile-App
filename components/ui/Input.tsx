// components/ui/Input.tsx — 60-tall text field. Sand fill at rest; on focus
// it turns white with a sand border. Matches the design's Input.

import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { colors, radius, fontFamily } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Rendered inside the field on the right (e.g. a search/mic icon). */
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  trailing,
  containerStyle,
  onFocus,
  onBlur,
  multiline,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        focused ? styles.focused : styles.idle,
        multiline && styles.multiline,
        containerStyle,
      ]}
    >
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {trailing}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.input,
    height: 60,
    width: '100%',
    paddingHorizontal: 25,
    borderWidth: 2,
  },
  multiline: {
    height: undefined,
    minHeight: 96,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  idle: {
    backgroundColor: colors.input,
    borderColor: 'transparent',
  },
  focused: {
    backgroundColor: colors.surface,
    borderColor: colors.tag,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
});
