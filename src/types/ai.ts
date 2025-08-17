export interface AIPrompt {
  topic: string;
  tone:
    | "professional"
    | "casual"
    | "energetic"
    | "educational"
    | "humorous"
    | "friendly"
    | "authoritative"
    | "dramatic"
    | "inspirational"
    | "emotional"
    | "technical"
    | "poetic"
    | "suspenseful"
    | "motivational";
  duration?: "short" | "medium" | "long"; // Optionnel maintenant
  platform:
    | "tiktok"
    | "youtube"
    | "instagram"
    | "linkedin"
    | "facebook"
    | "twitter"
    | "podcast"
    | "presentation"
    | "tiktok_story"
    | "reels"
    | "youtube_shorts";
  language: string; // L'IA détecte automatiquement la langue
  creativity?: number; // 0.0 (factuel) à 1.0 (créatif)

  // Structure narrative
  narrativeStructure?:
    | "hook-problem-solution"
    | "story-based"
    | "tutorial"
    | "review"
    | "interview"
    | "news"
    | "debate"
    | "testimonial";

  // Ton émotionnel
  emotionalTone?:
    | "neutral"
    | "positive"
    | "negative"
    | "inspiring"
    | "urgent"
    | "calming"
    | "exciting";

  // Contrôles de longueur de contenu
  wordCount?: number;
  characterCount?: number;
  paragraphCount?: number;
  sentenceLength?: "short" | "medium" | "long" | "mixed";
  vocabulary?: "simple" | "standard" | "advanced";
  scriptStructure?:
    | "introduction-development-conclusion"
    | "problem-solution"
    | "story-telling"
    | "comparison"
    | "list-format"
    | "question-answer";
  includePersonalAnecdotes?: boolean;
  includeStatistics?: boolean;
  includeQuestions?: boolean;
  emphasisStyle?: "bold" | "repetition" | "exclamation" | "subtle";
  readingPace?: "slow" | "normal" | "fast";
}

export interface AIGenerationOptions {
  includeHooks: boolean;
  includeCallToAction: boolean;
  includeHashtags: boolean;
  targetAudience?: string;
  customInstructions?: string;
  formatPreferences?: {
    useNumberedPoints?: boolean;
    useBulletPoints?: boolean;
    includeTransitions?: boolean;
    addTimestamps?: boolean;
  };
  contentStyle?: {
    useExamples?: boolean;
    includeMetaphors?: boolean;
    addEmojis?: boolean;
    includeCallouts?: boolean;
  };
}

export interface AIServiceConfig {
  apiEndpoint: string;
  apiKey: string | null;
}

export interface AIServiceResponse {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isAIGenerated: boolean;
  aiPrompt?: AIPrompt;
  aiOptions?: AIGenerationOptions;
}

// Interface pour les données de script
export interface ScriptData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isAIGenerated: boolean;
  aiPrompt?: AIPrompt;
  aiOptions?: AIGenerationOptions;
  // Autres propriétés potentielles pour les scripts
  notes?: string;
  tags?: string[];
  duration?: number;
  wordCount?: number;
}
