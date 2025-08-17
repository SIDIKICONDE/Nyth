/**
 * Tests de performance et stress pour le système de mémoire unifié
 * Ces tests vérifient les performances sous charge élevée
 */

import { MemoryManager } from '../MemoryManager';
import { CitationManager } from '../CitationManager';
import { MigrationService } from '../MigrationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from '@react-native-firebase/firestore';
import { embeddingService } from '../../embedding/EmbeddingService';
import { performance } from 'perf_hooks';

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

// Augmenter le timeout pour les tests de performance
jest.setTimeout(30000);

describe('Memory System Performance Tests', () => {
  const mockUserId = 'perf-test-user';
  let memoryManager: MemoryManager;
  let citationManager: CitationManager;
  let migrationService: MigrationService;

  // Métriques de performance
  const performanceMetrics = {
    createMemory: [] as number[],
    getMemories: [] as number[],
    searchMemories: [] as number[],
    updateMemory: [] as number[],
    deleteMemory: [] as number[],
    addCitations: [] as number[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize services
    memoryManager = MemoryManager.getInstance();
    citationManager = CitationManager.getInstance();
    migrationService = MigrationService.getInstance();
    
    // Setup mocks avec simulation de latence réseau
    setupPerformanceMocks();
  });

  afterEach(() => {
    // Rapport de performance après chaque test
    reportPerformanceMetrics();
  });

  function setupPerformanceMocks() {
    // AsyncStorage mock avec latence simulée
    const storage = new Map();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
      await simulateLatency(5); // 5ms latence
      return storage.get(key) || null;
    });
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
      await simulateLatency(10); // 10ms latence
      storage.set(key, value);
    });

    // Firestore mock avec latence simulée
    const firestoreData = new Map();
    const mockFirestore = {
      collection: jest.fn(() => ({
        doc: jest.fn((docId) => ({
          get: jest.fn(async () => {
            await simulateLatency(20); // 20ms latence
            return {
              exists: firestoreData.has(docId),
              data: () => firestoreData.get(docId),
            };
          }),
          set: jest.fn(async (data) => {
            await simulateLatency(30); // 30ms latence
            firestoreData.set(docId, data);
          }),
        })),
      })),
    };
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

    // EmbeddingService mock avec latence
    (embeddingService.generateEmbedding as jest.Mock).mockImplementation(async () => {
      await simulateLatency(50); // 50ms pour génération embedding
      return new Array(384).fill(Math.random());
    });
    (embeddingService.cosineSimilarity as jest.Mock).mockImplementation(() => {
      return Math.random();
    });
  }

  function simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function measurePerformance<T>(
    operation: () => Promise<T>,
    metricName: keyof typeof performanceMetrics
  ): Promise<T> {
    const startTime = performance.now();
    return operation().then(result => {
      const duration = performance.now() - startTime;
      performanceMetrics[metricName].push(duration);
      return result;
    });
  }

  function reportPerformanceMetrics() {
    console.log('\n📊 Performance Metrics Report:');
    console.log('================================');
    
    Object.entries(performanceMetrics).forEach(([operation, times]) => {
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        const p95 = calculatePercentile(times, 95);
        
        console.log(`\n${operation}:`);
        console.log(`  Avg: ${avg.toFixed(2)}ms`);
        console.log(`  Min: ${min.toFixed(2)}ms`);
        console.log(`  Max: ${max.toFixed(2)}ms`);
        console.log(`  P95: ${p95.toFixed(2)}ms`);
      }
    });
  }

  function calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  describe('High Volume Operations', () => {
    it('should handle 1000 memory creations efficiently', async () => {
      const memoryCount = 1000;
      const startTime = performance.now();
      const memories = [];

      for (let i = 0; i < memoryCount; i++) {
        const memory = await measurePerformance(
          () => memoryManager.createMemory(mockUserId, {
            title: `Memory ${i}`,
            content: `Performance test content ${i}`,
            category: i % 2 === 0 ? 'fact' : 'preference',
            importance: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
            tags: [`tag${i % 10}`],
          }),
          'createMemory'
        );
        memories.push(memory);
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerMemory = totalTime / memoryCount;

      console.log(`\n🚀 Created ${memoryCount} memories in ${totalTime.toFixed(2)}ms`);
      console.log(`   Average: ${avgTimePerMemory.toFixed(2)}ms per memory`);

      expect(memories).toHaveLength(memoryCount);
      expect(avgTimePerMemory).toBeLessThan(100); // Should be under 100ms per memory
    });

    it('should perform 500 searches efficiently', async () => {
      // First create some memories to search
      const memoryCount = 100;
      for (let i = 0; i < memoryCount; i++) {
        await memoryManager.createMemory(mockUserId, {
          title: `Searchable ${i}`,
          content: `Content with keywords: ${i % 10 === 0 ? 'special' : 'normal'} data`,
          category: 'fact',
          importance: 'medium',
          tags: [`search${i % 5}`],
        });
      }

      // Perform searches
      const searchCount = 500;
      const startTime = performance.now();
      const searchResults = [];

      for (let i = 0; i < searchCount; i++) {
        const results = await measurePerformance(
          () => memoryManager.searchMemories(
            mockUserId,
            `keywords ${i % 10}`,
            { limit: 10 }
          ),
          'searchMemories'
        );
        searchResults.push(results);
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerSearch = totalTime / searchCount;

      console.log(`\n🔍 Performed ${searchCount} searches in ${totalTime.toFixed(2)}ms`);
      console.log(`   Average: ${avgTimePerSearch.toFixed(2)}ms per search`);

      expect(searchResults).toHaveLength(searchCount);
      expect(avgTimePerSearch).toBeLessThan(50); // Should be under 50ms per search
    });
  });

  describe('Concurrent Operations Stress Test', () => {
    it('should handle 100 concurrent memory operations', async () => {
      const concurrentOps = 100;
      const startTime = performance.now();

      const operations = Array.from({ length: concurrentOps }, (_, i) => {
        const opType = i % 4;
        switch (opType) {
          case 0: // Create
            return memoryManager.createMemory(mockUserId, {
              title: `Concurrent ${i}`,
              content: `Concurrent content ${i}`,
              category: 'fact',
              importance: 'low',
            });
          case 1: // Read
            return memoryManager.getMemories(mockUserId);
          case 2: // Search
            return memoryManager.searchMemories(mockUserId, `content ${i}`, { limit: 5 });
          case 3: // Update (if memory exists)
            return memoryManager.updateMemory(
              mockUserId,
              `mem_${i}`,
              { content: `Updated ${i}` }
            ).catch(() => null);
          default:
            return Promise.resolve(null);
        }
      });

      const results = await Promise.all(operations);
      const totalTime = performance.now() - startTime;

      console.log(`\n⚡ Completed ${concurrentOps} concurrent operations in ${totalTime.toFixed(2)}ms`);
      console.log(`   Operations/second: ${(concurrentOps / (totalTime / 1000)).toFixed(2)}`);

      expect(results).toHaveLength(concurrentOps);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle rapid-fire citations', async () => {
      // Create memories for citation
      const memories = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          memoryManager.createMemory(mockUserId, {
            title: `Citation Memory ${i}`,
            content: `Content for citation ${i}`,
            category: 'preference',
            importance: 'high',
            citationRequired: true,
          })
        )
      );

      const citationCount = 200;
      const startTime = performance.now();
      const citations = [];

      for (let i = 0; i < citationCount; i++) {
        const memorySubset = memories.slice(0, Math.floor(Math.random() * 5) + 1);
        const citation = await measurePerformance(
          () => citationManager.addCitations(
            mockUserId,
            `Text referencing memories ${i}`,
            memorySubset.map(m => m.id)
          ),
          'addCitations'
        );
        citations.push(citation);
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerCitation = totalTime / citationCount;

      console.log(`\n📝 Added ${citationCount} citations in ${totalTime.toFixed(2)}ms`);
      console.log(`   Average: ${avgTimePerCitation.toFixed(2)}ms per citation`);

      expect(citations).toHaveLength(citationCount);
      expect(avgTimePerCitation).toBeLessThan(30); // Should be under 30ms per citation
    });
  });

  describe('Memory Limits and Boundaries', () => {
    it('should handle maximum memory size gracefully', async () => {
      const maxContentLength = 500;
      const largeContent = 'a'.repeat(maxContentLength);
      
      const startTime = performance.now();
      
      const memory = await memoryManager.createMemory(mockUserId, {
        title: 'Max Size Memory',
        content: largeContent,
        category: 'fact',
        importance: 'low',
      });

      const duration = performance.now() - startTime;

      expect(memory.content).toHaveLength(maxContentLength);
      expect(duration).toBeLessThan(500); // Should handle max size quickly
    });

    it('should handle 10000 memories per user', async () => {
      const targetCount = 10000;
      const batchSize = 100;
      const batches = targetCount / batchSize;
      
      console.log(`\n📦 Creating ${targetCount} memories in ${batches} batches...`);
      
      const startTime = performance.now();
      
      for (let batch = 0; batch < batches; batch++) {
        const batchMemories = Array.from({ length: batchSize }, (_, i) => ({
          title: `Batch ${batch} Memory ${i}`,
          content: `Content for batch ${batch} item ${i}`,
          category: (i % 2 === 0 ? 'fact' : 'preference') as 'fact' | 'preference',
          importance: 'low' as const,
        }));
        
        await memoryManager.createMemoriesBatch(mockUserId, batchMemories);
        
        if (batch % 10 === 0) {
          const progress = ((batch / batches) * 100).toFixed(1);
          console.log(`   Progress: ${progress}%`);
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      // Test retrieval performance with large dataset
      const retrievalStart = performance.now();
      const allMemories = await memoryManager.getMemories(mockUserId);
      const retrievalTime = performance.now() - retrievalStart;
      
      console.log(`\n✅ Created ${targetCount} memories in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`   Retrieved all in ${retrievalTime.toFixed(2)}ms`);
      
      expect(allMemories.length).toBeGreaterThanOrEqual(targetCount);
      expect(retrievalTime).toBeLessThan(5000); // Should retrieve all within 5 seconds
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache effectiveness', async () => {
      // Create test memories
      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          memoryManager.createMemory(mockUserId, {
            title: `Cache Test ${i}`,
            content: `Content ${i}`,
            category: 'fact',
            importance: 'low',
          })
        )
      );

      // First load - no cache
      const firstLoadStart = performance.now();
      await memoryManager.getMemories(mockUserId);
      const firstLoadTime = performance.now() - firstLoadStart;

      // Second load - with cache
      const secondLoadStart = performance.now();
      await memoryManager.getMemories(mockUserId);
      const secondLoadTime = performance.now() - secondLoadStart;

      // Third load - still cached
      const thirdLoadStart = performance.now();
      await memoryManager.getMemories(mockUserId);
      const thirdLoadTime = performance.now() - thirdLoadStart;

      console.log('\n💾 Cache Performance:');
      console.log(`   First load (no cache): ${firstLoadTime.toFixed(2)}ms`);
      console.log(`   Second load (cached): ${secondLoadTime.toFixed(2)}ms`);
      console.log(`   Third load (cached): ${thirdLoadTime.toFixed(2)}ms`);
      console.log(`   Speed improvement: ${((1 - secondLoadTime / firstLoadTime) * 100).toFixed(1)}%`);

      expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5); // At least 50% faster
      expect(thirdLoadTime).toBeLessThan(firstLoadTime * 0.5);
    });

    it('should handle cache invalidation efficiently', async () => {
      // Create initial memories
      const memories = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          memoryManager.createMemory(mockUserId, {
            title: `Invalidation Test ${i}`,
            content: `Content ${i}`,
            category: 'fact',
            importance: 'low',
          })
        )
      );

      // Load into cache
      await memoryManager.getMemories(mockUserId);

      // Perform updates that invalidate cache
      const updateStart = performance.now();
      await Promise.all(
        memories.slice(0, 10).map((memory, i) =>
          memoryManager.updateMemory(mockUserId, memory.id, {
            content: `Updated content ${i}`,
          })
        )
      );
      const updateTime = performance.now() - updateStart;

      // Reload after invalidation
      const reloadStart = performance.now();
      const updatedMemories = await memoryManager.getMemories(mockUserId);
      const reloadTime = performance.now() - reloadStart;

      console.log('\n🔄 Cache Invalidation:');
      console.log(`   Updates completed in: ${updateTime.toFixed(2)}ms`);
      console.log(`   Reload after invalidation: ${reloadTime.toFixed(2)}ms`);

      const updatedCount = updatedMemories.filter(m => 
        m.content.startsWith('Updated content')
      ).length;
      
      expect(updatedCount).toBe(10);
      expect(reloadTime).toBeLessThan(1000); // Should reload quickly
    });
  });

  describe('Migration Performance', () => {
    it('should migrate large legacy datasets efficiently', async () => {
      // Setup large legacy dataset
      const legacyMemoryCount = 500;
      const legacyData = {
        memories: Array.from({ length: legacyMemoryCount }, (_, i) => ({
          id: `legacy_${i}`,
          content: `Legacy content ${i}`,
          type: i % 2 === 0 ? 'preference' : 'rule',
          date: new Date(Date.now() - i * 86400000).toISOString(),
        })),
      };

      await AsyncStorage.setItem(
        `@legacy_memories_${mockUserId}`,
        JSON.stringify(legacyData)
      );

      // Perform migration
      const migrationStart = performance.now();
      const result = await migrationService.performFullMigration(mockUserId);
      const migrationTime = performance.now() - migrationStart;

      console.log(`\n🔀 Migration Performance:`);
      console.log(`   Migrated ${legacyMemoryCount} memories in ${migrationTime.toFixed(2)}ms`);
      console.log(`   Average: ${(migrationTime / legacyMemoryCount).toFixed(2)}ms per memory`);

      expect(result.success).toBe(true);
      expect(result.totalMemoriesMigrated).toBeGreaterThanOrEqual(legacyMemoryCount);
      expect(migrationTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Semantic Search Performance', () => {
    it('should perform semantic searches on large datasets efficiently', async () => {
      // Create diverse memories with embeddings
      const memoryCount = 200;
      await Promise.all(
        Array.from({ length: memoryCount }, (_, i) =>
          memoryManager.createMemory(mockUserId, {
            title: `Semantic ${i}`,
            content: `${['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'Data Science'][i % 5]} content ${i}`,
            category: 'fact',
            importance: 'medium',
            tags: [`semantic${i % 10}`],
          })
        )
      );

      // Perform semantic searches
      const searchQueries = [
        'artificial intelligence applications',
        'deep learning models',
        'neural network architectures',
        'machine learning algorithms',
        'data science techniques',
      ];

      const searchStart = performance.now();
      const searchResults = await Promise.all(
        searchQueries.map(query =>
          memoryManager.searchMemories(mockUserId, query, {
            limit: 20,
            minSimilarity: 0.7,
          })
        )
      );
      const searchTime = performance.now() - searchStart;

      console.log(`\n🧠 Semantic Search Performance:`);
      console.log(`   ${searchQueries.length} searches on ${memoryCount} memories`);
      console.log(`   Total time: ${searchTime.toFixed(2)}ms`);
      console.log(`   Average per search: ${(searchTime / searchQueries.length).toFixed(2)}ms`);

      searchResults.forEach((results, i) => {
        console.log(`   Query "${searchQueries[i]}": ${results.length} results`);
      });

      expect(searchResults).toHaveLength(searchQueries.length);
      searchResults.forEach(results => {
        expect(results.length).toBeGreaterThan(0);
      });
      expect(searchTime / searchQueries.length).toBeLessThan(500); // Under 500ms per search
    });
  });

  describe('Memory Cleanup Performance', () => {
    it('should perform batch deletions efficiently', async () => {
      // Create memories to delete
      const memories = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          memoryManager.createMemory(mockUserId, {
            title: `To Delete ${i}`,
            content: `Content ${i}`,
            category: 'fact',
            importance: 'low',
          })
        )
      );

      // Batch delete
      const deleteStart = performance.now();
      const deleteResults = await Promise.all(
        memories.map(memory =>
          memoryManager.deleteMemory(mockUserId, memory.id)
        )
      );
      const deleteTime = performance.now() - deleteStart;

      console.log(`\n🗑️ Batch Deletion Performance:`);
      console.log(`   Deleted ${memories.length} memories in ${deleteTime.toFixed(2)}ms`);
      console.log(`   Average: ${(deleteTime / memories.length).toFixed(2)}ms per deletion`);

      expect(deleteResults.every(r => r === true)).toBe(true);
      expect(deleteTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Real-world Simulation', () => {
    it('should handle realistic usage patterns', async () => {
      const simulationDuration = 10000; // 10 seconds
      const startTime = performance.now();
      let operationCount = 0;
      const results = {
        creates: 0,
        reads: 0,
        searches: 0,
        updates: 0,
        deletes: 0,
        citations: 0,
      };

      console.log('\n🌍 Real-world Simulation (10 seconds)...');

      while (performance.now() - startTime < simulationDuration) {
        const operation = Math.random();
        operationCount++;

        try {
          if (operation < 0.3) {
            // 30% - Create memory
            await memoryManager.createMemory(mockUserId, {
              title: `Real World ${operationCount}`,
              content: `Simulation content ${operationCount}`,
              category: Math.random() > 0.5 ? 'fact' : 'preference',
              importance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
            });
            results.creates++;
          } else if (operation < 0.5) {
            // 20% - Read memories
            await memoryManager.getMemories(mockUserId);
            results.reads++;
          } else if (operation < 0.7) {
            // 20% - Search
            await memoryManager.searchMemories(
              mockUserId,
              `content ${Math.floor(Math.random() * 100)}`,
              { limit: 10 }
            );
            results.searches++;
          } else if (operation < 0.85) {
            // 15% - Update
            const memories = await memoryManager.getMemories(mockUserId);
            if (memories.length > 0) {
              const randomMemory = memories[Math.floor(Math.random() * memories.length)];
              await memoryManager.updateMemory(mockUserId, randomMemory.id, {
                content: `Updated at ${operationCount}`,
              });
              results.updates++;
            }
          } else if (operation < 0.95) {
            // 10% - Delete
            const memories = await memoryManager.getMemories(mockUserId);
            if (memories.length > 0) {
              const randomMemory = memories[Math.floor(Math.random() * memories.length)];
              await memoryManager.deleteMemory(mockUserId, randomMemory.id);
              results.deletes++;
            }
          } else {
            // 5% - Citations
            const memories = await memoryManager.getMemories(mockUserId);
            if (memories.length > 0) {
              const memorySubset = memories.slice(0, Math.min(3, memories.length));
              await citationManager.addCitations(
                mockUserId,
                `Citation text ${operationCount}`,
                memorySubset.map(m => m.id)
              );
              results.citations++;
            }
          }
        } catch (error) {
          // Continue simulation even if individual operations fail
        }

        // Small delay to prevent overwhelming
        await simulateLatency(10);
      }

      const totalTime = performance.now() - startTime;
      const opsPerSecond = (operationCount / (totalTime / 1000)).toFixed(2);

      console.log(`\n📈 Simulation Results:`);
      console.log(`   Total operations: ${operationCount}`);
      console.log(`   Operations/second: ${opsPerSecond}`);
      console.log(`   Breakdown:`);
      Object.entries(results).forEach(([op, count]) => {
        const percentage = ((count / operationCount) * 100).toFixed(1);
        console.log(`     ${op}: ${count} (${percentage}%)`);
      });

      expect(operationCount).toBeGreaterThan(100);
      expect(Number(opsPerSecond)).toBeGreaterThan(10); // At least 10 ops/second
    });
  });

  describe('Performance Degradation Tests', () => {
    it('should maintain performance as dataset grows', async () => {
      const checkpoints = [100, 500, 1000, 2000];
      const performanceBySize: Record<number, number> = {};

      for (const checkpoint of checkpoints) {
        // Add memories up to checkpoint
        const toAdd = checkpoint - (await memoryManager.getMemories(mockUserId)).length;
        await Promise.all(
          Array.from({ length: toAdd }, (_, i) =>
            memoryManager.createMemory(mockUserId, {
              title: `Growth Test ${checkpoint}_${i}`,
              content: `Content for size test ${checkpoint}_${i}`,
              category: 'fact',
              importance: 'low',
            })
          )
        );

        // Measure search performance at this size
        const searchStart = performance.now();
        await memoryManager.searchMemories(mockUserId, 'Growth Test', { limit: 10 });
        const searchTime = performance.now() - searchStart;
        
        performanceBySize[checkpoint] = searchTime;
        
        console.log(`   Dataset size ${checkpoint}: ${searchTime.toFixed(2)}ms`);
      }

      // Check that performance doesn't degrade too much
      const degradation = performanceBySize[2000] / performanceBySize[100];
      console.log(`\n📉 Performance degradation: ${degradation.toFixed(2)}x slower at 2000 vs 100 memories`);
      
      expect(degradation).toBeLessThan(10); // Should not be more than 10x slower
    });
  });
});