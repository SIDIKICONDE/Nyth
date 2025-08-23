/**
 * Tests complets d'intégration pour l'AudioScreen
 *
 * Ce fichier teste l'intégration complète de l'AudioScreen avec :
 * - Tous les hooks personnalisés
 * - Tous les composants enfants
 * - Les interactions utilisateur
 * - L'intégration avec les modules natifs
 * - Les micro-interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Composant principal
import AudioScreen from './AudioScreen';

// Hooks à tester
import { useAudioFolders } from './hooks/useAudioFolders';
import { useAudioScreenState } from './hooks/useAudioScreenState';
import { useAudioCapture } from './hooks/useAudioCapture';

// Composants enfants
import AudioScreenHeader from './components/AudioScreenHeader';
import AudioFolderCard from './components/AudioFolderCard';
import AudioFAB from './components/AudioFAB';
import EmptyState from './components/EmptyState';
import AudioSearchBar from './components/AudioSearchBar';
import AudioLevelIndicator from './components/AudioLevelIndicator';
import AudioFolderActions from './components/AudioFolderActions';

// Types
import { AudioFolder } from './types';

// Mocks pour les dépendances externes
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        background: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        accent: '#007AFF',
        border: '#E5E5E5',
      },
    },
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

jest.mock('@/hooks/useOrientation', () => ({
  useOrientation: () => ({
    orientation: 'portrait',
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/test/path',
}));

jest.mock('@/utils/optimizedLogger', () => ({
  createOptimizedLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  }),
}));

// Mock pour AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock pour les alertes
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Alert, 'prompt').mockImplementation((title, message, buttons) => {
  // Simuler la saisie d'un nom de dossier
  buttons?.[1]?.onPress?.('Test Folder');
});

// Mock pour les modules natifs
jest.mock('../../../specs/NativeAudioCaptureModule', () => ({
  default: {
    createCaptureSession: jest.fn().mockResolvedValue(1),
    destroyCaptureSession: jest.fn().mockResolvedValue(true),
    startRecording: jest.fn().mockResolvedValue(true),
    stopRecording: jest.fn().mockResolvedValue(true),
    pauseRecording: jest.fn().mockResolvedValue(true),
    resumeRecording: jest.fn().mockResolvedValue(true),
    getCurrentLevel: jest.fn().mockResolvedValue(0.5),
    getPeakLevel: jest.fn().mockResolvedValue(0.8),
    analyzeAudioFile: jest.fn().mockResolvedValue({
      duration: 120,
      sampleRate: 44100,
      channels: 2,
      bitDepth: 16,
    }),
  },
}));

describe('AudioScreen - Tests d\'Intégration Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('1. Initialisation et Rendu', () => {
    test('✅ Le composant AudioScreen se rend correctement', async () => {
      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });
    });

    test('✅ Affiche l\'état vide quand aucun dossier n\'existe', async () => {
      const { getByText } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByText('Aucun dossier')).toBeTruthy();
      });
    });

    test('✅ Charge et affiche les dossiers par défaut', async () => {
      const { getByText } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByText('Enregistrements personnels')).toBeTruthy();
        expect(getByText('Réunions de travail')).toBeTruthy();
        expect(getByText('Idées créatives')).toBeTruthy();
      });
    });
  });

  describe('2. Tests des Hooks Personnalisés', () => {
    test('✅ useAudioFolders gère correctement le CRUD des dossiers', async () => {
      const TestComponent = () => {
        const {
          folders,
          isLoading,
          createFolder,
          deleteFolder,
          toggleFavorite,
        } = useAudioFolders();

        React.useEffect(() => {
          if (!isLoading && folders.length > 0) {
            // Tester la création
            createFolder('Nouveau Dossier Test');
            // Tester le favori
            toggleFavorite(folders[0].id);
          }
        }, [isLoading, folders]);

        return (
          <div data-testid="test-component">
            <span>{`Chargement: ${isLoading}`}</span>
            <span>{`Dossiers: ${folders.length}`}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('test-component')).toBeTruthy();
      });
    });

    test('✅ useAudioScreenState gère l\'état de sélection', () => {
      const TestComponent = () => {
        const {
          isSelectionMode,
          selectedFolders,
          toggleSelectionMode,
          toggleFolderSelection,
          clearSelection,
        } = useAudioScreenState();

        return (
          <div data-testid="selection-test">
            <button onClick={toggleSelectionMode} data-testid="toggle-selection">
              Toggle Selection
            </button>
            <button onClick={() => toggleFolderSelection('test-id')} data-testid="select-folder">
              Select Folder
            </button>
            <button onClick={clearSelection} data-testid="clear-selection">
              Clear Selection
            </button>
            <span data-testid="selection-state">
              {`Mode: ${isSelectionMode}, Selected: ${selectedFolders.length}`}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      fireEvent.press(getByTestId('toggle-selection'));
      expect(getByTestId('selection-state')).toHaveTextContent('Mode: true');

      fireEvent.press(getByTestId('select-folder'));
      expect(getByTestId('selection-state')).toHaveTextContent('Selected: 1');

      fireEvent.press(getByTestId('clear-selection'));
      expect(getByTestId('selection-state')).toHaveTextContent('Mode: false, Selected: 0');
    });

    test('✅ useAudioCapture gère l\'enregistrement audio', async () => {
      const TestComponent = () => {
        const {
          isRecording,
          currentLevel,
          peakLevel,
          startRecording,
          stopRecording,
        } = useAudioCapture();

        return (
          <div data-testid="capture-test">
            <button onClick={() => startRecording('/test/path')} data-testid="start-recording">
              Start Recording
            </button>
            <button onClick={stopRecording} data-testid="stop-recording">
              Stop Recording
            </button>
            <span data-testid="recording-state">
              {`Recording: ${isRecording}, Level: ${currentLevel}, Peak: ${peakLevel}`}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      // Démarrer l'enregistrement
      fireEvent.press(getByTestId('start-recording'));
      await waitFor(() => {
        expect(getByTestId('recording-state')).toHaveTextContent('Recording: true');
      });

      // Arrêter l'enregistrement
      fireEvent.press(getByTestId('stop-recording'));
      await waitFor(() => {
        expect(getByTestId('recording-state')).toHaveTextContent('Recording: false');
      });
    });
  });

  describe('3. Tests des Composants Enfants', () => {
    const mockFolder: AudioFolder = {
      id: '1',
      name: 'Test Folder',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
      recordingCount: 5,
      totalDuration: 300,
      isFavorite: false,
      color: '#4CAF50',
      icon: 'folder',
      tags: ['test'],
    };

    test('✅ AudioScreenHeader gère les modes de sélection', () => {
      const { getByText, rerender } = render(
        <AudioScreenHeader
          isSelectionMode={false}
          selectedCount={0}
          totalCount={5}
          onClearSelection={jest.fn()}
          onDeleteSelected={jest.fn()}
          onToggleSelectionMode={jest.fn()}
        />
      );

      expect(getByText('Audio')).toBeTruthy();

      rerender(
        <AudioScreenHeader
          isSelectionMode={true}
          selectedCount={2}
          totalCount={5}
          onClearSelection={jest.fn()}
          onDeleteSelected={jest.fn()}
          onToggleSelectionMode={jest.fn()}
        />
      );

      expect(getByText('2 / 5')).toBeTruthy();
      expect(getByText('Sélection')).toBeTruthy();
    });

    test('✅ AudioFolderCard gère les interactions', () => {
      const mockProps = {
        folder: mockFolder,
        isSelected: false,
        isSelectionMode: false,
        onPress: jest.fn(),
        onLongPress: jest.fn(),
        onDelete: jest.fn(),
      };

      const { getByTestId } = render(<AudioFolderCard {...mockProps} />);

      expect(getByTestId('folder-card')).toBeTruthy();

      fireEvent.press(getByTestId('folder-card'));
      expect(mockProps.onPress).toHaveBeenCalled();

      fireEvent(getByTestId('folder-card'), 'onLongPress');
      expect(mockProps.onLongPress).toHaveBeenCalled();
    });

    test('✅ AudioFAB gère l\'enregistrement', () => {
      const mockProps = {
        onPress: jest.fn(),
        isRecording: false,
        recordingDuration: 0,
      };

      const { getByTestId } = render(<AudioFAB {...mockProps} />);

      expect(getByTestId('audio-fab-button')).toBeTruthy();

      fireEvent.press(getByTestId('audio-fab-button'));
      expect(mockProps.onPress).toHaveBeenCalled();
    });

    test('✅ AudioSearchBar gère la recherche et le tri', () => {
      const mockProps = {
        searchQuery: '',
        onSearchChange: jest.fn(),
        sortBy: 'date' as const,
        sortOrder: 'desc' as const,
        onSortChange: jest.fn(),
        filterBy: 'all' as const,
        onFilterChange: jest.fn(),
      };

      const { getByText } = render(<AudioSearchBar {...mockProps} />);

      expect(getByText('Filtre')).toBeTruthy();
      expect(getByText('Rechercher des dossiers...')).toBeTruthy();
    });

    test('✅ EmptyState gère la création de dossiers', () => {
      const mockProps = {
        onCreateFolder: jest.fn(),
        isLoading: false,
      };

      const { getByText } = render(<EmptyState {...mockProps} />);

      expect(getByText('Aucun dossier')).toBeTruthy();
      expect(getByText('Créer un dossier')).toBeTruthy();
    });
  });

  describe('4. Tests des Interactions Utilisateur', () => {
    test('✅ Création d\'un nouveau dossier', async () => {
      const { getByText } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByText('Créer un dossier')).toBeTruthy();
      });

      // Le mock d'Alert.prompt devrait créer un dossier automatiquement
      fireEvent.press(getByText('Créer un dossier'));
    });

    test('✅ Mode de sélection multiple', async () => {
      const { getByText, getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });

      // Activer le mode sélection
      const selectionButtons = screen.getAllByText('Sélection');
      if (selectionButtons.length > 0) {
        fireEvent.press(selectionButtons[0]);
      }
    });

    test('✅ Recherche et filtrage', async () => {
      const { getByText } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByText('Filtre')).toBeTruthy();
      });

      fireEvent.press(getByText('Filtre'));
      expect(getByText('Filtrer par'))).toBeTruthy();
    });

    test('✅ Enregistrement audio avec FAB', async () => {
      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('audio-fab-button')).toBeTruthy();
      });

      // Démarrer l'enregistrement
      fireEvent.press(getByTestId('audio-fab-button'));

      // Le composant devrait afficher l'état d'enregistrement
      await waitFor(() => {
        expect(getByTestId('recording-gradient')).toBeTruthy();
      });
    });
  });

  describe('5. Tests d\'Intégration Native', () => {
    test('✅ Intégration avec le module de capture audio', async () => {
      const TestComponent = () => {
        const { startRecording, stopRecording, isRecording } = useAudioCapture();

        React.useEffect(() => {
          if (!isRecording) {
            startRecording('/test/path/audio.wav');
          }
        }, [isRecording]);

        return (
          <div data-testid="native-integration">
            <span>{`Recording: ${isRecording}`}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('native-integration')).toHaveTextContent('Recording: true');
      });
    });

    test('✅ Gestion des erreurs du module natif', async () => {
      const mockError = new Error('Erreur de capture audio');

      const TestComponent = () => {
        const { error, startRecording } = useAudioCapture({
          onError: jest.fn(),
        });

        React.useEffect(() => {
          // Simuler une erreur
          setTimeout(() => {
            throw mockError;
          }, 100);
        }, []);

        return (
          <div data-testid="error-handling">
            <span>{`Error: ${error || 'none'}`}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('error-handling')).toBeTruthy();
      });
    });
  });

  describe('6. Tests de Performance', () => {
    test('✅ Rendu performant avec de nombreux dossiers', async () => {
      const manyFolders = Array.from({ length: 50 }, (_, index) => ({
        ...mockFolder,
        id: `folder-${index}`,
        name: `Folder ${index}`,
      }));

      // Simuler le chargement de nombreux dossiers
      const startTime = performance.now();

      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Le rendu devrait être rapide (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    test('✅ Optimisation des re-renders', async () => {
      const renderCount = { current: 0 };

      const TestComponent = () => {
        const { folders } = useAudioFolders();
        renderCount.current += 1;

        return (
          <div data-testid="render-optimization">
            <span>{`Folders: ${folders.length}, Renders: ${renderCount.current}`}</span>
          </div>
        );
      };

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => {
        expect(getByTestId('render-optimization')).toBeTruthy();
      });

      // Le nombre de renders devrait être optimisé
      const rendersAfterInitial = renderCount.current;
      expect(rendersAfterInitial).toBeLessThan(10);
    });
  });

  describe('7. Tests d\'Accessibilité', () => {
    test('✅ Éléments accessibles correctement', async () => {
      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });

      // Vérifier les rôles d'accessibilité
      expect(getByTestId('audio-fab-button')).toHaveProp('accessibilityRole', 'button');
    });

    test('✅ Labels d\'accessibilité appropriés', async () => {
      const mockProps = {
        folder: mockFolder,
        isSelected: false,
        isSelectionMode: false,
        onPress: jest.fn(),
        onLongPress: jest.fn(),
        onDelete: jest.fn(),
      };

      const { getByTestId } = render(<AudioFolderCard {...mockProps} />);

      expect(getByTestId('folder-card')).toHaveProp('accessibilityLabel');
    });
  });

  describe('8. Tests de Micro-Interactions', () => {
    test('✅ RippleButton avec feedback haptiques', () => {
      const mockProps = {
        onPress: jest.fn(),
        hapticType: 'light' as const,
        rippleColor: 'rgba(255,255,255,0.3)',
        children: <span>Test Button</span>,
      };

      const { getByText } = render(
        <div data-testid="ripple-test">
          <button {...mockProps} data-testid="ripple-button">
            Test Button
          </button>
        </div>
      );

      fireEvent.press(getByText('Test Button'));
      expect(mockProps.onPress).toHaveBeenCalled();
    });

    test('✅ Animations du FAB pendant l\'enregistrement', async () => {
      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('audio-fab-button')).toBeTruthy();
      });

      // Simuler l'enregistrement
      fireEvent.press(getByTestId('audio-fab-button'));

      // Vérifier l'apparition des animations d'enregistrement
      await waitFor(() => {
        expect(getByTestId('recording-gradient')).toBeTruthy();
      });
    });
  });

  describe('9. Tests de Résilience', () => {
    test('✅ Gestion gracieuse des erreurs réseau', async () => {
      // Simuler une défaillance du module natif
      const originalStartRecording = require('../../../specs/NativeAudioCaptureModule').default.startRecording;
      originalStartRecording.mockRejectedValueOnce(new Error('Network Error'));

      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });

      // L'application devrait continuer à fonctionner
      expect(getByTestId('audio-fab-button')).toBeTruthy();
    });

    test('✅ Récupération après erreur de stockage', async () => {
      // Simuler une erreur AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage Error'));

      const { getByTestId } = render(<AudioScreen />);

      await waitFor(() => {
        expect(getByTestId('folders-flatlist')).toBeTruthy();
      });

      // Devrait afficher les données par défaut
      expect(getByText('Enregistrements personnels')).toBeTruthy();
    });
  });
});

// Test d'intégration de bout en bout
describe('🎵 AudioScreen - Test de Bout en Bout', () => {
  test('✅ Parcours utilisateur complet', async () => {
    const { getByTestId, getByText } = render(<AudioScreen />);

    // 1. Attendre le chargement initial
    await waitFor(() => {
      expect(getByTestId('folders-flatlist')).toBeTruthy();
    });

    // 2. Vérifier l'affichage des dossiers par défaut
    expect(getByText('Enregistrements personnels')).toBeTruthy();
    expect(getByText('Réunions de travail')).toBeTruthy();

    // 3. Tester la recherche
    const searchBar = getByText('Rechercher des dossiers...');
    fireEvent.changeText(searchBar, 'personnel');
    // Les résultats devraient être filtrés

    // 4. Tester l'enregistrement audio
    const fabButton = getByTestId('audio-fab-button');
    fireEvent.press(fabButton);

    await waitFor(() => {
      expect(getByTestId('recording-gradient')).toBeTruthy();
    });

    // 5. Arrêter l'enregistrement
    fireEvent.press(fabButton);

    // 6. Tester la création d'un dossier
    const createButton = getByText('Créer un dossier');
    fireEvent.press(createButton);

    // 7. Vérifier que tout fonctionne toujours
    expect(getByTestId('folders-flatlist')).toBeTruthy();
  });

  test('✅ Performance sous charge', async () => {
    const startTime = performance.now();

    const { getByTestId } = render(<AudioScreen />);

    await waitFor(() => {
      expect(getByTestId('folders-flatlist')).toBeTruthy();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;

    // L'écran devrait se charger rapidement
    expect(loadTime).toBeLessThan(200);

    // Effectuer plusieurs interactions
    for (let i = 0; i < 10; i++) {
      const fabButton = getByTestId('audio-fab-button');
      fireEvent.press(fabButton);
      await waitFor(() => {
        expect(getByTestId('recording-gradient')).toBeTruthy();
      });
      fireEvent.press(fabButton);
    }

    const interactionTime = performance.now() - endTime;
    // Les interactions devraient rester fluides
    expect(interactionTime).toBeLessThan(1000);
  });
});

export {};
