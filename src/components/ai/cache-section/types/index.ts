export interface CacheStats {
  entryCount: number;
  sizeInBytes: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheSectionProps {
  cacheStats: CacheStats;
  clearingCache: boolean;
  clearCache: () => Promise<void>;
  refreshCacheStats: () => Promise<void>;
}

export interface SizeInfo {
  text: string;
  color: string;
} 