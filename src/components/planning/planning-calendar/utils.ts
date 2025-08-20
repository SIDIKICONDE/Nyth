import { PlanningEvent, Goal, Task } from "../../../types/planning";
import { EVENT_TYPE_ICONS, PRIORITY_COLORS } from "./constants";

// Générer les jours du mois pour le calendrier
export const generateCalendarDays = (currentDate: Date): (Date | null)[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Premier jour du mois
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const days: (Date | null)[] = [];

  // Ajouter les jours vides du début
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  // Ajouter tous les jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
};

// Vérifier si une date est aujourd'hui
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Vérifier si une date est sélectionnée
export const isSelected = (date: Date, selectedDate: Date | null): boolean => {
  return selectedDate
    ? date.toDateString() === selectedDate.toDateString()
    : false;
};

// Obtenir la couleur de priorité d'un événement
export const getPriorityColor = (
  priority: PlanningEvent["priority"],
  fallbackColor: string
): string => {
  return PRIORITY_COLORS[priority] || fallbackColor;
};

// Obtenir l'icône de type d'événement
export const getEventTypeIcon = (type: PlanningEvent["type"]): string => {
  return EVENT_TYPE_ICONS[type] || "calendar";
};

// Naviguer vers le mois précédent ou suivant
export const navigateMonth = (
  currentDate: Date,
  direction: "prev" | "next"
): Date => {
  const newDate = new Date(currentDate);
  if (direction === "prev") {
    newDate.setMonth(newDate.getMonth() - 1);
  } else {
    newDate.setMonth(newDate.getMonth() + 1);
  }
  return newDate;
};

// Filtrer les événements pour une date donnée
export const getEventsForDate = (
  events: PlanningEvent[],
  date: Date
): PlanningEvent[] => {
  return events.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate.toDateString() === date.toDateString();
  });
};

// Formater la date pour l'affichage
export const formatSelectedDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Formater l'heure pour l'affichage
export const formatEventTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Filtrer les objectifs pour une date donnée (échéance)
export const getGoalsForDate = (goals: Goal[], date: Date): Goal[] => {
  return goals.filter((goal) => {
    const goalEndDate = new Date(goal.endDate);
    return goalEndDate.toDateString() === date.toDateString();
  });
};

// Filtrer les tâches pour une date donnée (échéance)
export const getTasksForDate = (tasks: Task[], date: Date): Task[] => {
  return tasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDueDate = new Date(task.dueDate);
    return taskDueDate.toDateString() === date.toDateString();
  });
};

// Obtenir l'icône selon le type d'élément
export const getItemTypeIcon = (type: "event" | "goal" | "task"): string => {
  switch (type) {
    case "event":
      return "calendar";
    case "goal":
      return "flag";
    case "task":
      return "checkbox";
    default:
      return "ellipse";
  }
};

// Obtenir la couleur selon le type d'élément
export const getItemTypeColor = (type: "event" | "goal" | "task"): string => {
  switch (type) {
    case "event":
      return "#3B82F6"; // Bleu
    case "goal":
      return "#10B981"; // Vert
    case "task":
      return "#F59E0B"; // Orange
    default:
      return "#6B7280"; // Gris
  }
};

// Formater le mois et l'année pour l'en-tête
export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
};
