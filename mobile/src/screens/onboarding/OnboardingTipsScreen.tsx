import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppButton from '../../components/AppButton';
import OnboardingProgress from '../../components/OnboardingProgress';
import PriorityBadge from '../../components/PriorityBadge';
import Screen from '../../components/Screen';
import { ArrowUp } from '../../components/icons';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Tips'>;

// Step 3 of 4. Todoist's equivalent screen teases voice dictation, a feature this app
// doesn't have — adapted into a teaser for what TaskFlow actually does well: the smart
// sort that blends deadline, schedule and priority (see backend/src/utils/sortTasks.ts).
export default function OnboardingTipsScreen({ navigation }: Props) {
  return (
    <Screen style={styles.container}>
      <OnboardingProgress step={2} total={4} />

      <Text style={styles.title}>One sort to rule{'\n'}them all</Text>
      <Text style={styles.subtitle}>
        TaskFlow's Smart sort blends deadline, schedule and priority — so the task that
        actually needs you next always floats to the top.
      </Text>

      <View style={styles.preview}>
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Renew passport</Text>
            <PriorityBadge priority="low" />
          </View>
          <Text style={styles.cardMeta}>Due in 3 hours</Text>
        </View>
        <View style={[styles.card, shadow.card]}>
          <View style={styles.cardRow}>
            <Text style={styles.cardTitle}>Quarterly report</Text>
            <PriorityBadge priority="high" />
          </View>
          <Text style={styles.cardMeta}>Due in 5 days</Text>
        </View>
      </View>
      <View style={styles.captionRow}>
        <ArrowUp size={13} color={colors.textMuted} strokeWidth={2.25} />
        <Text style={styles.caption}>Low priority, due soon, still sorts first.</Text>
      </View>

      <View style={styles.footer}>
        <AppButton label="Continue" onPress={() => navigation.navigate('Notifications')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  preview: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
