import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TaskListScreen from '../screens/TaskListScreen';
import AddEditTaskScreen from '../screens/AddEditTaskScreen';
import { AppStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="TaskList" component={TaskListScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AddEditTask"
        component={AddEditTaskScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}
