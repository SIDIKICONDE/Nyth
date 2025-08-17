import type { Language, MemoryIntent } from "./messageFilter";

const INTENTS: MemoryIntent[] = [
  "remember_explicit",
  "preference",
  "directive",
  "profile",
  "goal",
  "problem",
  "fact",
  "schedule",
];

const INTENT_TEMPLATES: Record<MemoryIntent, string[]> = {
  remember_explicit: [
    "Please remember this",
    "Do not forget this",
    "Keep this in mind",
    "Souviens-toi de ceci",
    "N'oublie pas ceci",
  ],
  preference: ["This is my preference", "I prefer", "J'aime", "Je préfère"],
  directive: [
    "This is a rule you should always follow",
    "From now on, always do this",
    "Toujours",
    "Jamais",
  ],
  profile: [
    "This is about my profile or personal non-sensitive info",
    "Ceci concerne mon profil",
  ],
  goal: ["This is my goal or long-term objective", "Mon objectif", "Je veux"],
  problem: [
    "This is a recurring problem for me",
    "J'ai du mal avec",
    "Ça ne marche pas souvent",
  ],
  fact: [
    "This is a stable fact about my tools/devices/preferences",
    "Ceci est un fait stable",
  ],
  schedule: [
    "This is a reminder or schedule request",
    "Ceci est une demande de rappel",
  ],
};

type EmbeddingTensor = { data: Float32Array; dims: number[] };

function meanPool(tensor: EmbeddingTensor): Float32Array {
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

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export type SemanticIntentScorer = (
  message: string,
  language: Language
) => Promise<Partial<Record<MemoryIntent, number>>>;

type XenovaModule = {
  pipeline: (task: string, model: string) => Promise<unknown>;
  env: { allowLocalModels: boolean };
};

export async function createSemanticIntentScorer(): Promise<SemanticIntentScorer> {
  const { embeddingService } = await import(
    "../../../../services/embedding/EmbeddingService"
  );

  const vectors: Record<MemoryIntent, Float32Array[]> = {
    remember_explicit: [],
    preference: [],
    directive: [],
    profile: [],
    goal: [],
    problem: [],
    fact: [],
    schedule: [],
  };

  async function embedToArray(text: string): Promise<Float32Array> {
    const v = await embeddingService.embedText(text);
    return new Float32Array(v || []);
  }

  for (const intent of INTENTS) {
    for (const t of INTENT_TEMPLATES[intent]) {
      vectors[intent].push(await embedToArray(t));
    }
  }

  const scorer: SemanticIntentScorer = async (message) => {
    const v = await embedToArray(message);
    if (v.length === 0) return {};
    const scores: Partial<Record<MemoryIntent, number>> = {};
    for (const intent of INTENTS) {
      const sims = vectors[intent]
        .filter((ref) => ref.length === v.length)
        .map((ref) => cosine(v, ref));
      if (sims.length === 0) continue;
      const best = Math.max(...sims);
      const score = Math.max(0, Math.min(1, (best - 0.3) / 0.5));
      if (score > 0.05) scores[intent] = score;
    }
    return scores;
  };

  return scorer;
}
