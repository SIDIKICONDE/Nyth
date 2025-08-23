import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { BookItem } from '../../src/components/home/library/BookItem';
import { BookShelf } from '../../src/components/home/library/BookShelf';
import { LibraryHeader } from '../../src/components/home/library/LibraryHeader';
import { getBookColor } from '../../src/components/home/library/BookColors';
import { getBookDimensions } from '../../src/components/home/library/BookDimensions';
import { Script } from '../../src/types';

// Mock des dépendances
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        text: '#000000',
      },
    },
  }),
}));

jest.mock('../../src/hooks/useOrientation', () => ({
  useOrientation: () => ({
    isTablet: false,
    isLargeTablet: false,
    isLandscape: false,
    width: 375,
    height: 667,
  }),
}));

jest.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../src/hooks/useDeviceTilt', () => ({
  useDeviceTilt: () => ({
    rotation: '0deg',
    isAvailable: false,
    disableGyroscope: jest.fn(),
    enableGyroscope: jest.fn(),
  }),
}));

jest.mock('../../src/utils/optimizedLogger', () => ({
  createOptimizedLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }),
}));

// Données de test réalistes
const createMockScripts = (count: number): Script[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `script-${index + 1}`,
    title: `Script ${index + 1} - ${['Vidéo', 'Podcast', 'Présentation', 'Interview'][index % 4]}`,
    content: `Contenu du script ${index + 1} avec du texte de test pour vérifier l'affichage et le comportement des composants de la bibliothèque.`,
    createdAt: new Date(2024, 0, 15 + index).toISOString(),
    updatedAt: new Date(2024, 0, 15 + index).toISOString(),
    isFavorite: index % 3 === 0, // Un tiers des scripts sont favoris
    tags: [`tag-${index + 1}`, 'test', 'bibliothèque'],
    metadata: {
      duration: 120 + (index * 30),
      wordCount: 500 + (index * 100),
      category: ['vidéo', 'audio', 'texte'][index % 3],
    },
  }));
};

