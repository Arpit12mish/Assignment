import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

// Mirrors Todoist's thin top progress line during onboarding — one segment per step,
// filled up to and including the current one, so the user always sees how much is left.
export default function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.segment, index <= step ? styles.filled : styles.empty]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.sm,
  },
  filled: {
    backgroundColor: colors.primary,
  },
  empty: {
    backgroundColor: colors.border,
  },
});
