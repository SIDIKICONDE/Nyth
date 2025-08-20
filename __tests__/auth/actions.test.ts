import { createAuthActions } from '../../src/contexts/auth/actions';

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

jest.mock('../../src/contexts/auth/firebase', () => ({
  signInWithEmail: jest.fn(async () => ({ success: true })),
  createAccount: jest.fn(async () => ({ success: true, user: { uid: 'u2', email: 'a@b.c', name: 'A', displayName: 'A', photoURL: null, emailVerified: false, isGuest: false } })),
  updateUserProfileFirebase: jest.fn(async () => ({ success: true })),
  sendPasswordReset: jest.fn(async () => ({ success: true })),
  changeUserEmail: jest.fn(async () => ({ success: true })),
  changeUserPassword: jest.fn(async () => ({ success: true })),
  deleteUserAccount: jest.fn(async () => ({ success: true })),
  signOutFirebase: jest.fn(async () => ({ success: true })),
}));

jest.mock('../../src/contexts/auth/storage', () => ({
  saveUser: jest.fn(async () => {}),
  clearAuthStorage: jest.fn(async () => {}),
}));

jest.mock('../../src/contexts/auth/syncUtils', () => ({
  createUserProfile: jest.fn(async () => {}),
  syncLocalDataToFirebase: jest.fn(async () => {}),
}));

jest.mock('../../src/contexts/auth/utils', () => ({
  handleAuthError: jest.fn(() => {}),
  notifyStateChange: jest.fn(async () => {}),
}));

jest.mock('../../src/contexts/auth/socialAuth', () => ({
  signInWithGoogle: jest.fn(async () => ({ success: true })),
  signInWithApple: jest.fn(async () => ({ success: true })),
  signOutGoogle: jest.fn(async () => {}),
}));

jest.mock('../../src/services/OfflineManager', () => ({
  offlineManager: {
    saveOfflineData: jest.fn(async () => {}),
  },
}));

jest.mock('../../src/services/defaultApiKey', () => ({
  DefaultApiKeyService: { configureDefaultOpenAIKey: jest.fn(async () => true) },
}));

