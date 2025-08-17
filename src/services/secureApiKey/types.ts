// Types pour le service de clés API sécurisées

export interface SecureApiKey {
  key: string;
  provider: string;
  createdAt: string;
  expiresAt: string;
  lastUsed?: string;
}

export interface StoredKeyData {
  encrypted: string;
  metadata: {
    provider: string;
    createdAt: string;
    expiresAt: string;
    lastUsed?: string;
  };
}

export interface KeyMetadata {
  provider: string;
  createdAt: string;
  expiresAt: string;
  hasKey: boolean;
}

export interface KeyListItem {
  provider: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  encryptionType?: "AES";
}

export interface MigrationResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface MigrationConfig {
  old: string;
  provider: string;
}

export interface KeychainOptions {
  accessible: any;
  authenticationPrompt?: {
    title: string;
    subtitle: string;
    description: string;
    cancel: string;
  };
}

export type ApiProvider =
  | "openai"
  | "gemini"
  | "mistral"
  | "cohere"
  | "claude"
  | "perplexity"
  | "together"
  | "groq"
  | "fireworks"
  | "azureopenai"
  | "openrouter"
  | "deepinfra"
  | "xai"
  | "deepseek";
