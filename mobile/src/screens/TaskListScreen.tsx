import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loadTasks, removeTask, setFilter, setSortMode, toggleTaskComplete } from '../store/tasksSlice';
import { logout } from '../store/authSlice';
import TaskItem from '../components/TaskItem';
import FilterTabs from '../components/FilterTabs';
import SortSelector from '../components/SortSelector';
import CategoryChips from '../components/CategoryChips';
import Screen from '../components/Screen';
import ConfirmDialog from '../components/ConfirmDialog';
import MicBadge from '../components/MicBadge';
import AppButton from '../components/AppButton';
import { ClipboardList, LogOut, Plus } from '../components/icons';
import { colors, radius, spacing, typography } from '../theme';
import { Task } from '../types';
import { isOverdue } from '../utils/sortTasks';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskList'>;

// Home screen once logged in: fetches the user's tasks once on mount, then layers three
// independent, purely client-side views on top of the fetched list — status filter
// (all/pending/done), sort mode (smart/deadline/priority), and category — so switching
// any of them feels instant instead of re-hitting the API.
export default function TaskListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status, filter, sortMode } = useAppSelector(state => state.tasks);
  const user = useAppSelector(state => state.auth.user);
  // Category filter is view-only state (unlike status filter / sort mode, nothing else
  // needs it), so it lives here rather than in Redux.
  const [category, setCategory] = useState<string | null>(null);
  // Which confirm dialog (if any) is open — a themed replacement for Alert.alert, which
  // renders as the bare OS dialog and looks like a different app next to this one's UI.
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    dispatch(loadTasks(sortMode));
    // Only re-fetch on mount — switching sort mode re-sorts in-memory instead (see setSortMode).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const categories = useMemo(
    () => Array.from(new Set(items.map(t => t.category || 'General'))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let result = items;
    if (filter === 'pending') result = result.filter(t => !t.completed);
    else if (filter === 'completed') result = result.filter(t => t.completed);
    if (category) result = result.filter(t => (t.category || 'General') === category);
    return result;
  }, [items, filter, category]);

  const pendingCount = items.filter(t => !t.completed).length;
  const stats = useMemo(() => {
    let overdue = 0;
    let done = 0;
    for (const t of items) {
      if (t.completed) done += 1;
      else if (isOverdue(t)) overdue += 1;
    }
    return { pending: pendingCount, overdue, done };
  }, [items, pendingCount]);

  const onDelete = (id: string) => setDeletingTaskId(id);

  const onOpenTask = (task: Task) => {
    navigation.navigate('AddEditTask', { task });
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi{user?.name ? `, ${user.name}` : ''}</Text>
          <Text style={styles.subGreeting}>
            {pendingCount === 0 ? 'All caught up!' : `${pendingCount} task${pendingCount === 1 ? '' : 's'} pending`}
          </Text>
        </View>
        <Pressable style={styles.logoutBtn} onPress={() => setConfirmingLogout(true)} hitSlop={8}>
          <LogOut size={20} color={colors.danger} />
        </Pressable>
      </View>

      {items.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.done}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>
      )}

      <FilterTabs value={filter} onChange={f => dispatch(setFilter(f))} />
      <SortSelector value={sortMode} onChange={s => dispatch(setSortMode(s))} />
      <CategoryChips categories={categories} value={category} onChange={setCategory} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={() => {
              dispatch(loadTasks(sortMode));
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          status === 'loading' ? undefined : (
            <View style={styles.empty}>
              <ClipboardList size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Your day is wide open</Text>
              <Text style={styles.emptySubtitle}>
                Add a task, or tell TaskFlow what you need to do.
              </Text>
              <AppButton
                label="Add a task"
                icon={<Plus size={18} color={colors.onColor} strokeWidth={2.5} />}
                onPress={() => navigation.navigate('AddEditTask', undefined)}
                style={styles.emptyBtn}
              />
              <AppButton
                label="Create with voice"
                variant="secondary"
                icon={<MicBadge size={22} iconSize={12} />}
                onPress={() => navigation.navigate('AddEditTask', { autoStartVoice: true })}
                style={styles.emptyBtn}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggleComplete={id => dispatch(toggleTaskComplete(id))}
            onDelete={onDelete}
            onPress={onOpenTask}
          />
        )}
      />

      <Pressable
        style={styles.micFab}
        onPress={() => navigation.navigate('AddEditTask', { autoStartVoice: true })}
        hitSlop={4}
      >
        <MicBadge size={52} />
      </Pressable>
      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddEditTask', undefined)}>
        <Plus size={28} color={colors.onColor} strokeWidth={2.5} />
      </Pressable>

      <ConfirmDialog
        visible={deletingTaskId !== null}
        title="Delete task"
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingTaskId(null)}
        onConfirm={() => {
          if (deletingTaskId) dispatch(removeTask(deletingTaskId));
          setDeletingTaskId(null);
        }}
      />
      <ConfirmDialog
        visible={confirmingLogout}
        title="Log out"
        message="Are you sure?"
        confirmLabel="Log out"
        destructive
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          dispatch(logout());
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  statValue: {
    ...typography.h2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  emptyBtn: {
    alignSelf: 'stretch',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  micFab: {
    position: 'absolute',
    right: spacing.lg + 4,
    bottom: spacing.xl + 60 + spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
