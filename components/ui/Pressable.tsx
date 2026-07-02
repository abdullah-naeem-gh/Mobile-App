// components/ui/Pressable.tsx — a Pressable that scales down slightly on
// press, matching the design's tactile button feedback. No animation
// library needed; uses the Pressable `pressed` state.

import React from 'react';
import {
  Pressable as RNPressable,
  StyleProp,
  ViewStyle,
  PressableProps,
} from 'react-native';

export interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle>;
  /** Scale applied while pressed. Default 0.97. */
  activeScale?: number;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  style,
  activeScale = 0.97,
  disabled,
  children,
  ...rest
}) => (
  <RNPressable
    disabled={disabled}
    style={({ pressed }) => [
      style,
      pressed && !disabled ? { transform: [{ scale: activeScale }] } : null,
    ]}
    {...rest}
  >
    {children}
  </RNPressable>
);
