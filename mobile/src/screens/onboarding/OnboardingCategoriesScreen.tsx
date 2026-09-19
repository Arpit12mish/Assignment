import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '../../components/AppButton';
import OnboardingProgress from '../../components/OnboardingProgress';
import Screen from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Categories'>;

const SUGGESTIONS = ['Work', 'Personal', 'Study', 'Health', 'Finance', 'Errands'];

// Step 2 of 4. Todoist asks "personal or team use" here, but this app has no team
// concept — adapted instead into picking starter categories, which have a real payoff:
// the selection is saved locally and offered as quick-select chips on the "add task"
// category field (see AddEditTaskScreen), rather than being purely decorative.
export default function OnboardingCategoriesScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>(['Work', 'Personal']);

  const toggle = (category: string) => {
    setSelected(current =>
      current.includes(category) ? current.filter(c => c !== category) : [...current, category],
    );
  };

  const onNext = async () => {
    await AsyncStorage.setItem('suggested_categories', JSON.stringify(selected));
    navigation.navigate('Tips');
  };

  return (
    <Screen style={styles.container}>
      <OnboardingProgress step={1} total={4} />

      <Text style={styles.title}>What would you like{'\n'}to organize?</Text>
      <Text style={styles.subtitle}>Pick a few — you can add more anytime.</Text>

      <View style={styles.grid}>
        {SUGGESTIONS.map(category => {
          const active = selected.includes(category);
          return (
            <Pressable
              key={category}
              onPress={() => toggle(category)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <AppButton label="Next" onPress={onNext} />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.onColor,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
