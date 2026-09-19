import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { googleAuthRequest, loginRequest, registerRequest, updateProfileRequest } from '../api/auth';
import { extractErrorMessage } from '../api/client';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  // False until bootstrapAuth has run once — RootNavigator shows a loading spinner
  // instead of the login screen while this is false, so a returning user with a
  // stored session never sees a flash of the auth flow before landing on their tasks.
  bootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  bootstrapped: false,
};

async function persistSession(token: string, user: User) {
  await AsyncStorage.setMany({
    auth_token: token,
    auth_user: JSON.stringify(user),
  });
}

// Restores a previously persisted session (token + user) on app launch.
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem('auth_token'),
    AsyncStorage.getItem('auth_user'),
  ]);
  if (token && userJson) {
    return { token, user: JSON.parse(userJson) as User };
  }
  return null;
});

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { token, user } = await loginRequest(payload.email, payload.password);
      await persistSession(token, user);
      return { token, user };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { token, user } = await registerRequest(payload.email, payload.password);
      await persistSession(token, user);
      return { token, user };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

// Runs the native Google Sign-In sheet, then exchanges the ID token it returns for our
// own JWT via the backend (which verifies it server-side — see authController.googleAuth).
// One thunk covers both first-time signup and returning login, since the backend
// find-or-creates the account either way.
export const googleLogin = createAsyncThunk('auth/googleLogin', async (_: void, { rejectWithValue }) => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success' || !response.data.idToken) {
      return rejectWithValue('Google sign-in was cancelled');
    }

    const { token, user } = await googleAuthRequest(response.data.idToken);
    await persistSession(token, user);
    return { token, user };
  } catch (err: any) {
    if (err?.code === 'SIGN_IN_CANCELLED' || err?.code === '-5') {
      return rejectWithValue('Google sign-in was cancelled');
    }
    return rejectWithValue(extractErrorMessage(err));
  }
});

// Used by onboarding to save the user's name and, on its last step, to mark
// onboarding complete — both go through the same partial-update endpoint.
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (update: { name?: string; onboarded?: boolean }, { rejectWithValue }) => {
    try {
      const user = await updateProfileRequest(update);
      const token = await AsyncStorage.getItem('auth_token');
      if (token) await persistSession(token, user);
      return user;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeMany(['auth_token', 'auth_user']);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  // login, register and googleLogin all resolve to the same { token, user } shape and
  // drive the same state transitions, so their pending/fulfilled/rejected actions are
  // handled together via addMatcher instead of being triplicated across addCase blocks.
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action: PayloadAction<{ token: string; user: User } | null>) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
        state.bootstrapped = true;
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.bootstrapped = true;
      })
      .addCase(logout.fulfilled, state => {
        state.token = null;
        state.user = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addMatcher(
        (action): action is ReturnType<typeof login.pending> =>
          [login.pending.type, register.pending.type, googleLogin.pending.type].includes(action.type),
        state => {
          state.status = 'loading';
          state.error = null;
        },
      )
      .addMatcher(
        (action): action is ReturnType<typeof login.fulfilled> =>
          [login.fulfilled.type, register.fulfilled.type, googleLogin.fulfilled.type].includes(action.type),
        (state, action) => {
          state.status = 'idle';
          state.token = action.payload.token;
          state.user = action.payload.user;
        },
      )
      .addMatcher(
        (action): action is ReturnType<typeof login.rejected> =>
          [login.rejected.type, register.rejected.type, googleLogin.rejected.type].includes(action.type),
        (state, action) => {
          state.status = 'error';
          state.error = (action.payload as string) || 'Authentication failed';
        },
      );
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
