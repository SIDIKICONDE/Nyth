/**
 * Types étendus pour le système de cache des abonnements
 */

export interface SubscriptionCacheEntry {
  data: import('./subscription').UserSubscription | null;
  usage: import('./subscription').UsageStats | null;
  cachedAt: number;
  expiresAt: number;
  version: string;
  lastAccessed?: number;
  accessCount?: number;
}

export interface CacheConfig {
  subscriptionTTL: number; // 5 minutes pour les abonnements actifs
  usageTTL: number;        // 2 minutes pour l'usage
  maxRetries: number;      // 3 tentatives max
  retryDelay: number;      // 1000ms délai initial
  enableCompression: boolean;
  maxCacheSize: number;    // Taille max en MB
  cleanupInterval: number; // Intervalle de nettoyage en ms
}

export interface CacheStats {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  hitRate: number;
  missRate: number;
  version: string;
  memoryUsage: number; // En MB
  lastCleanup: number;
}

export interface CacheStrategy {
  name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  ttl: number;
  maxSize: number;
  compression: boolean;
  fallbackToStorage: boolean;
}

export interface ListenerConfig {
  collectionName: string;
  filters?: Array<{
    field: string;
    operator: '==' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
    value: any;
  }>;
  batchSize: number;
  debounceMs: number;
  retryOnError: boolean;
  maxRetries: number;
}

export interface ListenerGroup {
  id: string;
  config: ListenerConfig;
  listeners: Map<string, () => void>;
  subscribers: Map<string, (data: any[]) => void>;
  lastUpdate: number;
  batchBuffer: any[];
  errorCount: number;
  lastError?: Error;
}

export interface ListenerStats {
  totalGroups: number;
  totalSubscribers: number;
  activeConnections: number;
  totalUpdates: number;
  averageLatency: number;
  errorRate: number;
  groups: Array<{
    id: string;
    subscribers: number;
    lastUpdate: number;
    bufferSize: number;
    errorCount: number;
  }>;
}

/**
 * Types pour les webhooks RevenueCat
 */
export interface RevenueCatWebhookEvent {
  type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION' | 'BILLING_ISSUE';
  app_user_id: string;
  product_id: string;
  period_type: 'monthly' | 'annual';
  expiration_at_ms?: number;
  original_transaction_id: string;
  event_timestamp_ms: number;
}

export interface RevenueCatWebhookHeaders {
  'x-revenuecat-signature': string;
  'content-type': string;
  'user-agent': string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  event?: RevenueCatWebhookEvent;
}

/**
 * Types pour les métriques de santé du système
 */
export interface SystemHealthMetrics {
  cacheHealth: CacheStats;
  listenerHealth: ListenerStats;
  subscriptionHealth: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    errorRate: number;
    averageResponseTime: number;
  };
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  recommendations: string[];
}

/**
 * Types pour les erreurs avec retry
 */
export interface RetryableError extends Error {
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryDelay: number;
  operationId: string;
}

export interface ErrorRecoveryStrategy {
  immediateRetry: boolean;
  exponentialBackoff: boolean;
  circuitBreaker: boolean;
  fallbackCache: boolean;
  maxRetries: number;
  baseDelay: number;
}
