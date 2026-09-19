import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  active: boolean;
  barCount?: number;
  height?: number;
  color?: string;
}

// A small Siri/audio-bar style visualizer for the "listening now" state — each bar loops
// its own height animation on a slightly staggered delay/duration so the row reads as
// live sound rather than one block pulsing in place. Not driven by real mic amplitude:
// the speech-recognition library's VOLUME_CHANGED event exists, but the iOS Simulator and
// Android Emulator have no real microphone feed to drive it, so a self-animating loop is
// the only thing guaranteed to look "alive" in every environment this app is tested in.
export default function Waveform({ active, barCount = 4, height = 22, color = colors.primary }: Props) {
  const values = useRef(Array.from({ length: barCount }, () => new Animated.Value(0.35))).current;

  useEffect(() => {
    if (!active) {
      values.forEach(v => v.stopAnimation(() => v.setValue(0.35)));
      return;
    }
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 280 + (i % 3) * 70,
            useNativeDriver: false,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: 280 + (i % 3) * 70,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    const started = Animated.stagger(80, loops);
    started.start();
    return () => loops.forEach(l => l.stop());
  }, [active, values]);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: v.interpolate({ inputRange: [0, 1], outputRange: [4, height] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
