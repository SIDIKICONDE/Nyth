/**
 * Types pour la construction de contexte IA
 */

// Options de base pour la construction de contexte
export interface ContextBuilderOptions {
  user: any;
  scripts: any[];
  language: string;
}

// Configuration du contexte utilisateur
export interface UserContextConfig {
  includeProfile: boolean;
  includeEmail: boolean;
  includeTransparencyNote: boolean;
  mentionAppName: boolean;
}

// Configuration du contexte des scripts
export interface ScriptsContextConfig {
  maxScripts: number;
  includePreview: boolean;
  previewLength: number;
  includeMetadata: boolean;
  includeWordCount: boolean;
}

// Configuration du contexte de mémoire
export interface MemoryContextConfig {
  maxEntriesHigh: number;
  maxEntriesMedium: number;
  maxEntriesLow: number;
  includeTimestamps: boolean;
  groupByImportance: boolean;
}

// Options complètes de construction
export interface FullContextOptions extends ContextBuilderOptions {
  userConfig?: UserContextConfig;
  scriptsConfig?: ScriptsContextConfig;
  memoryConfig?: MemoryContextConfig;
  customInstructions?: string;
}

// Résultat de construction de contexte
export interface ContextResult {
  userContext: string;
  scriptsContext: string;
  memoryContext: string;
  instructions: string;
  fullContext: string;
  metadata: {
    language: string;
    userHasScripts: boolean;
    userHasMemory: boolean;
    totalLength: number;
    sections: string[];
  };
}

// Configuration des instructions de langue
export interface LanguageInstructions {
  [languageCode: string]: string;
}

// Types pour les sections de contexte
export type ContextSection =
  | "userProfile"
  | "scripts"
  | "memory"
  | "instructions"
  | "customInstructions";

// Configuration de section
export interface SectionConfig {
  enabled: boolean;
  priority: number;
  maxLength?: number;
  customTemplate?: string;
}

// Configuration complète des sections
export type SectionsConfig = {
  [K in ContextSection]: SectionConfig;
};

// Métadonnées de script
export interface ScriptMetadata {
  id: string;
  title: string;
  wordCount: number;
  createdAt: string;
  isFavorite: boolean;
  preview: string;
}

// Profil utilisateur simplifié
export interface UserProfile {
  name?: string;
  displayName?: string;
  email?: string;
  uid?: string;
}
