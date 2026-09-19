import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../theme';
import { TaskFilter } from '../types';

const TABS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Done' },
];

export default function FilterTabs({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: (f: TaskFilter) => void;
}) {
  return (
    <View style={styles.row}>
      {TABS.map(tab => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  textActive: {
    color: colors.onColor,
  },
});
