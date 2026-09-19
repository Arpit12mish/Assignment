import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Priority } from '../types';
import { Flag } from './icons';

const OPTIONS: Priority[] = ['low', 'medium', 'high'];
const LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export default function PrioritySelector({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <View style={styles.row}>
      {OPTIONS.map(option => {
        const active = option === value;
        const color = colors.priority[option];
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              { borderColor: color },
              active && { backgroundColor: color },
            ]}
          >
            <Flag size={13} color={active ? colors.onColor : color} strokeWidth={2.25} />
            <Text style={[styles.text, { color: active ? colors.onColor : color }]}>
              {LABEL[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  text: {
    ...typography.body,
    fontWeight: '700',
  },
});
