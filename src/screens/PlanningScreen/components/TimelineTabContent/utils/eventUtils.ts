import { PlanningEvent } from "../../../../../types/planning";

export const eventUtils = {
  /**
   * Filtrer les événements sûrs (avec toutes les propriétés requises)
   */
  filterSafeEvents: (events: PlanningEvent[]): PlanningEvent[] => {
    return events.filter(
      (event) =>
        event &&
        typeof event.id === "string" &&
        typeof event.title === "string" &&
        event.startDate &&
        event.endDate
    );
  },

  /**
   * Valider qu'un événement a toutes les propriétés requises
   */
  isValidEvent: (event: PlanningEvent): boolean => {
    return !!(
      event &&
      event.id &&
      event.title &&
      event.startDate &&
      event.endDate
    );
  },

  /**
   * Trier les événements par date de début
   */
  sortEventsByStartDate: (events: PlanningEvent[]): PlanningEvent[] => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });
  },

  /**
   * Obtenir les événements d'aujourd'hui
   */
  getTodayEvents: (events: PlanningEvent[]): PlanningEvent[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate < tomorrow;
    });
  },

  /**
   * Obtenir les événements à venir (prochains 7 jours)
   */
  getUpcomingEvents: (events: PlanningEvent[]): PlanningEvent[] => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= now && eventDate <= nextWeek;
    });
  },
};
