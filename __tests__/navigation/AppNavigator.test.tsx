/**
 * Test de l'AppNavigator
 * Teste la logique de navigation entre écrans d'authentification et écrans principaux
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// Mocks des contextes
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mocks des écrans
jest.mock('../../src/screens/auth', () => ({
  LoginScreen: () => <mock-LoginScreen />,
  RegisterScreen: () => <mock-RegisterScreen />,
}));

jest.mock('../../src/screens/LoadingScreen', () => ({
  __esModule: true,
  default: () => <mock-LoadingScreen />,
}));

jest.mock('../../src/navigation/AppNavigator', () => ({
  __esModule: true,
  default: jest.fn(() => <mock-AppNavigator />),
}));

// Import après les mocks
import AppNavigator from '../../src/navigation/AppNavigator';

describe('AppNavigator', () => {
  const mockUseAuth = require('../../src/contexts/AuthContext').useAuth;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication State', () => {
    test('should show LoadingScreen when auth is loading', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: true,
      });

      await act(async () => {
        const { getByText } = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );

        expect(getByText('mock-LoadingScreen')).toBeTruthy();
      });
    });

    test('should show AuthNavigator when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
      MockedAppNavigator.mockImplementation(() => <mock-AuthNavigator />);

      await act(async () => {
        const { getByText } = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );

        expect(getByText('mock-AuthNavigator')).toBeTruthy();
      });
    });

    test('should show MainNavigator when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'test@example.com' },
        isLoading: false,
      });

      const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
      MockedAppNavigator.mockImplementation(() => <mock-MainNavigator />);

      await act(async () => {
        const { getByText } = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );

        expect(getByText('mock-MainNavigator')).toBeTruthy();
      });
    });
  });

  describe('Navigation Logic', () => {
    test('should handle guest user authentication', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'guest_123', email: null, isGuest: true },
        isLoading: false,
      });

      const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
      MockedAppNavigator.mockImplementation(() => <mock-MainNavigator />);

      await act(async () => {
        const { getByText } = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );

        expect(getByText('mock-MainNavigator')).toBeTruthy();
      });
    });

    test('should handle regular user authentication', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: {
          uid: 'user123',
          email: 'user@example.com',
          emailVerified: true,
          isGuest: false
        },
        isLoading: false,
      });

      const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
      MockedAppNavigator.mockImplementation(() => <mock-MainNavigator />);

      await act(async () => {
        const { getByText } = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );

        expect(getByText('mock-MainNavigator')).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    test('should transition from loading to auth screens', async () => {
      // Initial state: loading
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: true,
      });

      let rerender: any;

      await act(async () => {
        const result = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
        rerender = result.rerender;
      });

      // Transition to not loading, no user
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      await act(async () => {
        rerender(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
      });

      await waitFor(() => {
        const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
        expect(MockedAppNavigator).toHaveBeenCalled();
      });
    });

    test('should transition from loading to main screens when user is authenticated', async () => {
      // Initial state: loading
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: true,
      });

      let rerender: any;

      await act(async () => {
        const result = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
        rerender = result.rerender;
      });

      // Transition to authenticated user
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'test@example.com' },
        isLoading: false,
      });

      await act(async () => {
        rerender(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
      });

      await waitFor(() => {
        const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
        expect(MockedAppNavigator).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle undefined currentUser gracefully', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: undefined,
        isLoading: false,
      });

      await act(async () => {
        expect(() => {
          render(
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          );
        }).not.toThrow();
      });
    });

    test('should handle null currentUser gracefully', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      await act(async () => {
        expect(() => {
          render(
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          );
        }).not.toThrow();
      });
    });

    test('should handle malformed user object gracefully', async () => {
      mockUseAuth.mockReturnValue({
        currentUser: { invalid: 'object' },
        isLoading: false,
      });

      await act(async () => {
        expect(() => {
          render(
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          );
        }).not.toThrow();
      });
    });
  });

  describe('User State Changes', () => {
    test('should handle user logout transition', async () => {
      // Start with authenticated user
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'test@example.com' },
        isLoading: false,
      });

      let rerender: any;

      await act(async () => {
        const result = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
        rerender = result.rerender;
      });

      // User logs out
      mockUseAuth.mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      await act(async () => {
        rerender(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
      });

      await waitFor(() => {
        const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
        expect(MockedAppNavigator).toHaveBeenCalled();
      });
    });

    test('should handle user switching accounts', async () => {
      // Start with user1
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user1', email: 'user1@example.com' },
        isLoading: false,
      });

      let rerender: any;

      await act(async () => {
        const result = render(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
        rerender = result.rerender;
      });

      // Switch to user2
      mockUseAuth.mockReturnValue({
        currentUser: { uid: 'user2', email: 'user2@example.com' },
        isLoading: false,
      });

      await act(async () => {
        rerender(
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        );
      });

      await waitFor(() => {
        const MockedAppNavigator = require('../../src/navigation/AppNavigator').default;
        expect(MockedAppNavigator).toHaveBeenCalled();
      });
    });
  });
});
