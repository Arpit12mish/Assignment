import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingNameScreen from '../screens/onboarding/OnboardingNameScreen';
import OnboardingCategoriesScreen from '../screens/onboarding/OnboardingCategoriesScreen';
import OnboardingTipsScreen from '../screens/onboarding/OnboardingTipsScreen';
import OnboardingNotificationsScreen from '../screens/onboarding/OnboardingNotificationsScreen';
import { OnboardingStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// Runs once per account, gated in RootNavigator on `user.onboarded` — a signed-in user
// can't back out of this stack into the auth screens (there's nothing to go back to).
export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="Name" component={OnboardingNameScreen} />
      <Stack.Screen name="Categories" component={OnboardingCategoriesScreen} />
      <Stack.Screen name="Tips" component={OnboardingTipsScreen} />
      <Stack.Screen name="Notifications" component={OnboardingNotificationsScreen} />
    </Stack.Navigator>
  );
}
