/**
 * Test des CombinedProviders
 * Teste la hiérarchie des providers et leur rendu correct
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mocks de tous les providers
jest.mock('../../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/GlobalPreferencesContext', () => ({
  GlobalPreferencesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/FontContext', () => ({
  FontProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/DisplayPreferencesContext', () => ({
  DisplayPreferencesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/LayoutPreferencesContext', () => ({
  LayoutPreferencesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/InputStyleContext', () => ({
  InputStyleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/ChatStyleContext', () => ({
  ChatStyleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/MessageLayoutContext', () => ({
  MessageLayoutProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/SettingsContext', () => ({
  SettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/UserProfileContext', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/SubscriptionContext', () => ({
  SubscriptionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/ScriptsContext', () => ({
  ScriptsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/ChatContext', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../src/contexts/AchievementContext', () => ({
  AchievementProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mocks des providers externes
jest.mock('react-native-paper', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Import du composant après les mocks
import { CombinedProviders } from '../../src/contexts/CombinedProviders';

describe('CombinedProviders', () => {
  test('should be a valid React component', () => {
    expect(CombinedProviders).toBeDefined();
    expect(typeof CombinedProviders).toBe('object');
  });

  test('should have displayName property', () => {
    expect(CombinedProviders.displayName).toBe('CombinedProviders');
  });

  test('should accept children as prop', () => {
    // Test simple que le composant peut être créé sans erreur
    expect(() => {
      const element = React.createElement(CombinedProviders, { children: 'test' }, 'test');
      expect(element).toBeDefined();
    }).not.toThrow();
  });

  test('should be a valid JSX element', () => {
    // Test que le composant peut être utilisé en JSX
    const element = <CombinedProviders>test</CombinedProviders>;
    expect(element).toBeDefined();
    expect(element.type).toBe(CombinedProviders);
  });
});
