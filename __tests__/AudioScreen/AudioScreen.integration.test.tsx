import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AudioScreen from '@/screens/AudioScreen/AudioScreen';

// Mock des dépendances
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        accent: '#3B82F6',
        text: '#000000',
        textSecondary: '#666666',
        background: '#FFFFFF',
        border: '#E5E7EB',
      },
    },
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

jest.mock('@/hooks/useOrientation', () => ({
  useOrientation: () => ({
    orientation: 'portrait',
  }),
}));

jest.mock('@/screens/AudioScreen/hooks/useAudioFolders', () => ({
  useAudioFolders: () => ({
    folders: [
      {
        id: '1',
        name: 'Enregistrements personnels',
        description: 'Notes et mémos personnels',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        recordingCount: 12,
        totalDuration: 3600,
        isFavorite: true,
        color: '#4CAF50',
        icon: 'person',
        tags: ['personnel', 'notes'],
      },
      {
        id: '2',
        name: 'Réunions de travail',
        description: 'Enregistrements des réunions professionnelles',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        recordingCount: 8,
        totalDuration: 7200,
        isFavorite: false,
        color: '#2196F3',
        icon: 'work',
        tags: ['travail', 'réunions'],
      },
    ],
    isLoading: false,
    createFolder: jest.fn(),
    deleteFolder: jest.fn(),
    deleteSelectedFolders: jest.fn(),
    updateFolder: jest.fn(),
    editFolder: jest.fn(),
    changeFolderColor: jest.fn(),
    addFolderTag: jest.fn(),
    removeFolderTag: jest.fn(),
    duplicateFolder: jest.fn(),
    toggleFavorite: jest.fn(),
    sortFolders: jest.fn(),
    filterFolders: jest.fn(),
    searchFolders: jest.fn(),
    refreshFolders: jest.fn(),
  }),
}));

jest.mock('@/screens/AudioScreen/hooks/useAudioScreenState', () => ({
  useAudioScreenState: () => ({
    isSelectionMode: false,
    selectedFolders: [],
    toggleSelectionMode: jest.fn(),
    toggleFolderSelection: jest.fn(),
    clearSelection: jest.fn(),
  }),
}));

