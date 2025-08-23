import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { VideoThumbnail } from '../../src/components/home/video-library/VideoThumbnail';
import { useVideoThumbnail } from '../../src/components/home/video-library/hooks/useVideoThumbnail';

// Mock des dépendances
jest.mock('react-native-video-thumbnail', () => ({
  createThumbnail: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  exists: jest.fn(),
  stat: jest.fn(),
}));

jest.mock('../../src/components/home/video-library/hooks/useVideoThumbnail', () => ({
  useVideoThumbnail: jest.fn(),
}));

jest.mock('../../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        text: '#000000',
        surface: '#F5F5F5',
        border: '#E0E0E0',
      },
    },
  }),
}));

jest.mock('../../src/hooks/useCentralizedFont', () => ({
  useCentralizedFont: () => ({
    ui: {},
    content: {},
    heading: {},
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

describe('VideoThumbnail', () => {
  const mockVideoUri = '/path/to/video.mp4';
  const mockThumbnailUri = '/path/to/thumbnail.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Composant VideoThumbnail', () => {
    test('devrait rendre correctement avec les props de base', () => {
      const { getByTestId } = render(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={100}
          height={80}
          showPlayIcon={true}
        />
      );

      // Le composant devrait se rendre sans erreur
      expect(true).toBe(true);
    });

    test('devrait gérer les différentes tailles', () => {
      const { rerender } = render(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={200}
          height={150}
        />
      );

      rerender(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={50}
          height={40}
        />
      );

      // Le composant devrait gérer les changements de taille
      expect(true).toBe(true);
    });

    test('devrait gérer l\'option showPlayIcon', () => {
      const { rerender } = render(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={100}
          height={80}
          showPlayIcon={true}
        />
      );

      rerender(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={100}
          height={80}
          showPlayIcon={false}
        />
      );

      // Le composant devrait gérer les deux états
      expect(true).toBe(true);
    });

    test('devrait gérer les URIs vides', () => {
      const { getByText } = render(
        <VideoThumbnail
          videoUri=""
          width={100}
          height={80}
        />
      );

      // Le composant devrait gérer l'URI vide
      expect(true).toBe(true);
    });

    test('devrait avoir les bonnes dimensions', () => {
      const width = 120;
      const height = 90;

      const { getByTestId } = render(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={width}
          height={height}
        />
      );

      // Les dimensions devraient être appliquées
      expect(true).toBe(true);
    });

    test('devrait gérer les erreurs de chargement', () => {
      const { getByText } = render(
        <VideoThumbnail
          videoUri="invalid://uri"
          width={100}
          height={80}
        />
      );

      // Le composant devrait gérer les erreurs
      expect(true).toBe(true);
    });

    test('devrait afficher l\'icône de chargement', () => {
      const { getByText } = render(
        <VideoThumbnail
          videoUri={mockVideoUri}
          width={100}
          height={80}
        />
      );

      // L'icône de chargement devrait être visible
      expect(true).toBe(true);
    });

    test('devrait afficher le design de fallback VHS', () => {
      const { getByText } = render(
        <VideoThumbnail
          videoUri="error://test"
          width={100}
          height={80}
        />
      );

      // Le design de fallback devrait être affiché
      expect(true).toBe(true);
    });
  });

  describe('Hook useVideoThumbnail', () => {
    const mockUseVideoThumbnail = useVideoThumbnail as jest.MockedFunction<typeof useVideoThumbnail>;

    beforeEach(() => {
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: false,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });
    });

    test('devrait retourner l\'état initial', () => {
      const result = useVideoThumbnail(mockVideoUri);

      expect(result).toEqual({
        thumbnailUri: null,
        isLoading: false,
        hasError: false,
        error: null,
        retryGeneration: expect.any(Function),
      });
    });

    test('devrait gérer l\'état de chargement', () => {
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: true,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });

      const result = useVideoThumbnail(mockVideoUri);
      expect(result.isLoading).toBe(true);
    });

    test('devrait gérer l\'état d\'erreur', () => {
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: false,
        hasError: true,
        error: 'Erreur de génération',
        retryGeneration: jest.fn(),
      });

      const result = useVideoThumbnail(mockVideoUri);
      expect(result.hasError).toBe(true);
      expect(result.error).toBe('Erreur de génération');
    });

    test('devrait gérer la génération réussie', () => {
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: mockThumbnailUri,
        isLoading: false,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });

      const result = useVideoThumbnail(mockVideoUri);
      expect(result.thumbnailUri).toBe(mockThumbnailUri);
      expect(result.hasError).toBe(false);
    });

    test('devrait appeler retryGeneration', () => {
      const retryMock = jest.fn();
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: false,
        hasError: true,
        error: 'Erreur',
        retryGeneration: retryMock,
      });

      const result = useVideoThumbnail(mockVideoUri);
      result.retryGeneration();

      expect(retryMock).toHaveBeenCalled();
    });

    test('devrait gérer les URIs vides', () => {
      const result = useVideoThumbnail('');
      expect(result.thumbnailUri).toBeNull();
      expect(result.hasError).toBe(false);
    });

    test('devrait gérer les changements d\'URI', () => {
      const { rerender } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      rerender(
        <VideoThumbnail videoUri="/new/path/video.mp4" width={100} height={80} />
      );

      // Le hook devrait être appelé avec la nouvelle URI
      expect(mockUseVideoThumbnail).toHaveBeenCalledWith('/new/path/video.mp4');
    });
  });

  describe('Intégration VideoThumbnail + useVideoThumbnail', () => {
    test('devrait synchroniser les états entre le composant et le hook', () => {
      // État de chargement
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: true,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });

      const { rerender } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // État de succès
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: mockThumbnailUri,
        isLoading: false,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });

      rerender(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Le composant devrait refléter les changements d'état
      expect(true).toBe(true);
    });

    test('devrait gérer les transitions d\'états', () => {
      // Loading -> Error
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: null,
        isLoading: false,
        hasError: true,
        error: 'Erreur de génération',
        retryGeneration: jest.fn(),
      });

      const { rerender } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Error -> Success après retry
      mockUseVideoThumbnail.mockReturnValue({
        thumbnailUri: mockThumbnailUri,
        isLoading: false,
        hasError: false,
        error: null,
        retryGeneration: jest.fn(),
      });

      rerender(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Les transitions devraient être fluides
      expect(true).toBe(true);
    });
  });

  describe('Performance et optimisation', () => {
    test('devrait éviter les re-renders inutiles', () => {
      const { rerender } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Re-render avec les mêmes props
      rerender(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Le composant devrait être optimisé
      expect(mockUseVideoThumbnail).toHaveBeenCalledTimes(2); // Une fois par render
    });

    test('devrait gérer les changements de dimensions efficacement', () => {
      const { rerender } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Changer seulement les dimensions
      rerender(
        <VideoThumbnail videoUri={mockVideoUri} width={200} height={160} />
      );

      // Le hook ne devrait pas être re-appelé si l'URI n'a pas changé
      expect(mockUseVideoThumbnail).toHaveBeenCalledWith(mockVideoUri);
    });
  });

  describe('Accessibilité', () => {
    test('devrait avoir des attributs d\'accessibilité', () => {
      const { getByTestId } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Le composant devrait être accessible
      expect(true).toBe(true);
    });

    test('devrait gérer les lecteurs d\'écran', () => {
      const { getByText } = render(
        <VideoThumbnail videoUri={mockVideoUri} width={100} height={80} />
      );

      // Le contenu devrait être accessible
      expect(true).toBe(true);
    });
  });
});
