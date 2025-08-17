/**
 * Tests d'intégration pour le système de mémoire unifié
 * Ces tests vérifient l'interaction entre tous les composants
 */

import { MemoryManager } from '../MemoryManager';
import { CitationManager } from '../CitationManager';
import { MigrationService } from '../MigrationService';
import { useUnifiedMemory } from '../../../hooks/useUnifiedMemory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from '@react-native-firebase/firestore';
import { embeddingService } from '../../embedding/EmbeddingService';
import { renderHook, act } from '@testing-library/react-hooks';
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

describe('Memory System Integration Tests', () => {
  const mockUserId = 'integration-test-user';
  const mockTimestamp = '2024-01-15T10:00:00.000Z';
  
  let memoryManager: MemoryManager;
  let citationManager: CitationManager;
  let migrationService: MigrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockTimestamp));
    
    // Initialize services
    memoryManager = MemoryManager.getInstance();
    citationManager = CitationManager.getInstance();
    migrationService = MigrationService.getInstance();
    
    // Setup mocks
    setupMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setupMocks() {
    // AsyncStorage mock
    const storage = new Map();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => 
      Promise.resolve(storage.get(key) || null)
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
      storage.set(key, value);
      return Promise.resolve();
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key) => {
      storage.delete(key);
      return Promise.resolve();
    });

    // Firestore mock
    const firestoreData = new Map();
    const mockFirestore = {
      collection: jest.fn((collectionName) => ({
        doc: jest.fn((docId) => ({
          get: jest.fn().mockResolvedValue({
            exists: firestoreData.has(`${collectionName}/${docId}`),
            data: () => firestoreData.get(`${collectionName}/${docId}`),
          }),
          set: jest.fn((data) => {
            firestoreData.set(`${collectionName}/${docId}`, data);
            return Promise.resolve();
          }),
          update: jest.fn((data) => {
            const existing = firestoreData.get(`${collectionName}/${docId}`) || {};
            firestoreData.set(`${collectionName}/${docId}`, { ...existing, ...data });
            return Promise.resolve();
          }),
          delete: jest.fn(() => {
            firestoreData.delete(`${collectionName}/${docId}`);
            return Promise.resolve();
          }),
        })),
      })),
    };
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

    // CryptoService mock
    (CryptoService.encrypt as jest.Mock).mockImplementation((data) => 
      Promise.resolve(`encrypted_${data}`)
    );
    (CryptoService.decrypt as jest.Mock).mockImplementation((data) => 
      Promise.resolve(data.replace('encrypted_', ''))
    );

    // EmbeddingService mock
    (embeddingService.generateEmbedding as jest.Mock).mockResolvedValue(
      new Array(384).fill(0.1)
    );
    (embeddingService.cosineSimilarity as jest.Mock).mockReturnValue(0.85);
  }

  describe('End-to-End Memory Workflow', () => {
    it('should complete full memory lifecycle: create, cite, search, update, delete', async () => {
      // 1. Create a memory
      const newMemory = await memoryManager.createMemory(mockUserId, {
        title: 'Script Length Preference',
        content: 'User prefers 2-3 minute scripts for YouTube',
        category: 'preference',
        importance: 'high',
        tags: ['youtube', 'script', 'length'],
      });

      expect(newMemory.id).toBeDefined();
      expect(newMemory.embedding).toHaveLength(384);

      // 2. Search for the memory
      const searchResults = await memoryManager.searchMemories(
        mockUserId,
        'YouTube script duration',
        { limit: 5 }
      );

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].memory.id).toBe(newMemory.id);

      // 3. Use memory in AI response with citation
      const aiResponse = 'Based on your preferences, I recommend a 2-3 minute script.';
      const citedResponse = await citationManager.addCitations(
        mockUserId,
        aiResponse,
        [newMemory.id]
      );

      expect(citedResponse.citationText).toContain(`[[memory:${newMemory.id}]]`);
      expect(citedResponse.citedMemories).toContain(newMemory.id);

      // 4. Track usage
      await citationManager.trackUsage(
        mockUserId,
        newMemory.id,
        'Used for script generation advice'
      );

      const usageHistory = await citationManager.getUsageHistory(mockUserId);
      expect(usageHistory).toHaveLength(1);
      expect(usageHistory[0].memoryId).toBe(newMemory.id);

      // 5. Update the memory
      const updated = await memoryManager.updateMemory(
        mockUserId,
        newMemory.id,
        { content: 'User now prefers 3-4 minute scripts' }
      );

      expect(updated?.content).toBe('User now prefers 3-4 minute scripts');

      // 6. Detect conflicts with new memory
      const conflictingMemory = {
        title: 'New Script Length',
        content: 'User wants 10 minute scripts',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      const conflicts = await memoryManager.detectConflicts(
        mockUserId,
        conflictingMemory
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].suggestedAction).toBeDefined();

      // 7. Delete the memory
      const deleted = await memoryManager.deleteMemory(mockUserId, newMemory.id);
      expect(deleted).toBe(true);

      // 8. Verify deletion
      const afterDelete = await memoryManager.getMemoryById(mockUserId, newMemory.id);
      expect(afterDelete).toBeNull();
    });
  });

  describe('Migration and Legacy System Integration', () => {
    it('should migrate data from all legacy systems and integrate seamlessly', async () => {
      // Setup legacy data
      const legacyData = {
        aiMemory: {
          preferences: {
            scriptLength: '5 minutes',
            tone: 'casual',
          },
        },
        globalPreferences: {
          language: 'en',
          theme: 'light',
        },
        userStats: {
          scriptsGenerated: 100,
          totalWords: 50000,
        },
      };

      // Mock legacy data in AsyncStorage
      await AsyncStorage.setItem(
        `@ai_memory_${mockUserId}`,
        JSON.stringify(legacyData.aiMemory)
      );
      await AsyncStorage.setItem(
        `@global_preferences_${mockUserId}`,
        JSON.stringify(legacyData.globalPreferences)
      );
      await AsyncStorage.setItem(
        `@user_stats_${mockUserId}`,
        JSON.stringify(legacyData.userStats)
      );

      // Perform migration
      const migrationResult = await migrationService.performFullMigration(mockUserId);

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.totalMemoriesMigrated).toBeGreaterThan(0);
      expect(migrationResult.migratedSystems).toContain('useAIMemory');
      expect(migrationResult.migratedSystems).toContain('useGlobalPreferences');
      expect(migrationResult.migratedSystems).toContain('useUserStats');

      // Verify migrated memories are accessible
      const memories = await memoryManager.getMemories(mockUserId);
      expect(memories.length).toBeGreaterThan(0);

      // Check specific migrations
      const scriptLengthMemory = memories.find(m => 
        m.content.includes('5 minutes')
      );
      expect(scriptLengthMemory).toBeDefined();
      expect(scriptLengthMemory?.category).toBe('preference');

      const languageMemory = memories.find(m => 
        m.content.includes('en')
      );
      expect(languageMemory).toBeDefined();

      // Verify cleanup
      const cleanupResult = await migrationService.cleanupLegacyData(mockUserId);
      expect(cleanupResult).toBe(true);

      // Check legacy data is removed
      const legacyAIMemory = await AsyncStorage.getItem(`@ai_memory_${mockUserId}`);
      expect(legacyAIMemory).toBeNull();
    });
  });

  describe('Hook Integration', () => {
    it('should work seamlessly with useUnifiedMemory hook', async () => {
      const { result } = renderHook(() => useUnifiedMemory(mockUserId));

      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Create memory through hook
      await act(async () => {
        await result.current.createMemory({
          title: 'Hook Test Memory',
          content: 'Created via hook',
          category: 'fact',
          importance: 'low',
        });
      });

      expect(result.current.memories.length).toBe(1);
      expect(result.current.memories[0].title).toBe('Hook Test Memory');

      // Search through hook
      await act(async () => {
        await result.current.searchMemories('hook');
      });

      expect(result.current.searchResults.length).toBeGreaterThan(0);

      // Update through hook
      await act(async () => {
        await result.current.updateMemory(
          result.current.memories[0].id,
          { content: 'Updated via hook' }
        );
      });

      expect(result.current.memories[0].content).toBe('Updated via hook');

      // Delete through hook
      await act(async () => {
        await result.current.deleteMemory(result.current.memories[0].id);
      });

      expect(result.current.memories.length).toBe(0);
    });
  });

  describe('Complex Citation Scenarios', () => {
    it('should handle multiple memories with complex citation requirements', async () => {
      // Create multiple related memories
      const memories = await Promise.all([
        memoryManager.createMemory(mockUserId, {
          title: 'Script Structure',
          content: 'Always start with a hook',
          category: 'rule',
          importance: 'high',
          citationRequired: true,
        }),
        memoryManager.createMemory(mockUserId, {
          title: 'Tone Preference',
          content: 'Use conversational tone',
          category: 'preference',
          importance: 'medium',
          citationRequired: true,
        }),
        memoryManager.createMemory(mockUserId, {
          title: 'Internal Note',
          content: 'User payment info',
          category: 'context',
          importance: 'high',
          citationRequired: false,
          tags: ['sensitive'],
        }),
      ]);

      // Generate response using multiple memories
      const aiResponse = 'Your script should start with a hook and use a conversational tone. Processing payment.';
      
      const citedResponse = await citationManager.addCitations(
        mockUserId,
        aiResponse,
        memories.map(m => m.id)
      );

      // Should only cite non-sensitive memories with citationRequired: true
      expect(citedResponse.citedMemories).toContain(memories[0].id);
      expect(citedResponse.citedMemories).toContain(memories[1].id);
      expect(citedResponse.citedMemories).not.toContain(memories[2].id);

      // Validate citations
      const isValid = await citationManager.validateCitations(
        mockUserId,
        citedResponse.citationText
      );
      expect(isValid).toBe(true);

      // Get citation statistics
      for (const memory of memories.slice(0, 2)) {
        await citationManager.trackUsage(
          mockUserId,
          memory.id,
          'Used in script advice'
        );
      }

      const stats = await citationManager.getCitationStats(mockUserId);
      expect(stats.totalCitations).toBe(2);
      expect(stats.uniqueMemoriesCited).toBe(2);
      expect(stats.citationsByCategory).toHaveProperty('rule', 1);
      expect(stats.citationsByCategory).toHaveProperty('preference', 1);
    });
  });

  describe('Conflict Resolution Workflow', () => {
    it('should detect and resolve memory conflicts', async () => {
      // Create initial memory
      const original = await memoryManager.createMemory(mockUserId, {
        title: 'Video Length',
        content: 'Prefer short 2-minute videos',
        category: 'preference',
        importance: 'high',
        subject: 'video_length',
      });

      // Create conflicting memory
      const conflicting = {
        title: 'New Video Length',
        content: 'Now prefer long 10-minute videos',
        category: 'preference' as const,
        importance: 'high' as const,
      };

      // Detect conflicts
      const conflicts = await memoryManager.detectConflicts(
        mockUserId,
        conflicting
      );

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].conflictingMemoryId).toBe(original.id);
      expect(conflicts[0].suggestedAction).toBeDefined();

      // Resolve conflict based on suggestion
      if (conflicts[0].suggestedAction === 'update') {
        await memoryManager.updateMemory(
          mockUserId,
          original.id,
          { content: conflicting.content }
        );
      } else if (conflicts[0].suggestedAction === 'delete') {
        await memoryManager.deleteMemory(mockUserId, original.id);
        await memoryManager.createMemory(mockUserId, conflicting);
      } else if (conflicts[0].suggestedAction === 'merge') {
        // Consolidate memories
        const consolidated = await memoryManager.consolidateMemories(
          mockUserId,
          'video_length'
        );
        expect(consolidated).toBeDefined();
      }

      // Verify resolution
      const afterResolution = await memoryManager.getMemoriesByCategory(
        mockUserId,
        'preference'
      );
      
      const videoLengthMemories = afterResolution.filter(m => 
        m.subject === 'video_length' || m.content.includes('video')
      );
      
      // Should have resolved the conflict
      expect(videoLengthMemories.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle high volume of concurrent operations', async () => {
      const operations = [];
      const memoryCount = 50;

      // Create many memories concurrently
      for (let i = 0; i < memoryCount; i++) {
        operations.push(
          memoryManager.createMemory(mockUserId, {
            title: `Memory ${i}`,
            content: `Content for memory ${i}`,
            category: i % 2 === 0 ? 'fact' : 'preference',
            importance: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
            tags: [`tag${i % 5}`, `category${i % 3}`],
          })
        );
      }

      const createdMemories = await Promise.all(operations);
      expect(createdMemories).toHaveLength(memoryCount);

      // Perform concurrent searches
      const searchOperations = [];
      for (let i = 0; i < 10; i++) {
        searchOperations.push(
          memoryManager.searchMemories(
            mockUserId,
            `Content for memory ${i * 5}`,
            { limit: 5 }
          )
        );
      }

      const searchResults = await Promise.all(searchOperations);
      searchResults.forEach(results => {
        expect(results.length).toBeGreaterThan(0);
      });

      // Concurrent citation operations
      const citationOperations = [];
      for (let i = 0; i < 20; i++) {
        citationOperations.push(
          citationManager.addCitations(
            mockUserId,
            `Response using memory ${i}`,
            [createdMemories[i].id]
          )
        );
      }

      const citationResults = await Promise.all(citationOperations);
      citationResults.forEach((result, i) => {
        expect(result.citedMemories).toContain(createdMemories[i].id);
      });

      // Batch update operations
      const updateOperations = createdMemories.slice(0, 10).map((memory, i) =>
        memoryManager.updateMemory(
          mockUserId,
          memory.id,
          { importance: 'high' }
        )
      );

      const updateResults = await Promise.all(updateOperations);
      updateResults.forEach(result => {
        expect(result?.importance).toBe('high');
      });

      // Cleanup - batch delete
      const deleteOperations = createdMemories.map(memory =>
        memoryManager.deleteMemory(mockUserId, memory.id)
      );

      const deleteResults = await Promise.all(deleteOperations);
      deleteResults.forEach(result => {
        expect(result).toBe(true);
      });

      // Verify cleanup
      const remainingMemories = await memoryManager.getMemories(mockUserId);
      expect(remainingMemories.length).toBe(0);
    });
  });

  describe('Data Integrity and Recovery', () => {
    it('should maintain data integrity across service restarts', async () => {
      // Create memories
      const memory1 = await memoryManager.createMemory(mockUserId, {
        title: 'Persistent Memory 1',
        content: 'Should survive restart',
        category: 'fact',
        importance: 'high',
      });

      // Track usage
      await citationManager.trackUsage(
        mockUserId,
        memory1.id,
        'Initial usage'
      );

      // Simulate service restart by creating new instances
      const newMemoryManager = MemoryManager.getInstance();
      const newCitationManager = CitationManager.getInstance();

      // Verify data persists
      const retrievedMemory = await newMemoryManager.getMemoryById(
        mockUserId,
        memory1.id
      );
      expect(retrievedMemory).toBeDefined();
      expect(retrievedMemory?.title).toBe('Persistent Memory 1');

      const usageHistory = await newCitationManager.getUsageHistory(mockUserId);
      expect(usageHistory.length).toBeGreaterThan(0);
      expect(usageHistory[0].memoryId).toBe(memory1.id);
    });

    it('should handle corrupted data gracefully', async () => {
      // Inject corrupted data
      await AsyncStorage.setItem(
        `@citation_history_${mockUserId}`,
        'corrupted_json_data'
      );

      // Should handle gracefully and return empty
      const history = await citationManager.getUsageHistory(mockUserId);
      expect(history).toEqual([]);

      // Should still be able to track new usage
      const memory = await memoryManager.createMemory(mockUserId, {
        title: 'New Memory',
        content: 'After corruption',
        category: 'fact',
        importance: 'low',
      });

      await citationManager.trackUsage(
        mockUserId,
        memory.id,
        'Post-corruption usage'
      );

      const newHistory = await citationManager.getUsageHistory(mockUserId);
      expect(newHistory.length).toBe(1);
    });
  });

  describe('Security and Privacy', () => {
    it('should properly encrypt and filter sensitive data', async () => {
      // Try to create memory with sensitive data
      const sensitiveMemory = {
        title: 'User Info',
        content: 'SSN: 123-45-6789, Credit Card: 4111-1111-1111-1111',
        category: 'context' as const,
        importance: 'high' as const,
      };

      // Should filter or reject sensitive data
      await expect(
        memoryManager.createMemory(mockUserId, sensitiveMemory)
      ).rejects.toThrow();

      // Create memory with tags marking it as sensitive
      const privateMemo = await memoryManager.createMemory(mockUserId, {
        title: 'Private Note',
        content: 'User personal preference',
        category: 'context',
        importance: 'high',
        citationRequired: false,
        tags: ['private', 'sensitive'],
      });

      // Should not be cited even if used
      const citedResponse = await citationManager.addCitations(
        mockUserId,
        'Based on your personal preference',
        [privateMemo.id]
      );

      expect(citedResponse.citedMemories).not.toContain(privateMemo.id);

      // Verify encryption in storage
      const stored = await AsyncStorage.getItem(
        `@unified_memory_${mockUserId}`
      );
      if (stored) {
        expect(stored).toContain('encrypted_');
      }
    });
  });

  describe('Cross-Service Communication', () => {
    it('should coordinate between all services correctly', async () => {
      // Migration creates memories
      const legacyData = {
        preferences: { scriptLength: '3 minutes' },
      };
      await AsyncStorage.setItem(
        `@ai_memory_${mockUserId}`,
        JSON.stringify(legacyData)
      );

      await migrationService.migrateAIMemory(mockUserId);

      // Memory manager can access migrated data
      const memories = await memoryManager.getMemories(mockUserId);
      const migratedMemory = memories.find(m => 
        m.content.includes('3 minutes')
      );
      expect(migratedMemory).toBeDefined();

      // Citation manager can cite migrated memories
      if (migratedMemory) {
        const cited = await citationManager.addCitations(
          mockUserId,
          'Your preferred 3 minute scripts',
          [migratedMemory.id]
        );
        expect(cited.citedMemories).toContain(migratedMemory.id);

        // Track usage
        await citationManager.trackUsage(
          mockUserId,
          migratedMemory.id,
          'Used migrated memory'
        );
      }

      // All services see consistent state
      const status = await migrationService.getMigrationStatus(mockUserId);
      expect(status.migratedSystems).toContain('useAIMemory');

      const stats = await citationManager.getCitationStats(mockUserId);
      expect(stats.totalCitations).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty or null values gracefully', async () => {
      // Empty content
      await expect(
        memoryManager.createMemory(mockUserId, {
          title: 'Empty',
          content: '',
          category: 'fact',
          importance: 'low',
        })
      ).rejects.toThrow();

      // Null user ID
      await expect(
        memoryManager.getMemories('')
      ).rejects.toThrow();

      // Non-existent memory
      const nonExistent = await memoryManager.getMemoryById(
        mockUserId,
        'non_existent_id'
      );
      expect(nonExistent).toBeNull();

      // Empty citation list
      const noCitations = await citationManager.addCitations(
        mockUserId,
        'Text without citations',
        []
      );
      expect(noCitations.citedMemories).toEqual([]);
    });

    it('should handle service unavailability', async () => {
      // Simulate Firestore unavailable
      (getFirestore as jest.Mock).mockImplementation(() => {
        throw new Error('Firestore unavailable');
      });

      // Should fallback gracefully
      const memories = await memoryManager.getMemories(mockUserId);
      expect(memories).toEqual([]);

      // Restore Firestore
      setupMocks();

      // Service should recover
      const memory = await memoryManager.createMemory(mockUserId, {
        title: 'Recovery Test',
        content: 'After service recovery',
        category: 'fact',
        importance: 'low',
      });
      expect(memory.id).toBeDefined();
    });
  });
});