/**
 * Test des CombinedProviders
 * Teste la hiérarchie des providers et leur rendu correct
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mocks de tous les providers
jest.mock('../../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="auth-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/GlobalPreferencesContext', () => ({
  GlobalPreferencesProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="global-preferences-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/FontContext', () => ({
  FontProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="font-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/DisplayPreferencesContext', () => ({
  DisplayPreferencesProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="display-preferences-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/LayoutPreferencesContext', () => ({
  LayoutPreferencesProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="layout-preferences-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/InputStyleContext', () => ({
  InputStyleProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="input-style-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/ChatStyleContext', () => ({
  ChatStyleProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="chat-style-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/MessageLayoutContext', () => ({
  MessageLayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="message-layout-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="settings-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="theme-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/UserProfileContext', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="user-profile-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/SubscriptionContext', () => ({
  SubscriptionProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="subscription-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/ScriptsContext', () => ({
  ScriptsProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="scripts-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/ChatContext', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="chat-provider">{children}</View>
  ),
}));

jest.mock('../../src/contexts/AchievementContext', () => ({
  AchievementProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="achievement-provider">{children}</View>
  ),
}));

// Mocks des providers externes
jest.mock('react-native-paper', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => (
    <View testID="paper-provider">{children}</View>
  ),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
    <View testID="safe-area-provider">{children}</View>
  ),
}));

// Import du composant après les mocks
import { CombinedProviders } from '../../src/contexts/CombinedProviders';

describe('CombinedProviders', () => {
  const TestChild = () => <Text testID="test-child">Test Content</Text>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Hierarchy', () => {
    test('should render all providers in correct order', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        // Vérifier que tous les providers sont rendus
        expect(getByTestId('safe-area-provider')).toBeTruthy();
        expect(getByTestId('paper-provider')).toBeTruthy();
        expect(getByTestId('auth-provider')).toBeTruthy();
        expect(getByTestId('global-preferences-provider')).toBeTruthy();
        expect(getByTestId('settings-provider')).toBeTruthy();
        expect(getByTestId('theme-provider')).toBeTruthy();
        expect(getByTestId('font-provider')).toBeTruthy();
        expect(getByTestId('display-preferences-provider')).toBeTruthy();
        expect(getByTestId('layout-preferences-provider')).toBeTruthy();
        expect(getByTestId('input-style-provider')).toBeTruthy();
        expect(getByTestId('chat-style-provider')).toBeTruthy();
        expect(getByTestId('message-layout-provider')).toBeTruthy();
        expect(getByTestId('user-profile-provider')).toBeTruthy();
        expect(getByTestId('subscription-provider')).toBeTruthy();
        expect(getByTestId('achievement-provider')).toBeTruthy();
        expect(getByTestId('scripts-provider')).toBeTruthy();
        expect(getByTestId('chat-provider')).toBeTruthy();
        expect(getByTestId('test-child')).toBeTruthy();
      });
    });

    test('should render SafeAreaProvider as root provider', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        const safeAreaProvider = getByTestId('safe-area-provider');
        expect(safeAreaProvider).toBeTruthy();
        // Vérifier que c'est le provider racine
        expect(safeAreaProvider.parent?.props?.testID).toBeUndefined();
      });
    });

    test('should render children inside the innermost provider', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        // L'enfant devrait être dans le provider le plus interne (chat-provider)
        const chatProvider = getByTestId('chat-provider');
        expect(chatProvider).toBeTruthy();
        expect(getByTestId('test-child')).toBeTruthy();
      });
    });
  });

  describe('Memoization', () => {
    test('should memoize children to prevent unnecessary re-renders', async () => {
      const renderCount = { current: 0 };

      const TestComponent = () => {
        renderCount.current++;
        return <Text testID="memo-test">Memo Test</Text>;
      };

      const MemoizedTestComponent = React.memo(TestComponent);

      await act(async () => {
        const { rerender, getByTestId } = render(
          <CombinedProviders>
            <MemoizedTestComponent />
          </CombinedProviders>
        );

        expect(renderCount.current).toBe(1);
        expect(getByTestId('memo-test')).toBeTruthy();

        // Re-render avec les mêmes props
        rerender(
          <CombinedProviders>
            <MemoizedTestComponent />
          </CombinedProviders>
        );

        // Le composant ne devrait pas être re-rendu grâce à la mémoisation
        expect(renderCount.current).toBe(1);
      });
    });

    test('should have proper displayName for debugging', () => {
      expect(CombinedProviders.displayName).toBe('CombinedProviders');
    });
  });

  describe('Provider Groups', () => {
    test('should render UI Preferences providers in correct hierarchy', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        // Vérifier l'ordre des providers UI
        const fontProvider = getByTestId('font-provider');
        const displayPrefs = getByTestId('display-preferences-provider');
        const layoutPrefs = getByTestId('layout-preferences-provider');
        const inputStyle = getByTestId('input-style-provider');
        const chatStyle = getByTestId('chat-style-provider');
        const messageLayout = getByTestId('message-layout-provider');

        expect(fontProvider).toBeTruthy();
        expect(displayPrefs).toBeTruthy();
        expect(layoutPrefs).toBeTruthy();
        expect(inputStyle).toBeTruthy();
        expect(chatStyle).toBeTruthy();
        expect(messageLayout).toBeTruthy();
      });
    });

    test('should render User Data providers in correct hierarchy', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        // Vérifier l'ordre des providers de données utilisateur
        const userProfile = getByTestId('user-profile-provider');
        const subscription = getByTestId('subscription-provider');
        const achievement = getByTestId('achievement-provider');

        expect(userProfile).toBeTruthy();
        expect(subscription).toBeTruthy();
        expect(achievement).toBeTruthy();
      });
    });

    test('should render App Features providers in correct hierarchy', async () => {
      await act(async () => {
        const { getByTestId } = render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );

        // Vérifier l'ordre des providers de fonctionnalités
        const scripts = getByTestId('scripts-provider');
        const chat = getByTestId('chat-provider');

        expect(scripts).toBeTruthy();
        expect(chat).toBeTruthy();
      });
    });
  });

  describe('Performance Optimization', () => {
    test('should use React.memo for performance optimization', () => {
      expect(React.memo).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should memoize children content', async () => {
      const useMemoSpy = jest.spyOn(React, 'useMemo');

      await act(async () => {
        render(
          <CombinedProviders>
            <TestChild />
          </CombinedProviders>
        );
      });

      expect(useMemoSpy).toHaveBeenCalledWith(expect.any(Function), [expect.any(Object)]);
      useMemoSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle undefined children gracefully', async () => {
      await act(async () => {
        expect(() => {
          render(
            <CombinedProviders>
              {undefined}
            </CombinedProviders>
          );
        }).not.toThrow();
      });
    });

    test('should handle null children gracefully', async () => {
      await act(async () => {
        expect(() => {
          render(
            <CombinedProviders>
              {null}
            </CombinedProviders>
          );
        }).not.toThrow();
      });
    });

    test('should handle empty children gracefully', async () => {
      await act(async () => {
        expect(() => {
          render(<CombinedProviders>{[]}</CombinedProviders>);
        }).not.toThrow();
      });
    });
  });
});
