// Tests unitaires pour EmbeddingService
import { embeddingService } from '../../embedding/EmbeddingService';

// Mocks pour les providers d'IA
jest.mock('../../ai/ApiKeyManager', () => ({
  ApiKeyManager: {
    getOpenAIKey: jest.fn(),
    getGeminiKey: jest.fn(),
    getMistralKey: jest.fn(),
  },
}));

jest.mock('../../../config/firebase', () => ({
  functions: {
    httpsCallable: jest.fn(),
  },
}));

jest.mock('../../../config/aiConfig', () => ({
  getEnabledProviders: jest.fn(),
}));

jest.mock('../../../utils/optimizedLogger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('EmbeddingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    embeddingService['isInitialized'] = false;
    embeddingService['embedder'] = undefined;
    embeddingService['dim'] = 384; // Reset dimension
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = embeddingService;
      const instance2 = embeddingService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('getDimension', () => {
    it('should return default dimension when not initialized', () => {
      const dimension = embeddingService.getDimension();
      expect(dimension).toBe(384);
    });

    it('should return updated dimension after initialization', async () => {
      // Mock Firebase Functions success
      const { functions } = require('../../../config/firebase');
      const mockEmbeddingsProxy = jest.fn().mockResolvedValue({
        data: {
          embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]], // 5 dimensions
        },
      });
      (functions.httpsCallable as jest.Mock).mockReturnValue(mockEmbeddingsProxy);

      await embeddingService.embedText('test');

      const dimension = embeddingService.getDimension();
      expect(dimension).toBe(5);
    });
  });

  describe('embedText', () => {
    it('should use Firebase Functions when available', async () => {
      const { functions } = require('../../../config/firebase');
      const mockEmbeddingsProxy = jest.fn().mockResolvedValue({
        data: {
          embeddings: [[0.1, 0.2, 0.3]],
        },
      });
      (functions.httpsCallable as jest.Mock).mockReturnValue(mockEmbeddingsProxy);

      const result = await embeddingService.embedText('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockEmbeddingsProxy).toHaveBeenCalledWith({
        input: 'test text',
        model: 'text-embedding-3-small',
      });
    });

    it('should fallback to OpenAI when Firebase Functions fail', async () => {
      const { functions, ApiKeyManager } = require('../../../config/firebase');
      const mockEmbeddingsProxy = jest.fn().mockRejectedValue(new Error('Firebase error'));
      (functions.httpsCallable as jest.Mock).mockReturnValue(mockEmbeddingsProxy);

      // Mock OpenAI API
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: [0.1, 0.2, 0.3] }],
        }),
      });

      (ApiKeyManager.getOpenAIKey as jest.Mock).mockResolvedValue('test-openai-key');
      const { getEnabledProviders } = require('../../../config/aiConfig');
      (getEnabledProviders as jest.Mock).mockResolvedValue(['OPENAI']);

      const result = await embeddingService.embedText('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-openai-key',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: 'test text',
          }),
        })
      );
    });

    it('should fallback to Gemini when OpenAI fails', async () => {
      const { ApiKeyManager } = require('../../ai/ApiKeyManager');
      const { getEnabledProviders } = require('../../../config/aiConfig');

      // Mock providers
      (ApiKeyManager.getOpenAIKey as jest.Mock).mockResolvedValue('test-openai-key');
      (ApiKeyManager.getGeminiKey as jest.Mock).mockResolvedValue('test-gemini-key');
      (getEnabledProviders as jest.Mock).mockResolvedValue(['OPENAI', 'GEMINI']);

      // OpenAI fails, Gemini succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            embedding: { values: [0.1, 0.2, 0.3] },
          }),
        });

      const result = await embeddingService.embedText('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should fallback to Mistral when other providers fail', async () => {
      const { ApiKeyManager } = require('../../ai/ApiKeyManager');
      const { getEnabledProviders } = require('../../../config/aiConfig');

      // Mock providers
      (ApiKeyManager.getOpenAIKey as jest.Mock).mockResolvedValue('test-openai-key');
      (ApiKeyManager.getGeminiKey as jest.Mock).mockResolvedValue('test-gemini-key');
      (ApiKeyManager.getMistralKey as jest.Mock).mockResolvedValue('test-mistral-key');
      (getEnabledProviders as jest.Mock).mockResolvedValue(['OPENAI', 'GEMINI', 'MISTRAL']);

      // OpenAI and Gemini fail, Mistral succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockRejectedValueOnce(new Error('Gemini error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
          }),
        });

      const result = await embeddingService.embedText('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should return null when all providers fail', async () => {
      const { ApiKeyManager } = require('../../ai/ApiKeyManager');
      const { getEnabledProviders } = require('../../../config/aiConfig');

      (ApiKeyManager.getOpenAIKey as jest.Mock).mockResolvedValue('test-openai-key');
      (getEnabledProviders as jest.Mock).mockResolvedValue(['OPENAI']);

      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      const result = await embeddingService.embedText('test text');

      expect(result).toBeNull();
    });

    it('should return null when no providers are configured', async () => {
      const { getEnabledProviders } = require('../../../config/aiConfig');
      (getEnabledProviders as jest.Mock).mockResolvedValue([]);

      const result = await embeddingService.embedText('test text');

      expect(result).toBeNull();
    });

    it('should handle empty text', async () => {
      const { functions } = require('../../../config/firebase');
      const mockEmbeddingsProxy = jest.fn().mockResolvedValue({
        data: {
          embeddings: [[0.1, 0.2, 0.3]],
        },
      });
      (functions.httpsCallable as jest.Mock).mockReturnValue(mockEmbeddingsProxy);

      const result = await embeddingService.embedText('');

      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];

      const similarity = embeddingService.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(1); // Identical vectors should have similarity of 1
    });

    it('should calculate cosine similarity for orthogonal vectors', () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];

      const similarity = embeddingService.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(0); // Orthogonal vectors should have similarity of 0
    });

    it('should calculate cosine similarity for opposite vectors', () => {
      const vec1 = [1, 2];
      const vec2 = [-1, -2];

      const similarity = embeddingService.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(-1); // Opposite vectors should have similarity of -1
    });

    it('should handle zero vectors', () => {
      const vec1 = [0, 0];
      const vec2 = [1, 1];

      const similarity = embeddingService.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(0); // Zero vector should have similarity of 0 with any vector
    });

    it('should handle vectors of different lengths', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2];

      const similarity = embeddingService.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(1); // Should use the minimum length
    });
  });

  describe('meanPool', () => {
    it('should calculate mean pooling correctly', () => {
      const tensor = {
        data: new Float32Array([1, 2, 3, 4, 5, 6]), // 2 tokens, 3 dimensions
        dims: [1, 2, 3],
      };

      const result = (embeddingService as any).meanPool(tensor);

      expect(result).toEqual(new Float32Array([2.5, 3.5, 4.5])); // Mean of [1,4], [2,5], [3,6]
    });

    it('should handle single token', () => {
      const tensor = {
        data: new Float32Array([1, 2, 3]), // 1 token, 3 dimensions
        dims: [1, 1, 3],
      };

      const result = (embeddingService as any).meanPool(tensor);

      expect(result).toEqual(new Float32Array([1, 2, 3]));
    });
  });

  describe('Provider Integration', () => {
    describe('OpenAI Integration', () => {
      beforeEach(() => {
        const { ApiKeyManager } = require('../../ai/ApiKeyManager');
        (ApiKeyManager.getOpenAIKey as jest.Mock).mockResolvedValue('test-key');
      });

      it('should call OpenAI API with correct parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
          }),
        });

        await embeddingService.embedText('test');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.openai.com/v1/embeddings',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-key',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: 'test',
            }),
          })
        );
      });

      it('should handle OpenAI API errors', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 401 });

        const result = await embeddingService.embedText('test');

        expect(result).toBeNull();
      });
    });

    describe('Gemini Integration', () => {
      beforeEach(() => {
        const { ApiKeyManager } = require('../../ai/ApiKeyManager');
        (ApiKeyManager.getGeminiKey as jest.Mock).mockResolvedValue('test-key');
      });

      it('should call Gemini API with correct parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            embedding: { values: [0.1, 0.2, 0.3] },
          }),
        });

        await embeddingService.embedText('test');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=test-key',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'models/text-embedding-004',
              content: { parts: [{ text: 'test' }] },
            }),
          })
        );
      });
    });

    describe('Mistral Integration', () => {
      beforeEach(() => {
        const { ApiKeyManager } = require('../../ai/ApiKeyManager');
        (ApiKeyManager.getMistralKey as jest.Mock).mockResolvedValue('test-key');
      });

      it('should call Mistral API with correct parameters', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
          }),
        });

        await embeddingService.embedText('test');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.mistral.ai/v1/embeddings',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-key',
            },
            body: JSON.stringify({
              model: 'mistral-embed',
              input: 'test',
            }),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await embeddingService.embedText('test');

      expect(result).toBeNull();
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      const result = await embeddingService.embedText('test');

      expect(result).toBeNull();
    });

    it('should handle API rate limiting', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 429 });

      const result = await embeddingService.embedText('test');

      expect(result).toBeNull();
    });
  });
});
