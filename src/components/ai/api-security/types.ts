export interface ApiKey {
  provider: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  encryptionType?: 'AES' | 'Base64';
}

export interface ExpiryStatus {
  color: string;
  icon: string;
  text: string;
}

export type Provider = 'openai' | 'gemini' | 'mistral' | 'cohere' | string; 