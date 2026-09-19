import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { register, clearAuthError } from '../store/authSlice';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import Screen from '../components/Screen';
import { Check, ChevronLeft } from '../components/icons';
import { colors, spacing, typography } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Name is intentionally not collected here — it's asked once in onboarding (see
// OnboardingNameScreen), which is the single place it's captured whether the account
// came from this email form or from Google sign-in.
export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = touched && !/\S+@\S+\.\S+/.test(email) ? 'Enter a valid email' : undefined;
  const passwordError = touched && password.length < 6 ? 'Min 6 characters' : undefined;

  const onSubmit = () => {
    setTouched(true);
    if (!/\S+@\S+\.\S+/.test(email) || password.length < 6) return;
    dispatch(register({ email: email.trim(), password }));
  };

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={styles.back}>
            <ChevronLeft size={26} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.brandRow}>
            <Check size={16} color={colors.primary} strokeWidth={3} />
            <Text style={styles.brand}>TaskFlow</Text>
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Organize tasks by time, deadline and priority.</Text>

          <View style={styles.form}>
            <AppInput
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />
            <AppInput
              label="Password"
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />

            {!!error && <Text style={styles.formError}>{error}</Text>}

            <AppButton
              label="Sign Up"
              onPress={onSubmit}
              loading={status === 'loading'}
              style={styles.submit}
            />

            <AppButton
              label="Already have an account? Log in"
              variant="ghost"
              onPress={() => {
                dispatch(clearAuthError());
                navigation.navigate('Login');
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xl,
  },
  brand: {
    ...typography.h3,
    color: colors.primary,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  formError: {
    color: colors.danger,
    marginBottom: spacing.sm,
    ...typography.body,
  },
});
