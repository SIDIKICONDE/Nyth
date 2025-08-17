/**
 * Types pour la gestion du cache
 */

export interface CacheInfo {
  size: number;
  formattedSize: string;
}

export interface DirectoryCleanupResult {
  success: boolean;
  errors: string[];
}

export type CacheSizeUnit = 'B' | 'KB' | 'MB' | 'GB';

export interface CacheSizeFormatOptions {
  precision?: number;
  units?: CacheSizeUnit[];
} 