import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { bootstrapAuth } from '../store/authSlice';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import AppNavigator from './AppNavigator';
import { colors } from '../theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.textPrimary,
  },
};

// The single source of truth for which navigator is on screen:
//  - no token (restored from AsyncStorage by bootstrapAuth, or set by a fresh
//    login/register/googleLogin) → AuthNavigator
//  - signed in but user.onboarded is false → OnboardingNavigator (runs once per account)
//  - signed in and onboarded → AppNavigator
// No route-level checks are needed anywhere else — a screen in the wrong stack is
// simply unreachable given the current auth/onboarding state.
export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { token, user, bootstrapped } = useAppSelector(state => state.auth);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (!bootstrapped) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  let content;
  if (!token) {
    content = <AuthNavigator />;
  } else if (!user?.onboarded) {
    content = <OnboardingNavigator />;
  } else {
    content = <AppNavigator />;
  }

  return <NavigationContainer theme={navigationTheme}>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
