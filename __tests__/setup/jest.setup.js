/**
 * Setup Jest global pour tous les tests
 * Configuration des mocks et utilitaires globaux
 */

import 'react-native-gesture-handler/jestSetup';

// Mocks globaux pour React Native - Version avancée
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock pour react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
    TapGestureHandler: View,
    State: {
      UNDETERMINED: 0,
      FAILED: 1,
      BEGAN: 2,
      CANCELLED: 3,
      ACTIVE: 4,
      END: 5,
    },
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  mergeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  flushGetRequests: jest.fn(),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  multiMerge: jest.fn().mockResolvedValue(undefined),
}));

// Mocks Firebase
jest.mock('@react-native-firebase/app', () => ({
  default: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/auth', () => ({
  default: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  default: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  default: jest.fn(() => ({})),
  messaging: jest.fn(() => ({
    setBackgroundMessageHandler: jest.fn(),
    getToken: jest.fn().mockResolvedValue('mock-token'),
  })),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  default: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/storage', () => ({
  default: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/functions', () => ({
  default: jest.fn(() => ({})),
}));

// Mocks pour les autres dépendances
jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageCode: 'fr', countryCode: 'FR' }],
  getCurrencies: () => ['EUR'],
  getTimeZone: () => 'Europe/Paris',
  getCountry: () => 'FR',
  getLanguages: () => ['fr-FR'],
  uses24HourClock: () => true,
  usesMetricSystem: () => true,
}));

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getSystemName: () => 'iOS',
  getSystemVersion: () => '14.0',
  getDeviceName: () => 'iPhone',
  getUniqueId: () => 'mock-device-id',
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn().mockResolvedValue({
    type: 'wifi',
    isConnected: true,
  }),
}));

// Mocks pour les dimensions et la plateforme
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  Version: 14,
}));

// Mock pour les notifications push
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  onRegister: jest.fn(),
  onNotification: jest.fn(),
  addEventListener: jest.fn(),
  requestPermissions: jest.fn(),
}));

// Mock pour les haptic feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock pour les sensors
jest.mock('react-native-sensors', () => ({
  gyroscope: jest.fn(() => ({
    subscribe: jest.fn(() => ({
      unsubscribe: jest.fn(),
    })),
  })),
}));

// Configuration des variables globales de test
global.__TEST__ = true;
global.__DEV__ = true;

// Export des utilitaires de test avancés
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
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
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Configuration des console warnings/errors pour les tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
