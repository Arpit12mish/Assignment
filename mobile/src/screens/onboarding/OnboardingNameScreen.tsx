import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateProfile } from '../../store/authSlice';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import OnboardingProgress from '../../components/OnboardingProgress';
import Screen from '../../components/Screen';
import { colors, spacing, typography } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Name'>;

// Step 1 of 4. Pre-filled from the Google profile name when the account came from
// Google sign-in (payload.name on the backend); empty for email/password accounts,
// since Register no longer asks for it.
export default function OnboardingNameScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [saving, setSaving] = useState(false);

  const onNext = async () => {
    const trimmed = name.trim();
    if (trimmed) {
      setSaving(true);
      await dispatch(updateProfile({ name: trimmed }));
      setSaving(false);
    }
    navigation.navigate('Categories');
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <OnboardingProgress step={0} total={4} />

          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>We'll use this to greet you around the app.</Text>

          <AppInput
            label="Your name"
            placeholder="Jane Doe"
            value={name}
            onChangeText={setName}
            autoFocus
            style={styles.input}
          />

          <View style={styles.footer}>
            <AppButton label="Next" onPress={onNext} loading={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
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
  input: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
  },
});
