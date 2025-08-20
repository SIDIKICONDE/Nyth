export interface AIGeneratorState {
  topic: string;
  selectedPlatform: string;
  tone: string;
  duration: number;
  creativity: number;
  maxCharacters: number;
  isLoading: boolean;
}

export interface UserPreferences {
  platform: string;
  tone: string;
  duration: number;
  creativity: number;
  maxCharacters: number;
}

export type PlatformType = 'tiktok' | 'youtube' | 'instagram' | 'linkedin';
export type ToneType = 'professional' | 'casual' | 'energetic' | 'humorous'; 