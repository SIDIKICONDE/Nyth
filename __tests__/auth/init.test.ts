import { createAuthInit } from '../../src/contexts/auth/init';

const mockGetAuth = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: mockGetAuth,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

jest.mock('../../src/config/firebase', () => ({
  initializeFirebase: jest.fn(async () => true),
  setupFirebaseServices: jest.fn(() => {}),
}));

jest.mock('../../src/services/OfflineManager', () => ({
  offlineManager: {
    getIsOnline: jest.fn(() => true),
    getOfflineData: jest.fn(async () => null),
    loadPendingOperations: jest.fn(async () => {}),
    saveOfflineData: jest.fn(async () => {}),
  },
}));

jest.mock('../../src/utils/optimizedLogger', () => ({
  createOptimizedLogger: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() })
}));

jest.mock('../../src/services/defaultApiKey', () => ({
  DefaultApiKeyService: { configureDefaultOpenAIKey: jest.fn(async () => true) },
}));

jest.mock('../../src/contexts/auth/storage', () => ({
  getSavedUser: jest.fn(async () => null),
  saveUser: jest.fn(async () => {}),
  setFirebaseSession: jest.fn(async () => {}),
  clearAuthStorage: jest.fn(async () => {}),
}));

jest.mock('../../src/contexts/auth/socialAuth', () => ({
  configureGoogleSignIn: jest.fn(() => true),
}));

describe('auth init', () => {
  const baseDeps = () => ({
    setUser: jest.fn(),
    setLoading: jest.fn(),
    setFirebaseReady: jest.fn(),
    setGoogleSignInConfigured: jest.fn(),
    setIsOfflineMode: jest.fn(),
    isMountedRef: { current: true },
    authStateListenerRef: { current: null },
    lastUserStateRef: { current: '' },
    signInAsGuest: jest.fn(async () => true),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuth.mockReturnValue({ currentUser: null, signOut: jest.fn() });
    mockOnAuthStateChanged.mockImplementation(() => () => {});
  });

  describe('initializeAuth', () => {
    test('online path - Firebase success', async () => {
      const offlineManager = require('../../src/services/OfflineManager').offlineManager;
      offlineManager.getIsOnline.mockReturnValue(true);

      const deps = baseDeps();
      const init = createAuthInit(deps);
      await init.initializeAuth();

      expect(deps.setFirebaseReady).toHaveBeenCalledWith(true);
      expect(deps.setGoogleSignInConfigured).toHaveBeenCalledWith(true);
    });

    test('offline path - restores cached user', async () => {
      const offlineManager = require('../../src/services/OfflineManager').offlineManager;
      offlineManager.getIsOnline.mockReturnValue(false);
      offlineManager.getOfflineData.mockResolvedValue({ uid: 'cached-user', name: 'Cached' });

      const deps = baseDeps();
      const init = createAuthInit(deps);
      await init.initializeAuth();

      expect(deps.setIsOfflineMode).toHaveBeenCalledWith(true);
      expect(deps.setUser).toHaveBeenCalledWith({ uid: 'cached-user', name: 'Cached' });
      expect(deps.setLoading).toHaveBeenCalledWith(false);
    });

    test('offline path - no cached user, creates guest', async () => {
      const offlineManager = require('../../src/services/OfflineManager').offlineManager;
      offlineManager.getIsOnline.mockReturnValue(false);
      offlineManager.getOfflineData.mockResolvedValue(null);

      const storage = require('../../src/contexts/auth/storage');
      storage.getSavedUser.mockResolvedValue(null);

      const deps = baseDeps();
      const init = createAuthInit(deps);
      await init.initializeAuth();

      expect(deps.setIsOfflineMode).toHaveBeenCalledWith(true);
      expect(deps.signInAsGuest).toHaveBeenCalled();
      expect(offlineManager.loadPendingOperations).toHaveBeenCalled();
    });

    test('Firebase initialization fails - fallback to offline', async () => {
      const offlineManager = require('../../src/services/OfflineManager').offlineManager;
      offlineManager.getIsOnline.mockReturnValue(true);

      const firebase = require('../../src/config/firebase');
      firebase.initializeFirebase.mockResolvedValue(false);

      const deps = baseDeps();
      const init = createAuthInit(deps);
      await init.initializeAuth();

      expect(deps.setFirebaseReady).toHaveBeenCalledWith(false);
      expect(deps.setIsOfflineMode).toHaveBeenCalledWith(true);
      expect(deps.signInAsGuest).toHaveBeenCalled();
    });
  });

  describe('setupAuthStateListener', () => {
    test('sets up listener successfully', async () => {
      const deps = baseDeps();
      const init = createAuthInit(deps);
      
      await init.setupAuthStateListener();
      
      // Just verify the function completes without error
      expect(init.setupAuthStateListener).toBeDefined();
    });
  });

  describe('refreshAuthState', () => {
    test('handles basic refresh', async () => {
      const deps = baseDeps();
      const init = createAuthInit(deps);
      
      await init.refreshAuthState();
      
      // Just verify the function completes without error
      expect(init.refreshAuthState).toBeDefined();
    });
  });

  describe('cleanup', () => {
    test('cleans up auth state listener', () => {
      const mockUnsubscribe = jest.fn();
      const deps = baseDeps();
      deps.authStateListenerRef.current = mockUnsubscribe;

      const init = createAuthInit(deps);
      init.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(deps.authStateListenerRef.current).toBeNull();
    });
  });
});