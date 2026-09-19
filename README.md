# TaskFlow

A full-stack To-Do app: email/password + Google authentication, tasks with title/description/scheduled time/deadline/priority, a Todoist-inspired onboarding flow, and a backend API with MongoDB storage. Runs on both Android and iOS.

- **mobile/** — React Native CLI app (TypeScript, Android + iOS)
- **backend/** — Node.js + Express + TypeScript API (MongoDB)

## Quick start

1. **Backend** (see [backend/README.md](backend/README.md)):
   ```sh
   cd backend
   npm install
   cp .env.example .env   # fill in GOOGLE_WEB_CLIENT_ID — see "Google Sign-In setup" below
   brew services start mongodb/brew/mongodb-community@7.0   # or: docker compose up -d
   npm run dev
   ```
2. **Mobile** (see [mobile/README.md](mobile/README.md)), in a second terminal:
   ```sh
   cd mobile
   npm install
   npm start
   ```
   and in a third terminal, for whichever platform:
   ```sh
   cd mobile
   npm run android
   # or
   npm run ios
   ```

## Google Sign-In setup

Both platforms need credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) that only you can generate (they're tied to your Google account):

1. Create an OAuth 2.0 **Web application** client ID. Put it in `backend/.env` as `GOOGLE_WEB_CLIENT_ID` and in `mobile/src/config/env.ts` as `GOOGLE_WEB_CLIENT_ID`.
2. Create an OAuth 2.0 **Android** client ID for package `com.todoapp`, using the debug keystore's SHA-1 (`keytool -list -v -keystore mobile/android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android`).
3. Create an OAuth 2.0 **iOS** client ID for bundle id `com.todoapp`. Put it in `mobile/src/config/env.ts` as `GOOGLE_IOS_CLIENT_ID`.

Until these are filled in, "Continue with Google" fails gracefully with an error instead of crashing — everything else works without it. Apple Sign-In was deliberately left out: Android has no native SDK for it (it would need a web OAuth flow plus a paid Apple Developer account), so Google alone covers both platforms cleanly.

## Features

- **Auth**: a Todoist-style welcome screen with "Continue with Email" and "Continue with Google", plus a traditional login/register flow underneath. JWT sessions persist on-device (auto-login on relaunch).
- **Onboarding** (first login only, tracked server-side via `user.onboarded`): name capture (pre-filled from Google profile when applicable) → starter category picker → a feature-tour card → a notification-permission "soft ask". Adapted from Todoist's own onboarding, dropping the team-specific step since this app has no team concept.
- **Tasks**: create/edit/delete, each with title, description, category, priority (low/medium/high), a scheduled date-time, and a deadline — picked with the platform's native date & time pickers.
- **Completion**: tap to mark done/undone; done tasks show struck-through and sort to the bottom.
- **Filtering**: All / Pending / Done tabs, plus quick category chips built from whatever categories the user has actually used (seeded by the onboarding picker).
- **Sorting**: a Smart / Deadline / Priority selector. Smart blends deadline proximity, scheduled time, and priority into a single urgency score (see "Smart sort" in [backend/README.md](backend/README.md)) — implemented identically on both the API and the client; Deadline and Priority are plain single-field sorts for when you want that instead.
- **State management**: Redux Toolkit (`authSlice`, `tasksSlice`) with async thunks for every API call.
- **Design**: a warm, light theme inspired by Todoist (white surfaces, red brand accent, flag-style red/orange/blue priority colors), card-based task list, and a modal add/edit form.

## Architecture notes

- The mobile app never talks to MongoDB directly — all persistence goes through the backend's REST API, authenticated with a JWT the app stores in AsyncStorage and attaches via an axios interceptor.
- Google sign-in: the mobile app gets an ID token from the native Google SDK and sends only that to the backend, which verifies it server-side (`google-auth-library`) before issuing our own JWT — the app never has to be trusted about who signed in.
- `backend/src/utils/sortTasks.ts` and `mobile/src/utils/sortTasks.ts` implement the same urgency algorithm independently (server returns sorted results; client re-sorts locally after optimistic updates so the list re-orders instantly without a round trip).
- Android emulator reaches the backend via the `10.0.2.2` host alias, iOS Simulator via `localhost` directly (see `mobile/src/api/client.ts`); update `DEV_HOST` there for a physical device.
- New native modules on this project (Google Sign-In, `react-native-permissions`) need a **full clean rebuild** the first time they're added — an incremental Gradle/Xcode build can silently leave the native binary without them, surfacing as "module not found" (Android) or a hung promise (iOS). `cd android && ./gradlew clean` / clear `~/Library/Developer/Xcode/DerivedData` if a freshly-added native module misbehaves.

## Requirements coverage

| Requirement | Where |
|---|---|
| Register / login | `mobile/src/screens/{Welcome,Login,Register}Screen.tsx`, `backend/src/controllers/authController.ts` |
| Add task (title, description, date-time, deadline, priority) | `mobile/src/screens/AddEditTaskScreen.tsx` |
| Mark complete | `TaskItem` checkbox → `toggleTaskComplete` thunk → `PATCH /api/tasks/:id/complete` |
| Delete | `TaskItem` delete button (confirm dialog) → `DELETE /api/tasks/:id` |
| List with status | `TaskListScreen` + filter tabs |
| Node.js/MongoDB backend | `backend/` |
| State management | Redux Toolkit |
| Bonus: due dates | `dateTime` + `deadline` fields |
| Bonus: sort mixing time/deadline/priority | `sortTasks.ts` (both sides), selectable via `SortSelector` |
| Bonus: categories/tags | `category` field on tasks, filterable via `CategoryChips`, seeded by onboarding |
| Bonus: filtering | All / Pending / Done tabs + category chips |
| Bonus: comments explaining important sections | auth/task controllers, models, middleware, Redux slices, navigators |
| Bonus: Google Sign-In | `googleLogin` thunk, `POST /api/auth/google` |
| Bonus: cross-platform (Android + iOS) | `mobile/android/`, `mobile/ios/` |
