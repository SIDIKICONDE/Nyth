/**
 * Exemple d'utilisation des tests d'enregistrement vidéo
 * Ce fichier montre comment utiliser les utilitaires de test créés
 */

import { renderHook, act } from '@testing-library/react-native';
import { useRecordingSave } from '../../src/screens/RecordingScreen/hooks/useRecordingSave';
import { setupDefaultMocks, createMockVideoFile, createMockRecording } from './mocks';

describe('Exemples d\'utilisation des tests d\'enregistrement vidéo', () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  test('Exemple 1: Test d\'enregistrement simple réussi', async () => {
    const mockOnSaveSuccess = jest.fn();

    // Rendu du hook avec des paramètres de test
    const { result } = renderHook(() =>
      useRecordingSave({
        script: { id: 'test-script', title: 'Script de test' },
        settings: { quality: 'high' },
        recordingDuration: 15,
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    // Simuler la fin d'un enregistrement
    await act(async () => {
      const videoFile = createMockVideoFile('/test/example-recording.mp4', 15);
      await result.current.handleRecordingComplete(videoFile);
    });

    // Vérifier que la sauvegarde a réussi
    expect(mockOnSaveSuccess).toHaveBeenCalled();

    // Vérifier que les services ont été appelés correctement
    const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
    expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
      'test-user',
      '/test/example-recording.mp4',
      15,
      'test-script',
      'Script de test'
    );
  });

  test('Exemple 2: Test d\'erreur de stockage', async () => {
    // Simuler une erreur de stockage
    const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
    hybridStorageService.saveRecording.mockRejectedValueOnce(new Error('Disque plein'));

    const mockOnSaveError = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'low' },
        recordingDuration: 5,
        onSaveError: mockOnSaveError,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/error-recording.mp4', 5);
      await result.current.handleRecordingComplete(videoFile);
    });

    // Vérifier que l'erreur a été gérée
    expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('Exemple 3: Test avec utilisateur invité', async () => {
    // Changer l'utilisateur pour un invité
    const { useAuth } = require('@/contexts/AuthContext');
    useAuth.mockReturnValue({ user: null });

    const mockOnSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'medium' },
        recordingDuration: 10,
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/guest-recording.mp4', 10);
      await result.current.handleRecordingComplete(videoFile);
    });

    expect(mockOnSaveSuccess).toHaveBeenCalled();

    // Vérifier que l'ID utilisateur est 'guest'
    const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
    expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
      'guest',
      '/test/guest-recording.mp4',
      10,
      undefined,
      undefined
    );
  });

  test('Exemple 4: Test avec permissions refusées', async () => {
    // Simuler des permissions refusées
    const { FileManager } = require('@/services/social-share/utils/fileManager');
    FileManager.requestCameraAndMicrophonePermissions.mockResolvedValueOnce({
      allGranted: false,
      camera: false,
      microphone: false,
    });

    const mockOnSaveError = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'high' },
        recordingDuration: 20,
        onSaveError: mockOnSaveError,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/no-permission.mp4', 20);
      await result.current.handleRecordingComplete(videoFile);
    });

    // Le test devrait quand même réussir car la logique de fallback est en place
    // Dans un vrai scénario, cela dépendrait de la gestion d'erreur
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  test('Exemple 5: Test de performance avec gros fichier', async () => {
    // Simuler un gros fichier
    const { exists, stat } = require('react-native-fs');
    const largeFileSize = 100 * 1024 * 1024; // 100MB
    exists.mockResolvedValue(true);
    stat.mockResolvedValue({
      size: largeFileSize,
      isFile: () => true,
      path: '/test/large-recording.mp4',
    });

    const mockOnSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'high' },
        recordingDuration: 300, // 5 minutes
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    await act(async () => {
      const largeVideoFile = createMockVideoFile('/test/large-recording.mp4', 300);
      await result.current.handleRecordingComplete(largeVideoFile);
    });

    expect(mockOnSaveSuccess).toHaveBeenCalled();

    // Vérifier que la taille du fichier a été vérifiée
    expect(stat).toHaveBeenCalledWith('/test/large-recording.mp4');
  });

  test('Exemple 6: Test avec échec de sauvegarde dans la galerie', async () => {
    // Simuler un échec de sauvegarde dans la galerie
    const { FileManager } = require('@/services/social-share/utils/fileManager');
    FileManager.saveToGallery.mockResolvedValueOnce(false);

    const mockOnSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'medium' },
        recordingDuration: 15,
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/gallery-fail.mp4', 15);
      await result.current.handleRecordingComplete(videoFile);
    });

    // La sauvegarde devrait quand même réussir
    expect(mockOnSaveSuccess).toHaveBeenCalled();

    // Vérifier que la tentative de sauvegarde dans la galerie a été faite
    expect(FileManager.saveToGallery).toHaveBeenCalled();
  });

  test('Exemple 7: Test avec paramètres vidéo avancés', async () => {
    const mockSettings = {
      quality: 'high' as const,
      videoSettings: {
        codec: 'h264' as const,
        stabilization: 'cinematic' as const,
      },
    };

    const mockOnSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: { id: 'advanced-script', title: 'Script avancé' },
        settings: mockSettings,
        recordingDuration: 60,
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/advanced-recording.mp4', 60);
      await result.current.handleRecordingComplete(videoFile);
    });

    expect(mockOnSaveSuccess).toHaveBeenCalled();
  });

  test('Exemple 8: Test avec fichier corrompu', async () => {
    // Simuler un fichier qui n'existe pas
    const { exists } = require('react-native-fs');
    exists.mockResolvedValueOnce(false);

    const mockOnSaveError = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'low' },
        recordingDuration: 8,
        onSaveError: mockOnSaveError,
      })
    );

    await act(async () => {
      const corruptedVideoFile = createMockVideoFile('/test/corrupted.mp4', 8);
      await result.current.handleRecordingComplete(corruptedVideoFile);
    });

    expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
  });

  test('Exemple 9: Test de récupération après erreur', async () => {
    // Simuler une erreur puis une récupération réussie
    const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
    const { RecordingBackupManager } = require('@/services/autoSave');

    // Erreur lors de la sauvegarde principale
    hybridStorageService.saveRecording.mockRejectedValueOnce(new Error('Erreur de stockage'));
    // Sauvegarde de secours réussie
    RecordingBackupManager.saveRecording.mockResolvedValueOnce(undefined);

    const mockOnSaveSuccess = jest.fn();

    const { result } = renderHook(() =>
      useRecordingSave({
        script: null,
        settings: { quality: 'medium' },
        recordingDuration: 12,
        onSaveSuccess: mockOnSaveSuccess,
      })
    );

    await act(async () => {
      const videoFile = createMockVideoFile('/test/recovery-test.mp4', 12);
      await result.current.handleRecordingComplete(videoFile);
    });

    // La sauvegarde devrait réussir grâce au système de récupération
    expect(mockOnSaveSuccess).toHaveBeenCalled();
    expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
  });
});
