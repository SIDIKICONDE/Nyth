import { TFunction } from "i18next";
import { PlanningEvent } from "../../../types/planning";
import { GroupedEvents, TimelineStats } from "./types";

// Grouper les événements selon différents critères
export const groupEventsByDate = (events: PlanningEvent[]): GroupedEvents => {
  const grouped: GroupedEvents = {};

  events.forEach((event) => {
    const date = new Date(event.startDate).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
  });

  return grouped;
};

export const groupEventsByStatus = (events: PlanningEvent[]): GroupedEvents => {
  const grouped: GroupedEvents = {};

  events.forEach((event) => {
    const statusLabel = event.status;

    if (!grouped[statusLabel]) {
      grouped[statusLabel] = [];
    }
    grouped[statusLabel].push(event);
  });

  return grouped;
};

export const groupEventsByType = (events: PlanningEvent[]): GroupedEvents => {
  const grouped: GroupedEvents = {};

  events.forEach((event) => {
    const typeLabel = event.type;

    if (!grouped[typeLabel]) {
      grouped[typeLabel] = [];
    }
    grouped[typeLabel].push(event);
  });

  return grouped;
};

export const groupEventsByPriority = (
  events: PlanningEvent[]
): GroupedEvents => {
  const grouped: GroupedEvents = {};

  events.forEach((event) => {
    const priorityLabel = event.priority;

    if (!grouped[priorityLabel]) {
      grouped[priorityLabel] = [];
    }
    grouped[priorityLabel].push(event);
  });

  return grouped;
};

// Fonction principale de groupement
export const groupEvents = (
  events: PlanningEvent[],
  groupBy: "date" | "status" | "type" | "priority"
): GroupedEvents => {
  switch (groupBy) {
    case "date":
      return groupEventsByDate(events);
    case "status":
      return groupEventsByStatus(events);
    case "type":
      return groupEventsByType(events);
    case "priority":
      return groupEventsByPriority(events);
    default:
      return groupEventsByDate(events);
  }
};

// Trier les événements
export const sortEvents = (
  events: PlanningEvent[],
  sortOrder: "asc" | "desc"
): PlanningEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();

    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });
};

// Filtrer les événements
export const filterEvents = (
  events: PlanningEvent[],
  statusFilter: PlanningEvent["status"][],
  typeFilter: PlanningEvent["type"][]
): PlanningEvent[] => {
  return events.filter((event) => {
    const statusMatch =
      statusFilter.length === 0 || statusFilter.includes(event.status);
    const typeMatch =
      typeFilter.length === 0 || typeFilter.includes(event.type);

    return statusMatch && typeMatch;
  });
};

// Calculer les statistiques de la timeline
export const calculateTimelineStats = (
  events: PlanningEvent[]
): TimelineStats => {
  const stats: TimelineStats = {
    total: events.length,
    completed: 0,
    inProgress: 0,
    planned: 0,
    cancelled: 0,
    postponed: 0,
    byType: {
      script_creation: 0,
      recording: 0,
      editing: 0,
      review: 0,
      meeting: 0,
      deadline: 0,
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
  };

  events.forEach((event) => {
    // Compter par statut
    switch (event.status) {
      case "completed":
        stats.completed++;
        break;
      case "in_progress":
        stats.inProgress++;
        break;
      case "planned":
        stats.planned++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
      case "postponed":
        stats.postponed++;
        break;
    }

    // Compter par type
    stats.byType[event.type]++;

    // Compter par priorité
    stats.byPriority[event.priority]++;
  });

  return stats;
};

// Formater la date pour l'affichage
export const formatEventDate = (date: Date): string => {
  return new Date(date).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Formater l'heure pour l'affichage
export const formatEventTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Formater la durée
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes}min`;
};

// Vérifier si un événement est en retard
export const isEventOverdue = (event: PlanningEvent): boolean => {
  const now = new Date();
  const eventDate = new Date(event.endDate);

  return (
    eventDate < now &&
    event.status !== "completed" &&
    event.status !== "cancelled"
  );
};

// Vérifier si un événement est aujourd'hui
export const isEventToday = (event: PlanningEvent): boolean => {
  const today = new Date();
  const eventDate = new Date(event.startDate);

  return today.toDateString() === eventDate.toDateString();
};

// Vérifier si un événement est cette semaine
export const isEventThisWeek = (event: PlanningEvent): boolean => {
  const today = new Date();
  const eventDate = new Date(event.startDate);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return eventDate >= startOfWeek && eventDate <= endOfWeek;
};

// Obtenir la couleur de l'événement basée sur sa priorité et son statut
export const getEventColor = (event: PlanningEvent): string => {
  if (isEventOverdue(event)) {
    return "#DC2626"; // Rouge pour les événements en retard
  }

  if (event.status === "completed") {
    return "#10B981"; // Vert pour les événements terminés
  }

  if (event.status === "cancelled") {
    return "#6B7280"; // Gris pour les événements annulés
  }

  // Couleur basée sur la priorité pour les autres statuts
  switch (event.priority) {
    case "urgent":
      return "#DC2626";
    case "high":
      return "#EF4444";
    case "medium":
      return "#F59E0B";
    case "low":
      return "#10B981";
    default:
      return "#6B7280";
  }
};

// Rechercher dans les événements
export const searchEvents = (
  events: PlanningEvent[],
  searchTerm: string,
  t: TFunction
): PlanningEvent[] => {
  if (!searchTerm.trim()) {
    return events;
  }

  const term = searchTerm.toLowerCase();

  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(term) ||
      (event.description && event.description.toLowerCase().includes(term)) ||
      t(`planning.events.types.${event.type}`, event.type)
        .toLowerCase()
        .includes(term) ||
      t(`planning.events.status.${event.status}`, event.status)
        .toLowerCase()
        .includes(term) ||
      t(`planning.events.priorities.${event.priority}`, event.priority)
        .toLowerCase()
        .includes(term)
  );
};
