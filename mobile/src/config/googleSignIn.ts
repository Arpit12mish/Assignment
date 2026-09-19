import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from './env';

// Called once at app startup (see App.tsx).
//  - webClientId (not the Android/iOS one) is what makes GoogleSignin.signIn() return
//    an idToken our backend can verify — without it you only get an access token.
//  - iosClientId is required *in addition* on iOS, or the native SDK throws immediately
//    (there's no Android equivalent; Android identifies the app via its SHA-1 fingerprint
//    registered against the Android OAuth client instead).
// Both IDs are still empty placeholders until Google Cloud Console credentials are filled
// into env.ts, so configure() is skipped entirely rather than crashing the app on launch —
// tapping "Continue with Google" will just fail with a clear error until then.
export function configureGoogleSignIn() {
  if (!GOOGLE_WEB_CLIENT_ID) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
}
