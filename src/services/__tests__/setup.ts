// Setup global pour les tests Jest
import 'jest-environment-jsdom';

// Mocks globaux
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock React Native AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  runTransaction: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock embedding service
jest.mock('../../embedding/EmbeddingService', () => ({
  embeddingService: {
    embedText: jest.fn(),
    cosineSimilarity: jest.fn(),
    getDimension: jest.fn(() => 384),
  },
}));

// Mock memory config
jest.mock('../../config/memoryConfig', () => ({
  MEMORY_CITATIONS_ENABLED: true,
  isMemoryCitationsEnabled: jest.fn().mockResolvedValue(true),
}));

// Mock API Key Manager
jest.mock('../../ai/ApiKeyManager', () => ({
  ApiKeyManager: {
    getOpenAIKey: jest.fn(),
    getGeminiKey: jest.fn(),
    getMistralKey: jest.fn(),
    getClaudeKey: jest.fn(),
    getCohereKey: jest.fn(),
    getPerplexityKey: jest.fn(),
    getTogetherKey: jest.fn(),
    getGroqKey: jest.fn(),
    getFireworksKey: jest.fn(),
  },
}));

// Mock AI Config
jest.mock('../../config/aiConfig', () => ({
  getEnabledProviders: jest.fn(),
}));

// Mock Firebase Functions
jest.mock('../../config/firebase', () => ({
  functions: {
    httpsCallable: jest.fn(),
  },
}));

// Mock preference subject identification
jest.mock('../../components/chat/message-handler/context/memory/utils', () => ({
  identifyPreferenceSubject: jest.fn(),
}));

// Configuration Jest
beforeEach(() => {
  jest.clearAllMocks();

  // Reset fetch mock
  mockFetch.mockReset();

  // Reset AsyncStorage mock
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  (AsyncStorage.removeItem as jest.Mock).mockReset();

  // Reset Firebase mocks
  const firestore = require('@react-native-firebase/firestore');
  Object.values(firestore).forEach(mock => {
    if (typeof mock === 'function') {
      (mock as jest.Mock).mockReset();
    }
  });
});

afterEach(() => {
  jest.clearAllTimers();
});

// Exports pour les tests
export { mockFetch };
