// Tests unitaires pour MemoryManager
import { MemoryManager, MemoryEntry, MemoryCollection } from '../../memory/MemoryManager';
import { embeddingService } from '../../embedding/EmbeddingService';

// Mocks
jest.mock('../../embedding/EmbeddingService', () => ({
  embeddingService: {
    embedText: jest.fn(),
    cosineSimilarity: jest.fn(),
  },
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

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('../../../components/chat/message-handler/context/memory/utils', () => ({
  identifyPreferenceSubject: jest.fn(),
}));

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  const userId = 'test-user-123';
  const mockApp = {};

  beforeEach(() => {
    jest.clearAllMocks();
    MemoryManager['instance'] = null; // Reset singleton
    memoryManager = MemoryManager.getInstance();

    // Mock embedding service
    (embeddingService.embedText as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (embeddingService.cosineSimilarity as jest.Mock).mockReturnValue(0.8);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MemoryManager.getInstance();
      const instance2 = MemoryManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateMemoryId', () => {
    it('should generate unique IDs', () => {
      const id1 = (memoryManager as any).generateMemoryId();
      const id2 = (memoryManager as any).generateMemoryId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^mem_\d+_[a-z0-9]+$/);
    });
  });

  describe('loadUserMemory', () => {
    it('should load memory from cache if available', async () => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: [],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };

      memoryManager['memoryCache'].set(userId, mockCollection);

      const result = await memoryManager.loadUserMemory(userId);
      expect(result).toBe(mockCollection);
    });

    it('should load memory from Firestore when not cached', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          title: 'Test Entry',
          content: 'Test Content',
          category: 'preference' as const,
          importance: 'high' as const,
          timestamp: '2024-01-01T00:00:00Z',
          userId,
          citationRequired: true,
          tags: ['test'],
          relatedMemories: [],
          subject: 'test-subject',
          embedding: [0.1, 0.2, 0.3],
        },
      ];

      const mockSnapshot = {
        docs: mockEntries.map(entry => ({
          id: entry.id,
          data: () => ({
            title: entry.title,
            content: entry.content,
            category: entry.category,
            importance: entry.importance,
            timestamp: entry.timestamp,
            userId: entry.userId,
            citationRequired: entry.citationRequired,
            tags: entry.tags,
            relatedMemories: entry.relatedMemories,
            subject: entry.subject,
            embedding: entry.embedding,
          }),
        })),
      };

      const mockSummarySnapshot = {
        exists: true,
        data: () => ({
          lastUpdated: '2024-01-01T00:00:00Z',
          version: '1.1.0',
        }),
      };

      const { getDocs, getDoc } = require('@react-native-firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);
      (getDoc as jest.Mock).mockResolvedValue(mockSummarySnapshot);

      const result = await memoryManager.loadUserMemory(userId);

      expect(result.userId).toBe(userId);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe('Test Entry');
    });

    it('should handle Firestore errors gracefully', async () => {
      const { getDocs } = require('@react-native-firebase/firestore');
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(memoryManager.loadUserMemory(userId)).rejects.toThrow('Échec du chargement de la mémoire');
    });
  });

  describe('addMemory', () => {
    const mockMemory: Omit<MemoryEntry, 'id' | 'timestamp' | 'userId'> = {
      title: 'New Memory',
      content: 'Memory content',
      category: 'preference',
      importance: 'medium',
      citationRequired: true,
      tags: ['test'],
      relatedMemories: [],
    };

    beforeEach(() => {
      // Mock loadUserMemory
      const mockCollection: MemoryCollection = {
        userId,
        entries: [],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);

      // Mock Firestore
      const { setDoc } = require('@react-native-firebase/firestore');
      (setDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should add memory successfully', async () => {
      const result = await memoryManager.addMemory(userId, mockMemory);

      expect(result).toMatch(/^mem_\d+_[a-z0-9]+$/);
      expect(embeddingService.embedText).toHaveBeenCalledWith(
        expect.stringContaining('New Memory')
      );
    });

    it('should reject content that is too long', async () => {
      const longContent = 'a'.repeat(501);
      const longMemory = { ...mockMemory, content: longContent };

      await expect(memoryManager.addMemory(userId, longMemory)).rejects.toThrow(
        'Contenu trop long (max 500 caractères)'
      );
    });

    it('should reject sensitive information', async () => {
      const sensitiveMemory = { ...mockMemory, content: 'My password is secret123' };

      await expect(memoryManager.addMemory(userId, sensitiveMemory)).rejects.toThrow(
        'Informations sensibles non autorisées en mémoire'
      );
    });

    it('should detect and resolve conflicts', async () => {
      const existingEntry: MemoryEntry = {
        id: 'existing1',
        title: 'Existing Preference',
        content: 'Existing content',
        category: 'preference',
        importance: 'medium',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
        tags: ['preference'],
        subject: 'script_length',
      };

      const mockCollection: MemoryCollection = {
        userId,
        entries: [existingEntry],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);

      // Mock identifyPreferenceSubject to return same subject
      const { identifyPreferenceSubject } = require('../../../components/chat/message-handler/context/memory/utils');
      (identifyPreferenceSubject as jest.Mock).mockReturnValue('script_length');

      const result = await memoryManager.addMemory(userId, {
        ...mockMemory,
        category: 'preference',
      });

      expect(result).toBeDefined();
      // Should have resolved the conflict by merging
    });
  });

  describe('updateMemory', () => {
    const existingMemory: MemoryEntry = {
      id: 'memory1',
      title: 'Old Title',
      content: 'Old content',
      category: 'preference',
      importance: 'low',
      timestamp: '2024-01-01T00:00:00Z',
      userId,
      citationRequired: false,
      tags: ['old'],
    };

    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: [existingMemory],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);

      const { updateDoc } = require('@react-native-firebase/firestore');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update memory successfully', async () => {
      const updates = {
        title: 'New Title',
        content: 'New content',
        importance: 'high' as const,
      };

      await expect(memoryManager.updateMemory(userId, 'memory1', updates)).resolves.toBeUndefined();

      expect(embeddingService.embedText).toHaveBeenCalledWith(
        'New Title\nNew content'
      );
    });

    it('should throw error for non-existent memory', async () => {
      await expect(memoryManager.updateMemory(userId, 'nonexistent', { title: 'New' })).rejects.toThrow(
        'Mémoire nonexistent non trouvée'
      );
    });

    it('should reject updates with content too long', async () => {
      const longContent = 'a'.repeat(501);

      await expect(memoryManager.updateMemory(userId, 'memory1', { content: longContent })).rejects.toThrow(
        'Contenu trop long (max 500 caractères)'
      );
    });
  });

  describe('deleteMemory', () => {
    const existingMemory: MemoryEntry = {
      id: 'memory1',
      title: 'Test Memory',
      content: 'Test content',
      category: 'preference',
      importance: 'medium',
      timestamp: '2024-01-01T00:00:00Z',
      userId,
      citationRequired: false,
    };

    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: [existingMemory],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);

      const { deleteDoc } = require('@react-native-firebase/firestore');
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should delete memory successfully', async () => {
      await expect(memoryManager.deleteMemory(userId, 'memory1')).resolves.toBeUndefined();

      const cachedCollection = memoryManager['memoryCache'].get(userId);
      expect(cachedCollection?.entries).toHaveLength(0);
    });

    it('should throw error for non-existent memory', async () => {
      await expect(memoryManager.deleteMemory(userId, 'nonexistent')).rejects.toThrow(
        'Mémoire nonexistent non trouvée'
      );
    });
  });

  describe('searchMemories', () => {
    const memories: MemoryEntry[] = [
      {
        id: 'memory1',
        title: 'Script Length Preference',
        content: 'I prefer short scripts',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
        tags: ['script', 'length'],
      },
      {
        id: 'memory2',
        title: 'General Context',
        content: 'Working on video project',
        category: 'context',
        importance: 'medium',
        timestamp: '2024-01-02T00:00:00Z',
        userId,
        citationRequired: false,
        tags: ['work', 'video'],
      },
    ];

    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: memories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);
    });

    it('should search by category', async () => {
      const results = await memoryManager.searchMemories(userId, {
        category: 'preference',
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });

    it('should search by tags', async () => {
      const results = await memoryManager.searchMemories(userId, {
        tags: ['script'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });

    it('should search by content keywords', async () => {
      const results = await memoryManager.searchMemories(userId, {
        contentKeywords: ['video'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory2');
    });

    it('should search by importance', async () => {
      const results = await memoryManager.searchMemories(userId, {
        importance: 'high',
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });
  });

  describe('semanticSearch', () => {
    const memories: MemoryEntry[] = [
      {
        id: 'memory1',
        title: 'Script Preference',
        content: 'I like detailed scripts',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
        embedding: [0.1, 0.2, 0.3],
      },
    ];

    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: memories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);
    });

    it('should perform semantic search successfully', async () => {
      const results = await memoryManager.semanticSearch(
        userId,
        'script preferences',
        { topK: 5, minScore: 0.5 }
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
      expect(embeddingService.embedText).toHaveBeenCalledWith('script preferences');
      expect(embeddingService.cosineSimilarity).toHaveBeenCalled();
    });

    it('should fallback to keyword search when embedding fails', async () => {
      (embeddingService.embedText as jest.Mock).mockResolvedValue(null);

      const results = await memoryManager.semanticSearch(userId, 'script');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });
  });

  describe('clearUserMemory', () => {
    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: [{ id: 'memory1', title: 'Test', content: 'Test', category: 'preference', importance: 'medium', timestamp: '2024-01-01T00:00:00Z', userId, citationRequired: false }],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);

      const { getDocs, setDoc } = require('@react-native-firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
      (setDoc as jest.Mock).mockResolvedValue(undefined);
    });

    it('should clear all user memory', async () => {
      await expect(memoryManager.clearUserMemory(userId)).resolves.toBeUndefined();

      const cachedCollection = memoryManager['memoryCache'].get(userId);
      expect(cachedCollection).toBeUndefined();
    });
  });

  describe('getMemoryStats', () => {
    const memories: MemoryEntry[] = [
      {
        id: 'memory1',
        title: 'Preference 1',
        content: 'Content 1',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
      },
      {
        id: 'memory2',
        title: 'Context 1',
        content: 'Content 2',
        category: 'context',
        importance: 'medium',
        timestamp: '2024-01-02T00:00:00Z',
        userId,
        citationRequired: false,
      },
    ];

    beforeEach(() => {
      const mockCollection: MemoryCollection = {
        userId,
        entries: memories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };
      memoryManager['memoryCache'].set(userId, mockCollection);
    });

    it('should return correct memory statistics', async () => {
      const stats = await memoryManager.getMemoryStats(userId);

      expect(stats.totalEntries).toBe(2);
      expect(stats.byCategory).toEqual({
        preference: 1,
        context: 1,
      });
      expect(stats.byImportance).toEqual({
        high: 1,
        medium: 1,
      });
      expect(stats.lastUpdated).toBe('2024-01-01T00:00:00Z');
    });
  });
});
