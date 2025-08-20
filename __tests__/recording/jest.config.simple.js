/**
 * Configuration Jest simplifiée pour les tests d'enregistrement vidéo
 * Version sans transformation TypeScript complexe
 */

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,

  // Configuration spécifique pour les tests d'enregistrement vidéo
  testMatch: [
    '<rootDir>/simple-video-recording.test.ts',
  ],

  // Setup file simplifié
  setupFilesAfterEnv: [
    '<rootDir>/setup-simple.js',
  ],

  // Configuration des mocks simplifiée
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Mocks pour les dépendances externes
    '^react-native-vision-camera$': '<rootDir>/__tests__/recording/mocks/vision-camera.js',
    '^expo-camera$': '<rootDir>/__tests__/recording/mocks/expo-camera.js',
    '^react-native-fs$': '<rootDir>/__tests__/recording/mocks/react-native-fs.js',
  },

  // Configuration des transformateurs simplifiée
  transformIgnorePatterns: [
    ...baseConfig.transformIgnorePatterns,
    // Permettre la transformation de certaines dépendances
    'node_modules/(?!(react-native-vision-camera|@react-native|expo-camera|react-native-fs)/)',
  ],

  // Timeout plus long pour les tests d'intégration
  testTimeout: 10000,

  // Configuration de la verbosité
  verbose: true,

  // Configuration des timers
  fakeTimers: {
    enableGlobally: true,
  },

  // Configuration des mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
