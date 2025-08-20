/**
 * Types pour la gestion du mode hors ligne
 */

export interface OfflineOperation {
  id?: string;
  type: string;
  collection?: string;
  documentId?: string;
  data?: any;
  action: () => Promise<any>;
  timestamp?: string;
  retryCount?: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  hasCachedData: boolean;
  pendingOperationsCount: number;
}

export interface OfflineStats {
  dataCount: number;
  pendingOperations: number;
  cacheSize: number;
}

export interface CachedData<T = any> {
  data: T;
  timestamp: string;
  version?: string;
}

export type NetworkStateListener = (isOnline: boolean) => void;

export interface IOfflineManager {
  getIsOnline(): boolean;
  subscribe(callback: NetworkStateListener): () => void;
  saveOfflineData<T>(key: string, data: T): Promise<void>;
  getOfflineData<T>(key: string): Promise<T | null>;
  addPendingOperation(operation: OfflineOperation): void;
  loadPendingOperations(): Promise<void>;
  hasOfflineData(): Promise<boolean>;
  clearOfflineData(): Promise<void>;
  getOfflineStats(): Promise<OfflineStats>;
  cleanup(): void;
}
