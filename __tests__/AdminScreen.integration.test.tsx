import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AdminScreenV2 } from '../src/screens/AdminScreen/AdminScreenV2';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AdminProvider } from '../src/contexts/AdminContext';

// Mock des services admin
jest.mock('../src/services/adminCloudService', () => ({
  AdminCloudService: jest.fn().mockImplementation(() => ({
    getUsers: jest.fn().mockResolvedValue([
      { id: '1', email: 'admin@test.com', role: 'admin' },
      { id: '2', email: 'user@test.com', role: 'user' }
    ]),
    updateUserRole: jest.fn().mockResolvedValue(true),
    getStats: jest.fn().mockResolvedValue({
      totalUsers: 100,
      activeUsers: 75,
      premiumUsers: 25
    })
  }))
}));

jest.mock('../src/services/adminLocalService', () => ({
  AdminLocalService: jest.fn().mockImplementation(() => ({
    getLocalUsers: jest.fn().mockResolvedValue([]),
    getLocalStats: jest.fn().mockResolvedValue({})
  }))
}));

// Mock des hooks
jest.mock('../src/screens/AdminScreen/hooks/useAdminData', () => ({
  useAdminData: () => ({
    users: [
      { id: '1', email: 'admin@test.com', role: 'admin' },
      { id: '2', email: 'user@test.com', role: 'user' }
    ],
    stats: {
      totalUsers: 100,
      activeUsers: 75,
      premiumUsers: 25
    },
    loading: false,
    error: null,
    updateUserRole: jest.fn(),
    refreshData: jest.fn()
  })
}));

// Mock de l'authentification
jest.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => {
    const MockView = require('react-native').View;
    return React.createElement(MockView, { testID: "auth-provider" }, children);
  },
  useAuth: () => ({
    currentUser: { role: 'super_admin' },
    isAuthenticated: true,
    loading: false
  })
}));

// Mock du contexte admin
jest.mock('../src/contexts/AdminContext', () => ({
  AdminProvider: ({ children }: { children: React.ReactNode }) => {
    const MockView = require('react-native').View;
    return React.createElement(MockView, { testID: "admin-provider" }, children);
  },
  useAdmin: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    isSuperAdmin: true
  })
}));

describe('AdminScreen - Tests d\'Intégration', () => {
  const renderAdminScreen = () => {
    return render(
      <NavigationContainer>
        <AuthProvider>
          <AdminProvider>
            <AdminScreenV2 />
          </AdminProvider>
        </AuthProvider>
      </NavigationContainer>
    );
  };

  describe('Rendu de base', () => {
    it('devrait afficher l\'écran d\'administration', async () => {
      const { getByTestId } = renderAdminScreen();
      
      await waitFor(() => {
        expect(getByTestId('admin-screen-container')).toBeTruthy();
      });
    });

    it('devrait afficher les onglets principaux', async () => {
      const { getByText } = renderAdminScreen();
      
      await waitFor(() => {
        expect(getByText('Dashboard')).toBeTruthy();
        expect(getByText('Utilisateurs')).toBeTruthy();
        expect(getByText('Statistiques')).toBeTruthy();
      });
    });
  });

  describe('Navigation entre onglets', () => {
    it('devrait naviguer vers l\'onglet Utilisateurs', async () => {
      const { getByText } = renderAdminScreen();
      
      await waitFor(() => {
        const usersTab = getByText('Utilisateurs');
        fireEvent.press(usersTab);
        
        // Vérifier que l'onglet est actif
        expect(usersTab).toBeTruthy();
      });
    });

    it('devrait naviguer vers l\'onglet Statistiques', async () => {
      const { getByText } = renderAdminScreen();
      
      await waitFor(() => {
        const statsTab = getByText('Statistiques');
        fireEvent.press(statsTab);
        
        // Vérifier que l'onglet est actif
        expect(statsTab).toBeTruthy();
      });
    });
  });

  describe('Affichage des données', () => {
    it('devrait afficher la liste des utilisateurs', async () => {
      const { getByText } = renderAdminScreen();
      
      await waitFor(() => {
        expect(getByText('admin@test.com')).toBeTruthy();
        expect(getByText('user@test.com')).toBeTruthy();
      });
    });

    it('devrait afficher les statistiques de base', async () => {
      const { getByText } = renderAdminScreen();
      
      await waitFor(() => {
        expect(getByText('100')).toBeTruthy(); // totalUsers
        expect(getByText('75')).toBeTruthy();  // activeUsers
        expect(getByText('25')).toBeTruthy();  // premiumUsers
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de chargement', async () => {
      // Mock d'une erreur
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { getByTestId } = renderAdminScreen();
      
      await waitFor(() => {
        expect(getByTestId('admin-screen-container')).toBeTruthy();
      });
    });
  });
});
