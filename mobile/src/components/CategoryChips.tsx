import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

// Horizontally-scrolling quick filter built from whatever categories the user has
// actually used (plus "All") — there's no fixed category list, so this is how the
// free-text `category` field on a task doubles as a lightweight tag filter.
export default function CategoryChips({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string | null;
  onChange: (category: string | null) => void;
}) {
  if (categories.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <Pressable
        onPress={() => onChange(null)}
        style={[styles.chip, value === null && styles.chipActive]}
      >
        <Text style={[styles.chipText, value === null && styles.chipTextActive]}>All</Text>
      </Pressable>
      {categories.map(category => {
        const active = category === value;
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Without an explicit height, a horizontal ScrollView's flex-row content container
  // defaults to alignItems: 'stretch' on its cross axis — which, with nothing else
  // bounding its height, stretches every chip to fill the *screen's* remaining height
  // instead of sizing to its text. `flexGrow: 0` + `alignItems: 'center'` fixes both.
  scroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.onColor,
  },
});
