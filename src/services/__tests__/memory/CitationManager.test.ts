// Tests unitaires pour CitationManager
import { CitationManager } from '../../memory/CitationManager';
import { memoryManager } from '../../memory/MemoryManager';
import { MemoryEntry } from '../../memory/MemoryManager';

// Mocks
jest.mock('../../memory/MemoryManager', () => ({
  memoryManager: {
    loadUserMemory: jest.fn(),
  },
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

jest.mock('../../../config/memoryConfig', () => ({
  MEMORY_CITATIONS_ENABLED: true,
  isMemoryCitationsEnabled: jest.fn(),
}));

describe('CitationManager', () => {
  let citationManager: CitationManager;
  const userId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    CitationManager['instance'] = null; // Reset singleton
    citationManager = CitationManager.getInstance();

    // Mock isMemoryCitationsEnabled
    const { isMemoryCitationsEnabled } = require('../../../config/memoryConfig');
    (isMemoryCitationsEnabled as jest.Mock).mockResolvedValue(true);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CitationManager.getInstance();
      const instance2 = CitationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('processTextWithCitations', () => {
    const mockMemories: MemoryEntry[] = [
      {
        id: 'memory1',
        title: 'Script Length Preference',
        content: 'I prefer short scripts with clear structure',
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
        content: 'Working on video project for marketing',
        category: 'context',
        importance: 'medium',
        timestamp: '2024-01-02T00:00:00Z',
        userId,
        citationRequired: false,
        tags: ['work', 'video'],
      },
    ];

    beforeEach(() => {
      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });
    });

    it('should process text and add citations for relevant memories', async () => {
      const text = 'I need a short script with clear structure for my video project';
      const contextHint = 'Script generation';

      const result = await citationManager.processTextWithCitations(userId, text, contextHint);

      expect(result.citedMemories).toContain('memory1');
      expect(result.citationText).toContain('[[memory:memory1]]');
      expect(result.originalText).toBe(text);
    });

    it('should not add citations when disabled', async () => {
      const { isMemoryCitationsEnabled } = require('../../../config/memoryConfig');
      (isMemoryCitationsEnabled as jest.Mock).mockResolvedValue(false);

      const text = 'I need a short script';
      const result = await citationManager.processTextWithCitations(userId, text);

      expect(result.citedMemories).toHaveLength(0);
      expect(result.citationText).toBe(text);
    });

    it('should handle errors gracefully', async () => {
      (memoryManager.loadUserMemory as jest.Mock).mockRejectedValue(new Error('Load failed'));

      const text = 'Test text';
      const result = await citationManager.processTextWithCitations(userId, text);

      expect(result.citedMemories).toHaveLength(0);
      expect(result.citationText).toBe(text);
    });
  });

  describe('validateCitations', () => {
    const mockMemories: MemoryEntry[] = [
      {
        id: 'memory1',
        title: 'Required Citation Memory',
        content: 'Important preference that must be cited',
        category: 'preference',
        importance: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: true,
        tags: ['important'],
      },
    ];

    beforeEach(() => {
      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });
    });

    it('should validate citations successfully when all required citations are present', async () => {
      const text = 'This text includes the required memory [[memory:memory1]]';
      const result = await citationManager.validateCitations(userId, text);

      expect(result.isValid).toBe(true);
      expect(result.missingCitations).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing citations', async () => {
      const text = 'This text uses the memory but without citation';
      const result = await citationManager.validateCitations(userId, text);

      expect(result.isValid).toBe(false);
      expect(result.missingCitations).toContain('Required Citation Memory');
      expect(result.warnings).toHaveLength(1);
    });

    it('should not require citations when disabled', async () => {
      const { isMemoryCitationsEnabled } = require('../../../config/memoryConfig');
      (isMemoryCitationsEnabled as jest.Mock).mockResolvedValue(false);

      const text = 'This text uses memory without citation';
      const result = await citationManager.validateCitations(userId, text);

      expect(result.isValid).toBe(true);
      expect(result.missingCitations).toHaveLength(0);
    });
  });

  describe('extractCitedMemoryIds', () => {
    it('should extract memory IDs from citations', () => {
      const text = 'This text has citations [[memory:memory1]] and [[memory:memory2]]';
      const result = citationManager.extractCitedMemoryIds(text);

      expect(result).toEqual(['memory1', 'memory2']);
    });

    it('should return unique IDs when there are duplicates', () => {
      const text = 'This text has duplicate citations [[memory:memory1]] and [[memory:memory1]]';
      const result = citationManager.extractCitedMemoryIds(text);

      expect(result).toEqual(['memory1']);
    });

    it('should return empty array when no citations found', () => {
      const text = 'This text has no citations';
      const result = citationManager.extractCitedMemoryIds(text);

      expect(result).toHaveLength(0);
    });
  });

  describe('convertCitationsToReadable', () => {
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

    beforeEach(() => {
      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: mockMemories,
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });
    });

    it('should convert citations to readable format', async () => {
      const text = 'This text has a citation [[memory:memory1]]';
      const result = await citationManager.convertCitationsToReadable(userId, text);

      expect(result).toContain('[Source: Test Memory]');
      expect(result).not.toContain('[[memory:memory1]]');
    });

    it('should handle text without citations', async () => {
      const text = 'This text has no citations';
      const result = await citationManager.convertCitationsToReadable(userId, text);

      expect(result).toBe(text);
    });

    it('should return original text when citations are disabled', async () => {
      const { isMemoryCitationsEnabled } = require('../../../config/memoryConfig');
      (isMemoryCitationsEnabled as jest.Mock).mockResolvedValue(false);

      const text = 'This text has a citation [[memory:memory1]]';
      const result = await citationManager.convertCitationsToReadable(userId, text);

      expect(result).toBe('');
    });
  });

  describe('generateUsageReport', () => {
    const mockUsageHistory = [
      {
        memoryId: 'memory1',
        memoryTitle: 'Test Memory',
        usageContext: 'Script generation',
        citationRequired: true,
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        memoryId: 'memory1',
        memoryTitle: 'Test Memory',
        usageContext: 'Chat response',
        citationRequired: true,
        timestamp: '2024-01-02T00:00:00Z',
      },
    ];

    beforeEach(() => {
      citationManager['usageHistory'].set(userId, mockUsageHistory);

      (memoryManager.loadUserMemory as jest.Mock).mockResolvedValue({
        userId,
        entries: [
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
        ],
        lastUpdated: '2024-01-01T00:00:00Z',
        version: '1.1.0',
      });
    });

    it('should generate usage report successfully', async () => {
      const report = await citationManager.generateUsageReport(userId);

      expect(report.totalUsages).toBe(2);
      expect(report.mostUsedMemories).toHaveLength(1);
      expect(report.mostUsedMemories[0].memoryId).toBe('memory1');
      expect(report.mostUsedMemories[0].usageCount).toBe(2);
      expect(report.recentUsages).toHaveLength(2);
      expect(report.citationStats.totalCitationsRequired).toBe(2);
      expect(report.citationStats.complianceRate).toBe(100);
    });

    it('should handle empty usage history', async () => {
      citationManager['usageHistory'].set(userId, []);

      const report = await citationManager.generateUsageReport(userId);

      expect(report.totalUsages).toBe(0);
      expect(report.mostUsedMemories).toHaveLength(0);
      expect(report.citationStats.complianceRate).toBe(100);
    });
  });

  describe('clearUsageHistory', () => {
    beforeEach(() => {
      citationManager['usageHistory'].set(userId, [
        {
          memoryId: 'memory1',
          memoryTitle: 'Test Memory',
          usageContext: 'Test',
          citationRequired: true,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ]);
    });

    it('should clear usage history', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await citationManager.clearUsageHistory(userId);

      expect(citationManager['usageHistory'].has(userId)).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'citation_history_test-user-123'
      );
    });
  });

  describe('detectMemoryUsage', () => {
    const mockMemory: MemoryEntry = {
      id: 'memory1',
      title: 'Script Length',
      content: 'I prefer short scripts with clear structure',
      category: 'preference',
      importance: 'high',
      timestamp: '2024-01-01T00:00:00Z',
      userId,
      citationRequired: true,
    };

    it('should detect memory usage by keywords', () => {
      const text = 'I need a short script with clear structure';
      const result = (citationManager as any).detectMemoryUsage(text, mockMemory);

      expect(result).toBe(true);
    });

    it('should detect memory usage by category', () => {
      const preferenceMemory: MemoryEntry = {
        ...mockMemory,
        category: 'preference',
        content: 'I prefer detailed explanations',
      };

      const text = 'I would like to have detailed explanations';
      const result = (citationManager as any).detectMemoryUsage(text, preferenceMemory);

      expect(result).toBe(true);
    });

    it('should not detect usage when no keywords match', () => {
      const text = 'I need a long and complicated script';
      const result = (citationManager as any).detectMemoryUsage(text, mockMemory);

      expect(result).toBe(false);
    });
  });

  describe('extractKeywords', () => {
    it('should extract relevant keywords from text', () => {
      const text = 'I prefer short scripts with clear structure and good examples';
      const result = (citationManager as any).extractKeywords(text);

      expect(result).toContain('scripts');
      expect(result).toContain('structure');
      expect(result).not.toContain('le');
      expect(result).not.toContain('et');
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should filter out short words', () => {
      const text = 'I like to do things';
      const result = (citationManager as any).extractKeywords(text);

      expect(result).not.toContain('do');
      expect(result).not.toContain('to');
    });
  });

  describe('detectCategoryUsage', () => {
    it('should detect preference usage', () => {
      const text = 'I would like to prefer this option';
      const result = (citationManager as any).detectCategoryUsage(text, {
        category: 'preference',
      } as MemoryEntry);

      expect(result).toBe(true);
    });

    it('should detect rule usage', () => {
      const text = 'This is a mandatory rule that must be followed';
      const result = (citationManager as any).detectCategoryUsage(text, {
        category: 'rule',
      } as MemoryEntry);

      expect(result).toBe(true);
    });

    it('should detect context usage', () => {
      const text = 'This is the context of our current project';
      const result = (citationManager as any).detectCategoryUsage(text, {
        category: 'context',
      } as MemoryEntry);

      expect(result).toBe(true);
    });

    it('should not detect usage for unknown category', () => {
      const text = 'This is some random text';
      const unknownMemory: MemoryEntry = {
        id: 'unknown1',
        title: 'Unknown Memory',
        content: 'Unknown content',
        category: 'unknown' as any,
        importance: 'medium',
        timestamp: '2024-01-01T00:00:00Z',
        userId,
        citationRequired: false,
      };

      const result = (citationManager as any).detectCategoryUsage(text, unknownMemory);
      expect(result).toBe(false);
    });
  });

  describe('insertCitation', () => {
    const mockMemory: MemoryEntry = {
      id: 'memory1',
      title: 'Test Memory',
      content: 'Test content',
      category: 'preference',
      importance: 'high',
      timestamp: '2024-01-01T00:00:00Z',
      userId,
      citationRequired: true,
    };

    it('should insert citation in relevant sentence', () => {
      const text = 'I prefer short scripts. I also like clear structure.';
      const result = (citationManager as any).insertCitation(
        text,
        mockMemory,
        '[[memory:memory1]]'
      );

      expect(result).toContain('[[memory:memory1]]');
    });

    it('should add citation at end if no relevant position found', () => {
      const text = 'This is unrelated text.';
      const result = (citationManager as any).insertCitation(
        text,
        mockMemory,
        '[[memory:memory1]]'
      );

      expect(result).toBe('This is unrelated text. [[memory:memory1]]');
    });
  });
});
