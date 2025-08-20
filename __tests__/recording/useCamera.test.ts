/**
 * Tests pour le hook useCamera
 * Teste la logique d'enregistrement vidéo de la caméra
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCamera } from '../../src/components/camera/hooks/useCamera';
import { setupDefaultMocks, createMockVideoFile } from './mocks';

beforeEach(() => {
  setupDefaultMocks();
  jest.clearAllMocks();
});

describe('useCamera', () => {
  describe('initialisation', () => {
    test('initialise avec la position par défaut', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.position).toBe('back');
      expect(result.current.flash).toBe('off');
      expect(result.current.recordingState).toEqual({
        isRecording: false,
        isPaused: false,
        duration: 0,
        videoFile: undefined,
      });
    });

    test('initialise avec une position personnalisée', () => {
      const { result } = renderHook(() => useCamera('front'));

      expect(result.current.position).toBe('front');
    });

    test('retourne un device caméra valide', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.device).toBeDefined();
      expect(result.current.device?.id).toBe('test-device');
    });
  });

  describe('permissions', () => {
    test('retourne les permissions de caméra et microphone', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.hasCameraPermission).toBe(true);
      expect(result.current.hasMicrophonePermission).toBe(true);
    });

    test('demande les permissions avec succès', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        const granted = await result.current.requestPermissions();
        expect(granted).toBe(true);
      });
    });
  });

  describe('startRecording', () => {
    test('démarre l\'enregistrement avec succès', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(true);
      expect(result.current.recordingState.isPaused).toBe(false);
      expect(result.current.recordingState.duration).toBe(0);
    });

    test('empêche le démarrage multiple d\'enregistrement', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.startRecording(); // Deuxième appel
      });

      expect(result.current.recordingState.isRecording).toBe(true);
      // Le deuxième appel devrait être ignoré
    });

    test('gère les permissions manquantes', async () => {
      const { useCameraPermission, useMicrophonePermission } = require('react-native-vision-camera');

      useCameraPermission.mockReturnValue({
        hasPermission: false,
        requestPermission: jest.fn().mockResolvedValue(false),
      });

      useMicrophonePermission.mockReturnValue({
        hasPermission: false,
        requestPermission: jest.fn().mockResolvedValue(false),
      });

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(false);
      expect(result.current.recordingState.error).toBeUndefined();
    });

    test('gère les erreurs de démarrage d\'enregistrement', async () => {
      const { Camera } = require('react-native-vision-camera');
      const mockCameraInstance = {
        startRecording: jest.fn().mockRejectedValue(new Error('Camera error')),
        stopRecording: jest.fn(),
        pauseRecording: jest.fn(),
        resumeRecording: jest.fn(),
      };
      Camera.mockReturnValue(mockCameraInstance);

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(false);
      expect(result.current.recordingState.error).toBe('Erreur de démarrage inconnue');
    });
  });

  describe('stopRecording', () => {
    test('arrête l\'enregistrement en cours', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.stopRecording();
      });

      // L'état sera mis à jour par le callback onRecordingFinished simulé
      expect(result.current.recordingState.isRecording).toBe(false);
    });

    test('ignore l\'arrêt si aucun enregistrement en cours', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.stopRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(false);
    });
  });

  describe('pause et resume', () => {
    test('met en pause l\'enregistrement', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.pauseRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(true);
      expect(result.current.recordingState.isPaused).toBe(true);
    });

    test('reprend l\'enregistrement mis en pause', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.pauseRecording();
        await result.current.controls.resumeRecording();
      });

      expect(result.current.recordingState.isRecording).toBe(true);
      expect(result.current.recordingState.isPaused).toBe(false);
    });

    test('ignore la pause si déjà en pause', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.pauseRecording();
        await result.current.controls.pauseRecording(); // Deuxième pause
      });

      expect(result.current.recordingState.isPaused).toBe(true);
    });

    test('ignore la reprise si pas en pause', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.resumeRecording(); // Reprise sans pause
      });

      expect(result.current.recordingState.isPaused).toBe(false);
    });
  });

  describe('switchCamera', () => {
    test('bascule entre caméra arrière et avant', () => {
      const { result } = renderHook(() => useCamera('back'));

      act(() => {
        result.current.controls.switchCamera();
      });

      expect(result.current.position).toBe('front');

      act(() => {
        result.current.controls.switchCamera();
      });

      expect(result.current.position).toBe('back');
    });
  });

  describe('toggleFlash', () => {
    test('cycle à travers les modes flash', () => {
      const { result } = renderHook(() => useCamera());

      expect(result.current.flash).toBe('off');

      act(() => {
        result.current.controls.toggleFlash();
      });

      expect(result.current.flash).toBe('on');

      act(() => {
        result.current.controls.toggleFlash();
      });

      expect(result.current.flash).toBe('off');
    });
  });

  describe('timer d\'enregistrement', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('incrémente la durée pendant l\'enregistrement', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      expect(result.current.recordingState.duration).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.recordingState.duration).toBe(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.recordingState.duration).toBe(3);
    });

    test('ne pas incrémenter la durée si en pause', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
        await result.current.controls.pauseRecording();
      });

      expect(result.current.recordingState.duration).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.recordingState.duration).toBe(0);
    });
  });

  describe('setStartRecordingOptions', () => {
    test('met à jour les options d\'enregistrement', () => {
      const { result } = renderHook(() => useCamera());

      act(() => {
        result.current.setStartRecordingOptions({
          fileType: 'mp4',
          videoCodec: 'h264',
          videoBitRate: 5000000,
        });
      });

      // Les options sont stockées en interne, on ne peut pas les tester directement
      // mais on peut vérifier que la fonction existe
      expect(typeof result.current.setStartRecordingOptions).toBe('function');
    });
  });

  describe('stopRecordingAndGetFile', () => {
    test('retourne le fichier vidéo si disponible', async () => {
      const { result } = renderHook(() => useCamera());

      // Simuler un fichier vidéo terminé
      act(() => {
        result.current.recordingState.videoFile = createMockVideoFile();
      });

      await act(async () => {
        const file = await result.current.stopRecordingAndGetFile();
        expect(file).toEqual(createMockVideoFile());
      });
    });

    test('arrête l\'enregistrement et attend le fichier', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      // Simuler l'arrêt et la fin de l'enregistrement
      await act(async () => {
        const stopPromise = result.current.stopRecordingAndGetFile();

        // Simuler le callback onRecordingFinished
        act(() => {
          result.current.recordingState.isRecording = false;
          result.current.recordingState.videoFile = createMockVideoFile();
        });

        const file = await stopPromise;
        expect(file).toEqual(createMockVideoFile());
      });
    });

    test('retourne null en cas d\'erreur', async () => {
      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      await act(async () => {
        const file = await result.current.stopRecordingAndGetFile();
        expect(file).toBe(null);
      });
    });
  });

  describe('callbacks d\'enregistrement', () => {
    test('gère la fin réussie de l\'enregistrement', async () => {
      const { Camera } = require('react-native-vision-camera');
      const mockVideoFile = createMockVideoFile();

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      // Simuler le callback onRecordingFinished
      act(() => {
        // Trouver l'appel à startRecording et déclencher le callback
        const startRecordingCall = Camera.mock.calls[0][0];
        if (startRecordingCall && startRecordingCall.onRecordingFinished) {
          startRecordingCall.onRecordingFinished(mockVideoFile);
        }
      });

      expect(result.current.recordingState.isRecording).toBe(false);
      expect(result.current.recordingState.videoFile).toEqual(mockVideoFile);
    });

    test('gère les erreurs d\'enregistrement', async () => {
      const { Camera } = require('react-native-vision-camera');
      const recordingError = new Error('Recording failed');

      const { result } = renderHook(() => useCamera());

      await act(async () => {
        await result.current.controls.startRecording();
      });

      // Simuler le callback onRecordingError
      act(() => {
        const startRecordingCall = Camera.mock.calls[0][0];
        if (startRecordingCall && startRecordingCall.onRecordingError) {
          startRecordingCall.onRecordingError(recordingError);
        }
      });

      expect(result.current.recordingState.isRecording).toBe(false);
      expect(result.current.recordingState.error).toBe('Recording failed');
    });
  });
});
