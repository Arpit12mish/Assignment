import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch } from '../hooks/redux';
import { addTask, editTask } from '../store/tasksSlice';
import { parseTaskFromTranscript, resolveDateTimeFromTranscript } from '../api/ai';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import PrioritySelector from '../components/PrioritySelector';
import Screen from '../components/Screen';
import MicBadge from '../components/MicBadge';
import { AlertTriangle, Calendar, Mic, X } from '../components/icons';
import { formatFieldDateTime } from '../utils/dateUtils';
import { colors, radius, spacing, typography } from '../theme';
import { MissingField, Priority } from '../types';
import type { AppStackParamList } from '../navigation/types';

type DateField = 'dateTime' | 'deadline';

type Props = NativeStackScreenProps<AppStackParamList, 'AddEditTask'>;

const DESCRIPTION_MAX_LENGTH = 500;

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

// One screen handles both creating and editing a task: `route.params?.task` is present
// only when navigated to from tapping an existing task (see TaskListScreen), and every
// field's initial state below falls back to that task's values so it acts as an edit form.
export default function AddEditTaskScreen({ navigation, route }: Props) {
  const editing = route.params?.task;
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [category, setCategory] = useState(editing?.category ?? '');
  const [priority, setPriority] = useState<Priority>(editing?.priority ?? 'medium');
  const [dateTime, setDateTime] = useState(
    editing ? new Date(editing.dateTime) : addHours(new Date(), 1),
  );
  const [deadline, setDeadline] = useState(
    editing ? new Date(editing.deadline) : addHours(new Date(), 24),
  );
  // iOS only: which field the bottom-sheet picker is editing, and its in-progress value
  // (committed to dateTime/deadline only on "Done", discarded on "Cancel" or backdrop tap).
  // Android instead opens the OS's own modal dialogs imperatively — see openPicker below —
  // so it never touches this state.
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const [draftDate, setDraftDate] = useState<Date>(new Date());
  const [titleError, setTitleError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  // Voice-to-task: fields Gemini couldn't determine from the last transcript (drives the
  // "still needs this" banners below the date fields), whether the full-form parse is
  // in flight, and which single date field a targeted voice re-ask is currently resolving
  // (null when none — the two flows share the same recognizer, so only one runs at a time).
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [resolvingField, setResolvingField] = useState<DateField | null>(null);
  const { isListening, partialTranscript, error: micError, listen, stop } = useSpeechRecognition();

  // Set once during onboarding (see OnboardingCategoriesScreen) — surfaced here as
  // quick-select chips so that choice has a lasting, functional payoff instead of
  // being a purely decorative onboarding step.
  useEffect(() => {
    AsyncStorage.getItem('suggested_categories').then(raw => {
      if (raw) setSuggestedCategories(JSON.parse(raw));
    });
  }, []);

  const commit = (field: DateField, value: Date) => {
    if (field === 'dateTime') setDateTime(value);
    else setDeadline(value);
  };

  // Full "speak the whole task" flow: capture a transcript, send it to Gemini (via the
  // backend so the API key never ships in the app), and pre-fill every field it could
  // determine. Nothing is saved here — the user still reviews and taps Add Task/Save,
  // per their explicit preference over auto-saving straight from voice.
  const handleVoiceCapture = async () => {
    setVoiceError(null);
    setMissingFields([]);
    const transcript = await listen();
    if (!transcript.trim()) {
      if (!micError) setVoiceError("Didn't catch that — try again.");
      return;
    }
    setIsParsing(true);
    try {
      const parsed = await parseTaskFromTranscript(transcript);
      if (parsed.title) {
        setTitle(parsed.title);
        setTitleError(undefined);
      }
      if (parsed.description) setDescription(parsed.description);
      if (parsed.category) setCategory(parsed.category);
      setPriority(parsed.priority);
      if (parsed.dateTime) setDateTime(new Date(parsed.dateTime));
      if (parsed.deadline) setDeadline(new Date(parsed.deadline));
      setMissingFields(parsed.missing);
      if (parsed.missing.includes('title') && !parsed.title) {
        setVoiceError("Couldn't tell what the task is — add a title below, or try speaking again.");
      }
    } catch {
      setVoiceError('Could not understand that. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  // The mic FAB on the task list navigates here with autoStartVoice so the user can go
  // straight from "tap mic" to "speak" without an extra tap once the form has mounted.
  useEffect(() => {
    if (route.params?.autoStartVoice) handleVoiceCapture();
    // Only ever fires once, right after this screen mounts from that FAB.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Targeted follow-up for a single missing date field: offered next to "Scheduled for"/
  // "Deadline" whenever the last parse couldn't resolve it, as the mic-based alternative
  // to just tapping the field and using the picker built below.
  const handleVoiceResolveField = async (field: DateField) => {
    setVoiceError(null);
    setResolvingField(field);
    try {
      const transcript = await listen();
      if (!transcript.trim()) {
        if (!micError) setVoiceError("Didn't catch that — try again.");
        return;
      }
      const resolved = await resolveDateTimeFromTranscript(transcript);
      if (resolved) {
        commit(field, new Date(resolved));
        setMissingFields(prev => prev.filter(f => f !== field));
      } else {
        setVoiceError("Couldn't understand a date or time — try again, or set it manually.");
      }
    } catch {
      setVoiceError('Could not understand that. Please try again.');
    } finally {
      setResolvingField(null);
    }
  };

  // Android's DateTimePickerAndroid.open() shows the OS's own modal dialog and returns
  // immediately — no component needs to stay mounted, so this is purely imperative.
  // iOS has no equivalent modal API (RNDateTimePicker renders *inline* wherever it's
  // placed in the tree there), so it opens our own bottom sheet instead — see the Modal
  // in the JSX below and openPickerIOS.
  const openPickerAndroid = (field: DateField) => {
    const current = field === 'dateTime' ? dateTime : deadline;
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      onValueChange: (_event, pickedDate) => {
        DateTimePickerAndroid.open({
          value: current,
          mode: 'time',
          onValueChange: (_event2, pickedTime) => {
            const merged = new Date(pickedDate);
            merged.setHours(pickedTime.getHours(), pickedTime.getMinutes());
            commit(field, merged);
          },
        });
      },
    });
  };

  const openPickerIOS = (field: DateField) => {
    setDraftDate(field === 'dateTime' ? dateTime : deadline);
    setActiveField(field);
  };

  const openPicker = Platform.OS === 'android' ? openPickerAndroid : openPickerIOS;

  const confirmIOSPicker = () => {
    if (activeField) commit(activeField, draftDate);
    setActiveField(null);
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setSubmitting(true);
    const input = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      priority,
      dateTime: dateTime.toISOString(),
      deadline: deadline.toISOString(),
    };

    // editTask and addTask are separate thunks with different argument shapes, so the
    // union is cast here rather than typed precisely — both still resolve to a
    // fulfilled/rejected action with the same `.error` shape, which is all this needs.
    const action = editing
      ? editTask({ id: editing.id, input })
      : addTask(input);

    const result = await dispatch(action as any);
    setSubmitting(false);
    if (!result.error) {
      navigation.goBack();
    }
  };

  const voiceListening = isListening && resolvingField === null;
  // Flags the deadline as "Urgent" once it's under 24h away (or already past) — a quick
  // visual cue while the user is still setting up the task, separate from the overdue
  // styling TaskItem shows once a task is saved and sitting in the list.
  const deadlineUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <Screen style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{editing ? 'Edit Task' : 'New Task'}</Text>
        <Pressable hitSlop={8} onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X size={18} color={colors.textSecondary} strokeWidth={2.25} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!editing && (
          <Pressable
            style={[styles.voiceCard, voiceListening && styles.voiceCardActive]}
            onPress={voiceListening ? stop : handleVoiceCapture}
            disabled={isParsing || (isListening && resolvingField !== null)}
          >
            <MicBadge active={voiceListening} size={34} />
            {isParsing ? (
              <>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.voiceCardText}>Understanding what you said…</Text>
              </>
            ) : voiceListening ? (
              <Text style={styles.voiceCardText} numberOfLines={2}>
                {partialTranscript || 'Listening… tap to stop'}
              </Text>
            ) : (
              <>
                <View style={styles.voiceCardTextGroup}>
                  <Text style={styles.voiceCardText}>Speak to add a task</Text>
                  <Text style={styles.voiceCardSubtext} numberOfLines={1}>
                    AI parses the title, date &amp; priority
                  </Text>
                </View>
                <View style={styles.tryItPill}>
                  <Text style={styles.tryItText}>Try it</Text>
                </View>
              </>
            )}
          </Pressable>
        )}
        {!!(voiceError || micError) && (
          <Text style={styles.voiceError}>{voiceError || micError}</Text>
        )}

        <AppInput
          label="Title"
          placeholder="What needs to be done?"
          value={title}
          onChangeText={text => {
            setTitle(text);
            if (titleError) setTitleError(undefined);
          }}
          error={titleError}
        />
        <AppInput
          label="Description"
          labelRight={
            <Text style={styles.charCount}>
              {description.length}/{DESCRIPTION_MAX_LENGTH}
            </Text>
          }
          placeholder="Add more detail (optional)"
          value={description}
          onChangeText={setDescription}
          maxLength={DESCRIPTION_MAX_LENGTH}
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />
        <AppInput
          label="Category"
          placeholder="Work, Personal, Study..."
          value={category}
          onChangeText={setCategory}
        />
        {suggestedCategories.length > 0 && (
          <View style={styles.suggestionRow}>
            {suggestedCategories.map(suggestion => (
              <Pressable
                key={suggestion}
                onPress={() => setCategory(suggestion)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.label}>Priority</Text>
        <PrioritySelector value={priority} onChange={setPriority} />

        <View style={styles.dateSection}>
          <View>
            <Pressable style={styles.dateField} onPress={() => openPicker('dateTime')}>
              <View style={styles.dateLabelRow}>
                <Calendar size={12} color={colors.textSecondary} strokeWidth={2.25} />
                <Text style={styles.dateLabel}>Scheduled for</Text>
              </View>
              <Text style={styles.dateValue}>{formatFieldDateTime(dateTime)}</Text>
            </Pressable>
            {missingFields.includes('dateTime') && (
              <Pressable
                style={styles.voiceMissingRow}
                onPress={
                  resolvingField === 'dateTime' && isListening
                    ? stop
                    : () => handleVoiceResolveField('dateTime')
                }
                disabled={
                  (isListening && resolvingField !== 'dateTime') ||
                  (resolvingField === 'dateTime' && !isListening)
                }
              >
                {resolvingField === 'dateTime' ? (
                  isListening ? (
                    <View style={styles.voiceMissingContent}>
                      <Mic size={13} color={colors.warning} strokeWidth={2.25} />
                      <Text style={styles.voiceMissingText}>Listening… tap to stop</Text>
                    </View>
                  ) : (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )
                ) : (
                  <View style={styles.voiceMissingContent}>
                    <Mic size={13} color={colors.warning} strokeWidth={2.25} />
                    <Text style={styles.voiceMissingText}>
                      Didn't catch this — tap to speak it, or set it above
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
          <View>
            <Pressable style={styles.dateField} onPress={() => openPicker('deadline')}>
              <View style={styles.dateLabelRow}>
                <AlertTriangle
                  size={12}
                  color={deadlineUrgent ? colors.danger : colors.textSecondary}
                  strokeWidth={2.25}
                />
                <Text style={styles.dateLabel}>Deadline</Text>
                {deadlineUrgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateValue}>{formatFieldDateTime(deadline)}</Text>
            </Pressable>
            {missingFields.includes('deadline') && (
              <Pressable
                style={styles.voiceMissingRow}
                onPress={
                  resolvingField === 'deadline' && isListening
                    ? stop
                    : () => handleVoiceResolveField('deadline')
                }
                disabled={
                  (isListening && resolvingField !== 'deadline') ||
                  (resolvingField === 'deadline' && !isListening)
                }
              >
                {resolvingField === 'deadline' ? (
                  isListening ? (
                    <View style={styles.voiceMissingContent}>
                      <Mic size={13} color={colors.warning} strokeWidth={2.25} />
                      <Text style={styles.voiceMissingText}>Listening… tap to stop</Text>
                    </View>
                  ) : (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )
                ) : (
                  <View style={styles.voiceMissingContent}>
                    <Mic size={13} color={colors.warning} strokeWidth={2.25} />
                    <Text style={styles.voiceMissingText}>
                      Didn't catch this — tap to speak it, or set it above
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        </View>
        {deadline.getTime() < dateTime.getTime() && (
          <View style={styles.dateWarningRow}>
            <AlertTriangle size={14} color={colors.warning} strokeWidth={2.25} />
            <Text style={styles.dateWarning}>Deadline is before the scheduled time</Text>
          </View>
        )}

        <AppButton
          label={editing ? 'Save Changes' : 'Add Task'}
          onPress={onSubmit}
          loading={submitting}
          style={styles.submit}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <Modal visible={activeField !== null} transparent animationType="slide">
          <Pressable style={styles.sheetBackdrop} onPress={() => setActiveField(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setActiveField(null)}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>
                {activeField === 'dateTime' ? 'Scheduled for' : 'Deadline'}
              </Text>
              <Pressable onPress={confirmIOSPicker}>
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draftDate}
              mode="datetime"
              display="spinner"
              textColor={colors.textPrimary}
              onValueChange={(_event, selected) => setDraftDate(selected)}
            />
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  suggestionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  voiceCardActive: {
    borderColor: colors.primary,
  },
  voiceCardText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flexShrink: 1,
  },
  voiceCardTextGroup: {
    flex: 1,
  },
  voiceCardSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  tryItPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tryItText: {
    ...typography.caption,
    color: colors.onColor,
    fontWeight: '700',
  },
  voiceError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  voiceMissingRow: {
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  voiceMissingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceMissingText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    flexShrink: 1,
  },
  dateSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dateField: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  urgentBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.onColor,
    fontWeight: '700',
  },
  dateValue: {
    ...typography.h3,
    color: colors.accent,
  },
  dateWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dateWarning: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  submit: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sheetCancel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sheetDone: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
});
