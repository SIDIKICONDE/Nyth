import AsyncStorage from "@react-native-async-storage/async-storage";
import { embeddingService } from "../embedding/EmbeddingService";

export type KnowledgeItem = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
  lang?: "fr" | "en";
};

type EmbeddingsCache = Record<string, number[]>;

const CACHE_KEY = "@faq_embeddings_v1";

async function loadFAQ(): Promise<KnowledgeItem[]> {
  const mod = await import("../../knowledge/faq.json");
  const data = (mod as { default: KnowledgeItem[] }).default;
  return Array.isArray(data) ? data : [];
}

async function loadCache(): Promise<EmbeddingsCache> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as EmbeddingsCache) : {};
  } catch {
    return {};
  }
}

async function saveCache(cache: EmbeddingsCache): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function getEmbeddingFor(text: string): Promise<number[]> {
  const vec = await embeddingService.embedText(text);
  return Array.isArray(vec) ? vec : [];
}

function similarity(a: number[], b: number[]): number {
  return embeddingService.cosineSimilarity(a, b);
}

export class KnowledgeService {
  static async searchTopK(
    query: string,
    topK: number = 3,
    minScore: number = 0.35,
    language: "fr" | "en" = "fr"
  ): Promise<Array<{ item: KnowledgeItem; score: number }>> {
    const items = await loadFAQ();
    const cache = await loadCache();
    const queryEmbedding = await getEmbeddingFor(query);
    if (queryEmbedding.length === 0) return [];

    const scored: Array<{ item: KnowledgeItem; score: number }> = [];
    for (const it of items) {
      if (it.lang && it.lang !== language) continue;
      const key = it.id;
      let emb = cache[key];
      if (!emb || emb.length === 0) {
        const toEmbed = `${it.question}\n${it.answer}`;
        emb = await getEmbeddingFor(toEmbed);
        cache[key] = emb;
      }
      if (emb && emb.length > 0) {
        const s = similarity(queryEmbedding, emb);
        if (!Number.isNaN(s)) {
          scored.push({ item: it, score: s });
        }
      }
    }

    await saveCache(cache);
    return scored
      .filter((x) => x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
