/**
 * Types et interfaces pour le système de sauvegarde automatique
 */

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // en millisecondes
  cloudBackup: boolean;
  maxLocalBackups: number;
  maxCloudBackups: number;
}

export interface BackupMetadata {
  id: string;
  type: 'script' | 'recording';
  timestamp: number;
  size: number;
  cloudUrl?: string;
  localPath?: string;
}

export interface BackupStats {
  totalBackups: number;
  scriptBackups: number;
  recordingBackups: number;
  totalSize: number;
  lastBackup: number | null;
} 