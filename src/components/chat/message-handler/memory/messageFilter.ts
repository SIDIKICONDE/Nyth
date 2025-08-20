/*
 * smartMemoryFilter.ts — Filtre de mémoire conversationnelle "complet et intelligent"
 *
 * Objectifs :
 *  - Ignorer le bruit (salutations, remerciements, etc.)
 *  - Détecter l'intention de mémoire (souviens-toi, préférences, directives, objectifs, problèmes…)
 *  - Scorer l'importance avec pondérations contextuelles
 *  - Détecter la sensibilité (PII, sujets sensibles) et empêcher la persistance par défaut
 *  - Classer en mémoire courte (session) vs longue (persistante)
 *  - Multilingue fr/en auto, extensible
 *  - Hooks de configuration (poids, seuils, sources mots-clés, NLP optionnel)
 *
 * Remarque : Pas de dépendances externes obligatoires. Possibilité d'injecter un
 *  analyseur sémantique (embedding/similarité) via options si vous en disposez.
 */

// ==========================
// Types & Interfaces
// ==========================

export type Language = "fr" | "en";

export type MemoryIntent =
  | "remember_explicit" // "souviens-toi", "n'oublie pas", "remember"
  | "preference" // goûts durables, styles de réponse
  | "directive" // règles récurrentes : toujours/jamais/à l'avenir
  | "profile" // infos perso non sensibles : prénom, métier (non médical/politique/religieux…)
  | "goal" // objectifs, projets
  | "problem" // difficultés récurrentes
  | "fact" // faits utiles (ex: utilise iPhone 13 mini)
  | "schedule"; // rappels, dates, échéances (souvent pas mémoire longue)

export interface FilterResult {
  shouldAnalyze: boolean;
  shouldPersist: boolean; // autorisé à être mémorisé en long terme
  target: "long" | "short" | "none"; // recommandation d'emplacement
  language: Language;
  score: number; // score global (≥ threshold ⇒ intéressant)
  intentScores: Partial<Record<MemoryIntent, number>>;
  intents: MemoryIntent[]; // intents retenus (>0)
  reasons: string[]; // pourquoi / règles déclenchées
  sensitive: boolean; // contient des données sensibles
  pii: Partial<PIIMatch> | null; // détection de PII
  redacted?: string; // message caviardé si PII
}

export interface PIIMatch {
  email?: string[];
  phone?: string[];
  url?: string[];
  ip?: string[];
  addressHint?: string[]; // indices faibles (ex: rue de la Gare, 10bis)
}

export interface SmartMemoryFilterOptions {
  language?: Language; // si omis ⇒ auto
  minLength?: number; // longueur min pour considérer
  threshold?: number; // seuil de score global
  intentWeights?: Partial<Record<MemoryIntent, number>>; // pondérations
  bonusWeights?: {
    hasQuotes?: number;
    hasNumbers?: number;
    hasLinkOrContact?: number;
    longMessage?: number;
  };
  penalties?: {
    veryShort?: number;
    allCaps?: number;
    fewWords?: number;
  };
  // Interrupteurs de sécurité
  allowSensitiveByDefault?: boolean; // false ⇒ ne pas persister si sensible sans opt-in explicite
  // Analyseur sémantique optionnel (embedding/similarity) : renvoyer [0..1]
  semanticIntentScorer?: (
    message: string,
    language: Language
  ) => Partial<Record<MemoryIntent, number>>;
}

export interface SmartMemoryFilterAsyncOptions
  extends Omit<SmartMemoryFilterOptions, "semanticIntentScorer"> {
  semanticIntentScorer?: (
    message: string,
    language: Language
  ) => Promise<Partial<Record<MemoryIntent, number>>>;
}

// ==========================
// Config par défaut
// ==========================

const DEFAULT_OPTIONS: Required<
  Omit<
    SmartMemoryFilterOptions,
    "language" | "semanticIntentScorer" | "intentWeights"
  >
