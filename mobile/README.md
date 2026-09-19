# TaskFlow — Mobile App

React Native CLI (TypeScript) to-do app with email/password + Google authentication, onboarding, task scheduling, priority, and a smart mixed sort. Runs on Android and iOS. See the [root README](../README.md) for the full project overview, how to run the backend, and Google Sign-In credential setup.

## Stack

- React Native 0.87 (CLI, TypeScript, new architecture, Hermes) — Android + iOS
- React Navigation (native-stack): Auth stack → Onboarding stack → App stack, switched purely on Redux state in `RootNavigator`
- Redux Toolkit + React Redux for state management
- Axios for API calls, AsyncStorage for session persistence
- `@react-native-google-signin/google-signin` for Google auth, `react-native-permissions` for the onboarding notification-permission step
- `@react-native-community/datetimepicker` for native date/time pickers

## Project structure

```
src/
  api/          axios client + auth/task request functions
  components/   reusable UI (buttons, inputs, task card, priority chips...)
  config/       Google Sign-In client IDs + configuration
  hooks/        typed Redux hooks
  navigation/   auth stack, onboarding stack, app stack, root switcher
  screens/      Welcome, Login, Register, TaskList, AddEditTask
  screens/onboarding/  Name, Categories, Tips, Notifications
  store/        Redux slices (auth, tasks)
  theme/        design tokens (colors, spacing, typography)
  types/        shared TypeScript types
  utils/        smart-sort algorithm, date formatting
```

## Setup

```sh
npm install
```

Fill in `src/config/env.ts` with your Google OAuth client IDs (see the root README's "Google Sign-In setup") — the app runs fine without them, "Continue with Google" just won't work yet.

The app talks to the backend at `http://10.0.2.2:4000/api` on Android (the special alias the emulator uses to reach the host machine's `localhost`) and `http://localhost:4000/api` on iOS Simulator — see [src/api/client.ts](src/api/client.ts). On a physical device, change `DEV_HOST` to your machine's LAN IP.

Make sure the backend (see [../backend](../backend)) is running first.

## Run

```sh
npm start          # Metro bundler
npm run android     # build + install + launch on Android emulator/device
npm run ios         # build + install + launch on iOS Simulator
```

If you add or update a native dependency (anything under `node_modules/*/android` or `*/ios`), do a full clean rebuild once — `cd android && ./gradlew clean`, or clear `~/Library/Developer/Xcode/DerivedData` — before running again. An incremental build can silently omit the new native module from the compiled binary.

## Notes

- Session (JWT + user) persists in AsyncStorage, so the app auto-logs-in on relaunch.
- `user.onboarded` (server-side) gates whether `RootNavigator` shows the onboarding stack — it runs once per account, not once per device.
- The task list's default sort ("smart") blends deadline proximity, scheduled time, and priority — see [src/utils/sortTasks.ts](src/utils/sortTasks.ts), mirrored server-side in `backend/src/utils/sortTasks.ts`.
