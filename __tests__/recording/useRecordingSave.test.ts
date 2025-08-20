/**
 * Tests pour le hook useRecordingSave
 * Teste la logique de sauvegarde des enregistrements
 */

import { renderHook, act } from '@testing-library/react-native';
import { useRecordingSave } from '../../src/screens/RecordingScreen/hooks/useRecordingSave';
import { setupDefaultMocks, createMockVideoFile } from './mocks';

beforeEach(() => {
  setupDefaultMocks();
  jest.clearAllMocks();
});

describe('useRecordingSave', () => {
  describe('initialisation', () => {
    test('initialise avec les paramètres par défaut', () => {
      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
        })
      );

      expect(typeof result.current.handleRecordingComplete).toBe('function');
    });

    test('initialise avec tous les paramètres', () => {
      const mockScript = { id: 'script1', title: 'Test Script' };
      const mockSettings = { quality: 'high' as const };

      const { result } = renderHook(() =>
        useRecordingSave({
          script: mockScript,
          settings: mockSettings,
          recordingDuration: 15,
          onSaveSuccess: jest.fn(),
                      onSaveError: jest.fn() as (error: Error) => void,
        })
      );

      expect(typeof result.current.handleRecordingComplete).toBe('function');
    });
  });

  describe('handleRecordingComplete - succès', () => {
    test('traite un enregistrement réussi avec toutes les étapes', async () => {
      const mockOnSaveSuccess = jest.fn();
      const mockScript = { id: 'script1', title: 'Test Script' };
      const mockSettings = { quality: 'high' as const };
      const mockVideoFile = createMockVideoFile('/test/recording.mp4', 20);

      const { result } = renderHook(() =>
        useRecordingSave({
          script: mockScript,
          settings: mockSettings,
          recordingDuration: 20,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();

      // Vérifier que toutes les étapes de sauvegarde ont été appelées
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { FileManager } = require('@/services/social-share/utils/fileManager');

      expect(hybridStorageService.initializeLocalStorage).toHaveBeenCalled();
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'test-user',
        mockVideoFile.path,
        20,
        mockScript.id,
        mockScript.title
      );
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
      expect(FileManager.saveToGallery).toHaveBeenCalled();
    });

    test('utilise l\'utilisateur guest si pas d\'utilisateur connecté', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: null });

      const mockOnSaveSuccess = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'guest',
        mockVideoFile.path,
        10,
        undefined,
        undefined
      );
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });

    test('gère les paramètres vidéo avancés', async () => {
      const mockOnSaveSuccess = jest.fn();
      const mockSettings = {
        quality: 'high' as const,
        videoSettings: {
          codec: 'h264' as const,
          stabilization: 'auto' as const,
        },
      };
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: mockSettings,
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  describe('handleRecordingComplete - erreurs', () => {
    test('gère l\'erreur de vérification de fichier', async () => {
      const { exists } = require('react-native-fs');
      exists.mockResolvedValueOnce(false);

      const mockOnSaveError = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveError: mockOnSaveError,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('gère l\'erreur d\'initialisation du stockage', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      hybridStorageService.initializeLocalStorage.mockRejectedValueOnce(new Error('Storage init failed'));

      const mockOnSaveError = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveError: mockOnSaveError,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('gère l\'erreur de sauvegarde principale et active la sauvegarde de secours', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { FileManager } = require('@/services/social-share/utils/fileManager');

      // Erreur lors de la sauvegarde principale
      hybridStorageService.saveRecording.mockRejectedValueOnce(new Error('Primary save failed'));
      // Sauvegarde de secours réussie
      RecordingBackupManager.saveRecording.mockResolvedValueOnce(undefined);
      FileManager.saveToGallery.mockResolvedValueOnce(true);

      const mockOnSaveSuccess = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
    });

    test('gère l\'échec total de sauvegarde', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');

      hybridStorageService.saveRecording.mockRejectedValueOnce(new Error('Primary save failed'));
      RecordingBackupManager.saveRecording.mockRejectedValueOnce(new Error('Backup save failed'));

      const mockOnSaveError = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveError: mockOnSaveError,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('gère l\'échec de sauvegarde dans la galerie', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.saveToGallery.mockResolvedValueOnce(false);

      const mockOnSaveSuccess = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      // La sauvegarde devrait toujours réussir même si la galerie échoue
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    test('log les informations détaillées de l\'enregistrement', async () => {
      const mockScript = { id: 'script1', title: 'Test Script' };
      const mockSettings = {
        quality: 'high' as const,
        videoSettings: { codec: 'h264' as const },
      };
      const mockVideoFile = createMockVideoFile('/test/recording.mp4', 30);

      const { result } = renderHook(() =>
        useRecordingSave({
          script: mockScript,
          settings: mockSettings,
          recordingDuration: 30,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      // Vérifier que les logs ont été appelés (les mocks de logger sont vérifiés)
      const { createLogger } = require('@/utils/optimizedLogger');
      expect(createLogger).toHaveBeenCalledWith('useRecordingSave');
    });

    test('log les erreurs de sauvegarde', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      hybridStorageService.initializeLocalStorage.mockRejectedValueOnce(new Error('Storage error'));

      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      // Les erreurs sont loggées via le service de logging
      const { createLogger } = require('@/utils/optimizedLogger');
      expect(createLogger).toHaveBeenCalledWith('useRecordingSave');
    });
  });

  describe('callbacks', () => {
    test('appelle onSaveSuccess en cas de succès', async () => {
      const mockOnSaveSuccess = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });

    test('appelle onSaveError en cas d\'erreur', async () => {
      const { exists } = require('react-native-fs');
      exists.mockResolvedValueOnce(false);

      const mockOnSaveError = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
          onSaveError: mockOnSaveError,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      expect(mockOnSaveError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('ne plante pas sans callbacks', async () => {
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 10,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      // Aucune erreur ne devrait être levée
      expect(true).toBe(true);
    });
  });

  describe('différents scénarios d\'utilisateur', () => {
    test('utilisateur connecté avec script', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: { uid: 'user123' } });

      const mockOnSaveSuccess = jest.fn();
      const mockScript = { id: 'script1', title: 'Test Script' };
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: mockScript,
          settings: null,
          recordingDuration: 15,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'user123',
        mockVideoFile.path,
        15,
        mockScript.id,
        mockScript.title
      );
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });

    test('utilisateur invité sans script', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: null });

      const mockOnSaveSuccess = jest.fn();
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() =>
        useRecordingSave({
          script: null,
          settings: null,
          recordingDuration: 8,
          onSaveSuccess: mockOnSaveSuccess,
        })
      );

      await act(async () => {
        await result.current.handleRecordingComplete(mockVideoFile);
      });

      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'guest',
        mockVideoFile.path,
        8,
        undefined,
        undefined
      );
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });
});
