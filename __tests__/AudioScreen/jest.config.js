/**
 * Configuration Jest spécifique pour les tests AudioScreen
 * Cette configuration étend la configuration principale avec des setups spécifiques
 */

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,

  // Configuration spécifique pour les tests AudioScreen
  testMatch: ['<rootDir>/__tests__/AudioScreen/**/*.test.(js|jsx|ts|tsx)'],

  // Setup file pour les mocks
  setupFilesAfterEnv: ['<rootDir>/__tests__/AudioScreen/setup.js'],

  // Configuration des mocks spécifique
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Mocks pour les dépendances externes
    '^react-native-reanimated$':
      '<rootDir>/__tests__/AudioScreen/mocks/react-native-reanimated.js',
    '^react-native-linear-gradient$':
      '<rootDir>/__tests__/AudioScreen/mocks/react-native-linear-gradient.js',
    '^react-native-vector-icons/.*$':
      '<rootDir>/__tests__/AudioScreen/mocks/react-native-vector-icons.js',
    '^twrnc$': '<rootDir>/__tests__/AudioScreen/mocks/twrnc.js',
  },

  // Configuration des transformateurs
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-linear-gradient|@react-native|@react-navigation|react-native-reanimated|react-native-vector-icons)/)',
  ],

  // Timeout pour les tests d'intégration
  testTimeout: 15000,

  // Configuration de la verbosité
  verbose: true,

  // Configuration des timers
  timers: 'fake',

  // Configuration des mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Configuration de la couverture
  collectCoverageFrom: [
    'src/screens/AudioScreen/**/*.{ts,tsx}',
    '!src/screens/AudioScreen/**/*.d.ts',
    '!src/screens/AudioScreen/**/*.test.{ts,tsx}',
  ],

  // Seuil de couverture pour AudioScreen
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
