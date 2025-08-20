/**
 * Setup Jest pour les tests d'enregistrement vidéo
 * Configure les mocks globaux et l'environnement de test
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

// Configuration des mocks globaux
beforeEach(() => {
  // Nettoyer tous les mocks avant chaque test
  jest.clearAllMocks();
  jest.resetAllMocks();

  // Configuration des variables d'environnement de test
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = '1';

  // Mock de Date pour des résultats prévisibles
  const mockDate = new Date('2024-01-01T12:00:00Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  Date.now = jest.fn(() => mockDate.getTime());

  // Mock de Math.random pour des résultats prévisibles
  jest.spyOn(Math, 'random').mockReturnValue(0.5);

  // Mock de Performance.now pour des tests de performance
  jest.spyOn(performance, 'now').mockReturnValue(1000);
});

// Nettoyage après chaque test
afterEach(() => {
  // Restaurer les mocks de Date et Math
  jest.restoreAllMocks();

  // Nettoyer les timers
  jest.clearAllTimers();
  jest.runOnlyPendingTimers();
});

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
  Camera: jest.fn(),
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(),
  useMicrophonePermission: jest.fn(),
}));

// Mock d'expo-camera (remplacé par React Native)
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

// Mock de CameraRoll React Native - Nouvelle API
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveToCameraRoll: jest.fn(),
    getPhotos: jest.fn(),
    getAlbums: jest.fn(),
    createAlbum: jest.fn(),
  },
}));

// Mock des permissions React Native
jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  check: jest.fn(),
  PERMISSIONS: {
    IOS_PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    ANDROID_READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    ANDROID_WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
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

// Mock des services
jest.mock('@/utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('@/services/firebase/hybridStorageService', () => ({
  hybridStorageService: {
    initializeLocalStorage: jest.fn(),
    saveRecording: jest.fn(),
  },
  VIDEO_DIR: '/test/video/',
}));

jest.mock('@/services/autoSave', () => ({
  RecordingBackupManager: {
    saveRecording: jest.fn(),
  },
}));

jest.mock('@/services/social-share/utils/fileManager', () => ({
  FileManager: {
    saveToGallery: jest.fn(),
    requestCameraAndMicrophonePermissions: jest.fn(),
  },
}));

jest.mock('@/utils/pathNormalizer', () => ({
  toFileUri: jest.fn(),
}));

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

  // Configuration des mocks React Native
  const CameraRoll = require('@react-native-camera-roll/camera-roll');
  const Permissions = require('react-native-permissions');

  CameraRoll.CameraRoll.saveToCameraRoll.mockResolvedValue('file://saved/video.mp4');
  CameraRoll.CameraRoll.getPhotos.mockResolvedValue({ edges: [] });
  CameraRoll.CameraRoll.getAlbums.mockResolvedValue([]);
  CameraRoll.CameraRoll.createAlbum.mockResolvedValue('test-album');

  Permissions.request.mockResolvedValue('granted');
  Permissions.check.mockResolvedValue('granted');

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
