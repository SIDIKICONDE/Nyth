/**
 * Tests visuels et fonctionnels complets pour HamburgerMenu
 * Tests du rendu, couleurs, animations, interactions et accessibilité
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { HamburgerMenu } from '../../../src/components/home/UnifiedHomeFAB/designs/HamburgerMenu';
import { FABAction } from '../../../src/components/home/UnifiedHomeFAB/types';

// Mocks des dépendances externes
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => ({
  default: 'MockIcon'
}));

jest.mock('react-native-linear-gradient', () => ({
  LinearGradient: 'MockLinearGradient'
}));

jest.mock('@react-native-community/blur', () => ({
  BlurView: 'MockBlurView'
}));

// Mock du contexte de thème
const mockThemeContext = {
  currentTheme: {
    isDark: false,
    colors: {
      primary: '#007AFF',
      text: '#000000',
      background: '#FFFFFF',
      border: '#E5E5E5'
    }
  }
};

jest.mock('../../../src/contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext
}));

// Mock du hook d'optimisation du contraste
jest.mock('../../../src/hooks/useContrastOptimization', () => ({
  useContrastOptimization: () => ({
    getOptimizedButtonColors: () => ({
      background: '#007AFF',
      text: '#FFFFFF',
      shadow: '#007AFF'
    })
  })
}));

// Mock du composant Typography
jest.mock('../../../src/components/ui/Typography', () => ({
  UIText: ({ children, style, weight }: any) => React.createElement('UIText', { style, weight }, children)
}));

// Données de test
const mockActions: FABAction[] = [
  {
    id: 'record',
    label: 'Enregistrer',
    icon: 'record',
    onPress: jest.fn()
  },
  {
    id: 'edit',
    label: 'Modifier',
    icon: 'pencil',
    onPress: jest.fn()
  },
  {
    id: 'share',
    label: 'Partager',
    icon: 'share',
    onPress: jest.fn()
  }
];

describe('HamburgerMenu - Tests Visuels et Fonctionnels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu Initial et Structure', () => {
    it('devrait rendre le composant avec la structure correcte', () => {
      const { getByTestId, toJSON } = render(
        <HamburgerMenu actions={mockActions} />
      );

      // Vérifier que le composant se rend
      expect(toJSON()).toBeTruthy();

      // Snapshot pour vérifier la structure visuelle
      expect(toJSON()).toMatchSnapshot();
    });

    it('devrait afficher le bouton hamburger', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      // Le bouton devrait être présent
      const button = getByTestId('hamburger-button');
      expect(button).toBeTruthy();
    });

    it('devrait avoir les bonnes dimensions pour le bouton', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier les styles du bouton
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: 56,
            height: 56,
            borderRadius: 28
          })
        ])
      );
    });

    it('devrait avoir un gradient de fond pour le bouton', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const gradient = getByTestId('hamburger-button-gradient');
      expect(gradient).toBeTruthy();
      expect(gradient.props.colors).toBeDefined();
    });
  });

  describe('Couleurs et Thèmes', () => {
    it('devrait utiliser les couleurs du thème clair par défaut', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier que les couleurs primaires sont utilisées
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#007AFF'
          })
        ])
      );
    });

    it('devrait supporter le thème sombre', () => {
      // Changer le mock pour le thème sombre
      mockThemeContext.currentTheme.isDark = true;
      mockThemeContext.currentTheme.colors.primary = '#FF6B6B';
      mockThemeContext.currentTheme.colors.text = '#FFFFFF';
      mockThemeContext.currentTheme.colors.background = '#1A1A1A';

      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier que les couleurs du thème sombre sont utilisées
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FF6B6B'
          })
        ])
      );

      // Remettre le thème clair
      mockThemeContext.currentTheme.isDark = false;
      mockThemeContext.currentTheme.colors.primary = '#007AFF';
    });

    it('devrait avoir des couleurs optimisées pour le contraste', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier que le bouton a une ombre pour le contraste
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shadowColor: '#007AFF'
          })
        ])
      );
    });

    it('devrait utiliser des couleurs cohérentes dans les éléments', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');
      const gradient = getByTestId('hamburger-button-gradient');

      // Vérifier la cohérence des couleurs
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      );
      expect(gradient.props.colors).toBeDefined();
    });
  });

  describe('Animations et Transitions', () => {
    it('devrait animer l\'ouverture du menu', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Simuler le clic pour ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      // Vérifier que l'animation de rotation est appliquée
      await waitFor(() => {
        const animatedView = getByTestId('hamburger-button-animated');
        expect(animatedView.props.style.transform).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              rotate: expect.any(Object) // Animation value
            })
          ])
        );
      });
    });

    it('devrait animer les lignes hamburger', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      // Vérifier les animations des lignes
      await waitFor(() => {
        const line1 = getByTestId('hamburger-line-1');
        const line2 = getByTestId('hamburger-line-2');
        const line3 = getByTestId('hamburger-line-3');

        expect(line1.props.style.transform).toBeDefined();
        expect(line2.props.style.opacity).toBeDefined();
        expect(line3.props.style.transform).toBeDefined();
      });
    });

    it('devrait avoir une animation fluide pour le bouton', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier l'animation d'échelle
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        const animatedView = getByTestId('hamburger-button-animated');
        expect(animatedView.props.style.transform).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              scale: expect.any(Object)
            })
          ])
        );
      });
    });

    it('devrait gérer les animations de fermeture', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir puis fermer
      await act(async () => {
        fireEvent.press(button);
      });

      await act(async () => {
        fireEvent.press(button);
      });

      // Vérifier que les animations de fermeture sont appliquées
      await waitFor(() => {
        const animatedView = getByTestId('hamburger-button-animated');
        expect(animatedView.props.style.transform).toBeDefined();
      });
    });
  });

  describe('Interactions Utilisateur', () => {
    it('devrait ouvrir le menu au clic sur le bouton', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      await act(async () => {
        fireEvent.press(button);
      });

      // Vérifier que le menu est ouvert
      await waitFor(() => {
        const menuContainer = getByTestId('hamburger-menu-container');
        expect(menuContainer.props.style.pointerEvents).toBe('auto');
      });
    });

    it('devrait fermer le menu au deuxième clic', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Premier clic - ouvrir
      await act(async () => {
        fireEvent.press(button);
      });

      // Deuxième clic - fermer
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        const menuContainer = getByTestId('hamburger-menu-container');
        expect(menuContainer.props.style.pointerEvents).toBe('box-none');
      });
    });

    it('devrait afficher les actions du menu quand ouvert', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        // Vérifier que les actions sont visibles
        const action1 = getByTestId('hamburger-action-record');
        const action2 = getByTestId('hamburger-action-edit');
        const action3 = getByTestId('hamburger-action-share');

        expect(action1).toBeTruthy();
        expect(action2).toBeTruthy();
        expect(action3).toBeTruthy();
      });
    });

    it('devrait appeler la fonction onPress d\'une action', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        const recordAction = getByTestId('hamburger-action-record');

        // Cliquer sur l'action
        fireEvent.press(recordAction);

        // Vérifier que la fonction a été appelée
        expect(mockActions[0].onPress).toHaveBeenCalledTimes(1);
      });
    });

    it('devrait fermer le menu après avoir cliqué sur une action', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        const recordAction = getByTestId('hamburger-action-record');

        // Cliquer sur l'action
        fireEvent.press(recordAction);
      });

      // Vérifier que le menu se ferme
      await waitFor(() => {
        const menuContainer = getByTestId('hamburger-menu-container');
        expect(menuContainer.props.style.pointerEvents).toBe('box-none');
      });
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir des labels d\'accessibilité appropriés', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityLabel).toBe('Ouvrir le menu');
    });

    it('devrait changer le label d\'accessibilité quand le menu est ouvert', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(button.props.accessibilityLabel).toBe('Fermer le menu');
      });
    });

    it('devrait avoir des rôles appropriés pour les actions', async () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Ouvrir le menu pour accéder aux actions
      await act(async () => {
        fireEvent.press(button);
      });

      await waitFor(() => {
        const recordAction = getByTestId('hamburger-action-record');
        expect(recordAction.props.accessibilityRole).toBe('button');
        expect(recordAction.props.accessibilityLabel).toBe('Enregistrer');
      });
    });

    it('devrait supporter la navigation au clavier', () => {
      const { getByTestId } = render(
        <HamburgerMenu actions={mockActions} />
      );

      const button = getByTestId('hamburger-button');

      // Vérifier que le bouton peut recevoir le focus
      expect(button.props.focusable).not.toBe(false);
    });
  });

  describe('États et Conditions Limites', () => {
    it('devrait gérer une liste d\'actions vide', () => {
      const { toJSON } = render(
        <HamburgerMenu actions={[]} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('devrait gérer une seule action', () => {
      const singleAction = [mockActions[0]];
      const { toJSON } = render(
        <HamburgerMenu actions={singleAction} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('devrait gérer beaucoup d\'actions', () => {
      const manyActions = Array.from({ length: 10 }, (_, i) => ({
        id: `action${i}`,
        label: `Action ${i}`,
        icon: 'plus',
        onPress: jest.fn()
      }));

      const { toJSON } = render(
        <HamburgerMenu actions={manyActions} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('devrait gérer les actions sans icône personnalisée', () => {
      const actionsWithoutCustomIcon = mockActions.map(action => ({
        ...action,
        iconComponent: undefined
      }));

      const { toJSON } = render(
        <HamburgerMenu actions={actionsWithoutCustomIcon} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('devrait gérer les actions avec icône personnalisée', () => {
      const actionsWithCustomIcon = mockActions.map(action => ({
        ...action,
        iconComponent: React.createElement('CustomIcon')
      }));

      const { toJSON } = render(
        <HamburgerMenu actions={actionsWithCustomIcon} />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Performance et Stabilité', () => {
    it('devrait gérer le re-render sans problème', () => {
      const { rerender, toJSON } = render(
        <HamburgerMenu actions={mockActions} />
      );

      // Test de re-render multiple
      for (let i = 0; i < 5; i++) {
        rerender(<HamburgerMenu actions={mockActions} />);
      }

      expect(toJSON()).toBeTruthy();
    });

    it('devrait nettoyer correctement au démontage', () => {
      const { unmount } = render(
        <HamburgerMenu actions={mockActions} />
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
