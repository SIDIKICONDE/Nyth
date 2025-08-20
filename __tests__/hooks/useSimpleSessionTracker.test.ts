/**
 * Test du hook useSimpleSessionTracker
 * Teste le tracking des sessions utilisateur
 */

import { renderHook, act } from '@testing-library/react-native';
import { useSimpleSessionTracker } from '../../src/hooks/useSimpleSessionTracker';

// Mocks des services externes
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../src/services/userActivityService', () => ({
  userActivityService: {
    trackActivity: jest.fn(),
    startSession: jest.fn(),
    endSession: jest.fn(),
    getSessionDuration: jest.fn(),
  },
}));

jest.mock('../../src/services/analyticsService', () => ({
  analyticsService: {
    trackEvent: jest.fn(),
    trackScreenView: jest.fn(),
  },
}));

describe('useSimpleSessionTracker', () => {
  const mockAsyncStorage = require('@react-native-async-storage/async-storage');
  const mockUserActivityService = require('../../src/services/userActivityService').userActivityService;
  const mockAnalyticsService = require('../../src/services/analyticsService').analyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Session Initialization', () => {
    test('should initialize session on mount', () => {
      renderHook(() => useSimpleSessionTracker());

      expect(mockUserActivityService.startSession).toHaveBeenCalled();
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('session_start', expect.any(Object));
    });

    test('should load previous session data from storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        startTime: Date.now() - 3600000, // 1 hour ago
        lastActivity: Date.now() - 60000, // 1 minute ago
      }));

      await act(async () => {
        renderHook(() => useSimpleSessionTracker());
      });

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_session_data');
    });

    test('should handle missing session data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      await act(async () => {
        renderHook(() => useSimpleSessionTracker());
      });

      expect(mockUserActivityService.startSession).toHaveBeenCalled();
    });
  });

  describe('Activity Tracking', () => {
    test('should track user activity periodically', () => {
      renderHook(() => useSimpleSessionTracker());

      // Avancer le temps de 5 minutes (intervalle de tracking)
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockUserActivityService.trackActivity).toHaveBeenCalled();
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('user_activity', expect.any(Object));
    });

    test('should save session data to storage periodically', () => {
      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_session_data',
        expect.any(String)
      );
    });

    test('should handle storage errors gracefully', () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Le hook devrait continuer à fonctionner malgré l'erreur de stockage
      expect(mockUserActivityService.trackActivity).toHaveBeenCalled();
    });
  });

  describe('Session Duration', () => {
    test('should calculate session duration correctly', () => {
      const startTime = Date.now() - 3600000; // 1 hour ago
      mockUserActivityService.getSessionDuration.mockReturnValue(3600000);

      renderHook(() => useSimpleSessionTracker());

      expect(mockUserActivityService.getSessionDuration).toHaveBeenCalled();
    });

    test('should track long sessions', () => {
      mockUserActivityService.getSessionDuration.mockReturnValue(4 * 60 * 60 * 1000); // 4 hours

      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
        'long_session',
        expect.objectContaining({ duration: 4 * 60 * 60 * 1000 })
      );
    });
  });

  describe('Session End', () => {
    test('should end session on unmount', () => {
      const { unmount } = renderHook(() => useSimpleSessionTracker());

      act(() => {
        unmount();
      });

      expect(mockUserActivityService.endSession).toHaveBeenCalled();
      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('session_end', expect.any(Object));
    });

    test('should save final session data on unmount', () => {
      const { unmount } = renderHook(() => useSimpleSessionTracker());

      act(() => {
        unmount();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_session_data',
        expect.any(String)
      );
    });

    test('should handle unmount errors gracefully', () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const { unmount } = renderHook(() => useSimpleSessionTracker());

      act(() => {
        unmount();
      });

      // Le hook devrait quand même terminer la session
      expect(mockUserActivityService.endSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle AsyncStorage errors during initialization', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));

      await act(async () => {
        expect(() => {
          renderHook(() => useSimpleSessionTracker());
        }).not.toThrow();
      });

      expect(mockUserActivityService.startSession).toHaveBeenCalled();
    });

    test('should handle userActivityService errors', () => {
      mockUserActivityService.trackActivity.mockImplementationOnce(() => {
        throw new Error('Service error');
      });

      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Le hook devrait continuer à fonctionner
      expect(mockUserActivityService.startSession).toHaveBeenCalled();
    });

    test('should handle analytics errors', () => {
      mockAnalyticsService.trackEvent.mockImplementationOnce(() => {
        throw new Error('Analytics error');
      });

      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      // Le hook devrait continuer à fonctionner
      expect(mockUserActivityService.trackActivity).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should use efficient timers', () => {
      renderHook(() => useSimpleSessionTracker());

      // Vérifier que les timers sont configurés avec un intervalle raisonnable
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
    });

    test('should cleanup timers on unmount', () => {
      const { unmount } = renderHook(() => useSimpleSessionTracker());

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      act(() => {
        unmount();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    test('should not create multiple timers', () => {
      renderHook(() => useSimpleSessionTracker());

      // Le hook ne devrait créer qu'un seul timer
      expect(setInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('Analytics Integration', () => {
    test('should track session events', () => {
      renderHook(() => useSimpleSessionTracker());

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('session_start', expect.any(Object));
    });

    test('should track activity events', () => {
      renderHook(() => useSimpleSessionTracker());

      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith('user_activity', expect.any(Object));
    });

    test('should include session metadata in events', () => {
      renderHook(() => useSimpleSessionTracker());

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
        'session_start',
        expect.objectContaining({
          timestamp: expect.any(Number),
          platform: expect.any(String),
        })
      );
    });
  });
});
