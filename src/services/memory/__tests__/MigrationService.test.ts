import { MigrationService, MigrationStatus } from '../MigrationService';
import { memoryManager } from '../MemoryManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from '@react-native-firebase/firestore';

// Mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-firebase/firestore');
jest.mock('@react-native-firebase/app');
jest.mock('../MemoryManager');
jest.mock('../../../utils/optimizedLogger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('MigrationService', () => {
  let migrationService: MigrationService;
  const mockUserId = 'test-user-123';
  const mockTimestamp = '2024-01-15T10:00:00.000Z';

  // Mock data from legacy systems
  const mockAIMemoryData = {
    preferences: {
      scriptLength: '2-3 minutes',
      tone: 'professional',
      style: 'educational',
    },
    history: [
      { query: 'Create a script', response: 'Generated script...', timestamp: '2024-01-01' },
    ],
  };

  const mockGlobalPreferences = {
    language: 'fr',
    theme: 'dark',
    notifications: true,
    autoSave: false,
  };

  const mockUserStats = {
    scriptsGenerated: 42,
    totalWords: 15000,
    lastActive: '2024-01-10',
    achievements: ['first_script', 'power_user'],
  };

  const mockLegacyMemories = [
    {
      id: 'legacy_1',
      content: 'User prefers short scripts',
      type: 'preference',
      date: '2024-01-01',
    },
    {
      id: 'legacy_2',
      content: 'Always include introduction',
      type: 'rule',
      date: '2024-01-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    migrationService = MigrationService.getInstance();
    
    // Mock Date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockTimestamp));
    
    // Mock AsyncStorage
    const mockStorage = new Map();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      return Promise.resolve(mockStorage.get(key) || null);
    });
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key, value) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key) => {
      mockStorage.delete(key);
      return Promise.resolve();
    });
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);
    
    // Mock Firestore
    const mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    
    // Mock memoryManager
    (memoryManager.createMemory as jest.Mock).mockImplementation((userId, memory) => 
      Promise.resolve({
        ...memory,
        id: `mem_${Date.now()}`,
        userId,
        timestamp: mockTimestamp,
        citationRequired: true,
      })
    );
    (memoryManager.getMemories as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MigrationService.getInstance();
      const instance2 = MigrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Migration Status', () => {
    it('should get initial migration status', async () => {
      const status = await migrationService.getMigrationStatus(mockUserId);
      
      expect(status).toMatchObject({
        userId: mockUserId,
        isComplete: false,
        startedAt: null,
        completedAt: null,
        migratedSystems: [],
        totalMemoriesMigrated: 0,
        errors: [],
      });
    });

    it('should update migration status', async () => {
      await migrationService.updateMigrationStatus(mockUserId, {
        isComplete: false,
        startedAt: mockTimestamp,
        migratedSystems: ['useAIMemory'],
      });

      const status = await migrationService.getMigrationStatus(mockUserId);
      
      expect(status.startedAt).toBe(mockTimestamp);
      expect(status.migratedSystems).toContain('useAIMemory');
    });

    it('should persist migration status', async () => {
      await migrationService.updateMigrationStatus(mockUserId, {
        isComplete: true,
        completedAt: mockTimestamp,
      });

      // Create new instance to test persistence
      const newInstance = MigrationService.getInstance();
      const status = await newInstance.getMigrationStatus(mockUserId);
      
      expect(status.isComplete).toBe(true);
      expect(status.completedAt).toBe(mockTimestamp);
    });
  });

  describe('AI Memory Migration', () => {
    beforeEach(() => {
      // Setup AI Memory mock data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@ai_memory_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockAIMemoryData));
        }
        return Promise.resolve(null);
      });
    });

    it('should migrate AI memory preferences', async () => {
      const result = await migrationService.migrateAIMemory(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBeGreaterThan(0);
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: expect.stringContaining('script'),
          category: 'preference',
        })
      );
    });

    it('should handle empty AI memory', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await migrationService.migrateAIMemory(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBe(0);
    });

    it('should handle corrupted AI memory data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
      
      const result = await migrationService.migrateAIMemory(mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should not migrate twice', async () => {
      await migrationService.migrateAIMemory(mockUserId);
      jest.clearAllMocks();
      
      await migrationService.migrateAIMemory(mockUserId);
      
      expect(memoryManager.createMemory).not.toHaveBeenCalled();
    });
  });

  describe('Global Preferences Migration', () => {
    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@global_preferences_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockGlobalPreferences));
        }
        return Promise.resolve(null);
      });
    });

    it('should migrate global preferences', async () => {
      const result = await migrationService.migrateGlobalPreferences(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBeGreaterThan(0);
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: expect.stringContaining('Language'),
          content: expect.stringContaining('fr'),
          category: 'preference',
        })
      );
    });

    it('should categorize preferences correctly', async () => {
      const result = await migrationService.migrateGlobalPreferences(mockUserId);
      
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: expect.stringContaining('Theme'),
          category: 'preference',
          importance: 'medium',
        })
      );
    });

    it('should handle missing preferences gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ language: 'en' }) // Partial preferences
      );
      
      const result = await migrationService.migrateGlobalPreferences(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBe(1);
    });
  });

  describe('User Stats Migration', () => {
    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@user_stats_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockUserStats));
        }
        return Promise.resolve(null);
      });
    });

    it('should migrate user statistics', async () => {
      const result = await migrationService.migrateUserStats(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBeGreaterThan(0);
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: expect.stringContaining('Scripts generated'),
          content: expect.stringContaining('42'),
          category: 'fact',
        })
      );
    });

    it('should migrate achievements as context', async () => {
      const result = await migrationService.migrateUserStats(mockUserId);
      
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          title: expect.stringContaining('Achievements'),
          category: 'context',
          tags: expect.arrayContaining(['achievement']),
        })
      );
    });

    it('should handle stats without achievements', async () => {
      const statsWithoutAchievements = { ...mockUserStats };
      delete statsWithoutAchievements.achievements;
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(statsWithoutAchievements)
      );
      
      const result = await migrationService.migrateUserStats(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBeGreaterThan(0);
    });
  });

  describe('Legacy Memory Migration', () => {
    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@legacy_memories_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockLegacyMemories));
        }
        return Promise.resolve(null);
      });
    });

    it('should migrate legacy memories', async () => {
      const result = await migrationService.migrateLegacyMemories(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.memoriesCreated).toBe(2);
      expect(memoryManager.createMemory).toHaveBeenCalledTimes(2);
    });

    it('should map legacy types to new categories', async () => {
      const result = await migrationService.migrateLegacyMemories(mockUserId);
      
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          content: 'User prefers short scripts',
          category: 'preference',
        })
      );
      
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          content: 'Always include introduction',
          category: 'rule',
        })
      );
    });

    it('should handle unknown legacy types', async () => {
      const memoriesWithUnknownType = [
        {
          id: 'legacy_unknown',
          content: 'Some content',
          type: 'unknown_type',
          date: '2024-01-01',
        },
      ];
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(memoriesWithUnknownType)
      );
      
      const result = await migrationService.migrateLegacyMemories(mockUserId);
      
      expect(result.success).toBe(true);
      expect(memoryManager.createMemory).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          category: 'context', // Default category
        })
      );
    });
  });

  describe('Full Migration', () => {
    beforeEach(() => {
      // Setup all legacy data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@ai_memory_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockAIMemoryData));
        }
        if (key === `@global_preferences_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockGlobalPreferences));
        }
        if (key === `@user_stats_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockUserStats));
        }
        if (key === `@legacy_memories_${mockUserId}`) {
          return Promise.resolve(JSON.stringify(mockLegacyMemories));
        }
        return Promise.resolve(null);
      });
    });

    it('should perform full migration', async () => {
      const result = await migrationService.performFullMigration(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.totalMemoriesMigrated).toBeGreaterThan(0);
      expect(result.migratedSystems).toEqual([
        'useAIMemory',
        'useGlobalPreferences',
        'useUserStats',
        'legacyMemories',
      ]);
    });

    it('should update status during migration', async () => {
      const result = await migrationService.performFullMigration(mockUserId);
      
      const status = await migrationService.getMigrationStatus(mockUserId);
      
      expect(status.isComplete).toBe(true);
      expect(status.completedAt).toBeDefined();
      expect(status.totalMemoriesMigrated).toBe(result.totalMemoriesMigrated);
    });

    it('should handle partial migration failures', async () => {
      // Make one migration fail
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === `@ai_memory_${mockUserId}`) {
          throw new Error('Storage error');
        }
        return Promise.resolve(null);
      });
      
      const result = await migrationService.performFullMigration(mockUserId);
      
      expect(result.success).toBe(true); // Overall success
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('useAIMemory');
    });

    it('should skip already migrated systems', async () => {
      // First migration
      await migrationService.migrateAIMemory(mockUserId);
      jest.clearAllMocks();
      
      // Full migration should skip AI Memory
      const result = await migrationService.performFullMigration(mockUserId);
      
      expect(result.migratedSystems).not.toContain('useAIMemory');
    });
  });

  describe('Cleanup Operations', () => {
    beforeEach(() => {
      // Setup legacy data
      const mockStorage = new Map([
        [`@ai_memory_${mockUserId}`, JSON.stringify(mockAIMemoryData)],
        [`@global_preferences_${mockUserId}`, JSON.stringify(mockGlobalPreferences)],
        [`@user_stats_${mockUserId}`, JSON.stringify(mockUserStats)],
        [`@legacy_memories_${mockUserId}`, JSON.stringify(mockLegacyMemories)],
      ]);
      
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => 
        Promise.resolve(mockStorage.get(key) || null)
      );
      (AsyncStorage.removeItem as jest.Mock).mockImplementation((key) => {
        mockStorage.delete(key);
        return Promise.resolve();
      });
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(Array.from(mockStorage.keys()));
    });

    it('should cleanup legacy data after successful migration', async () => {
      await migrationService.performFullMigration(mockUserId);
      
      const cleaned = await migrationService.cleanupLegacyData(mockUserId);
      
      expect(cleaned).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@ai_memory_${mockUserId}`);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@global_preferences_${mockUserId}`);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@user_stats_${mockUserId}`);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`@legacy_memories_${mockUserId}`);
    });

    it('should not cleanup if migration is incomplete', async () => {
      const cleaned = await migrationService.cleanupLegacyData(mockUserId);
      
      expect(cleaned).toBe(false);
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      await migrationService.performFullMigration(mockUserId);
      
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove failed'));
      
      const cleaned = await migrationService.cleanupLegacyData(mockUserId);
      
      expect(cleaned).toBe(false);
    });
  });

  describe('Rollback Operations', () => {
    it('should rollback migration on critical failure', async () => {
      // Setup to fail during migration
      (memoryManager.createMemory as jest.Mock).mockRejectedValue(
        new Error('Critical error')
      );
      
      const result = await migrationService.performFullMigration(mockUserId);
      
      expect(result.success).toBe(false);
      
      const status = await migrationService.getMigrationStatus(mockUserId);
      expect(status.isComplete).toBe(false);
      expect(status.errors.length).toBeGreaterThan(0);
    });

    it('should allow retry after rollback', async () => {
      // First attempt fails
      (memoryManager.createMemory as jest.Mock).mockRejectedValueOnce(
        new Error('Temporary error')
      );
      
      await migrationService.performFullMigration(mockUserId);
      
      // Fix the issue
      (memoryManager.createMemory as jest.Mock).mockResolvedValue({
        id: 'mem_new',
        userId: mockUserId,
      });
      
      // Retry should work
      const result = await migrationService.performFullMigration(mockUserId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Migration Validation', () => {
    it('should validate migrated data', async () => {
      await migrationService.performFullMigration(mockUserId);
      
      const isValid = await migrationService.validateMigration(mockUserId);
      
      expect(isValid).toBe(true);
    });

    it('should detect incomplete migration', async () => {
      // Partial migration
      await migrationService.migrateAIMemory(mockUserId);
      
      const isValid = await migrationService.validateMigration(mockUserId);
      
      expect(isValid).toBe(false);
    });

    it('should check data integrity', async () => {
      await migrationService.performFullMigration(mockUserId);
      
      // Corrupt the migration status
      await migrationService.updateMigrationStatus(mockUserId, {
        totalMemoriesMigrated: -1, // Invalid value
      });
      
      const isValid = await migrationService.validateMigration(mockUserId);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    it('should track migration progress', async () => {
      const progressCallback = jest.fn();
      
      await migrationService.performFullMigration(mockUserId, {
        onProgress: progressCallback,
      });
      
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.any(Number),
          total: expect.any(Number),
          system: expect.any(String),
        })
      );
    });

    it('should report progress percentage', async () => {
      const progressUpdates: number[] = [];
      
      await migrationService.performFullMigration(mockUserId, {
        onProgress: (progress) => {
          progressUpdates.push(progress.percentage);
        },
      });
      
      expect(progressUpdates[0]).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });

  describe('Batch Migration', () => {
    it('should migrate multiple users in batch', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      
      const results = await migrationService.performBatchMigration(userIds);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle batch migration failures independently', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      
      // Make second user fail
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('user2')) {
          throw new Error('User 2 error');
        }
        return Promise.resolve(null);
      });
      
      const results = await migrationService.performBatchMigration(userIds);
      
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient errors', async () => {
      let attemptCount = 0;
      (memoryManager.createMemory as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve({ id: 'mem_success' });
      });
      
      const result = await migrationService.migrateWithRetry(
        mockUserId,
        'useAIMemory',
        3
      );
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      (memoryManager.createMemory as jest.Mock).mockRejectedValue(
        new Error('Persistent error')
      );
      
      const result = await migrationService.migrateWithRetry(
        mockUserId,
        'useAIMemory',
        3
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent error');
    });
  });
});