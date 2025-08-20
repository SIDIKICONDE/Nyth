/**
 * Setup Jest simplifié pour les tests d'enregistrement vidéo
 * Version sans dépendances externes complexes
 */

import { jest } from '@jest/globals';

// Configuration globale de Jest
global.jest = jest;

// Mock de console pour réduire le bruit pendant les tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Mock de setTimeout et setInterval pour les tests avec timers
jest.setTimeout(10000);

// Configuration des mocks pour react-native
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
    Version: 13,
    isTesting: true,
    select: jest.fn(obj => obj.ios || obj.default),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock de react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    takePhoto: jest.fn(),
  })),
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(),
  useMicrophonePermission: jest.fn(),
}));

// Mock d'expo-camera
jest.mock('expo-camera', () => ({
  Camera: jest.fn(),
  CameraType: {
    back: 'back',
    front: 'front',
  },
  FlashMode: {
    off: 'off',
    on: 'on',
    auto: 'auto',
  },
}));

// Mock de react-native-fs
jest.mock('react-native-fs', () => ({
  exists: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  downloadFile: jest.fn(),
  uploadFiles: jest.fn(),
  stopDownload: jest.fn(),
  stopUpload: jest.fn(),
}));

// Mock des services de logging
jest.mock('@/utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock des services de stockage
jest.mock('@/services/firebase/hybridStorageService', () => ({
  hybridStorageService: {
    initializeLocalStorage: jest.fn(),
    saveRecording: jest.fn(),
  },
  VIDEO_DIR: '/test/video/',
}));

// Mock des services de sauvegarde automatique
jest.mock('@/services/autoSave', () => ({
  RecordingBackupManager: {
    saveRecording: jest.fn(),
  },
}));

// Mock des services de partage de fichiers
jest.mock('@/services/social-share/utils/fileManager', () => ({
  FileManager: {
    saveToGallery: jest.fn().mockResolvedValue(true),
    requestCameraAndMicrophonePermissions: jest.fn().mockResolvedValue({
      allGranted: true,
      camera: true,
      microphone: true,
      storage: true,
    }),
  },
}));

// Mock des utilitaires de path
jest.mock('@/utils/pathNormalizer', () => ({
  toFileUri: jest.fn(),
}));

// Mock des contextes React
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Configuration par défaut des mocks
const setupDefaultMocks = () => {
  const { useCameraDevice, useCameraPermission, useMicrophonePermission } = require('react-native-vision-camera');
  const { useAuth } = require('@/contexts/AuthContext');
  const { FileManager } = require('@/services/social-share/utils/fileManager');
  const RNFS = require('react-native-fs');
  const { toFileUri } = require('@/utils/pathNormalizer');
  const { RecordingBackupManager } = require('@/services/autoSave');
  const { hybridStorageService } = require('@/services/firebase/hybridStorageService');

  useCameraDevice.mockReturnValue({
    id: 'test-device',
    devices: ['wide-angle-camera'],
    hasFlash: true,
    hasTorch: true,
    isMultiCam: false,
    maxZoom: 5,
    minZoom: 0.5,
    neutralZoom: 1,
    position: 'back',
    supportsFocus: true,
    supportsLowLightBoost: true,
    supportsRawCapture: false,
  });

  useCameraPermission.mockReturnValue({
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  });

  useMicrophonePermission.mockReturnValue({
    hasPermission: true,
    requestPermission: jest.fn().mockResolvedValue(true),
  });

  useAuth.mockReturnValue({
    user: { uid: 'test-user' },
  });

  FileManager.requestCameraAndMicrophonePermissions.mockResolvedValue({
    allGranted: true,
    camera: true,
    microphone: true,
    storage: true,
  });

  FileManager.saveToGallery.mockResolvedValue(true);

  RNFS.exists.mockResolvedValue(true);
  RNFS.stat.mockResolvedValue({
    size: 1024 * 1024,
    isFile: () => true,
    path: '/test/video.mp4',
  });

  toFileUri.mockImplementation((path) => `file://${path}`);

  RecordingBackupManager.saveRecording.mockResolvedValue(undefined);

  hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
  hybridStorageService.saveRecording.mockResolvedValue('test-recording-id');
};

// Exporter la fonction de setup pour l'utiliser dans les tests
global.setupDefaultMocks = setupDefaultMocks;

// Setup automatique des mocks par défaut
setupDefaultMocks();
