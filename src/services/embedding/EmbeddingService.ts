import { createLogger } from "../../utils/optimizedLogger";

export type EmbeddingVector = number[];
type EmbedderOutput = { data: Float32Array; dims: number[] };
type EmbedderFn = (
  text: string,
  options?: { normalize?: boolean }
) => Promise<EmbedderOutput>;

class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private isInitialized: boolean = false;
  private dim: number = 384; // default expected dimension for MiniLM models
  private embedder: EmbedderFn | undefined = undefined;
  private logger = createLogger("EmbeddingService");

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  getDimension(): number {
    return this.dim;
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized) return true;
    // Use server-side embeddings via functions proxy
    this.embedder = async (text: string) => {
      const { getSecureHeaders } = await import("../../utils/securityUtils");
      const { SERVER_CONFIG } = await import("../../config/serverConfig");
      const headers = await getSecureHeaders();
      const response = await fetch(
        `${SERVER_CONFIG.BASE_URL}/embeddingsProxy`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small",
          }),
        }
      );
      if (response.ok) {
        const data = (await response.json()) as { embeddings: number[][] };
        const vec = (data.embeddings?.[0] || []) as number[];
        const dims = [1, 1, vec.length];
        const arr = new Float32Array(vec);
        return { data: arr, dims } as EmbedderOutput;
      }

      if (response.status !== 404) {
        throw new Error(`Embeddings HTTP ${response.status}`);
      }

      const { ApiKeyManager } = await import("../ai/ApiKeyManager");

      const openaiKey = await ApiKeyManager.getOpenAIKey();
      if (openaiKey) {
        type OpenAIEmbeddingsResponse = {
          data: { embedding: number[]; index: number }[];
        };
        const r = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text,
          }),
        });
        if (!r.ok) throw new Error(`Embeddings HTTP ${r.status}`);
        const j = (await r.json()) as OpenAIEmbeddingsResponse;
        const vec = (j.data?.[0]?.embedding || []) as number[];
        const dims = [1, 1, vec.length];
        return { data: new Float32Array(vec), dims } as EmbedderOutput;
      }

      const geminiKey = await ApiKeyManager.getGeminiKey();
      if (geminiKey) {
        type GeminiEmbeddingResponse = { embedding?: { values?: number[] } };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text }] },
          }),
        });
        if (!r.ok) throw new Error(`Embeddings HTTP ${r.status}`);
        const j = (await r.json()) as GeminiEmbeddingResponse;
        const vec = (j.embedding?.values || []) as number[];
        const dims = [1, 1, vec.length];
        return { data: new Float32Array(vec), dims } as EmbedderOutput;
      }

      const mistralKey = await ApiKeyManager.getMistralKey();
      if (mistralKey) {
        type OpenAIEmbeddingsResponse = {
          data: { embedding: number[]; index: number }[];
        };
        const r = await fetch("https://api.mistral.ai/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mistralKey}`,
          },
          body: JSON.stringify({ model: "mistral-embed", input: text }),
        });
        if (!r.ok) throw new Error(`Embeddings HTTP ${r.status}`);
        const j = (await r.json()) as OpenAIEmbeddingsResponse;
        const vec = (j.data?.[0]?.embedding || []) as number[];
        const dims = [1, 1, vec.length];
        return { data: new Float32Array(vec), dims } as EmbedderOutput;
      }

      throw new Error("Embeddings HTTP 404");
    };
    try {
      const probe = await this.embedder("ok", { normalize: true });
      const dims = Array.isArray((probe as EmbedderOutput).dims)
        ? (probe as EmbedderOutput).dims
        : [1, 1, 0];
      const d = dims.length >= 3 ? dims[2] : 0;
      if (d > 0) this.dim = d;
    } catch {}
    this.isInitialized = true;
    return true;
  }

  private meanPool(tensor: {
    data: Float32Array;
    dims: number[];
  }): Float32Array {
    const tokens = tensor.dims[1];
    const dim = tensor.dims[2];
    const out = new Float32Array(dim);
    for (let t = 0; t < tokens; t++) {
      for (let d = 0; d < dim; d++) {
        out[d] += tensor.data[t * dim + d];
      }
    }
    for (let d = 0; d < dim; d++) out[d] /= tokens;
    return out;
  }

  async embedText(text: string): Promise<EmbeddingVector | null> {
    const ok = await this.ensureInitialized();
    if (!ok || !this.embedder) return null;

    try {
      const output = await this.embedder(text, { normalize: true });
      const pooled = this.meanPool(output);
      // Convert to JS number[]
      const vector: number[] = Array.from(pooled);
      return vector;
    } catch (error) {
      this.logger.error("❌ Failed to embed text:", error);
      return null;
    }
  }

  cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < len; i++) {
      const ai = a[i] || 0;
      const bi = b[i] || 0;
      dot += ai * bi;
      na += ai * ai;
      nb += bi * bi;
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb) + 1e-8;
    return denom > 0 ? dot / denom : 0;
  }
}

export const embeddingService = EmbeddingService.getInstance();
