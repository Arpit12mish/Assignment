// Manual Jest mock — the real module wraps a native TurboModule that doesn't exist in
// the Jest environment, so any test that imports it (even transitively, via authSlice)
// needs this stand-in. Only the methods TaskFlow actually calls are implemented.
module.exports = {
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({ type: 'success', data: { idToken: 'mock-id-token' } }),
    ),
    signOut: jest.fn(() => Promise.resolve()),
  },
};
