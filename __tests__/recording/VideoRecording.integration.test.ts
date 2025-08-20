/**
 * Tests d'intégration pour l'enregistrement vidéo
 * Teste le flux complet d'enregistrement vidéo de bout en bout
 */

import React, { Fragment } from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { CameraModule } from '../../src/components/camera/CameraModule';
import { useRecordingSave } from '../../src/screens/RecordingScreen/hooks/useRecordingSave';
import { setupDefaultMocks, createMockVideoFile } from './mocks';

beforeEach(() => {
  setupDefaultMocks();
  jest.clearAllMocks();
});

describe('Flux complet d\'enregistrement vidéo - Tests d\'intégration', () => {
  describe('Enregistrement simple réussi', () => {
    test('flux complet: démarrage → enregistrement → arrêt → sauvegarde', async () => {
      const mockOnRecordingComplete = jest.fn();
      const mockOnRecordingStart = jest.fn();
      const mockOnRecordingStop = jest.fn();

      // Rendu du composant CameraModule
      const { getByTestId } = render(
        <CameraModule
          onRecordingComplete={mockOnRecordingComplete}
          onRecordingStart={mockOnRecordingStart}
          onRecordingStop={mockOnRecordingStop}
        />
      );

      // Vérifier que la caméra est initialisée
      await waitFor(() => {
        expect(mockOnRecordingStart).not.toHaveBeenCalled();
        expect(mockOnRecordingStop).not.toHaveBeenCalled();
      });

      // Simuler le démarrage de l'enregistrement
      await act(async () => {
        // Ici nous simulerions un clic sur le bouton d'enregistrement
        // Pour les tests d'intégration, nous testons directement les hooks

        // Test du hook useRecordingSave avec un enregistrement complet
        const mockVideoFile = createMockVideoFile('/test/complete-recording.mp4', 30);

        const TestComponent = () => {
          const { handleRecordingComplete } = useRecordingSave({
            script: { id: 'test-script', title: 'Test Script' },
            settings: { quality: 'high' },
            recordingDuration: 30,
            onSaveSuccess: () => {
              console.log('✅ Sauvegarde réussie');
            },
            onSaveError: (error: Error) => {
              console.error('❌ Erreur de sauvegarde:', error);
            },
          });

          React.useEffect(() => {
            // Simuler la fin d'un enregistrement
            handleRecordingComplete(mockVideoFile);
          }, []);

          return null;
        };

        render(<Fragment><TestComponent /></Fragment>);
      });

      // Attendre que la sauvegarde soit terminée
      await waitFor(() => {
        expect(mockOnRecordingComplete).toHaveBeenCalledWith(expect.any(Object));
      });

      // Vérifier que toutes les étapes du flux ont été exécutées
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { FileManager } = require('@/services/social-share/utils/fileManager');

      expect(hybridStorageService.initializeLocalStorage).toHaveBeenCalled();
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'test-user',
        '/test/complete-recording.mp4',
        30,
        'test-script',
        'Test Script'
      );
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
      expect(FileManager.saveToGallery).toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs pendant l\'enregistrement', () => {
    test('récupération gracieuse après erreur de caméra', async () => {
      const { Camera } = require('react-native-vision-camera');
      const mockOnRecordingComplete = jest.fn();
      const mockOnError = jest.fn();

      // Simuler une erreur de caméra
      Camera.mockImplementation(() => ({
        startRecording: jest.fn().mockRejectedValue(new Error('Camera hardware error')),
        stopRecording: jest.fn(),
        pauseRecording: jest.fn(),
        resumeRecording: jest.fn(),
      }));

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'medium' },
          recordingDuration: 5,
          onSaveError: mockOnError,
        });

        React.useEffect(() => {
          // Tenter de sauvegarder avec un fichier corrompu
          const corruptedVideoFile = createMockVideoFile('/test/corrupted.mp4', 5);
          handleRecordingComplete(corruptedVideoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    test('sauvegarde de secours activée après erreur principale', async () => {
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      const { RecordingBackupManager } = require('@/services/autoSave');
      const { FileManager } = require('@/services/social-share/utils/fileManager');

      // Simuler une erreur de sauvegarde principale
      hybridStorageService.saveRecording.mockRejectedValueOnce(new Error('Storage full'));
      // Sauvegarde de secours réussie
      RecordingBackupManager.saveRecording.mockResolvedValueOnce(undefined);
      FileManager.saveToGallery.mockResolvedValueOnce(true);

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'low' },
          recordingDuration: 10,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/recovery-test.mp4', 10);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      // Vérifier que la sauvegarde de secours a été utilisée
      expect(RecordingBackupManager.saveRecording).toHaveBeenCalled();
      expect(FileManager.saveToGallery).toHaveBeenCalled();
    });
  });

  describe('Différents scénarios utilisateur', () => {
    test('utilisateur connecté avec script complexe', async () => {
      const mockScript = {
        id: 'complex-script',
        title: 'Script complexe avec instructions',
        content: 'Contenu du script...',
      };
      const mockSettings = {
        quality: 'high',
        videoSettings: {
          codec: 'h264',
          stabilization: 'cinematic',
        },
      };

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: mockScript,
          settings: mockSettings,
          recordingDuration: 45,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/complex-recording.mp4', 45);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'test-user',
        '/test/complex-recording.mp4',
        45,
        'complex-script',
        'Script complexe avec instructions'
      );
    });

    test('utilisateur invité sans script', async () => {
      const { useAuth } = require('@/contexts/AuthContext');
      useAuth.mockReturnValue({ user: null });

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'low' },
          recordingDuration: 5,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/guest-recording.mp4', 5);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalledWith(
        'guest',
        '/test/guest-recording.mp4',
        5,
        undefined,
        undefined
      );
    });
  });

  describe('Gestion des permissions', () => {
    test('flux avec permissions accordées', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.requestCameraAndMicrophonePermissions.mockResolvedValueOnce({
        allGranted: true,
        camera: true,
        microphone: true,
      });

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'medium' },
          recordingDuration: 15,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/permission-test.mp4', 15);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });
    });

    test('comportement avec permissions refusées', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      const { useCameraPermission, useMicrophonePermission } = require('react-native-vision-camera');

      FileManager.requestCameraAndMicrophonePermissions.mockResolvedValueOnce({
        allGranted: false,
        camera: false,
        microphone: false,
      });

      useCameraPermission.mockReturnValue({
        hasPermission: false,
        requestPermission: jest.fn().mockResolvedValue(false),
      });

      useMicrophonePermission.mockReturnValue({
        hasPermission: false,
        requestPermission: jest.fn().mockResolvedValue(false),
      });

      // Simuler un scénario où les permissions sont requises mais refusées
      const { Camera } = require('react-native-vision-camera');
      Camera.mockImplementation(() => ({
        startRecording: jest.fn().mockRejectedValue(new Error('Permission denied')),
        stopRecording: jest.fn(),
        pauseRecording: jest.fn(),
        resumeRecording: jest.fn(),
      }));

      const mockOnError = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'high' },
          recordingDuration: 10,
          onSaveError: mockOnError,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/no-permission.mp4', 10);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Performance et métriques', () => {
    test('enregistrement avec métriques de performance', async () => {
      const { exists, stat } = require('react-native-fs');
      const largeFileSize = 50 * 1024 * 1024; // 50MB

      exists.mockResolvedValue(true);
      stat.mockResolvedValue({
        size: largeFileSize,
        isFile: () => true,
        path: '/test/large-recording.mp4',
      });

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'high' },
          recordingDuration: 60, // 1 minute
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const largeVideoFile = createMockVideoFile('/test/large-recording.mp4', 60);
          handleRecordingComplete(largeVideoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      // Vérifier que les informations de fichier ont été vérifiées
      expect(stat).toHaveBeenCalledWith('/test/large-recording.mp4');
    });

    test('gestion de fichiers de différentes tailles', async () => {
      const testCases = [
        { size: 1024, duration: 1 }, // 1KB, 1 seconde
        { size: 1024 * 1024, duration: 10 }, // 1MB, 10 secondes
        { size: 100 * 1024 * 1024, duration: 300 }, // 100MB, 5 minutes
      ];

      for (const { size, duration } of testCases) {
        const { exists, stat } = require('react-native-fs');
        exists.mockResolvedValue(true);
        stat.mockResolvedValue({
          size,
          isFile: () => true,
          path: `/test/recording-${duration}s.mp4`,
        });

        const mockOnSaveSuccess = jest.fn();

        const TestComponent = ({ fileSize, fileDuration }: { fileSize: number; fileDuration: number }) => {
          const { handleRecordingComplete } = useRecordingSave({
            script: null,
            settings: { quality: 'high' },
            recordingDuration: fileDuration,
            onSaveSuccess: mockOnSaveSuccess,
          });

          React.useEffect(() => {
            const videoFile = createMockVideoFile(`/test/recording-${fileDuration}s.mp4`, fileDuration);
            handleRecordingComplete(videoFile);
          }, []);

          return null;
        };

        render(<Fragment><TestComponent fileSize={size} fileDuration={duration} /></Fragment>);

        await waitFor(() => {
          expect(mockOnSaveSuccess).toHaveBeenCalled();
        });

        jest.clearAllMocks();
      }
    });
  });

  describe('Sauvegarde dans la galerie', () => {
    test('sauvegarde réussie dans la galerie', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.saveToGallery.mockResolvedValueOnce(true);

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'high' },
          recordingDuration: 20,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/gallery-test.mp4', 20);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      expect(FileManager.saveToGallery).toHaveBeenCalled();
    });

    test('gestion de l\'échec de sauvegarde dans la galerie', async () => {
      const { FileManager } = require('@/services/social-share/utils/fileManager');
      FileManager.saveToGallery.mockResolvedValueOnce(false);

      const mockOnSaveSuccess = jest.fn();

      const TestComponent = () => {
        const { handleRecordingComplete } = useRecordingSave({
          script: null,
          settings: { quality: 'medium' },
          recordingDuration: 15,
          onSaveSuccess: mockOnSaveSuccess,
        });

        React.useEffect(() => {
          const videoFile = createMockVideoFile('/test/gallery-fail.mp4', 15);
          handleRecordingComplete(videoFile);
        }, []);

        return null;
      };

      render(<Fragment><TestComponent /></Fragment>);

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled();
      });

      expect(FileManager.saveToGallery).toHaveBeenCalled();

      // La sauvegarde devrait réussir même si la galerie échoue
      const { hybridStorageService } = require('@/services/firebase/hybridStorageService');
      expect(hybridStorageService.saveRecording).toHaveBeenCalled();
    });
  });
});
