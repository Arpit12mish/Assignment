import { Task } from '../types';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Name: undefined;
  Categories: undefined;
  Tips: undefined;
  Notifications: undefined;
};

export type AppStackParamList = {
  TaskList: undefined;
  AddEditTask: { task?: Task; autoStartVoice?: boolean } | undefined;
};
