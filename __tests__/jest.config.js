/**
 * Configuration Jest pour les tests complets de l'application Nyth
 * Configuration optimisée pour React Native avec TypeScript
 */

module.exports = {
  preset: 'react-native',

  // Configuration des mocks
  setupFilesAfterEnv: ['<rootDir>/../setup/jest.setup.js'],

  // Extensions de fichiers
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Fichiers à ignorer
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/vendor/',
  ],

  // Patterns de fichiers de test
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],

  // Transformations pour les modules ES6
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-native-firebase|@react-navigation|react-native-reanimated|react-native-gesture-handler)/)',
  ],

  // Variables globales
  globals: {
    __DEV__: true,
    __TEST__: true,
  },

  // Configuration des timers
  timers: 'fake',

  // Timeouts
  testTimeout: 10000,

  // Mode verbeux pour les détails
  verbose: true,
};
