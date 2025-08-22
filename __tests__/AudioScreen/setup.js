/**
 * Setup Jest pour les tests AudioScreen
 * Configure les mocks globaux et l'environnement de test
 */

import { jest } from '@jest/globals';

// Configuration globale de Jest
global.jest = jest;

// Mock de console pour réduire le bruit pendant les tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Mock des timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Configuration des variables globales de test
global.__TEST__ = true;
global.__DEV__ = true;

// Export des utilitaires de test avancés
global.testUtils = {
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),
  flushPromises: () => new Promise(setImmediate),
  createMockStore: (initialState = {}) => ({
    getState: () => initialState,
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }),
  createMockNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    dispatch: jest.fn(),
  }),
};

// Configuration globale pour les tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock des modules React Native
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});

// Mock des modules de navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

// Mock des modules de sécurité
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    bottom: 34,
    left: 0,
    right: 0,
  })),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock des modules d'orientation
jest.mock('@react-native-community/hooks', () => ({
  useOrientation: jest.fn(() => ({
    orientation: 'portrait',
  })),
}));

// Mock des modules de stockage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock des modules de thème
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        accent: '#3B82F6',
        text: '#000000',
        textSecondary: '#666666',
        background: '#FFFFFF',
        border: '#E5E7EB',
      },
    },
  }),
}));

// Mock des modules de traduction
jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock des modules d'orientation
jest.mock('@/hooks/useOrientation', () => ({
  useOrientation: () => ({
    orientation: 'portrait',
  }),
}));

// Mock des modules de logger
jest.mock('@/utils/optimizedLogger', () => ({
  createOptimizedLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

// Mock des modules d'animation
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock des modules de gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock des modules d'icônes
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');

// Mock des modules d'alerte
jest.spyOn(require('react-native'), 'Alert').mockImplementation(() => {});

// Mock complet de React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');

  RN.PixelRatio = {
    get: jest.fn(() => 2),
    getPixelSizeForLayoutSize: jest.fn(size => size * 2),
    roundToNearestPixel: jest.fn(size => Math.round(size * 2) / 2),
  };

  RN.Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  return RN;
});

// Mock forcé pour react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  return ({ children, ...props }) =>
    React.createElement('LinearGradient', { ...props, children });
});

// Mock forcé pour react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  return ({ children, ...props }) =>
    React.createElement('Ionicons', { ...props, children });
});

jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return ({ children, ...props }) =>
    React.createElement('MaterialIcons', { ...props, children });
});

console.log('✅ Setup AudioScreen tests terminé');
