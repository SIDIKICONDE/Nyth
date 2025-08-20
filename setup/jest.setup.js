/**
 * Setup Jest global pour tous les tests
 * Configuration des mocks et utilitaires globaux
 */

import 'react-native-gesture-handler/jestSetup';

// Mocks globaux pour React Native
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  flushGetRequests: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/auth', () => ({}));
jest.mock('@react-native-firebase/firestore', () => ({}));
jest.mock('@react-native-firebase/messaging', () => ({}));
jest.mock('@react-native-firebase/analytics', () => ({}));
jest.mock('@react-native-firebase/storage', () => ({}));
jest.mock('@react-native-firebase/functions', () => ({}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageCode: 'fr', countryCode: 'FR' }],
  getCurrencies: () => ['EUR'],
  getTimeZone: () => 'Europe/Paris',
  getCountry: () => 'FR',
  getLanguages: () => ['fr-FR'],
}));

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  getBuildNumber: () => '1',
  getSystemName: () => 'iOS',
  getSystemVersion: () => '14.0',
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock pour les dimensions de l'écran
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock pour Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

// Configuration des variables globales de test
global.__TEST__ = true;
global.__DEV__ = true;

// Export des utilitaires de test
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  flushPromises: () => new Promise(setImmediate),
};
