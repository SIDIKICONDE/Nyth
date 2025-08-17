import { Platform, PermissionsAndroid } from "react-native";
import RNCalendarEvents from "react-native-calendar-events";
import { PlanningEvent } from "../../types/planning";
import { createLogger } from "../../utils/optimizedLogger";

const logger = createLogger("CalendarIntegrationService");

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
}

export interface CalendarInfo {
  id: string;
  title: string;
  type: string;
  source: string;
  isPrimary?: boolean;
  allowsModifications?: boolean;
}

export class CalendarIntegrationService {
  private static instance: CalendarIntegrationService;
  private hasPermissions = false;
  private isInitialized = false;
  // Statut simple accessible
  get initialized(): boolean {
    return this.isInitialized;
  }

  static getInstance(): CalendarIntegrationService {
    if (!CalendarIntegrationService.instance) {
      CalendarIntegrationService.instance = new CalendarIntegrationService();
    }
    return CalendarIntegrationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.hasPermissions;

    try {
      logger.info("🗓️ Initialisation du service calendrier...");

      const hasPermissions = await this.requestPermissions();
      this.hasPermissions = hasPermissions;
      this.isInitialized = true;

      if (hasPermissions) {
        logger.info("✅ Service calendrier initialisé avec succès");
      } else {
        logger.warn("⚠️ Service calendrier initialisé sans permissions");
      }

      return hasPermissions;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de l'initialisation du service calendrier:",
        error
      );
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        // Demander les permissions Android
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
        ]);

        const readGranted =
          granted[PermissionsAndroid.PERMISSIONS.READ_CALENDAR] === "granted";
        const writeGranted =
          granted[PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR] === "granted";

        this.hasPermissions = readGranted && writeGranted;

        if (this.hasPermissions) {
          logger.info("✅ Permissions calendrier Android accordées");
        } else {
          logger.warn("⚠️ Permissions calendrier Android refusées");
        }

        return this.hasPermissions;
      } else {
        // iOS - utiliser react-native-calendar-events
        const permission = await RNCalendarEvents.requestPermissions();
        this.hasPermissions = permission === "authorized";

        if (this.hasPermissions) {
          logger.info("✅ Permissions calendrier iOS accordées");
        } else {
          logger.warn("⚠️ Permissions calendrier iOS refusées");
        }

        return this.hasPermissions;
      }
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la demande de permissions calendrier:",
        error
      );
      return false;
    }
  }

  async getCalendars(): Promise<CalendarInfo[]> {
    if (!this.hasPermissions) {
      await this.requestPermissions();
    }

    if (!this.hasPermissions) {
      logger.warn("⚠️ Pas de permissions calendrier - retour liste vide");
      return [];
    }

    try {
      const calendars = await RNCalendarEvents.findCalendars();

      const calendarInfos: CalendarInfo[] = calendars.map((cal) => ({
        id: cal.id,
        title: cal.title,
        type: cal.type || "unknown",
        source: cal.source || "unknown",
        isPrimary: cal.isPrimary || false,
        allowsModifications: cal.allowsModifications !== false,
      }));

      logger.info(`📅 ${calendarInfos.length} calendriers trouvés`);
      return calendarInfos;
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des calendriers:", error);
      return [];
    }
  }

  async syncEventToCalendar(
    planningEvent: PlanningEvent
  ): Promise<string | null> {
    if (!this.hasPermissions) {
      await this.requestPermissions();
    }

    if (!this.hasPermissions) {
      logger.warn(
        "⚠️ Pas de permissions - impossible de synchroniser l'événement"
      );
      return null;
    }

    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) {
        logger.warn("⚠️ Aucun calendrier par défaut trouvé");
        return null;
      }

      const eventDetails = {
        calendarId,
        title: planningEvent.title,
        startDate: new Date(planningEvent.startDate).toISOString(),
        endDate: new Date(planningEvent.endDate).toISOString(),
        description: planningEvent.description || "",
        location: planningEvent.location || "",
        allDay: false, // Les événements Naya ne sont pas "toute la journée" par défaut
        notes: `Créé depuis Naya - ID: ${planningEvent.id}`,
      };

      const eventId = await RNCalendarEvents.saveEvent(
        planningEvent.title,
        eventDetails
      );

      logger.info(`✅ Événement synchronisé vers le calendrier: ${eventId}`);
      return eventId;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la synchronisation de l'événement:",
        error
      );
      return null;
    }
  }

  async syncMultipleEvents(
    events: PlanningEvent[]
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    logger.info(`🔄 Synchronisation de ${events.length} événements...`);

    for (const event of events) {
      try {
        const calendarEventId = await this.syncEventToCalendar(event);
        if (calendarEventId) {
          results.success.push(event.id);
        } else {
          results.failed.push(event.id);
        }
      } catch (error) {
        logger.error(`❌ Erreur sync événement ${event.id}:`, error);
        results.failed.push(event.id);
      }
    }

    logger.info(
      `📊 Synchronisation terminée: ${results.success.length} succès, ${results.failed.length} échecs`
    );
    return results;
  }

  async removeEventFromCalendar(eventId: string): Promise<boolean> {
    if (!this.hasPermissions) return false;

    try {
      await RNCalendarEvents.removeEvent(eventId);
      logger.info(`🗑️ Événement supprimé du calendrier: ${eventId}`);
      return true;
    } catch (error) {
      logger.error("❌ Erreur lors de la suppression de l'événement:", error);
      return false;
    }
  }

  private async getDefaultCalendarId(): Promise<string | null> {
    try {
      const calendars = await this.getCalendars();

      // Chercher le calendrier principal
      let defaultCalendar = calendars.find(
        (cal) => cal.isPrimary && cal.allowsModifications
      );

      // Si pas trouvé, prendre le premier qui permet les modifications
      if (!defaultCalendar) {
        defaultCalendar = calendars.find((cal) => cal.allowsModifications);
      }

      // En dernier recours, prendre le premier
      if (!defaultCalendar) {
        defaultCalendar = calendars[0];
      }

      if (defaultCalendar) {
        logger.info(
          `📅 Calendrier par défaut: ${defaultCalendar.title} (${defaultCalendar.id})`
        );
        return defaultCalendar.id;
      }

      logger.warn("⚠️ Aucun calendrier utilisable trouvé");
      return null;
    } catch (error) {
      logger.error(
        "❌ Erreur lors de la récupération du calendrier par défaut:",
        error
      );
      return null;
    }
  }

  // Méthodes utilitaires
  isAvailable(): boolean {
    return this.hasPermissions;
  }

  getStatus(): {
    initialized: boolean;
    hasPermissions: boolean;
    platform: string;
  } {
    return {
      initialized: this.isInitialized,
      hasPermissions: this.hasPermissions,
      platform: Platform.OS,
    };
  }
}

export const calendarService = CalendarIntegrationService.getInstance();
