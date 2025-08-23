/**
 * Configuration Jest spécifique pour les tests HamburgerMenu
 */

const baseConfig = require('../../jest.config.js');

module.exports = {
  ...baseConfig,

  // Configuration spécifique pour les tests HamburgerMenu
  setupFilesAfterEnv: [
    ...baseConfig.setupFilesAfterEnv,
    './HamburgerMenu.setup.js'
  ],

  // Pattern pour les tests HamburgerMenu
  testMatch: [
    '**/__tests__/home/components/HamburgerMenu.test.tsx',
    '**/__tests__/home/components/HamburgerMenu.integration.test.tsx'
  ],

  // Configuration des mocks
  moduleNameMapping: {
    ...baseConfig.moduleNameMapping,
    // Mocks spécifiques pour les animations
    '^react-native/Libraries/Animated/Animated$': '<rootDir>/__tests__/home/components/HamburgerMenu.setup.js'
  },

  // Configuration de la couverture pour les tests HamburgerMenu
  collectCoverageFrom: [
    'src/components/home/UnifiedHomeFAB/designs/HamburgerMenu.tsx',
    'src/components/home/UnifiedHomeFAB/types.ts'
  ],

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90
    }
  },

  // Configuration pour les tests d'animation
  testTimeout: 10000,

  // Snapshots pour les tests visuels
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],

  // Configuration pour les tests d'accessibilité
  setupFiles: [
    './accessibility-setup.js'
  ]
};
