// Fill this in with the OAuth 2.0 "Web application" Client ID from Google Cloud Console
// (Credentials → OAuth 2.0 Client IDs). It must be the *Web* client, not the Android/iOS
// one — GoogleSignin uses it to request an ID token that the backend can verify, and the
// backend (see backend/.env's GOOGLE_WEB_CLIENT_ID) must be configured with the same value.
export const GOOGLE_WEB_CLIENT_ID = '';

// A *separate* OAuth 2.0 Client ID of type "iOS" (bundle id com.todoapp), required only
// on iOS by the native Google Sign-In SDK — Android instead identifies the app via the
// SHA-1 fingerprint registered against the Android-type client, so it has no equivalent here.
export const GOOGLE_IOS_CLIENT_ID = '';
