import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { TaskSort } from '../types';
import { Sparkles } from './icons';

const OPTIONS: { key: TaskSort; label: string }[] = [
  { key: 'smart', label: 'Smart' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'priority', label: 'Priority' },
];

// Lets the user pick which of the three server/client sort algorithms orders the list —
// "Smart" is the bonus mixed urgency algorithm (see utils/sortTasks.ts); the other two
// are plain single-field sorts, useful when you specifically want to see what's due soonest
// or what's most important regardless of timing.
export default function SortSelector({
  value,
  onChange,
}: {
  value: TaskSort;
  onChange: (s: TaskSort) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Sort</Text>
      {OPTIONS.map(option => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            {option.key === 'smart' && (
              <Sparkles size={12} color={active ? colors.primary : colors.textSecondary} strokeWidth={2.25} />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginRight: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
});
