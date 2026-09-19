module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native[^/]*|@react-native[^/]*|@react-navigation[^/]*|react-redux|@reduxjs[^/]*|immer)/)',
  ],
  moduleNameMapper: {
    // Both wrap native TurboModules that don't exist under Jest — google-signin has no
    // official mock (see __mocks__/), react-native-permissions ships its own.
    '^react-native-permissions$': 'react-native-permissions/mock',
  },
};
