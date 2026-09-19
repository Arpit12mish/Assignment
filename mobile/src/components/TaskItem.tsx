import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { Task } from '../types';
import { formatDateTime, timeUntil } from '../utils/dateUtils';
import { isOverdue } from '../utils/sortTasks';
import PriorityBadge from './PriorityBadge';
import { AlertTriangle, Check, Clock, X } from './icons';

interface Props {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
}

export default function TaskItem({ task, onToggleComplete, onDelete, onPress }: Props) {
  const overdue = isOverdue(task);

  return (
    <Pressable
      onPress={() => onPress(task)}
      style={({ pressed }) => [styles.card, shadow.card, pressed && styles.pressed]}
    >
      <Pressable
        hitSlop={10}
        onPress={() => onToggleComplete(task.id)}
        style={[
          styles.checkbox,
          task.completed && styles.checkboxChecked,
          { borderColor: colors.priority[task.priority] },
        ]}
      >
        {task.completed && <Check size={14} color={colors.onColor} strokeWidth={3} />}
      </Pressable>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, task.completed && styles.titleDone]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <PriorityBadge priority={task.priority} />
        </View>

        {!!task.description && (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.category}>{task.category || 'General'}</Text>
          <View style={styles.deadlineRow}>
            {overdue ? (
              <AlertTriangle size={12} color={colors.danger} strokeWidth={2.25} />
            ) : (
              <Clock size={12} color={colors.textSecondary} strokeWidth={2.25} />
            )}
            <Text style={[styles.deadline, overdue && styles.overdue]}>
              {formatDateTime(task.deadline)} · {timeUntil(task.deadline)}
            </Text>
          </View>
        </View>
      </View>

      <Pressable hitSlop={10} onPress={() => onDelete(task.id)} style={styles.deleteBtn}>
        <X size={16} color={colors.textSecondary} strokeWidth={2.25} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  category: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadline: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overdue: {
    color: colors.danger,
    fontWeight: '700',
  },
  deleteBtn: {
    marginLeft: spacing.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