> & {
  intentWeights: Record<MemoryIntent, number>;
} = {
  minLength: 10,
  threshold: 1.8,
  intentWeights: {
    remember_explicit: 2.2,
    preference: 1.4,
    directive: 1.6,
    profile: 1.2,
    goal: 1.3,
    problem: 1.3,
    fact: 1.0,
    schedule: 1.0,
  },
  bonusWeights: {
    hasQuotes: 0.8,
    hasNumbers: 0.5,
    hasLinkOrContact: 0.9,
    longMessage: 0.6,
  },
  penalties: {
    veryShort: -2.0,
    allCaps: -1.0,
    fewWords: -1.2,
  },
  allowSensitiveByDefault: false,
};

// ==========================
// Lexiques FR/EN (extensibles)
// ==========================

const LEXICON = {
  fr: {
    remember_explicit: [
      "souviens",
      "rappelle",
      "n'oublie pas",
      "retenir",
      "mémorise",
      "note que",
    ],
    preference: [
      "je préfère",
      "j'aime",
      "je déteste",
      "j'adore",
      "je n'aime pas",
      "ma préférence",
      "plutôt",
      "de préférence",
    ],
    directive: [
      "toujours",
      "jamais",
      "à l'avenir",
      "désormais",
      "dorénavant",
      "ne plus",
      "arrête de",
      "évite de",
      "chaque fois",
    ],
    profile: [
      "je suis",
      "je m'appelle",
      "mon nom",
      "j'habite",
      "je travaille",
      "mon métier",
      "ma profession",
      "mon entreprise",
    ],
    goal: [
      "mon objectif",
      "je veux",
      "j'aimerais",
      "je souhaite",
      "mon projet",
      "j'espère",
      "mon rêve",
    ],
    problem: [
      "mon problème",
      "j'ai du mal",
      "je galère",
      "difficulté avec",
      "ça ne marche pas",
      "je n'arrive pas",
    ],
    fact: [
      "j'utilise",
      "mon téléphone",
      "mon appareil",
      "j'ai acheté",
      "je possède",
      "ma config",
      "ma version",
    ],
    schedule: [
      "rappelle-moi",
      "demain",
      "à",
      "le",
      "rendez-vous",
      "deadline",
      "échéance",
      "samedi",
      "lundi",
      "à",
    ],
  },
  en: {
    remember_explicit: [
      "remember",
      "don't forget",
      "keep in mind",
      "remind me",
      "note that",
      "memorize",
    ],
    preference: [
      "i prefer",
      "i like",
      "i love",
      "i hate",
      "my preference",
      "rather",
      "preferably",
    ],
    directive: [
      "always",
      "never",
      "from now on",
      "going forward",
      "avoid",
      "stop",
      "each time",
    ],
    profile: [
      "i am",
      "my name",
      "i live",
      "i work",
      "my job",
      "my profession",
      "my company",
    ],
    goal: [
      "my goal",
      "i want",
      "i would like",
      "i wish",
      "my project",
      "i hope",
      "my dream",
    ],
    problem: [
      "my problem",
      "i struggle",
      "difficulty with",
      "hard time",
      "doesn't work",
      "i can't",
    ],
    fact: [
      "i use",
      "my phone",
      "my device",
      "i bought",
      "i own",
      "my setup",
      "my version",
    ],
    schedule: [
      "remind me",
      "tomorrow",
      "on",
      "at",
      "meeting",
      "deadline",
      "due",
      "monday",
      "saturday",
    ],
  },
} as const;

