/**
 * Configuration Jest spécifique pour les tests d'enregistrement vidéo
 * Cette configuration étend la configuration principale avec des setups spécifiques
 */

const baseConfig = require('../../jest.config.js');

// Configuration Jest simplifiée pour les tests d'enregistrement vidéo
// Utilise la configuration de base avec quelques ajustements

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,

  // Configuration spécifique pour les tests d'enregistrement vidéo
  testMatch: [
    '<rootDir>/__tests__/recording/**/*.test.(js|jsx|ts|tsx)',
  ],

  // Setup file pour les mocks
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/recording/setup.js',
  ],

  // Configuration des mocks simplifiée
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Mocks pour les dépendances externes
    '^react-native-vision-camera$': '<rootDir>/__tests__/recording/mocks/vision-camera.js',
    '^expo-camera$': '<rootDir>/__tests__/recording/mocks/expo-camera.js',
    '^react-native-fs$': '<rootDir>/__tests__/recording/mocks/react-native-fs.js',
  },

  // Configuration simplifiée des transformateurs
  transformIgnorePatterns: [
    ...baseConfig.transformIgnorePatterns,
    // Permettre la transformation de certaines dépendances
    'node_modules/(?!(react-native-vision-camera|@react-native|expo-camera|react-native-fs)/)',
  ],

  // Timeout plus long pour les tests d'intégration
  testTimeout: 15000,

  // Configuration de la verbosité
  verbose: true,

  // Configuration des timers
  timers: 'fake',

  // Configuration des mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
