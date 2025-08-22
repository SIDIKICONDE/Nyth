export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lastModified?: string;
  duration?: number;
  isFavorite?: boolean;
  tags?: string[];
  category?: string;
  isAIGenerated?: boolean;
  aiPrompt?: {
    topic: string;
    tone:
      | 'professional'
      | 'casual'
      | 'energetic'
      | 'educational'
      | 'humorous'
      | 'friendly'
      | 'authoritative'
      | 'dramatic'
      | 'inspirational'
      | 'emotional'
      | 'technical'
      | 'poetic'
      | 'suspenseful'
      | 'motivational';
    duration: 'short' | 'medium' | 'long';
    platform:
      | 'tiktok'
      | 'youtube'
      | 'instagram'
      | 'linkedin'
      | 'facebook'
      | 'twitter'
      | 'podcast'
      | 'presentation'
      | 'tiktok_story'
      | 'reels'
      | 'youtube_shorts';
    language: string; // L'IA détecte automatiquement la langue
    creativity?: number; // 0.0 (factuel) à 1.0 (créatif)
    characterCount?: number;
    narrativeStructure?:
      | 'hook-problem-solution'
      | 'story-based'
      | 'tutorial'
      | 'review'
      | 'interview'
      | 'news'
      | 'debate'
      | 'testimonial';
    emotionalTone?:
      | 'neutral'
      | 'positive'
      | 'negative'
      | 'inspiring'
      | 'urgent'
      | 'calming'
      | 'exciting';
  };
  aiOptions?: {
    includeHooks: boolean;
    includeCallToAction: boolean;
    includeHashtags: boolean;
    targetAudience?: string;
  };
  estimatedDuration?: number;
}

// Types pour les nouvelles méthodes de calcul de défilement
export type ScrollCalculationType =
  | 'classic'
  | 'wpm'
  | 'duration'
  | 'lines'
  | 'adaptive'
  | 'level';

export interface ScrollMethod {
  type: ScrollCalculationType;
  value: number | string;
}

import { VideoSettings } from './video';

export interface RecordingSettings {
  // Ancien système (compatibilité)
  scrollSpeed?: number; // Vitesse de défilement (1-100) - optionnel pour compatibilité
  audioEnabled?: boolean; // Alias pour isMicEnabled (compatibilité)
  videoEnabled?: boolean; // Alias pour isVideoEnabled (compatibilité)
  quality?: 'low' | 'medium' | 'high'; // Ancien système de qualité (compatibilité)

  // Nouveau système de calcul
  scrollCalculationMethod?: ScrollCalculationType;
  scrollDurationMinutes?: number;
  scrollWPM?: number;
  scrollLinesPerSecond?: number;
  scrollUserLevel?: 'debutant' | 'intermediaire' | 'expert';

  // Apparence du texte
  fontSize: number;
  isMirrored: boolean;
  textAlignment: 'left' | 'center' | 'right';
  textColor: string;
  textShadow: boolean;
  horizontalMargin: number; // Pourcentage des marges latérales
  isCompactMode: boolean; // Mode texte ultra-compact

  // Enregistrement
  isMicEnabled: boolean;
  isVideoEnabled: boolean;
  showCountdown: boolean;
  countdownDuration: number;
  videoQuality: '2160p' | '1080p' | '720p' | '480p';
  countdown?: number; // Alias pour countdownDuration (compatibilité)

  // Paramètres vidéo avancés
  videoSettings?: VideoSettings;

  // Zone de défilement
  scrollAreaTop: number;
  scrollAreaBottom: number;
  scrollStartLevel: number;
}

export interface Recording {
  id: string;
  scriptId?: string;
  scriptTitle?: string;
  videoUri: string;
  uri?: string;
  thumbnailUri?: string;
  duration: number;
  createdAt: Date | string;
  hasOverlay?: boolean;
  quality?: 'low' | 'medium' | 'high';
  videoSettings?: Partial<VideoSettings>;
}

// RootStackParamList est maintenant défini dans navigation.ts
export type { RootStackParamList } from './navigation';
