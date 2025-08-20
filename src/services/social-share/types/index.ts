export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  packageName?: string;
  urlScheme?: string;
  webUrl?: string;
  maxDuration?: number; // en secondes
  recommendedFormat: {
    quality: '720p' | '1080p' | '4K';
    aspectRatio: { width: number; height: number };
  };
}

export interface ShareOptions {
  title?: string;
  description?: string;
  hashtags?: string[];
}

export interface ShareContent {
  videoUri: string;
  options?: ShareOptions;
}

export interface PlatformRecommendation {
  platform: SocialPlatform;
  score: number;
  reasons: string[];
}

export interface HashtagSuggestion {
  platform: SocialPlatform;
  hashtags: string[];
  topic?: string;
} 