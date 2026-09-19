import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Mic } from './icons';
import { colors } from '../theme';

interface Props {
  active?: boolean;
  size?: number;
  iconSize?: number;
}

// The mic glyph wherever it appears (task-list FAB, the "speak to add a task" card) —
// a filled circle so it reads as a proper tappable control instead of a bare icon, that
// switches from an outline/idle look to a solid primary-colored, gently pulsing one while
// actively listening, so "recording now" is obvious without needing a text label.
export default function MicBadge({ active, size = 40, iconSize }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? colors.primary : colors.surfaceAlt,
          borderColor: active ? colors.primary : colors.border,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      <Mic size={iconSize ?? size * 0.5} color={active ? colors.onColor : colors.primary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
