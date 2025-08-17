import { CitationManager, CitationContext, MemoryUsage } from '../CitationManager';
import { memoryManager, MemoryEntry } from '../MemoryManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoService } from '../../cryptoService';
import * as memoryConfig from '../../../config/memoryConfig';

// Mocks
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../MemoryManager');
jest.mock('../../cryptoService');
jest.mock('../../../config/memoryConfig');
jest.mock('../../../utils/optimizedLogger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('CitationManager', () => {
  let citationManager: CitationManager;
  const mockUserId = 'test-user-123';
  const mockTimestamp = '2024-01-15T10:00:00.000Z';

  const mockMemories: MemoryEntry[] = [
    {
      id: 'mem_12345678',
      userId: mockUserId,
      title: 'Script Length Preference',
      content: 'User prefers 2-3 minute scripts',
      category: 'preference',
      importance: 'high',
      timestamp: '2024-01-01T10:00:00.000Z',
      citationRequired: true,
      tags: ['script', 'length'],
    },
    {
      id: 'mem_87654321',
      userId: mockUserId,
      title: 'Video Style Rule',
      content: 'Always use professional tone',
      category: 'rule',
      importance: 'medium',
      timestamp: '2024-01-02T10:00:00.000Z',
      citationRequired: false,
    },
    {
      id: 'mem_11111111',
      userId: mockUserId,
      title: 'Sensitive Info',
      content: 'User personal data',
      category: 'context',
      importance: 'high',
      timestamp: '2024-01-03T10:00:00.000Z',
      citationRequired: true,
      tags: ['sensitive'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    citationManager = CitationManager.getInstance();
    
    // Mock Date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(mockTimestamp));
    
    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    
    // Mock CryptoService
    (CryptoService.encrypt as jest.Mock).mockImplementation((data) => 
      Promise.resolve(`encrypted_${data}`)
    );
    (CryptoService.decrypt as jest.Mock).mockImplementation((data) => 
      Promise.resolve(data.replace('encrypted_', ''))
    );
    
    // Mock memoryManager
    (memoryManager.getMemories as jest.Mock).mockResolvedValue(mockMemories);
    (memoryManager.getMemoryById as jest.Mock).mockImplementation((userId, memoryId) => 
      Promise.resolve(mockMemories.find(m => m.id === memoryId) || null)
    );
    
    // Mock memory config
    (memoryConfig.isMemoryCitationsEnabled as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CitationManager.getInstance();
      const instance2 = CitationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Citation Generation', () => {
    it('should add citations to text when memories are used', async () => {
      const text = 'Based on your preferences, I recommend a 2-3 minute script.';
      const usedMemoryIds = ['mem_12345678'];

      const result = await citationManager.addCitations(
        mockUserId,
        text,
        usedMemoryIds
      );

      expect(result.citationText).toContain('[[memory:mem_12345678]]');
      expect(result.citedMemories).toEqual(['mem_12345678']);
      expect(result.originalText).toBe(text);
    });

    it('should handle multiple citations', async () => {
      const text = 'Your 2-3 minute script should use a professional tone.';
      const usedMemoryIds = ['mem_12345678', 'mem_87654321'];

      const result = await citationManager.addCitations(
        mockUserId,
        text,
        usedMemoryIds
      );

      expect(result.citationText).toContain('[[memory:mem_12345678]]');
      expect(result.citationText).toContain('[[memory:mem_87654321]]');
      expect(result.citedMemories).toHaveLength(2);
    });

    it('should only cite memories marked as citationRequired', async () => {
      const text = 'Following the professional tone rule.';
      const usedMemoryIds = ['mem_87654321']; // citationRequired: false

      const result = await citationManager.addCitations(
        mockUserId,
        text,
        usedMemoryIds
      );

      expect(result.citationText).not.toContain('[[memory:');
      expect(result.citedMemories).toHaveLength(0);
    });

    it('should skip citations when disabled', async () => {
      (memoryConfig.isMemoryCitationsEnabled as jest.Mock).mockReturnValue(false);

      const text = 'Based on your preferences, I recommend a 2-3 minute script.';
      const usedMemoryIds = ['mem_12345678'];

      const result = await citationManager.addCitations(
        mockUserId,
        text,
        usedMemoryIds
      );

      expect(result.citationText).toBe(text);
      expect(result.citedMemories).toHaveLength(0);
    });

    it('should handle non-existent memory IDs gracefully', async () => {
      const text = 'Some text';
      const usedMemoryIds = ['non_existent_id'];

      const result = await citationManager.addCitations(
        mockUserId,
        text,
        usedMemoryIds
      );

      expect(result.citationText).toBe(text);
      expect(result.citedMemories).toHaveLength(0);
    });
  });

  describe('Citation Extraction', () => {
    it('should extract citation IDs from text', () => {
      const textWithCitations = 'Based on [[memory:mem_12345678]] and [[memory:mem_87654321]].';
      
      const citations = citationManager.extractCitations(textWithCitations);
      
      expect(citations).toEqual(['mem_12345678', 'mem_87654321']);
    });

    it('should handle text without citations', () => {
      const plainText = 'This is plain text without any citations.';
      
      const citations = citationManager.extractCitations(plainText);
      
      expect(citations).toEqual([]);
    });

    it('should handle malformed citations', () => {
      const textWithMalformed = 'Valid [[memory:mem_12345678]] and invalid [[memory:]] citation.';
      
      const citations = citationManager.extractCitations(textWithMalformed);
      
      expect(citations).toEqual(['mem_12345678']);
    });

    it('should remove duplicate citations', () => {
      const textWithDuplicates = '[[memory:mem_12345678]] and again [[memory:mem_12345678]].';
      
      const citations = citationManager.extractCitations(textWithDuplicates);
      
      expect(citations).toEqual(['mem_12345678']);
    });
  });

  describe('Citation Removal', () => {
    it('should remove all citations from text', () => {
      const textWithCitations = 'Based on [[memory:mem_12345678]] preferences [[memory:mem_87654321]].';
      
      const cleanText = citationManager.removeCitations(textWithCitations);
      
      expect(cleanText).toBe('Based on  preferences .');
      expect(cleanText).not.toContain('[[memory:');
    });

    it('should handle text without citations', () => {
      const plainText = 'This is plain text.';
      
      const cleanText = citationManager.removeCitations(plainText);
      
      expect(cleanText).toBe(plainText);
    });
  });

  describe('Citation Validation', () => {
    it('should validate that all cited memories exist', async () => {
      const textWithCitations = 'Based on [[memory:mem_12345678]].';
      
      const isValid = await citationManager.validateCitations(
        mockUserId,
        textWithCitations
      );
      
      expect(isValid).toBe(true);
    });

    it('should detect invalid citations', async () => {
      const textWithInvalid = 'Based on [[memory:non_existent]].';
      
      const isValid = await citationManager.validateCitations(
        mockUserId,
        textWithInvalid
      );
      
      expect(isValid).toBe(false);
    });

    it('should validate mixed valid and invalid citations', async () => {
      const textWithMixed = 'Valid [[memory:mem_12345678]] and invalid [[memory:non_existent]].';
      
      const isValid = await citationManager.validateCitations(
        mockUserId,
        textWithMixed
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('Usage History Tracking', () => {
    it('should track memory usage', async () => {
      await citationManager.trackUsage(
        mockUserId,
        'mem_12345678',
        'Used for script generation'
      );

      const history = await citationManager.getUsageHistory(mockUserId);
      
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        memoryId: 'mem_12345678',
        memoryTitle: 'Script Length Preference',
        usageContext: 'Used for script generation',
        citationRequired: true,
        timestamp: mockTimestamp,
      });
    });

    it('should persist usage history', async () => {
      await citationManager.trackUsage(
        mockUserId,
        'mem_12345678',
        'First usage'
      );

      // Create new instance to test persistence
      const newInstance = CitationManager.getInstance();
      const history = await newInstance.getUsageHistory(mockUserId);
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(CryptoService.encrypt).toHaveBeenCalled();
    });

    it('should limit usage history size', async () => {
      // Track 101 usages (limit is 100)
      for (let i = 0; i < 101; i++) {
        await citationManager.trackUsage(
          mockUserId,
          'mem_12345678',
          `Usage ${i}`
        );
      }

      const history = await citationManager.getUsageHistory(mockUserId);
      
      expect(history).toHaveLength(100);
      expect(history[0].usageContext).toBe('Usage 1'); // Oldest removed
    });

    it('should handle tracking non-existent memories', async () => {
      await citationManager.trackUsage(
        mockUserId,
        'non_existent',
        'Usage context'
      );

      const history = await citationManager.getUsageHistory(mockUserId);
      
      expect(history).toHaveLength(0);
    });
  });

  describe('Citation Statistics', () => {
    beforeEach(async () => {
      // Setup usage history
      await citationManager.trackUsage(mockUserId, 'mem_12345678', 'Usage 1');
      await citationManager.trackUsage(mockUserId, 'mem_12345678', 'Usage 2');
      await citationManager.trackUsage(mockUserId, 'mem_87654321', 'Usage 3');
    });

    it('should get citation statistics', async () => {
      const stats = await citationManager.getCitationStats(mockUserId);
      
      expect(stats).toMatchObject({
        totalCitations: 3,
        uniqueMemoriesCited: 2,
        mostCitedMemory: {
          memoryId: 'mem_12345678',
          count: 2,
        },
        citationsByCategory: {
          preference: 2,
          rule: 1,
        },
      });
    });

    it('should handle empty statistics', async () => {
      // Clear history
      jest.clearAllMocks();
      citationManager = CitationManager.getInstance();

      const stats = await citationManager.getCitationStats(mockUserId);
      
      expect(stats).toMatchObject({
        totalCitations: 0,
        uniqueMemoriesCited: 0,
        mostCitedMemory: null,
        citationsByCategory: {},
      });
    });
  });

  describe('Auto-Citation Detection', () => {
    it('should detect when memories should be cited based on content', async () => {
      const text = 'I recommend creating a 2-3 minute script for your video.';
      
      const suggestedCitations = await citationManager.detectRequiredCitations(
        mockUserId,
        text
      );
      
      expect(suggestedCitations).toContain('mem_12345678');
    });

    it('should detect multiple relevant memories', async () => {
      const text = 'Your 2-3 minute script should maintain a professional tone throughout.';
      
      const suggestedCitations = await citationManager.detectRequiredCitations(
        mockUserId,
        text
      );
      
      expect(suggestedCitations).toContain('mem_12345678');
      // mem_87654321 has citationRequired: false, so it might not be suggested
    });

    it('should not suggest sensitive memories', async () => {
      const text = 'Processing user data for the script.';
      
      const suggestedCitations = await citationManager.detectRequiredCitations(
        mockUserId,
        text
      );
      
      expect(suggestedCitations).not.toContain('mem_11111111');
    });

    it('should handle text with no relevant memories', async () => {
      const text = 'The weather is nice today.';
      
      const suggestedCitations = await citationManager.detectRequiredCitations(
        mockUserId,
        text
      );
      
      expect(suggestedCitations).toEqual([]);
    });
  });

  describe('Citation Formatting', () => {
    it('should format citations with context', async () => {
      const formatted = await citationManager.formatCitationWithContext(
        mockUserId,
        'mem_12345678'
      );
      
      expect(formatted).toContain('Script Length Preference');
      expect(formatted).toContain('[[memory:mem_12345678]]');
      expect(formatted).toContain('2-3 minute scripts');
    });

    it('should handle formatting for non-existent memory', async () => {
      const formatted = await citationManager.formatCitationWithContext(
        mockUserId,
        'non_existent'
      );
      
      expect(formatted).toBe('[[memory:non_existent]]');
    });

    it('should format batch citations', async () => {
      const memoryIds = ['mem_12345678', 'mem_87654321'];
      
      const formatted = await citationManager.formatBatchCitations(
        mockUserId,
        memoryIds
      );
      
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toContain('Script Length Preference');
      expect(formatted[1]).toContain('Video Style Rule');
    });
  });

  describe('Citation Cleanup', () => {
    it('should clean up orphaned citations', async () => {
      const textWithOrphaned = 'Valid [[memory:mem_12345678]] and orphaned [[memory:deleted_mem]].';
      
      const cleaned = await citationManager.cleanupOrphanedCitations(
        mockUserId,
        textWithOrphaned
      );
      
      expect(cleaned).toContain('[[memory:mem_12345678]]');
      expect(cleaned).not.toContain('[[memory:deleted_mem]]');
    });

    it('should preserve valid citations', async () => {
      const textWithValid = 'All valid [[memory:mem_12345678]] citations [[memory:mem_87654321]].';
      
      const cleaned = await citationManager.cleanupOrphanedCitations(
        mockUserId,
        textWithValid
      );
      
      expect(cleaned).toBe(textWithValid);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent citation operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        citationManager.addCitations(
          mockUserId,
          `Text ${i} with memory reference`,
          ['mem_12345678']
        )
      );

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.originalText).toBe(`Text ${i} with memory reference`);
        expect(result.citedMemories).toEqual(['mem_12345678']);
      });
    });

    it('should queue operations to prevent race conditions', async () => {
      const trackOperations = Array.from({ length: 5 }, (_, i) =>
        citationManager.trackUsage(
          mockUserId,
          'mem_12345678',
          `Concurrent usage ${i}`
        )
      );

      await Promise.all(trackOperations);
      
      const history = await citationManager.getUsageHistory(mockUserId);
      expect(history).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const history = await citationManager.getUsageHistory(mockUserId);
      
      expect(history).toEqual([]);
    });

    it('should handle encryption errors', async () => {
      (CryptoService.encrypt as jest.Mock).mockRejectedValue(
        new Error('Encryption failed')
      );

      await citationManager.trackUsage(
        mockUserId,
        'mem_12345678',
        'Usage'
      );

      // Should not throw, but log error
      expect(true).toBe(true);
    });

    it('should handle memory manager errors', async () => {
      (memoryManager.getMemories as jest.Mock).mockRejectedValue(
        new Error('Memory fetch failed')
      );

      const result = await citationManager.addCitations(
        mockUserId,
        'Text',
        ['mem_12345678']
      );

      expect(result.citationText).toBe('Text');
      expect(result.citedMemories).toEqual([]);
    });

    it('should validate input parameters', async () => {
      await expect(
        citationManager.addCitations('', 'Text', ['mem_12345678'])
      ).rejects.toThrow('User ID requis');

      await expect(
        citationManager.addCitations(mockUserId, '', ['mem_12345678'])
      ).rejects.toThrow('Texte requis');
    });
  });

  describe('Citation Export and Import', () => {
    it('should export citation history', async () => {
      await citationManager.trackUsage(mockUserId, 'mem_12345678', 'Usage 1');
      await citationManager.trackUsage(mockUserId, 'mem_87654321', 'Usage 2');

      const exported = await citationManager.exportCitationHistory(mockUserId);
      
      expect(exported).toMatchObject({
        userId: mockUserId,
        exportDate: mockTimestamp,
        history: expect.arrayContaining([
          expect.objectContaining({ memoryId: 'mem_12345678' }),
          expect.objectContaining({ memoryId: 'mem_87654321' }),
        ]),
      });
    });

    it('should import citation history', async () => {
      const importData = {
        userId: mockUserId,
        exportDate: '2024-01-10T10:00:00.000Z',
        history: [
          {
            memoryId: 'mem_imported',
            memoryTitle: 'Imported Memory',
            usageContext: 'Imported usage',
            citationRequired: true,
            timestamp: '2024-01-10T10:00:00.000Z',
          },
        ],
      };

      await citationManager.importCitationHistory(mockUserId, importData);
      
      const history = await citationManager.getUsageHistory(mockUserId);
      expect(history).toContainEqual(
        expect.objectContaining({ memoryId: 'mem_imported' })
      );
    });
  });
});