module.exports = {
  preset: 'react-native',
  setupFiles: [
    '<rootDir>/jest.setup.js',
  ],
  fakeTimers: { enableGlobally: true },
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'react-native' +
      '|@react-native' +
      '|react-native-gesture-handler' +
      '|react-native-google-mobile-ads' +
      '|react-native-iap' +
      '|react-native-reanimated' +
      '|react-native-safe-area-context' +
      '|react-native-vector-icons' +
      '|react-native-nitro-modules' +
      '|react-native-worklets' +
    ')/)',
  ],
};
