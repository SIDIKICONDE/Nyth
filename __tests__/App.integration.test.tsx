/**
 * Test d'intégration complet pour l'application Nyth
 * Teste l'initialisation, les providers, la navigation et les services principaux
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Mocks des services externes
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    setBackgroundMessageHandler: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native-localize', () => ({
  getLocales: () => [{ languageCode: 'fr', countryCode: 'FR' }],
  getCurrencies: () => ['EUR'],
  getTimeZone: () => 'Europe/Paris',
}));

jest.mock('./src/services/performance/PerformanceMonitor', () => ({
  performanceMonitor: {
    startMonitoring: jest.fn(),
    setThresholds: jest.fn(),
  },
}));

jest.mock('./src/services/performance/OptimizedWarmupService', () => ({
  OptimizedWarmupService: {
    init: jest.fn(),
    cleanup: jest.fn(),
  },
}));

jest.mock('./src/services/performance/LazyLoadService', () => ({
  LazyLoadService: {
    preloadModules: jest.fn().mockResolvedValue(undefined),
    clearCache: jest.fn(),
  },
}));

// Mocks des contextes
jest.mock('./src/contexts/CombinedProviders', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CombinedProviders: ({ children }: { children: React.ReactNode }) => (
      <View testID="combined-providers">{children}</View>
    ),
  };
});

jest.mock('./src/contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    isLoading: false,
  }),
}));

jest.mock('./src/navigation/AppNavigator', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return () => (
    <View testID="app-navigator">
      <Text>App Navigator</Text>
    </View>
  );
});

jest.mock('./src/locales/i18n', () => ({
  isI18nReady: () => true,
  waitForI18n: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./src/utils/optimizedLogger', () => ({
  createOptimizedLogger: () => ({
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }),
  disableConsoleLogs: jest.fn(),
}));

jest.mock('./src/hooks/useSimpleSessionTracker', () => ({
  useSimpleSessionTracker: jest.fn(),
}));

// Import de l'App après les mocks
import App from '../App';

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App Initialization', () => {
    test('should render without crashing', async () => {
      await act(async () => {
        const { getByTestId } = render(<App />);

        // Vérifier que les éléments principaux sont rendus
        expect(getByTestId('combined-providers')).toBeTruthy();
        expect(getByTestId('app-navigator')).toBeTruthy();
      });
    });

    test('should initialize services on mount', async () => {
      const mockWaitForI18n = require('./src/locales/i18n').waitForI18n;
      const mockOptimizedWarmupService = require('./src/services/performance/OptimizedWarmupService').OptimizedWarmupService;
      const mockLazyLoadService = require('./src/services/performance/LazyLoadService').LazyLoadService;

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(mockWaitForI18n).toHaveBeenCalled();
        expect(mockOptimizedWarmupService.init).toHaveBeenCalled();
        expect(mockLazyLoadService.preloadModules).toHaveBeenCalledWith([
          {
            name: "react-native-localize",
            loader: expect.any(Function),
          },
        ]);
      });
    });

    test('should handle i18n initialization error gracefully', async () => {
      const mockWaitForI18n = require('./src/locales/i18n').waitForI18n;
      mockWaitForI18n.mockRejectedValueOnce(new Error('i18n initialization failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Erreur lors de l\'initialisation'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    test('should start performance monitoring in development', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      const mockPerformanceMonitor = require('./src/services/performance/PerformanceMonitor').performanceMonitor;

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled();
        expect(mockPerformanceMonitor.setThresholds).toHaveBeenCalledWith({
          minFPS: 50,
          maxMemoryMB: 200,
          maxRenderTimeMS: 16,
          maxInteractionTimeMS: 50,
        });
      });

      (global as any).__DEV__ = originalDev;
    });

    test('should setup Firebase messaging handler', async () => {
      const mockMessaging = require('@react-native-firebase/messaging').default;

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(mockMessaging().setBackgroundMessageHandler).toHaveBeenCalledWith(
          expect.any(Function)
        );
      });
    });
  });

  describe('App Structure', () => {
    test('should render with proper component hierarchy', async () => {
      await act(async () => {
        const { getByTestId } = render(<App />);

        // Vérifier la hiérarchie des composants
        expect(getByTestId('combined-providers')).toBeTruthy();
        expect(getByTestId('app-navigator')).toBeTruthy();
      });
    });

    test('should render ErrorBoundary as root component', async () => {
      const { getByTestId } = render(<App />);

      // ErrorBoundary devrait envelopper toute l'application
      expect(getByTestId('combined-providers').parent?.props?.testID).toBeUndefined();
    });

    test('should render GestureHandlerRootView', async () => {
      const { getByTestId } = render(<App />);

      // GestureHandlerRootView devrait être présent
      const gestureHandler = getByTestId('combined-providers').parent;
      expect(gestureHandler?.type?.name).toBe('GestureHandlerRootView');
    });
  });

  describe('Cleanup on Unmount', () => {
    test('should cleanup services on unmount', async () => {
      const mockOptimizedWarmupService = require('./src/services/performance/OptimizedWarmupService').OptimizedWarmupService;
      const mockLazyLoadService = require('./src/services/performance/LazyLoadService').LazyLoadService;

      let unmount: () => void;

      await act(async () => {
        const result = render(<App />);
        unmount = result.unmount;
      });

      await act(async () => {
        unmount!();
      });

      expect(mockOptimizedWarmupService.cleanup).toHaveBeenCalled();
      expect(mockLazyLoadService.clearCache).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle Firebase messaging setup error', async () => {
      const mockMessaging = require('@react-native-firebase/messaging').default;
      mockMessaging.mockImplementation(() => {
        throw new Error('Firebase not initialized');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(<App />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Erreur lors de l\'initialisation'),
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    test('should handle LazyLoadService preload error gracefully', async () => {
      const mockLazyLoadService = require('./src/services/performance/LazyLoadService').LazyLoadService;
      mockLazyLoadService.preloadModules.mockRejectedValueOnce(new Error('Preload failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(<App />);
      });

      // L'erreur devrait être ignorée silencieusement
      expect(mockLazyLoadService.preloadModules).toHaveBeenCalled();
      // Pas d'erreur dans les logs car elle est catchée
    });
  });
});
