/**
 * Mocks pour les tests d'enregistrement vidéo
 * Ce fichier centralise tous les mocks nécessaires pour les tests
 */

import { jest } from '@jest/globals';

// Mock pour react-native-vision-camera
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

// Mock pour expo-camera
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

// Mock pour react-native-fs
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
  pathForBundle: jest.fn(),
  pathForGroup: jest.fn(),
  getFSInfo: jest.fn(),
  getAllExternalFilesDirs: jest.fn(),
  readDir: jest.fn(),
  readDirAssets: jest.fn(),
  copyAssetsVideoIOS: jest.fn(),
  copyAssetsFileIOS: jest.fn(),
  setReadable: jest.fn(),
  MainBundlePath: jest.fn(),
  CachesDirectoryPath: jest.fn(),
  DocumentDirectoryPath: jest.fn(),
  ExternalDirectoryPath: jest.fn(),
  ExternalStorageDirectoryPath: jest.fn(),
  TemporaryDirectoryPath: jest.fn(),
  LibraryDirectoryPath: jest.fn(),
  PicturesDirectoryPath: jest.fn(),
}));

// Mock pour CameraRoll (React Native) - Nouvelle API
jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    saveToCameraRoll: jest.fn(),
    getPhotos: jest.fn(),
    getAlbums: jest.fn(),
    createAlbum: jest.fn(),
  },
}));

// Mock pour les permissions React Native
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

// Mock pour les services de logging
jest.mock('@/utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock pour les services de stockage
jest.mock('@/services/firebase/hybridStorageService', () => ({
  hybridStorageService: {
    initializeLocalStorage: jest.fn(),
    saveRecording: jest.fn(),
  },
  VIDEO_DIR: '/test/video/',
}));

// Mock pour les services de sauvegarde automatique
jest.mock('@/services/autoSave', () => ({
  RecordingBackupManager: {
    saveRecording: jest.fn(),
  },
}));

// Mock pour les services de partage de fichiers (version React Native)
jest.mock('@/services/social-share/utils/fileManager', () => ({
  FileManager: {
    saveToGallery: jest.fn().mockImplementation(async (uri) => {
      const CameraRoll = require('@react-native-camera-roll/camera-roll');
      await CameraRoll.CameraRoll.saveToCameraRoll(uri, 'video');
      return true;
    }),
    requestCameraAndMicrophonePermissions: jest.fn().mockResolvedValue({
      allGranted: true,
      camera: true,
      microphone: true,
      storage: true,
    }),
  },
}));

// Mock pour les utilitaires de path
jest.mock('@/utils/pathNormalizer', () => ({
  toFileUri: jest.fn(),
}));

// Mock pour les contextes React
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock pour les hooks de navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock pour Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

// Types mock pour les tests
export interface MockVideoFile {
  path: string;
  duration: number;
}

export interface MockRecording {
  id: string;
  videoUri: string;
  uri: string;
  duration: number;
  scriptId?: string;
  scriptTitle?: string;
  createdAt: string;
  quality: 'low' | 'medium' | 'high';
}

// Utilitaires pour les tests
export const createMockVideoFile = (path: string = '/test/video.mp4', duration: number = 10): MockVideoFile => ({
  path,
  duration,
});

export const createMockRecording = (id: string = 'test-recording'): MockRecording => ({
  id,
  videoUri: `file://${id}.mp4`,
  uri: `file://${id}.mp4`,
  duration: 10,
  scriptId: 'test-script',
  scriptTitle: 'Test Script',
  createdAt: new Date().toISOString(),
  quality: 'high',
});

// Setup des mocks par défaut
export const setupDefaultMocks = () => {
  const { useCameraDevice, useCameraPermission, useMicrophonePermission } = require('react-native-vision-camera');
  const { useAuth } = require('@/contexts/AuthContext');
  const { FileManager } = require('@/services/social-share/utils/fileManager');
  const RNFS = require('react-native-fs');
  const { toFileUri } = require('@/utils/pathNormalizer');
  const { RecordingBackupManager } = require('@/services/autoSave');
  const { hybridStorageService } = require('@/services/firebase/hybridStorageService');

  // Configuration par défaut
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
  });

  FileManager.saveToGallery.mockResolvedValue(true);

  RNFS.exists.mockResolvedValue(true);
  RNFS.stat.mockResolvedValue({
    size: 1024 * 1024, // 1MB
    isFile: () => true,
    path: '/test/video.mp4',
  });

  toFileUri.mockImplementation((path: string) => `file://${path}`);

  RecordingBackupManager.saveRecording.mockResolvedValue(undefined);

  hybridStorageService.initializeLocalStorage.mockResolvedValue(undefined);
  hybridStorageService.saveRecording.mockResolvedValue('test-recording-id');
};
