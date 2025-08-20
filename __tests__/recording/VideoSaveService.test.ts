/**
 * Tests unitaires pour VideoSaveService
 * Teste la logique de sauvegarde des vidéos
 */

import { VideoSaveService } from '../../src/screens/RecordingScreen/services/videoSaveService';
import { setupDefaultMocks, createMockVideoFile, createMockRecording } from './mocks';

// Setup des mocks avant tous les tests
beforeEach(() => {
  setupDefaultMocks();
  jest.clearAllMocks();
});

// Mock des dépendances
const mockVideoFile = createMockVideoFile('/test/recording.mp4', 15);
const mockScript = { id: 'script1', title: 'Test Script' };
const mockSettings = { quality: 'high' as const };
const mockUserId = 'user123';

describe('VideoSaveService', () => {
  describe('verifyFileExists', () => {
    test('retourne true si le fichier existe', async () => {
      const { exists } = require('react-native-fs');
      exists.mockResolvedValueOnce(true);

      const result = await VideoSaveService['verifyFileExists']('/test/video.mp4');
      expect(result).toBe(true);
      expect(exists).toHaveBeenCalledWith('/test/video.mp4');
    });

    test('retourne false si le fichier n\'existe pas', async () => {
      const { exists } = require('react-native-fs');
      exists.mockResolvedValueOnce(false);

      const result = await VideoSaveService['verifyFileExists']('/test/missing.mp4');
      expect(result).toBe(false);
    });

    test('gère les erreurs de vérification de fichier', async () => {
      const { exists } = require('react-native-fs');
      exists.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await VideoSaveService['verifyFileExists']('/test/error.mp4');
      expect(result).toBe(false);
    });
  });

  describe('getFileInfo', () => {
    test('retourne les informations du fichier sur iOS', async () => {
      const { stat } = require('react-native-fs');
      const mockStat = {
        path: '/test/video.mp4',
        size: 2048,
        isFile: () => true,
        ctime: new Date(),
        mtime: new Date(),
      };
      stat.mockResolvedValueOnce(mockStat);

      // Mock Platform.OS pour iOS
      jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

      const result = await VideoSaveService['getFileInfo']('/test/video.mp4');

      expect(result).toEqual({
        path: '/test/video.mp4',
        size: 2048,
        isFile: true,
        ctime: mockStat.ctime,
        mtime: mockStat.mtime,
      });
      expect(stat).toHaveBeenCalledWith('/test/video.mp4');
    });

    test('retourne null sur Android', async () => {
      // Mock Platform.OS pour Android
      jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

      const result = await VideoSaveService['getFileInfo']('/test/video.mp4');
      expect(result).toBeNull();
    });
  });

  describe('createRecordingObject', () => {
    test('crée un objet Recording avec toutes les propriétés', () => {
      const recording = VideoSaveService['createRecordingObject']({
        recordingId: 'rec123',
        videoUriWithPrefix: 'file:///test/video.mp4',
        recordingDuration: 30,
        script: mockScript,
        settings: mockSettings,
      });

      expect(recording).toEqual({
        id: 'rec123',
        videoUri: 'file:///test/video.mp4',
        uri: 'file:///test/video.mp4',
        duration: 30,
        scriptId: 'script1',
        scriptTitle: 'Test Script',
        createdAt: expect.any(String),
        quality: 'high',
      });
    });

    test('gère le cas sans script', () => {
      const recording = VideoSaveService['createRecordingObject']({
        recordingId: 'rec123',
        videoUriWithPrefix: 'file:///test/video.mp4',
        recordingDuration: 20,
        script: null,
        settings: mockSettings,
      });

      expect(recording.scriptId).toBeUndefined();
      expect(recording.scriptTitle).toBeUndefined();
    });

    test('gère le cas avec paramètres vidéo avancés', () => {
      const settingsWithVideo = {
        ...mockSettings,
        videoSettings: {
          codec: 'h264' as const,
          stabilization: 'auto' as const,
        },
      };

      const recording = VideoSaveService['createRecordingObject']({
        recordingId: 'rec123',
        videoUriWithPrefix: 'file:///test/video.mp4',
        recordingDuration: 25,
        script: mockScript,
        settings: settingsWithVideo,
      });

      expect((recording as any).videoSettings).toEqual({
        codec: 'h264',
        stabilization: 'auto',
      });
    });
  });

  describe('saveToGallery', () => {
    test('sauvegarde avec succès dans la galerie', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.saveToGallery.mockResolvedValueOnce(true);

      const result = await VideoSaveService['saveToGallery']('file:///test/video.mp4');
      expect(result).toBe(true);
      expect(FileManager.saveToGallery).toHaveBeenCalledWith('file:///test/video.mp4');
    });

    test('gère l\'échec de sauvegarde dans la galerie', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.saveToGallery.mockRejectedValueOnce(new Error('Gallery error'));

      const result = await VideoSaveService['saveToGallery']('file:///test/video.mp4');
      expect(result).toBe(false);
    });
  });

  describe('handlePostSaveNavigation', () => {
    test('navigue immédiatement si sauvegarde dans galerie réussie', () => {
      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      VideoSaveService['handlePostSaveNavigation']({
        savedToGallery: true,
        videoUriWithPrefix: 'file:///test/video.mp4',
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(mockOnNavigate).toHaveBeenCalled();
    });

    test('affiche une alerte si sauvegarde dans galerie échoue', () => {
      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);
      const { Alert } = require('react-native');

      VideoSaveService['handlePostSaveNavigation']({
        savedToGallery: false,
        videoUriWithPrefix: 'file:///test/video.mp4',
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(mockOnNavigate).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Galerie non disponible',
        'La vidéo a été sauvegardée localement. Vous pourrez réessayer l\'export vers la galerie depuis votre bibliothèque.',
        expect.any(Array)
      );
    });
  });

  describe('attemptFallbackSave', () => {
    test('sauvegarde de secours réussie', async () => {
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { toFileUri } = require('@/utils/pathNormalizer');
      const { FileManager } = require('@/services/social-share/utils/fileManager');

      RecordingBackupManager.saveRecording.mockResolvedValueOnce(undefined);
      FileManager.saveToGallery.mockResolvedValueOnce(true);
      toFileUri.mockReturnValueOnce('file:///fallback/video.mp4');

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService['attemptFallbackSave']({
        video: mockVideoFile,
        recordingDuration: 15,
        script: mockScript,
        settings: mockSettings,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(true);
      expect(result.recordingId).toBe('rec_');
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
      expect(mockOnNavigate).toHaveBeenCalled();
    });

    test('gère l\'échec de la sauvegarde de secours', async () => {
      const { RecordingBackupManager } = require('@/services/autoSave');
      RecordingBackupManager.saveRecording.mockRejectedValueOnce(new Error('Storage error'));

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService['attemptFallbackSave']({
        video: mockVideoFile,
        recordingDuration: 15,
        script: mockScript,
        settings: mockSettings,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(mockOnNavigate).toHaveBeenCalled();
    });
  });

  describe('saveRecording - succès', () => {
    test('sauvegarde complète réussie avec toutes les étapes', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      const { exists, stat } = require('react-native-fs');
      const { toFileUri } = require('@/utils/pathNormalizer');

      // Configuration des mocks
      exists.mockResolvedValue(true);
      stat.mockResolvedValue({ size: 1024 * 1024, isFile: () => true });
      hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
      hybridStorageService.saveRecording.mockResolvedValue('saved-recording-id');
      RecordingBackupManager.saveRecording.mockResolvedValue(undefined);
      FileManager.saveToGallery.mockResolvedValue(true);
      toFileUri.mockReturnValue('file:///saved/video.mp4');

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 20,
        script: mockScript,
        settings: mockSettings,
        userId: mockUserId,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(true);
      expect(result.recordingId).toBe('saved-recording-id');
      expect(mockOnNavigate).toHaveBeenCalled();

      // Vérification que toutes les étapes ont été appelées
      expect(hybridStorageService.initializeLocalStorage).toHaveBeenCalled();
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        mockUserId,
        mockVideoFile.path,
        20,
        mockScript.id,
        mockScript.title
      );
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
      expect(FileManager.saveToGallery).toHaveBeenCalled();
    });

    test('utilise l\'ID utilisateur "guest" par défaut', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { exists } = require('react-native-fs');

      exists.mockResolvedValue(true);
      hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
      hybridStorageService.saveRecording.mockResolvedValue('guest-recording-id');

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 10,
        script: null,
        settings: null,
        userId: undefined, // Pas d'utilisateur fourni
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'guest',
        mockVideoFile.path,
        10,
        undefined,
        undefined
      );
    });
  });

  describe('saveRecording - erreurs', () => {
    test('gère le fichier vidéo introuvable', async () => {
      const { exists } = require('react-native-fs');
      exists.mockResolvedValue(false);

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 10,
        script: null,
        settings: null,
        userId: mockUserId,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Video file not found');
    });

    test('gère les erreurs d\'initialisation du stockage', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { exists } = require('react-native-fs');

      exists.mockResolvedValue(true);
      hybridStorageService.initializeLocalStorage.mockRejectedValue(new Error('Storage init failed'));

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 10,
        script: null,
        settings: null,
        userId: mockUserId,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('gère les erreurs de sauvegarde du fichier', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { exists } = require('react-native-fs');

      exists.mockResolvedValue(true);
      hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
      hybridStorageService.saveRecording.mockRejectedValue(new Error('Save failed'));

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 10,
        script: null,
        settings: null,
        userId: mockUserId,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('active la sauvegarde de secours en cas d\'erreur principale', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { exists } = require('react-native-fs');

      exists.mockResolvedValue(true);
      hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
      hybridStorageService.saveRecording.mockRejectedValue(new Error('Primary save failed'));
      RecordingBackupManager.saveRecording.mockResolvedValue(undefined);

      const mockOnNavigate = jest.fn();
      const mockT = jest.fn((key, fallback) => fallback);

      const result = await VideoSaveService.saveRecording({
        video: mockVideoFile,
        recordingDuration: 10,
        script: null,
        settings: null,
        userId: mockUserId,
        onNavigate: mockOnNavigate,
        t: mockT,
      });

      // La sauvegarde de secours devrait réussir
      expect(result.success).toBe(true);
      expect(result.recordingId).toMatch(/^rec_\d+$/);
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
    });
  });
});
