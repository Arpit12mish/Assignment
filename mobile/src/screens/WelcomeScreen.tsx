import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { googleLogin } from '../store/authSlice';
import AppButton from '../components/AppButton';
import GoogleIcon from '../components/GoogleIcon';
import Screen from '../components/Screen';
import { Check } from '../components/icons';
import { colors, spacing, typography } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

const illustration = require('../assets/illustrations/planning.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

// The app's entry point for a signed-out user — mirrors Todoist's own welcome screen
// (brand mark, headline, stacked auth buttons) rather than dropping straight into a
// login form. "Continue with Email" leads to Register, since that's the more common
// path here (no email-recognition step to branch to login automatically); a small link
// below covers returning users who want to log in directly.
export default function WelcomeScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector(state => state.auth);

  return (
    <Screen style={styles.screen}>
      <View style={styles.hero}>
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
        <View style={styles.brandMark}>
          <Check size={22} color={colors.onColor} strokeWidth={3} />
        </View>
        <Text style={styles.brand}>TaskFlow</Text>
        <Text style={styles.headline}>Organize your work{'\n'}and life, finally.</Text>
      </View>

      <View style={styles.actions}>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <AppButton label="Continue with Email" onPress={() => navigation.navigate('Register')} />

        <AppButton
          label="Continue with Google"
          variant="secondary"
          icon={<GoogleIcon />}
          loading={status === 'loading'}
          onPress={() => dispatch(googleLogin())}
          style={styles.googleButton}
        />

        <AppButton
          label="Already have an account? Log in"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  illustration: {
    width: '100%',
    height: 240,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brand: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 40,
  },
  actions: {
    marginBottom: spacing.xl,
  },
  googleButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
    ...typography.body,
  },
});