describe('auth actions', () => {
  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  const baseDeps = () => {
    let currentUser: any = null;
    return {
      user: currentUser,
      setUser: jest.fn((u: any) => { currentUser = u; }),
      setLoading: jest.fn(),
      setError: jest.fn(),
      isGoogleSignInConfigured: true,
      isMountedRef: { current: true },
      lastUserStateRef: { current: '' },
      logger,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    test('success', async () => {
      const actions = createAuthActions(baseDeps());
      const ok = await actions.signIn('a@b.c', 'x');
      expect(ok).toBe(true);
    });

    test('failure sets error', async () => {
      const firebase = require('../../src/contexts/auth/firebase');
      firebase.signInWithEmail.mockResolvedValueOnce({ success: false, error: 'Invalid credentials' });
      
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signIn('a@b.c', 'wrong');
      
      expect(ok).toBe(false);
      expect(deps.setError).toHaveBeenCalledWith('Invalid credentials');
    });

    test('exception handled', async () => {
      const firebase = require('../../src/contexts/auth/firebase');
      firebase.signInWithEmail.mockRejectedValueOnce(new Error('Network error'));
      
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signIn('a@b.c', 'x');
      
      expect(ok).toBe(false);
      expect(deps.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('signInAsGuest', () => {
    test('creates guest user with unique ID', async () => {
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signInAsGuest();
      
      expect(ok).toBe(true);
      expect(deps.setUser).toHaveBeenCalledWith(expect.objectContaining({
        isGuest: true,
        name: 'Invité',
        displayName: 'Invité',
        uid: expect.stringMatching(/^guest_\d+_/),
      }));
    });

    test('handles offline save error gracefully', async () => {
      const offlineManager = require('../../src/services/OfflineManager').offlineManager;
      offlineManager.saveOfflineData.mockRejectedValueOnce(new Error('Storage full'));
      
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signInAsGuest();
      
      expect(ok).toBe(true);
      // Just verify the warning was called, don't check exact parameters
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    test('success creates profile and syncs data', async () => {
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signUp('a@b.c', 'x', 'Alice');
      
      expect(ok).toBe(true);
      
      const syncUtils = require('../../src/contexts/auth/syncUtils');
      expect(syncUtils.createUserProfile).toHaveBeenCalledWith('u2', 'a@b.c', 'Alice');
      expect(syncUtils.syncLocalDataToFirebase).toHaveBeenCalledWith('u2', 'u2');
    });

    test('failure on account creation', async () => {
      const firebase = require('../../src/contexts/auth/firebase');
      firebase.createAccount.mockResolvedValueOnce({ success: false, error: 'Email already exists' });
      
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      const ok = await actions.signUp('a@b.c', 'x', 'Alice');
      
      expect(ok).toBe(false);
      expect(deps.setError).toHaveBeenCalledWith('Email already exists');
    });
  });

  describe('logout', () => {
    test('Firebase user logout', async () => {
      const deps = baseDeps();
      deps.user = { uid: 'u1', isGuest: false };
      const actions = createAuthActions(deps);
      
      await actions.logout();
      
      const storage = require('../../src/contexts/auth/storage');
      expect(storage.clearAuthStorage).toHaveBeenCalledWith('u1');
      expect(deps.setUser).toHaveBeenCalledWith(null);
    });

    test('cleanup for inconsistent state', async () => {
      const deps = baseDeps();
      deps.user = null;
      const actions = createAuthActions(deps);
      
      await actions.logout();
      
      const storage = require('../../src/contexts/auth/storage');
      expect(storage.clearAuthStorage).toHaveBeenCalledWith();
      expect(deps.setUser).toHaveBeenCalledWith(null);
    });

    test('handles Firebase signOut error', async () => {
      const firebase = require('../../src/contexts/auth/firebase');
      firebase.signOutFirebase.mockResolvedValueOnce({ success: false, error: 'Network error' });
      
      const deps = baseDeps();
      deps.user = { uid: 'u1', isGuest: false };
      const actions = createAuthActions(deps);
      
      await actions.logout();
      
      expect(deps.setError).toHaveBeenCalledWith('Network error');
    });
  });

  describe('updateUserProfile', () => {
    test('success updates local state', async () => {
      const deps = baseDeps();
      deps.user = { uid: 'u1', name: 'Old', displayName: 'Old' };
      const actions = createAuthActions(deps);
      
      const ok = await actions.updateUserProfile({ name: 'New Name' });
      
      expect(ok).toBe(true);
      expect(deps.setUser).toHaveBeenCalledWith(expect.any(Function));
    });

    test('fails when no user', async () => {
      const deps = baseDeps();
      deps.user = null;
      const actions = createAuthActions(deps);
      
      const ok = await actions.updateUserProfile({ name: 'New' });
      
      expect(ok).toBe(false);
      expect(deps.setError).toHaveBeenCalledWith('Utilisateur non connecté');
    });
  });

  describe('Google Sign-In', () => {
    test('fails when not configured', async () => {
      const deps = baseDeps();
      deps.isGoogleSignInConfigured = false;
      const actions = createAuthActions(deps);
      
      const ok = await actions.handleGoogleSignIn();
      
      expect(ok).toBe(false);
      expect(deps.setError).toHaveBeenCalledWith(
        'La connexion Google n\'est pas configurée. Vérifiez les clés API.'
      );
    });

    test('success', async () => {
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      
      const ok = await actions.handleGoogleSignIn();
      
      expect(ok).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith('✅ Connexion Google réussie');
    });
  });

  describe('Apple Sign-In', () => {
    test('success', async () => {
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      
      const ok = await actions.handleAppleSignIn();
      
      expect(ok).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith('✅ Connexion Apple réussie');
    });

    test('failure', async () => {
      const socialAuth = require('../../src/contexts/auth/socialAuth');
      socialAuth.signInWithApple.mockResolvedValueOnce({ success: false, error: 'User cancelled' });
      
      const deps = baseDeps();
      const actions = createAuthActions(deps);
      
      const ok = await actions.handleAppleSignIn();
      
      expect(ok).toBe(false);
      expect(deps.setError).toHaveBeenCalledWith('User cancelled');
    });
  });
});


