// Types pour l'intégration calendrier
export interface CalendarPermissionStatus {
  granted: boolean;
  message?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

export interface CalendarProvider {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'system';
  isAvailable: boolean;
}

export interface CalendarIntegrationConfig {
  enabled: boolean;
  provider: CalendarProvider | null;
  syncReminders: boolean;
  autoSync: boolean;
}
