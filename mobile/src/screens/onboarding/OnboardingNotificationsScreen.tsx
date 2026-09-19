import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { requestNotifications } from 'react-native-permissions';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../hooks/redux';
import { updateProfile } from '../../store/authSlice';
import AppButton from '../../components/AppButton';
import OnboardingProgress from '../../components/OnboardingProgress';
import Screen from '../../components/Screen';
import { colors, spacing, typography } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';

const illustration = require('../../assets/illustrations/success.png');

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Notifications'>;

// Step 4 of 4 — the "soft ask" pattern: prime the user with a friendly explanation
// before the OS's real permission dialog appears, since a cold system prompt with no
// context gets denied far more often. Marking onboarded happens on both buttons; the
// permission itself is only requested on "Remind Me".
export default function OnboardingNotificationsScreen(_props: Props) {
  const dispatch = useAppDispatch();
  const [requesting, setRequesting] = useState(false);

  const finish = async () => {
    await dispatch(updateProfile({ onboarded: true }));
    // RootNavigator switches to AppNavigator once user.onboarded is true — nothing to
    // navigate to manually here.
  };

  const onRemindMe = async () => {
    setRequesting(true);
    try {
      await requestNotifications(['alert', 'sound', 'badge']);
    } finally {
      setRequesting(false);
      await finish();
    }
  };

  return (
    <Screen style={styles.container}>
      <OnboardingProgress step={3} total={4} />

      <Text style={styles.title}>Never miss a{'\n'}deadline</Text>
      <Text style={styles.subtitle}>
        Enable notifications and we'll give you a nudge as a deadline gets close.
      </Text>

      <View style={styles.illustration}>
        <Image source={illustration} style={styles.illustrationImage} resizeMode="contain" />
      </View>

      <View style={styles.footer}>
        <AppButton label="Remind Me" onPress={onRemindMe} loading={requesting} />
        <AppButton label="Not now" variant="ghost" onPress={finish} />
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
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '90%',
    height: 260,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