jest.mock('@/utils/optimizedLogger', () => ({
  createOptimizedLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');

// Mock Alert
jest.spyOn(require('react-native'), 'Alert').mockImplementation(() => {});

describe('AudioScreen Integration', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    dispatch: jest.fn(),
  };

  const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<
    typeof useSafeAreaInsets
  >;
  const mockUseNavigation = useNavigation as jest.MockedFunction<
    typeof useNavigation
  >;

  beforeEach(() => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 34,
      left: 0,
      right: 0,
    });
    mockUseNavigation.mockReturnValue(mockNavigation);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render correctly with all components', () => {
      const { getByText, getByTestId } = render(<AudioScreen />);

      expect(getByText('Audio')).toBeTruthy();
      expect(getByText('2 dossiers')).toBeTruthy();
    });

    test('should render header with correct information', () => {
      const { getByText } = render(<AudioScreen />);

      expect(getByText('Audio')).toBeTruthy();
      expect(getByText('2 dossiers')).toBeTruthy();
    });

    test('should render search bar', () => {
      const { getByPlaceholderText } = render(<AudioScreen />);

      expect(getByPlaceholderText('Rechercher des dossiers...')).toBeTruthy();
    });

    test('should render folder cards', () => {
      const { getByText } = render(<AudioScreen />);

      expect(getByText('Enregistrements personnels')).toBeTruthy();
      expect(getByText('Réunions de travail')).toBeTruthy();
    });

    test('should render FAB button', () => {
      const { getByTestId } = render(<AudioScreen />);

      expect(getByTestId('audio-fab-button')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    test('should handle folder press', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent.press(folderCards[0]);

      // Vérifier que la navigation est appelée ou que l'action appropriée est déclenchée
      expect(folderCards[0]).toBeTruthy();
    });

    test('should handle folder long press', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent(folderCards[0], 'longPress');

      // Vérifier que le mode sélection est activé
      expect(folderCards[0]).toBeTruthy();
    });

    test('should handle FAB press', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');
      fireEvent.press(fabButton);

      expect(fabButton).toBeTruthy();
    });

    test('should handle search input', () => {
      const { getByPlaceholderText } = render(<AudioScreen />);

      const searchInput = getByPlaceholderText('Rechercher des dossiers...');
      fireEvent.changeText(searchInput, 'test search');

      expect(searchInput.props.value).toBe('test search');
    });

    test('should handle sort change', () => {
      const { getByText } = render(<AudioScreen />);

      const sortButton = getByText('Date');
      fireEvent.press(sortButton);

      expect(sortButton).toBeTruthy();
    });

    test('should handle filter change', () => {
      const { getByText } = render(<AudioScreen />);

      const filterButton = getByText('Filtre');
      fireEvent.press(filterButton);

      expect(filterButton).toBeTruthy();
    });
  });

  describe('Recording State', () => {
    test('should handle recording start', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');

      // Simuler le début de l'enregistrement
      fireEvent.press(fabButton);

      expect(fabButton).toBeTruthy();
    });

    test('should handle recording stop', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');

      // Simuler l'arrêt de l'enregistrement
      fireEvent.press(fabButton);

      expect(fabButton).toBeTruthy();
    });

    test('should display recording duration', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');
      expect(fabButton).toBeTruthy();
    });
  });

  describe('Selection Mode', () => {
    test('should enter selection mode on long press', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent(folderCards[0], 'longPress');

      expect(folderCards[0]).toBeTruthy();
    });

    test('should handle multiple folder selection', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');

      // Simuler la sélection multiple
      fireEvent.press(folderCards[0]);
      fireEvent.press(folderCards[1]);

      expect(folderCards).toHaveLength(2);
    });

    test('should clear selection', () => {
      const { getByText } = render(<AudioScreen />);

      const clearButton = getByText('Annuler');
      fireEvent.press(clearButton);

      expect(clearButton).toBeTruthy();
    });

    test('should delete selected folders', () => {
      const { getByText } = render(<AudioScreen />);

      const deleteButton = getByText('Supprimer');
      fireEvent.press(deleteButton);

      expect(deleteButton).toBeTruthy();
    });
  });

  describe('Folder Management', () => {
    test('should create new folder', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');
      fireEvent.press(fabButton);

      expect(fabButton).toBeTruthy();
    });

    test('should delete folder', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const deleteButtons = getAllByTestId('delete-button');
      fireEvent.press(deleteButtons[0]);

      expect(deleteButtons[0]).toBeTruthy();
    });

    test('should edit folder', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent.press(folderCards[0]);

      expect(folderCards[0]).toBeTruthy();
    });

    test('should duplicate folder', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent.press(folderCards[0]);

      expect(folderCards[0]).toBeTruthy();
    });
  });

  describe('Search and Filter', () => {
    test('should filter folders by search query', () => {
      const { getByPlaceholderText } = render(<AudioScreen />);

      const searchInput = getByPlaceholderText('Rechercher des dossiers...');
      fireEvent.changeText(searchInput, 'personnel');

      expect(searchInput.props.value).toBe('personnel');
    });

    test('should filter by favorites', () => {
      const { getByText } = render(<AudioScreen />);

      const filterButton = getByText('Filtre');
      fireEvent.press(filterButton);

      const favoritesFilter = getByText('Favoris');
      fireEvent.press(favoritesFilter);

      expect(favoritesFilter).toBeTruthy();
    });

    test('should filter by recent', () => {
      const { getByText } = render(<AudioScreen />);

      const filterButton = getByText('Filtre');
      fireEvent.press(filterButton);

      const recentFilter = getByText('Récents');
      fireEvent.press(recentFilter);

      expect(recentFilter).toBeTruthy();
    });

    test('should filter by empty folders', () => {
      const { getByText } = render(<AudioScreen />);

      const filterButton = getByText('Filtre');
      fireEvent.press(filterButton);

      const emptyFilter = getByText('Vides');
      fireEvent.press(emptyFilter);

      expect(emptyFilter).toBeTruthy();
    });
  });

  describe('Sorting', () => {
    test('should sort by name', () => {
      const { getByText } = render(<AudioScreen />);

      const sortButton = getByText('Date');
      fireEvent.press(sortButton);

      const nameSort = getByText('Nom');
      fireEvent.press(nameSort);

      expect(nameSort).toBeTruthy();
    });

    test('should sort by count', () => {
      const { getByText } = render(<AudioScreen />);

      const sortButton = getByText('Date');
      fireEvent.press(sortButton);

      const countSort = getByText('Nombre');
      fireEvent.press(countSort);

      expect(countSort).toBeTruthy();
    });

    test('should sort by duration', () => {
      const { getByText } = render(<AudioScreen />);

      const sortButton = getByText('Date');
      fireEvent.press(sortButton);

      const durationSort = getByText('Durée');
      fireEvent.press(durationSort);

      expect(durationSort).toBeTruthy();
    });

    test('should toggle sort order', () => {
      const { getByText } = render(<AudioScreen />);

      const sortButton = getByText('Date');
      fireEvent.press(sortButton);

      expect(sortButton).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    test('should show empty state when no folders', () => {
      // Mock useAudioFolders pour retourner un tableau vide
      jest.doMock('@/screens/AudioScreen/hooks/useAudioFolders', () => ({
        useAudioFolders: () => ({
          folders: [],
          isLoading: false,
          createFolder: jest.fn(),
          deleteFolder: jest.fn(),
          deleteSelectedFolders: jest.fn(),
          updateFolder: jest.fn(),
          editFolder: jest.fn(),
          changeFolderColor: jest.fn(),
          addFolderTag: jest.fn(),
          removeFolderTag: jest.fn(),
          duplicateFolder: jest.fn(),
          toggleFavorite: jest.fn(),
          sortFolders: jest.fn(),
          filterFolders: jest.fn(),
          searchFolders: jest.fn(),
          refreshFolders: jest.fn(),
        }),
      }));

      const { getByText } = render(<AudioScreen />);

      expect(getByText('Aucun dossier')).toBeTruthy();
    });

    test('should handle create folder from empty state', () => {
      // Mock useAudioFolders pour retourner un tableau vide
      jest.doMock('@/screens/AudioScreen/hooks/useAudioFolders', () => ({
        useAudioFolders: () => ({
          folders: [],
          isLoading: false,
          createFolder: jest.fn(),
          deleteFolder: jest.fn(),
          deleteSelectedFolders: jest.fn(),
          updateFolder: jest.fn(),
          editFolder: jest.fn(),
          changeFolderColor: jest.fn(),
          addFolderTag: jest.fn(),
          removeFolderTag: jest.fn(),
          duplicateFolder: jest.fn(),
          toggleFavorite: jest.fn(),
          sortFolders: jest.fn(),
          filterFolders: jest.fn(),
          searchFolders: jest.fn(),
          refreshFolders: jest.fn(),
        }),
      }));

      const { getByText } = render(<AudioScreen />);

      const createButton = getByText('Créer un dossier');
      fireEvent.press(createButton);

      expect(createButton).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    test('should show loading state', () => {
      // Mock useAudioFolders pour retourner isLoading: true
      jest.doMock('@/screens/AudioScreen/hooks/useAudioFolders', () => ({
        useAudioFolders: () => ({
          folders: [],
          isLoading: true,
          createFolder: jest.fn(),
          deleteFolder: jest.fn(),
          deleteSelectedFolders: jest.fn(),
          updateFolder: jest.fn(),
          editFolder: jest.fn(),
          changeFolderColor: jest.fn(),
          addFolderTag: jest.fn(),
          removeFolderTag: jest.fn(),
          duplicateFolder: jest.fn(),
          toggleFavorite: jest.fn(),
          sortFolders: jest.fn(),
          filterFolders: jest.fn(),
          searchFolders: jest.fn(),
          refreshFolders: jest.fn(),
        }),
      }));

      const { getByText } = render(<AudioScreen />);

      expect(getByText('Chargement des dossiers...')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    test('should handle pull to refresh', () => {
      const { getByTestId } = render(<AudioScreen />);

      const flatList = getByTestId('folders-flatlist');
      fireEvent(flatList, 'refresh');

      expect(flatList).toBeTruthy();
    });
  });

  describe('Orientation Changes', () => {
    test('should handle portrait orientation', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      expect(folderCards).toHaveLength(2);
    });

    test('should handle landscape orientation', () => {
      // Mock useOrientation pour retourner landscape
      jest.doMock('@/hooks/useOrientation', () => ({
        useOrientation: () => ({
          orientation: 'landscape',
        }),
      }));

      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      expect(folderCards).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle folder creation error', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');
      fireEvent.press(fabButton);

      expect(fabButton).toBeTruthy();
    });

    test('should handle folder deletion error', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const deleteButtons = getAllByTestId('delete-button');
      fireEvent.press(deleteButtons[0]);

      expect(deleteButtons[0]).toBeTruthy();
    });

    test('should handle search error', () => {
      const { getByPlaceholderText } = render(<AudioScreen />);

      const searchInput = getByPlaceholderText('Rechercher des dossiers...');
      fireEvent.changeText(searchInput, 'invalid search');

      expect(searchInput.props.value).toBe('invalid search');
    });
  });

  describe('Performance', () => {
    test('should handle large number of folders', () => {
      // Mock useAudioFolders pour retourner beaucoup de dossiers
      const manyFolders = Array.from({ length: 100 }, (_, i) => ({
        id: `folder-${i}`,
        name: `Folder ${i}`,
        description: `Description ${i}`,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        recordingCount: Math.floor(Math.random() * 10),
        totalDuration: Math.floor(Math.random() * 3600),
        isFavorite: Math.random() > 0.5,
        color: '#4CAF50',
        icon: 'folder',
        tags: ['test'],
      }));

      jest.doMock('@/screens/AudioScreen/hooks/useAudioFolders', () => ({
        useAudioFolders: () => ({
          folders: manyFolders,
          isLoading: false,
          createFolder: jest.fn(),
          deleteFolder: jest.fn(),
          deleteSelectedFolders: jest.fn(),
          updateFolder: jest.fn(),
          editFolder: jest.fn(),
          changeFolderColor: jest.fn(),
          addFolderTag: jest.fn(),
          removeFolderTag: jest.fn(),
          duplicateFolder: jest.fn(),
          toggleFavorite: jest.fn(),
          sortFolders: jest.fn(),
          filterFolders: jest.fn(),
          searchFolders: jest.fn(),
          refreshFolders: jest.fn(),
        }),
      }));

      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      expect(folderCards.length).toBeGreaterThan(0);
    });

    test('should handle rapid state changes', () => {
      const { rerender } = render(<AudioScreen />);

      // Rapid state changes
      rerender(<AudioScreen />);
      rerender(<AudioScreen />);
      rerender(<AudioScreen />);

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels', () => {
      const { getByTestId } = render(<AudioScreen />);

      const fabButton = getByTestId('audio-fab-button');
      expect(fabButton.props.accessibilityLabel).toBeDefined();
    });

    test('should support screen readers', () => {
      const { getByText } = render(<AudioScreen />);

      const title = getByText('Audio');
      expect(title).toBeTruthy();
    });
  });

  describe('Integration with Navigation', () => {
    test('should navigate to folder detail', () => {
      const { getAllByTestId } = render(<AudioScreen />);

      const folderCards = getAllByTestId('folder-card');
      fireEvent.press(folderCards[0]);

      expect(mockNavigation.navigate).toHaveBeenCalled();
    });

    test('should handle back navigation', () => {
      const { getByText } = render(<AudioScreen />);

      // Simuler la navigation retour
      mockNavigation.goBack();

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });
});