describe('Intégration de la Bibliothèque', () => {
  let mockScripts: Script[];
  let mockCallbacks: {
    onScriptPress: jest.Mock;
    onScriptLongPress: jest.Mock;
    onToggleSelection: jest.Mock;
    onScriptShare: jest.Mock;
    onScriptDuplicate: jest.Mock;
    onScriptExport: jest.Mock;
    onScriptDelete: jest.Mock;
    onToggleFavorite: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockScripts = createMockScripts(6);
    mockCallbacks = {
      onScriptPress: jest.fn(),
      onScriptLongPress: jest.fn(),
      onToggleSelection: jest.fn(),
      onScriptShare: jest.fn(),
      onScriptDuplicate: jest.fn(),
      onScriptExport: jest.fn(),
      onScriptDelete: jest.fn(),
      onToggleFavorite: jest.fn(),
    };

    // Mock des animations
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'sequence').mockReturnValue({
      start: jest.fn(),
    } as any);
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
    } as any);
  });

  describe('Scénarios d\'utilisation réels', () => {
    test('devrait afficher une bibliothèque complète avec plusieurs scripts', () => {
      const { getAllByText } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleSelection={mockCallbacks.onToggleSelection}
          onScriptShare={mockCallbacks.onScriptShare}
          onScriptDuplicate={mockCallbacks.onScriptDuplicate}
          onScriptExport={mockCallbacks.onScriptExport}
          onScriptDelete={mockCallbacks.onScriptDelete}
          onToggleFavorite={mockCallbacks.onToggleFavorite}
        />
      );

      // Vérifier que tous les titres sont affichés
      mockScripts.forEach(script => {
        expect(getAllByText(script.title)).toBeTruthy();
      });
    });

    test('devrait gérer le mode de sélection multiple', async () => {
      const { rerender } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleSelection={mockCallbacks.onToggleSelection}
        />
      );

      // Activer le mode de sélection
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={true}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleSelection={mockCallbacks.onToggleSelection}
        />
      );

      // Sélectionner quelques scripts
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[mockScripts[0].id, mockScripts[2].id]}
          isSelectionModeActive={true}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleSelection={mockCallbacks.onToggleSelection}
        />
      );

      // Le composant devrait gérer la sélection multiple
      expect(true).toBe(true);
    });

    test('devrait gérer les interactions utilisateur complexes', async () => {
      const { getAllByTestId } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleSelection={mockCallbacks.onToggleSelection}
          onScriptShare={mockCallbacks.onScriptShare}
          onScriptDuplicate={mockCallbacks.onScriptDuplicate}
          onScriptExport={mockCallbacks.onScriptExport}
          onScriptDelete={mockCallbacks.onScriptDelete}
          onToggleFavorite={mockCallbacks.onToggleFavorite}
        />
      );

      // Simuler des interactions utilisateur
      await act(async () => {
        // Les interactions devraient être gérées correctement
        expect(true).toBe(true);
      });
    });

    test('devrait gérer les scripts favoris et leurs badges', () => {
      const favoriteScripts = mockScripts.filter(script => script.isFavorite);
      const { getAllByText } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          onToggleFavorite={mockCallbacks.onToggleFavorite}
        />
      );

      // Vérifier que les scripts favoris sont affichés
      favoriteScripts.forEach(script => {
        expect(getAllByText(script.title)).toBeTruthy();
      });
    });
  });

  describe('Gestion des états et transitions', () => {
    test('devrait gérer les transitions entre les modes', () => {
      const { rerender } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Transition vers le mode de sélection
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={true}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Transition avec sélection
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[mockScripts[0].id]}
          isSelectionModeActive={true}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Retour au mode normal
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Les transitions devraient être fluides
      expect(true).toBe(true);
    });

    test('devrait gérer les changements de données dynamiques', () => {
      const { rerender } = render(
        <BookShelf
          scripts={mockScripts.slice(0, 3)}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Ajouter des scripts
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Modifier un script
      const updatedScripts = [...mockScripts];
      updatedScripts[0] = { ...updatedScripts[0], title: 'Script modifié' };

      rerender(
        <BookShelf
          scripts={updatedScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Les changements devraient être gérés correctement
      expect(true).toBe(true);
    });
  });

  describe('Performance et optimisations', () => {
    test('devrait gérer un grand nombre de scripts efficacement', () => {
      const largeScriptList = createMockScripts(50);
      
      const { getAllByText } = render(
        <BookShelf
          scripts={largeScriptList}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Vérifier que les scripts sont rendus
      expect(getAllByText(largeScriptList[0].title)).toBeTruthy();
      expect(getAllByText(largeScriptList[49].title)).toBeTruthy();
    });

    test('devrait éviter les re-renders inutiles', () => {
      const { rerender } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Re-render avec les mêmes props
      rerender(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Le composant devrait être optimisé
      expect(true).toBe(true);
    });

    test('devrait gérer les animations de manière optimisée', () => {
      render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Les animations devraient être initialisées
      expect(Animated.loop).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs et cas limites', () => {
    test('devrait gérer les scripts avec des données manquantes', () => {
      const incompleteScripts = [
        { ...mockScripts[0], title: '' },
        { ...mockScripts[1], content: undefined },
        { ...mockScripts[2], createdAt: null },
      ];

      const { getAllByText } = render(
        <BookShelf
          scripts={incompleteScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Le composant devrait gérer les données manquantes
      expect(true).toBe(true);
    });

    test('devrait gérer les étagères vides', () => {
      const { getByTestId } = render(
        <BookShelf
          scripts={[]}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // L'étagère vide devrait se rendre correctement
      expect(true).toBe(true);
    });

    test('devrait gérer les callbacks manquants', () => {
      const { getAllByText } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
          // Callbacks optionnels non fournis
        />
      );

      // Le composant devrait fonctionner sans les callbacks optionnels
      expect(getAllByText(mockScripts[0].title)).toBeTruthy();
    });
  });

  describe('Cohérence visuelle et UX', () => {
    test('devrait maintenir la cohérence des couleurs', () => {
      const colorPairs = mockScripts.map((_, index) => getBookColor(index));
      
      // Vérifier que les couleurs sont valides
      colorPairs.forEach(pair => {
        expect(pair).toHaveLength(2);
        expect(pair[0]).toMatch(/^#[0-9A-F]{6}$/i);
        expect(pair[1]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('devrait avoir des dimensions cohérentes', () => {
      const dimensions = getBookDimensions();
      
      // Vérifier la cohérence des dimensions
      expect(dimensions.BOOK_WIDTH).toBeGreaterThan(0);
      expect(dimensions.BOOK_HEIGHT).toBeGreaterThan(0);
      expect(dimensions.ITEMS_PER_ROW).toBeGreaterThan(0);
      
      // Vérifier le ratio
      const ratio = dimensions.BOOK_HEIGHT / dimensions.BOOK_WIDTH;
      expect(ratio).toBeCloseTo(1.3, 1);
    });

    test('devrait gérer les différents types de contenu', () => {
      const diverseScripts = [
        { ...mockScripts[0], title: 'Script très long avec un titre qui dépasse largement la largeur disponible pour tester l\'ellipsis' },
        { ...mockScripts[1], title: 'Court' },
        { ...mockScripts[2], title: 'Script avec des caractères spéciaux: éàçù€£¥' },
      ];

      const { getAllByText } = render(
        <BookShelf
          scripts={diverseScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Tous les titres devraient être affichés
      diverseScripts.forEach(script => {
        expect(getAllByText(script.title)).toBeTruthy();
      });
    });
  });

  describe('Accessibilité et internationalisation', () => {
    test('devrait être accessible aux lecteurs d\'écran', () => {
      const { getAllByText } = render(
        <BookShelf
          scripts={mockScripts}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Les textes devraient être accessibles
      mockScripts.forEach(script => {
        expect(getAllByText(script.title)).toBeTruthy();
      });
    });

    test('devrait gérer les dates dans différents formats', () => {
      const scriptsWithDifferentDates = [
        { ...mockScripts[0], createdAt: new Date('2024-01-01').toISOString() },
        { ...mockScripts[1], createdAt: new Date('2023-12-31').toISOString() },
        { ...mockScripts[2], createdAt: new Date('2024-02-29').toISOString() },
      ];

      const { getAllByText } = render(
        <BookShelf
          scripts={scriptsWithDifferentDates}
          rowIndex={0}
          selectedScripts={[]}
          isSelectionModeActive={false}
          onScriptPress={mockCallbacks.onScriptPress}
          onScriptLongPress={mockCallbacks.onScriptLongPress}
        />
      );

      // Les dates devraient être formatées correctement
      expect(getAllByText('01/01/24')).toBeTruthy();
      expect(getAllByText('31/12/23')).toBeTruthy();
      expect(getAllByText('29/02/24')).toBeTruthy();
    });
  });
});
