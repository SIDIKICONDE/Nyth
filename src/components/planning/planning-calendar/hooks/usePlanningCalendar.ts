import { useState, useMemo } from "react";
import { usePlanning } from "../../../../hooks/usePlanning";
import { useTasks } from "../../../../hooks/useTasks";
import { PlanningEvent, Goal, Task } from "../../../../types/planning";
import { getEventsForDate, getGoalsForDate, getTasksForDate, navigateMonth } from "../utils";

// Type unifié pour tous les éléments du calendrier
export interface CalendarItem {
  id: string;
  title: string;
  type: 'event' | 'goal' | 'task';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  date: Date;
  originalItem: PlanningEvent | Goal | Task;
}

export const usePlanningCalendar = () => {
  const { events, goals } = usePlanning();
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Navigation du calendrier
  const handleNavigateMonth = (direction: "prev" | "next") => {
    const newDate = navigateMonth(currentDate, direction);
    setCurrentDate(newDate);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Gestion de la sélection
  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  // Obtenir tous les éléments pour une date
  const getItemsForDay = (date: Date): CalendarItem[] => {
    const dayEvents = getEventsForDate(events, date);
    const dayGoals = getGoalsForDate(goals, date);
    const dayTasks = getTasksForDate(tasks, date);

    const items: CalendarItem[] = [];

    // Ajouter les événements
    dayEvents.forEach(event => {
      items.push({
        id: event.id,
        title: event.title,
        type: 'event',
        priority: event.priority,
        status: event.status,
        date: new Date(event.startDate),
        originalItem: event,
      });
    });

    // Ajouter les objectifs (échéances)
    dayGoals.forEach(goal => {
      items.push({
        id: goal.id,
        title: goal.title,
        type: 'goal',
        priority: goal.priority,
        status: goal.status,
        date: new Date(goal.endDate),
        originalItem: goal,
      });
    });

    // Ajouter les tâches (échéances)
    dayTasks.forEach(task => {
      items.push({
        id: task.id,
        title: task.title,
        type: 'task',
        priority: task.priority,
        status: task.status,
        date: task.dueDate ? new Date(task.dueDate) : new Date(),
        originalItem: task,
      });
    });

    // Trier par heure/priorité
    return items.sort((a, b) => {
      // D'abord par heure si c'est un événement
      if (a.type === 'event' && b.type === 'event') {
        return a.date.getTime() - b.date.getTime();
      }
      // Puis par priorité
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
      return aPriority - bPriority;
    });
  };

  // Maintenir la compatibilité avec l'ancienne API
  const getEventsForDay = (date: Date): PlanningEvent[] => {
    return getEventsForDate(events, date);
  };

  return {
    currentDate,
    selectedDate,
    events,
    goals,
    tasks,
    handleNavigateMonth,
    handleGoToToday,
    handleDatePress,
    getEventsForDay, // Pour compatibilité
    getItemsForDay, // Nouvelle fonction unifiée
  };
};
