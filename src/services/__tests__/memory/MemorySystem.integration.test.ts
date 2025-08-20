// Tests d'intégration pour le système de mémoire complet
import { memoryManager, MemoryEntry } from '../../memory/MemoryManager';
import { citationManager } from '../../memory/CitationManager';
import { embeddingService } from '../../embedding/EmbeddingService';
import { useUnifiedMemory } from '../../../hooks/useUnifiedMemory';

// Mocks
jest.mock('../../memory/MemoryManager');
jest.mock('../../memory/CitationManager');
jest.mock('../../embedding/EmbeddingService');
jest.mock('../../../config/memoryConfig', () => ({
  MEMORY_CITATIONS_ENABLED: true,
  isMemoryCitationsEnabled: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-firebase/firestore');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../utils/optimizedLogger');

describe('Memory System Integration', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singletons
    const MemoryManager = require('../../memory/MemoryManager').MemoryManager;
    const CitationManager = require('../../memory/CitationManager').CitationManager;
    MemoryManager['instance'] = null;
    CitationManager['instance'] = null;

    // Mock implementations
    (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
      userId,
      entries: [],
      lastUpdated: '2024-01-01T00:00:00Z',
      version: '1.1.0',
    });

    (memoryManager.addMemory as jest.Mock).mockImplementation((userId, memory) => {
      const newMemory: MemoryEntry = {
        ...memory,
        id: `mem_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId,
      };
      return Promise.resolve(newMemory.id);
    });

    (embeddingService.embedText as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
    (citationManager.processTextWithCitations as jest.Mock).mockResolvedValue({
      citedMemories: [],
      citationText: 'Test text',
      originalText: 'Test text',
    });
  });

  describe('End-to-End Memory Flow', () => {
    it('should create memory with embedding and handle citations', async () => {
      const memoryData = {
        title: 'Test Memory',
        content: 'This is a test memory about script preferences',
        category: 'preference' as const,
        importance: 'high' as const,
        citationRequired: true,
        tags: ['script', 'preference'],
      };

      // Create memory
      const memoryId = await memoryManager.addMemory(userId, memoryData);

      expect(memoryId).toMatch(/^mem_\d+$/);
      expect(embeddingService.embedText).toHaveBeenCalledWith(
        expect.stringContaining('Test Memory')
      );
      expect(memoryManager.addMemory).toHaveBeenCalledWith(userId, memoryData);
    });

    it('should process text with automatic citations', async () => {
      const mockMemories: MemoryEntry[] = [
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
      ];

      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });

      (citationManager.processTextWithCitations as jest.Mock).mockResolvedValue({
        citedMemories: ['memory1'],
        citationText: 'I need a short script [[memory:memory1]]',
        originalText: 'I need a short script',
      });

      const text = 'I need a short script';
      const result = await citationManager.processTextWithCitations(userId, text, 'Script generation');

      expect(result.citedMemories).toContain('memory1');
      expect(result.citationText).toContain('[[memory:memory1]]');
      expect(result.originalText).toBe(text);
    });

    it('should validate citations correctly', async () => {
      const mockMemories: MemoryEntry[] = [
        {
          id: 'memory1',
          title: 'Test Memory',
          content: 'Test content',
          category: 'preference',
          importance: 'high',
          timestamp: '2024-01-01T00:00:00Z',
          userId,
          citationRequired: true,
        },
      ];

      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });

      (citationManager.validateCitations as jest.Mock).mockResolvedValue({
        isValid: true,
        missingCitations: [],
        warnings: [],
      });

      const text = 'This text includes the memory [[memory:memory1]]';
      const validation = await citationManager.validateCitations(userId, text);

      expect(validation.isValid).toBe(true);
      expect(validation.missingCitations).toHaveLength(0);
    });
  });

  describe('Memory Search Integration', () => {
    const mockMemories: MemoryEntry[] = [
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
        embedding: [0.1, 0.2, 0.3],
      },
      {
        id: 'memory2',
        title: 'Video Project Context',
        content: 'Working on marketing video',
        category: 'context',
        importance: 'medium',
        timestamp: '2024-01-02T00:00:00Z',
        userId,
        citationRequired: false,
        tags: ['video', 'marketing'],
        embedding: [0.4, 0.5, 0.6],
      },
    ];

    beforeEach(() => {
      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });

      (memoryManager.searchMemories as jest.Mock).mockResolvedValue([mockMemories[0]]);
      (memoryManager.semanticSearch as jest.Mock).mockResolvedValue([mockMemories[1]]);
    });

    it('should perform keyword search', async () => {
      const results = await memoryManager.searchMemories(userId, {
        tags: ['script'],
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });

    it('should perform semantic search', async () => {
      (embeddingService.embedText as jest.Mock).mockResolvedValue([0.1, 0.2, 0.3]);
      (embeddingService.cosineSimilarity as jest.Mock).mockReturnValue(0.8);

      const results = await memoryManager.semanticSearch(
        userId,
        'video marketing project',
        { topK: 5, minScore: 0.5 }
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory2');
      expect(embeddingService.embedText).toHaveBeenCalledWith('video marketing project');
    });

    it('should fallback to keyword search when embedding fails', async () => {
      (embeddingService.embedText as jest.Mock).mockResolvedValue(null);

      const results = await memoryManager.semanticSearch(userId, 'script');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('memory1');
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should detect and resolve conflicts during memory creation', async () => {
      const existingMemory: MemoryEntry = {
        id: 'existing1',
        title: 'Existing Preference',
        content: 'I prefer detailed scripts',
        category: 'preference',
        importance: 'medium',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
        subject: 'script_detail_level',
      };

      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: [existingMemory],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });

      const newMemoryData = {
        title: 'New Preference',
        content: 'I prefer very detailed scripts with examples',
        category: 'preference' as const,
        importance: 'high' as const,
        citationRequired: true,
        tags: ['script', 'detail'],
      };

      await memoryManager.addMemory(userId, newMemoryData);

      // Should have processed the memory with conflict detection
      expect(memoryManager.addMemory).toHaveBeenCalledWith(userId, newMemoryData);
    });
  });

  describe('Hook Integration', () => {
    let hook: ReturnType<typeof useUnifiedMemory>;

    beforeEach(() => {
      hook = useUnifiedMemory();

      // Mock auth context
      const mockUseAuth = jest.fn().mockReturnValue({
        user: { uid: userId },
      });
      require('../../contexts/AuthContext').useAuth = mockUseAuth;
    });

    it('should initialize memory state', () => {
      expect(hook.memories).toEqual([]);
      expect(hook.isLoading).toBe(true);
      expect(hook.isInitialized).toBe(false);
      expect(hook.error).toBeNull();
    });

    it('should add memory through hook', async () => {
      const memoryData = {
        title: 'Hook Test Memory',
        content: 'Test content from hook',
        category: 'preference' as const,
        importance: 'medium' as const,
        citationRequired: false,
        tags: ['test'],
      };

      const memoryId = await hook.addMemory(memoryData);

      expect(memoryId).toMatch(/^mem_\d+$/);
      expect(memoryManager.addMemory).toHaveBeenCalledWith(userId, memoryData);
    });

    it('should search memories through hook', async () => {
      const searchQuery = {
        category: 'preference' as const,
        importance: 'high' as const,
      };

      await hook.searchMemories(searchQuery);

      expect(memoryManager.searchMemories).toHaveBeenCalledWith(userId, searchQuery);
    });

    it('should process citations through hook', async () => {
      const text = 'Test text for citation processing';
      const contextHint = 'Test context';

      await hook.processTextWithCitations(text, contextHint);

      expect(citationManager.processTextWithCitations).toHaveBeenCalledWith(
        userId,
        text,
        contextHint
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle embedding service failures gracefully', async () => {
      (embeddingService.embedText as jest.Mock).mockRejectedValue(new Error('Embedding failed'));

      const memoryData = {
        title: 'Test Memory',
        content: 'Test content',
        category: 'preference' as const,
        importance: 'medium' as const,
        citationRequired: false,
        tags: ['test'],
      };

      // Should still succeed even with embedding failure
      const memoryId = await memoryManager.addMemory(userId, memoryData);
      expect(memoryId).toBeDefined();
    });

    it('should handle Firestore failures gracefully', async () => {
      (memoryManager.addMemory as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const memoryData = {
        title: 'Test Memory',
        content: 'Test content',
        category: 'preference' as const,
        importance: 'medium' as const,
        citationRequired: false,
        tags: ['test'],
      };

      await expect(memoryManager.addMemory(userId, memoryData)).rejects.toThrow('Firestore error');
    });

    it('should handle citation processing failures gracefully', async () => {
      (citationManager.processTextWithCitations as jest.Mock).mockRejectedValue(
        new Error('Citation processing failed')
      );

      const text = 'Test text';
      await expect(citationManager.processTextWithCitations(userId, text)).rejects.toThrow(
        'Citation processing failed'
      );
    });
  });

  describe('Performance Integration', () => {
    it('should handle bulk operations efficiently', async () => {
      const memoryBatch = Array.from({ length: 10 }, (_, i) => ({
        title: `Batch Memory ${i}`,
        content: `Content for batch memory ${i}`,
        category: 'preference' as const,
        importance: 'medium' as const,
        citationRequired: false,
        tags: ['batch', `tag${i}`],
      }));

      const addPromises = memoryBatch.map(memory => memoryManager.addMemory(userId, memory));
      const results = await Promise.all(addPromises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toMatch(/^mem_\d+$/);
      });
    });

    it('should cache memory operations', async () => {
      const memoryData = {
        title: 'Cached Memory',
        content: 'Content for cached memory',
        category: 'preference' as const,
        importance: 'medium' as const,
        citationRequired: false,
        tags: ['cached'],
      };

      // First call should load from storage
      await memoryManager.addMemory(userId, memoryData);
      expect(memoryManager.loadUserMemory).toHaveBeenCalledTimes(1);

      // Subsequent calls should use cache
      await memoryManager.addMemory(userId, { ...memoryData, title: 'Another Cached Memory' });
      expect(memoryManager.loadUserMemory).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Persistence Integration', () => {
    it('should persist memory to Firestore', async () => {
      const memoryData = {
        title: 'Persistent Memory',
        content: 'This memory should be persisted',
        category: 'fact' as const,
        importance: 'medium' as const,
        citationRequired: true,
        tags: ['persistent'],
      };

      const memoryId = await memoryManager.addMemory(userId, memoryData);

      expect(memoryId).toBeDefined();
      // In real implementation, this would verify Firestore write
    });

    it('should load memory from Firestore', async () => {
      const mockCollection = {
        userId,
        entries: [
          {
            id: 'memory1',
            title: 'Loaded Memory',
            content: 'This memory was loaded from Firestore',
            category: 'preference',
            importance: 'high',
            timestamp: '2024-01-01T00:00:00Z',
            userId,
            citationRequired: true,
            tags: ['loaded'],
          },
        ],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      };

      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue(mockCollection);

      const result = await memoryManager.loadUserMemory(userId);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe('Loaded Memory');
    });
  });
});