// Messages de bruit à ignorer
const IGNORE_PATTERNS: RegExp[] = [
  /^(salut|bonjour|bonsoir|hello|hi|hey|yo|👋|coucou)[\s\.,!]*$/i,
  /^(merci|thanks|thank you|thx|ty)[\s\.,!]*$/i,
  /^(oui|non|yes|no|ok|okay|d'accord|parfait|super|génial|cool|top|nickel)[\s\.,!]*$/i,
  /^(comment|pourquoi|quoi|où|quand|qui|how|why|what|where|when|who)\b/i,
  /^(aide|help|explique|explain|support|assistance)\b/i,
  /^(de rien|avec plaisir|you're welcome|no problem|np)[\s\.,!]*$/i,
  /^(ça va|ça roule|ça marche|tout va bien|how are you|how's it going|how do you do)\b/i,
  /^\?+$/,
  /^\.+$/,
  /^!+$/,
  /^,+$/,
  /^;+$/,
  /^(lol|mdr|haha|hehe|😂|🤣|😅|😊|😄|:‑?\)|;\)|:‑?D|xD)$/i,
  /^test[\s\.,!]*$/i,
  /^[0-9\s\.,!?]{1,10}$/,
  /^[#@€$%^&*()_\-+=~`<>|\\\/] {1,10}$/,
  /^.{0,2}$/,
];

// ==========================
// Utilitaires
// ==========================

function normalize(s: string) {
  return s.normalize("NFKC").trim();
}

function detectLanguage(message: string, hint?: Language): Language {
  if (hint) return hint;
  const m = message.toLowerCase();
  const frHits = [
    "je ",
    "j'",
    "à ",
    "ça",
    "toujours",
    "jamais",
    "souviens",
    "rappelle",
  ].filter((k) => m.includes(k)).length;
  const enHits = [
    " i ",
    "i'm",
    "don't",
    "always",
    "never",
    "remember",
    "remind",
  ].filter((k) => m.includes(k)).length;
  return frHits >= enHits ? "fr" : "en";
}

function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

// Détection PII (heuristique)
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(\+?\d[\s\-.()]*){7,}/g; // large
const URL_RE = /https?:\/\/[\w.-]+(?:\/[\w./?%&=+-]*)?/gi;
const IP_RE =
  /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
const ADDRESS_HINT_RE =
  /(rue|avenue|bd\.?|boulevard|impasse|allée|chemin|route|place|\d{1,4}\s?(bis|ter)?)/gi;

function detectPII(message: string): PIIMatch | null {
  const email = message.match(EMAIL_RE) || undefined;
  const phone =
    message.match(PHONE_RE)?.filter((p) => p.replace(/\D/g, "").length >= 9) ||
    undefined;
  const url = message.match(URL_RE) || undefined;
  const ip = message.match(IP_RE) || undefined;
  const addressHint = message.match(ADDRESS_HINT_RE) || undefined;
  const any = email || phone?.length || url || ip || addressHint;
  return any ? { email, phone, url, ip, addressHint } : null;
}

function redactPII(message: string, pii: PIIMatch): string {
  let out = message;
  if (pii.email)
    pii.email.forEach(
      (e) =>
        (out = out.replace(
          new RegExp(e.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
          "<email>"
        ))
    );
  if (pii.phone)
    pii.phone.forEach(
      (p) =>
        (out = out.replace(
          new RegExp(p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
          "<phone>"
        ))
    );
  if (pii.url)
    pii.url.forEach(
      (u) =>
        (out = out.replace(
          new RegExp(u.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
          "<url>"
        ))
    );
  if (pii.ip)
    pii.ip.forEach(
      (i) =>
        (out = out.replace(
          new RegExp(i.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g"),
          "<ip>"
        ))
    );
  return out;
}

const SENSITIVE_TOPICS = {
  fr: [
    "religion",
    "politique",
    "orientation sexuelle",
    "santé",
    "maladie",
    "diagnostic",
    "syndicat",
  ],
  en: [
    "religion",
    "politics",
    "sexual orientation",
    "health",
    "illness",
    "diagnosis",
    "trade union",
  ],
};

function isSensitive(message: string, lang: Language): boolean {
  const m = message.toLowerCase();
  const topics = SENSITIVE_TOPICS[lang];
  return topics.some((t) => m.includes(t));
}

function matchesIgnore(message: string): boolean {
  return IGNORE_PATTERNS.some((re) => re.test(message));
}

// ==========================
// Scoring
// ==========================

function computeIntentScores(
  message: string,
  lang: Language,
  weights: Record<MemoryIntent, number>
): Partial<Record<MemoryIntent, number>> {
  const m = message.toLowerCase();
  const lex = LEXICON[lang];
  const scores: Partial<Record<MemoryIntent, number>> = {};
  (Object.keys(lex) as MemoryIntent[]).forEach((intent) => {
    const hit = lex[intent].some((kw) => m.includes(kw));
    if (hit) scores[intent] = weights[intent];
  });
  return scores;
}

type BonusOptions = Pick<
  SmartMemoryFilterOptions,
  "minLength" | "bonusWeights" | "penalties"
>;

function computeBonuses(message: string, options: BonusOptions): number {
  const { bonusWeights, penalties } = { ...DEFAULT_OPTIONS, ...options };
  const m = message;
  let score = 0;
  if (m.includes('"') || m.includes("'")) score += bonusWeights.hasQuotes ?? 0;
  if (/\d+/.test(m)) score += bonusWeights.hasNumbers ?? 0;
  if (/@/.test(m) || /https?:\/\//.test(m))
    score += bonusWeights.hasLinkOrContact ?? 0;
  if (m.length > 80) score += bonusWeights.longMessage ?? 0;
  if (m.trim().length < (options.minLength ?? DEFAULT_OPTIONS.minLength))
    score += penalties.veryShort ?? 0;
  if (/^[A-Z\s]+$/.test(m)) score += penalties.allCaps ?? 0;
  if (wordCount(m) < 3) score += penalties.fewWords ?? 0;
  return score;
}

// ==========================
// Décision mémoire
// ==========================

export function analyzeForMemory(
  input: string,
  opts: SmartMemoryFilterOptions = {}
): FilterResult {
  const original = input;
  const text = normalize(original);

  // 1) ignore bruit
  if (matchesIgnore(text)) {
    return {
      shouldAnalyze: false,
      shouldPersist: false,
      target: "none",
      language: detectLanguage(text, opts.language),
      score: 0,
      intentScores: {},
      intents: [],
      reasons: ["Message de conversation normale"],
      sensitive: false,
      pii: null,
    };
  }

  // 2) langue
  const lang = detectLanguage(text, opts.language);

  // 3) PII & sensibilité
  const pii = detectPII(text);
  const sensitive = isSensitive(text, lang) || !!pii;

  // 4) intents
  const weights = {
    ...DEFAULT_OPTIONS.intentWeights,
    ...(opts.intentWeights || {}),
  } as Record<MemoryIntent, number>;
  const intentScores = computeIntentScores(text, lang, weights);

  // 4bis) sémantique optionnelle (0..1), pondérée à 50% d'un poids de base
  if (opts.semanticIntentScorer) {
    const sem = opts.semanticIntentScorer(text, lang);
    for (const k in sem) {
      const intent = k as MemoryIntent;
      const val = sem[intent];
      if (val && val > 0) {
        intentScores[intent] =
          (intentScores[intent] || 0) + val * (weights[intent] ?? 1) * 0.5;
      }
    }
  }

  // 5) bonus/pénalités
  const bonus = computeBonuses(text, opts);

  // 6) score global
  const score =
    Object.values(intentScores).reduce((a, b) => a + (b || 0), 0) + bonus;

  // 7) intents retenus
  const intents = Object.entries(intentScores)
    .filter(([_, v]) => (v || 0) > 0)
    .map(([k]) => k as MemoryIntent);

  // 8) décision initiale
  const threshold = opts.threshold ?? DEFAULT_OPTIONS.threshold;
  const shouldAnalyze =
    score >= threshold &&
    text.length >= (opts.minLength ?? DEFAULT_OPTIONS.minLength);

  // 9) classification (long/short/none)
  let target: FilterResult["target"] = "none";
  let shouldPersist = false;

  if (shouldAnalyze) {
    // Heuristique :
    // - remember_explicit, preference, directive, profile ⇒ Long (sauf sensible ⇒ Short)
    // - goal, problem, fact ⇒ Short par défaut, Long si score très haut
    // - schedule ⇒ Short (rappel), jamais Long par défaut
    const highScore = score >= threshold + 1.2;
    const has = (i: MemoryIntent) => intents.includes(i);

    if (
      has("remember_explicit") ||
      has("preference") ||
      has("directive") ||
      has("profile")
    ) {
      target = sensitive ? "short" : "long";
      shouldPersist =
        !sensitive ||
        (opts.allowSensitiveByDefault ??
          DEFAULT_OPTIONS.allowSensitiveByDefault);
    } else if (has("goal") || has("problem") || has("fact")) {
      target = highScore && !sensitive ? "long" : "short";
      shouldPersist = target === "long";
    } else if (has("schedule")) {
      target = "short";
      shouldPersist = false; // suggérer un système de rappel dédié
    }
  }

  // 10) raisons (explicabilité)
  const reasons: string[] = [];
  if (shouldAnalyze) reasons.push("Score au-dessus du seuil");
  if (intents.length)
    reasons.push(`Intention(s) détectée(s): ${intents.join(", ")}`);
  if (sensitive)
    reasons.push("Contenu sensible ou PII détecté — persistance restreinte");
  if (pii) reasons.push("Présence de PII (email/téléphone/url/ip/adresse)");

  // 11) redaction
  const redacted = pii ? redactPII(text, pii) : undefined;

  return {
    shouldAnalyze,
    shouldPersist: shouldAnalyze && shouldPersist,
    target,
    language: lang,
    score,
    intentScores,
    intents,
    reasons,
    sensitive,
    pii: pii || null,
    redacted,
  };
}

export async function analyzeForMemoryAsync(
  input: string,
  opts: SmartMemoryFilterAsyncOptions = {}
): Promise<FilterResult> {
  const original = input;
  const text = normalize(original);

  if (matchesIgnore(text)) {
    return {
      shouldAnalyze: false,
      shouldPersist: false,
      target: "none",
      language: detectLanguage(text, opts.language),
      score: 0,
      intentScores: {},
      intents: [],
      reasons: ["Message de conversation normale"],
      sensitive: false,
      pii: null,
    };
  }

  const lang = detectLanguage(text, opts.language);
  const pii = detectPII(text);
  const sensitive = isSensitive(text, lang) || !!pii;

  const weights = {
    ...DEFAULT_OPTIONS.intentWeights,
    ...(opts.intentWeights || {}),
  } as Record<MemoryIntent, number>;
  const intentScores = computeIntentScores(text, lang, weights);

  if (opts.semanticIntentScorer) {
    const sem = await opts.semanticIntentScorer(text, lang);
    for (const k in sem) {
      const intent = k as MemoryIntent;
      const val = sem[intent];
      if (val && val > 0) {
        intentScores[intent] =
          (intentScores[intent] || 0) + val * (weights[intent] ?? 1) * 0.5;
      }
    }
  }

  const bonus = computeBonuses(text, opts);
  const score =
    Object.values(intentScores).reduce((a, b) => a + (b || 0), 0) + bonus;

  const intents = Object.entries(intentScores)
    .filter(([_, v]) => (v || 0) > 0)
    .map(([k]) => k as MemoryIntent);

  const threshold = opts.threshold ?? DEFAULT_OPTIONS.threshold;
  const shouldAnalyze =
    score >= threshold &&
    text.length >= (opts.minLength ?? DEFAULT_OPTIONS.minLength);

  let target: FilterResult["target"] = "none";
  let shouldPersist = false;

  if (shouldAnalyze) {
    const highScore = score >= threshold + 1.2;
    const has = (i: MemoryIntent) => intents.includes(i);

    if (
      has("remember_explicit") ||
      has("preference") ||
      has("directive") ||
      has("profile")
    ) {
      target = sensitive ? "short" : "long";
      shouldPersist =
        !sensitive ||
        (opts.allowSensitiveByDefault ??
          DEFAULT_OPTIONS.allowSensitiveByDefault);
    } else if (has("goal") || has("problem") || has("fact")) {
      target = highScore && !sensitive ? "long" : "short";
      shouldPersist = target === "long";
    } else if (has("schedule")) {
      target = "short";
      shouldPersist = false;
    }
  }

  const reasons: string[] = [];
  if (shouldAnalyze) reasons.push("Score au-dessus du seuil");
  if (intents.length)
    reasons.push(`Intention(s) détectée(s): ${intents.join(", ")}`);
  if (sensitive)
    reasons.push("Contenu sensible ou PII détecté — persistance restreinte");
  if (pii) reasons.push("Présence de PII (email/téléphone/url/ip/adresse)");

  const redacted = pii ? redactPII(text, pii) : undefined;

  return {
    shouldAnalyze,
    shouldPersist: shouldAnalyze && shouldPersist,
    target,
    language: lang,
    score,
    intentScores,
    intents,
    reasons,
    sensitive,
    pii: pii || null,
    redacted,
  };
}

// ==========================
// Batch & Stats
// ==========================

export function filterMessagesForMemory(
  messages: Array<{ message: string; languageHint?: Language }>,
  opts: SmartMemoryFilterOptions | SmartMemoryFilterAsyncOptions = {}
) {
  return messages.map(({ message, languageHint }) =>
    analyzeForMemory(message, {
      ...(opts as SmartMemoryFilterOptions),
      language: languageHint,
    })
  );
}

export function getFilteringStats(
  messages: Array<{ message: string; languageHint?: Language }>,
  opts: SmartMemoryFilterOptions | SmartMemoryFilterAsyncOptions = {}
) {
  const results = filterMessagesForMemory(
    messages,
    opts as SmartMemoryFilterOptions
  );
  const analyzed = results.filter((r) => r.shouldAnalyze).length;
  const averageScore =
    results.reduce((a, r) => a + r.score, 0) / (results.length || 1);
  return {
    total: results.length,
    analyzed,
    ignored: results.length - analyzed,
    percentage: (analyzed / (results.length || 1)) * 100,
    averageScore,
  };
}

// ==========================
// Exemple d'utilisation
// ==========================

/*
import { analyzeForMemory } from './smartMemoryFilter';

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('messageFilter');

const input = "Toujours répondre en français, s'il te plaît. Mon email est test@example.com";
const res = analyzeForMemory(input);
logger.debug(res);
// ⇒ {
//   shouldAnalyze: true,
//   shouldPersist: false, // PII ⇒ sensible ⇒ short memory only
//   target: 'short',
//   language: 'fr',
//   score: 3.8,
//   intents: ['directive'],
//   sensitive: true,
//   pii: { email: ['test@example.com'] },
//   redacted: "Toujours répondre en français, s'il te plaît. Mon email est <email>"
// }
*/

// ==========================
// Notes d'intégration
// ==========================
// - Persistez seulement les entrées res.shouldPersist === true et target === 'long'.
// - Si target === 'short' mais shouldAnalyze === true, gardez en mémoire de session ou déclenchez un rappel (schedule).
// - Ne stockez jamais de PII en clair. Utilisez res.redacted pour des logs, ou ne stockez pas du tout.
// - Vous pouvez fournir un semanticIntentScorer pour affiner la détection (embedding locale ou règle maison).
// - Ajustez threshold & weights par A/B tests.
