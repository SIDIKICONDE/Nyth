import { MemoryManager, MemoryEntry, MemoryCollection, MemoryConflict } from '../MemoryManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from '@react-native-firebase/firestore';
import { embeddingService } from '../../embedding/EmbeddingService';
import { CryptoService } from '../../cryptoService';

// Mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-firebase/firestore');
jest.mock('@react-native-firebase/app');
jest.mock('../../embedding/EmbeddingService');
jest.mock('../../cryptoService');
jest.mock('../../../utils/optimizedLogger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  const mockUserId = 'test-user-123';
  const mockTimestamp = '2024-01-15T10:00:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
    memoryManager = MemoryManager.getInstance();
    
    // Mock Date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockTimestamp));
    
    // Mock Firestore
    const mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    
    // Mock CryptoService
    (CryptoService.encrypt as jest.Mock).mockImplementation((data) => Promise.resolve(`encrypted_${data}`));
    (CryptoService.decrypt as jest.Mock).mockImplementation((data) => Promise.resolve(data.replace('encrypted_', '')));
    
    // Mock EmbeddingService
    (embeddingService.generateEmbedding as jest.Mock).mockResolvedValue(new Array(384).fill(0.1));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MemoryManager.getInstance();
      const instance2 = MemoryManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Memory Creation', () => {
    it('should create a new memory entry with all required fields', async () => {
      const newMemory = {
        title: 'Préférence de longueur de script',
        content: 'L\'utilisateur préfère des scripts de 2-3 minutes',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      const result = await memoryManager.createMemory(mockUserId, newMemory);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^mem_[a-z0-9]{8}$/),
        userId: mockUserId,
        title: newMemory.title,
        content: newMemory.content,
        category: newMemory.category,
        importance: newMemory.importance,
        timestamp: mockTimestamp,
        citationRequired: true,
      });
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(501);
      const newMemory = {
        title: 'Test',
        content: longContent,
        category: 'fact' as const,
        importance: 'low' as const,
      };

      await expect(
        memoryManager.createMemory(mockUserId, newMemory)
      ).rejects.toThrow('Le contenu dépasse la limite de 500 caractères');
    });

    it('should detect and set subject automatically', async () => {
      const newMemory = {
        title: 'Longueur de script préférée',
        content: 'Scripts de 3 minutes maximum',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      const result = await memoryManager.createMemory(mockUserId, newMemory);
      expect(result.subject).toBe('script_length');
    });

    it('should generate embeddings for semantic search', async () => {
      const newMemory = {
        title: 'Test embedding',
        content: 'Contenu pour test embedding',
        category: 'fact' as const,
        importance: 'medium' as const,
      };

      const result = await memoryManager.createMemory(mockUserId, newMemory);
      
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('Test embedding')
      );
      expect(result.embedding).toHaveLength(384);
    });

    it('should handle tags properly', async () => {
      const newMemory = {
        title: 'Test avec tags',
        content: 'Contenu avec tags',
        category: 'context' as const,
        importance: 'low' as const,
        tags: ['test', 'memory', 'system'],
      };

      const result = await memoryManager.createMemory(mockUserId, newMemory);
      expect(result.tags).toEqual(['test', 'memory', 'system']);
    });
  });

  describe('Memory Retrieval', () => {
    const mockMemories: MemoryEntry[] = [
      {
        id: 'mem_12345678',
        userId: mockUserId,
        title: 'Préférence 1',
        content: 'Content 1',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T10:00:00.000Z',
        citationRequired: true,
      },
      {
        id: 'mem_87654321',
        userId: mockUserId,
        title: 'Règle 1',
        content: 'Content 2',
        category: 'rule',
        importance: 'medium',
        timestamp: '2024-01-02T10:00:00.000Z',
        citationRequired: false,
      },
    ];

    beforeEach(() => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          entries: mockMemories,
          lastUpdated: mockTimestamp,
          version: '1.1.0',
        }),
      });
      
      (getFirestore as jest.Mock).mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: mockGet,
          }),
        }),
      });
    });

    it('should get all memories for a user', async () => {
      const memories = await memoryManager.getMemories(mockUserId);
      expect(memories).toHaveLength(2);
      expect(memories).toEqual(mockMemories);
    });

    it('should filter memories by category', async () => {
      const preferences = await memoryManager.getMemoriesByCategory(mockUserId, 'preference');
      expect(preferences).toHaveLength(1);
      expect(preferences[0].category).toBe('preference');
    });

    it('should filter memories by importance', async () => {
      const highImportance = await memoryManager.getMemoriesByImportance(mockUserId, 'high');
      expect(highImportance).toHaveLength(1);
      expect(highImportance[0].importance).toBe('high');
    });

    it('should get a specific memory by ID', async () => {
      const memory = await memoryManager.getMemoryById(mockUserId, 'mem_12345678');
      expect(memory).toEqual(mockMemories[0]);
    });

    it('should return null for non-existent memory', async () => {
      const memory = await memoryManager.getMemoryById(mockUserId, 'non_existent');
      expect(memory).toBeNull();
    });

    it('should use cache for repeated requests', async () => {
      await memoryManager.getMemories(mockUserId);
      await memoryManager.getMemories(mockUserId);
      
      const mockGet = (getFirestore as jest.Mock).mock.results[0].value
        .collection().doc().get;
      
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Update', () => {
    it('should update an existing memory', async () => {
      const updates = {
        content: 'Updated content',
        importance: 'low' as const,
      };

      const result = await memoryManager.updateMemory(mockUserId, 'mem_12345678', updates);
      
      expect(result).toBeTruthy();
      expect(result?.content).toBe('Updated content');
      expect(result?.importance).toBe('low');
    });

    it('should validate updated content length', async () => {
      const updates = {
        content: 'a'.repeat(501),
      };

      await expect(
        memoryManager.updateMemory(mockUserId, 'mem_12345678', updates)
      ).rejects.toThrow('Le contenu dépasse la limite de 500 caractères');
    });

    it('should update timestamp on modification', async () => {
      const updates = { title: 'New title' };
      const result = await memoryManager.updateMemory(mockUserId, 'mem_12345678', updates);
      
      expect(result?.timestamp).toBe(mockTimestamp);
    });
  });

  describe('Memory Deletion', () => {
    it('should delete a memory', async () => {
      const result = await memoryManager.deleteMemory(mockUserId, 'mem_12345678');
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent memory', async () => {
      const result = await memoryManager.deleteMemory(mockUserId, 'non_existent');
      expect(result).toBe(false);
    });

    it('should clear cache after deletion', async () => {
      await memoryManager.getMemories(mockUserId);
      await memoryManager.deleteMemory(mockUserId, 'mem_12345678');
      
      const memories = await memoryManager.getMemories(mockUserId);
      expect(memories).not.toContainEqual(
        expect.objectContaining({ id: 'mem_12345678' })
      );
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicting preferences', async () => {
      const existingMemory: MemoryEntry = {
        id: 'mem_existing',
        userId: mockUserId,
        title: 'Script length preference',
        content: 'User prefers 5-minute scripts',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T10:00:00.000Z',
        citationRequired: true,
        subject: 'script_length',
      };

      const newMemory = {
        title: 'New script length',
        content: 'User wants 2-minute scripts',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      const conflicts = await memoryManager.detectConflicts(mockUserId, newMemory);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toMatchObject({
        conflictingMemoryId: expect.any(String),
        reason: expect.stringContaining('script'),
        confidence: expect.any(Number),
        suggestedAction: expect.stringMatching(/update|delete|merge/),
      });
    });

    it('should not detect conflicts for different categories', async () => {
      const newMemory = {
        title: 'Script fact',
        content: 'Scripts can be various lengths',
        category: 'fact' as const,
        importance: 'low' as const,
      };

      const conflicts = await memoryManager.detectConflicts(mockUserId, newMemory);
      expect(conflicts).toHaveLength(0);
    });

    it('should handle semantic similarity for conflict detection', async () => {
      (embeddingService.cosineSimilarity as jest.Mock).mockReturnValue(0.95);

      const newMemory = {
        title: 'Similar content',
        content: 'Very similar to existing',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      const conflicts = await memoryManager.detectConflicts(mockUserId, newMemory);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Semantic Search', () => {
    it('should search memories by semantic similarity', async () => {
      const mockSearchResults = [
        { memory: { id: 'mem_1', title: 'Result 1' }, similarity: 0.9 },
        { memory: { id: 'mem_2', title: 'Result 2' }, similarity: 0.7 },
      ];

      (embeddingService.cosineSimilarity as jest.Mock)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.3);

      const results = await memoryManager.searchMemories(
        mockUserId,
        'search query',
        { limit: 2 }
      );

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
    });

    it('should filter search results by category', async () => {
      const results = await memoryManager.searchMemories(
        mockUserId,
        'search query',
        { category: 'preference' }
      );

      results.forEach(result => {
        expect(result.memory.category).toBe('preference');
      });
    });

    it('should respect similarity threshold', async () => {
      (embeddingService.cosineSimilarity as jest.Mock).mockReturnValue(0.3);

      const results = await memoryManager.searchMemories(
        mockUserId,
        'search query',
        { minSimilarity: 0.5 }
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('Memory Consolidation', () => {
    it('should consolidate related memories', async () => {
      const relatedMemories = [
        {
          id: 'mem_1',
          title: 'Script length 1',
          content: '2 minutes preferred',
          subject: 'script_length',
        },
        {
          id: 'mem_2',
          title: 'Script length 2',
          content: '3 minutes maximum',
          subject: 'script_length',
        },
      ];

      const consolidated = await memoryManager.consolidateMemories(
        mockUserId,
        'script_length'
      );

      expect(consolidated).toMatchObject({
        title: expect.stringContaining('script'),
        content: expect.stringContaining('consolidé'),
        category: 'preference',
        relatedMemories: expect.arrayContaining(['mem_1', 'mem_2']),
      });
    });

    it('should handle empty consolidation', async () => {
      const consolidated = await memoryManager.consolidateMemories(
        mockUserId,
        'non_existent_subject'
      );

      expect(consolidated).toBeNull();
    });
  });

  describe('Sensitive Data Filtering', () => {
    it('should filter sensitive information', async () => {
      const sensitiveMemory = {
        title: 'Personal info',
        content: 'My password is secret123 and SSN is 123-45-6789',
        category: 'context' as const,
        importance: 'high' as const,
      };

      const result = await memoryManager.createMemory(mockUserId, sensitiveMemory);
      
      expect(result.content).not.toContain('secret123');
      expect(result.content).not.toContain('123-45-6789');
    });

    it('should detect and flag financial information', async () => {
      const financialMemory = {
        title: 'Payment info',
        content: 'Credit card 4111-1111-1111-1111',
        category: 'context' as const,
        importance: 'high' as const,
      };

      await expect(
        memoryManager.createMemory(mockUserId, financialMemory)
      ).rejects.toThrow('Information sensible détectée');
    });
  });

  describe('Batch Operations', () => {
    it('should create multiple memories in batch', async () => {
      const memories = [
        {
          title: 'Memory 1',
          content: 'Content 1',
          category: 'fact' as const,
          importance: 'low' as const,
        },
        {
          title: 'Memory 2',
          content: 'Content 2',
          category: 'rule' as const,
          importance: 'medium' as const,
        },
      ];

      const results = await memoryManager.createMemoriesBatch(mockUserId, memories);
      
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Memory 1');
      expect(results[1].title).toBe('Memory 2');
    });

    it('should handle partial batch failures', async () => {
      const memories = [
        {
          title: 'Valid memory',
          content: 'Valid content',
          category: 'fact' as const,
          importance: 'low' as const,
        },
        {
          title: 'Invalid memory',
          content: 'a'.repeat(501), // Too long
          category: 'fact' as const,
          importance: 'low' as const,
        },
      ];

      const results = await memoryManager.createMemoriesBatch(mockUserId, memories);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Valid memory');
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle concurrent operations with queue', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        memoryManager.createMemory(mockUserId, {
          title: `Concurrent ${i}`,
          content: `Content ${i}`,
          category: 'fact',
          importance: 'low',
        })
      );

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.title).toBe(`Concurrent ${i}`);
      });
    });

    it('should respect cache TTL', async () => {
      jest.useRealTimers();
      const spy = jest.spyOn(memoryManager as any, 'loadMemoryCollection');
      
      await memoryManager.getMemories(mockUserId);
      await memoryManager.getMemories(mockUserId);
      
      expect(spy).toHaveBeenCalledTimes(1);
      
      // Simulate cache expiry
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
      
      await memoryManager.getMemories(mockUserId);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      (getFirestore as jest.Mock).mockImplementation(() => {
        throw new Error('Firestore connection failed');
      });

      const result = await memoryManager.getMemories(mockUserId);
      expect(result).toEqual([]);
    });

    it('should handle encryption errors', async () => {
      (CryptoService.encrypt as jest.Mock).mockRejectedValue(
        new Error('Encryption failed')
      );

      await expect(
        memoryManager.createMemory(mockUserId, {
          title: 'Test',
          content: 'Test',
          category: 'fact',
          importance: 'low',
        })
      ).rejects.toThrow('Encryption failed');
    });

    it('should handle invalid user ID', async () => {
      await expect(
        memoryManager.getMemories('')
      ).rejects.toThrow('User ID requis');
    });
  });
});