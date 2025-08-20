import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { planningService } from "../services/firebase/planningService";
import { Goal, PlanningAnalytics, PlanningEvent } from "../types/planning";
import { createLogger } from "../utils/optimizedLogger";
import { widgetService } from "../services/ios/WidgetService";
import { goalsControlService } from "../services/GoalsControlService";
import { enhancedNotificationService } from "../services/notifications/EnhancedNotificationService";
import { calendarService } from "../services/calendar/CalendarIntegrationService";
import { useGlobalPreferences } from "./useGlobalPreferences";

const logger = createLogger("usePlanning");

// Fonction de debounce pour optimiser les mises à jour
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface UsePlanningReturn {
  // État
  events: PlanningEvent[];
  goals: Goal[];
  analytics: PlanningAnalytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions pour les événements
  createEvent: (
    eventData: Omit<PlanningEvent, "id" | "createdAt" | "updatedAt" | "userId">
  ) => Promise<string>;
  updateEvent: (
    eventId: string,
    updates: Partial<PlanningEvent>
  ) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Actions pour les objectifs
  createGoal: (
    goalData: Omit<
      Goal,
      "id" | "createdAt" | "updatedAt" | "progress" | "userId"
    >
  ) => Promise<string>;
  updateGoalProgress: (goalId: string, current: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;

  // Utilitaires
  refreshData: () => Promise<void>;
  getEventsForDate: (date: Date) => PlanningEvent[];
  getActiveGoals: () => Goal[];
  calculateAnalytics: (
    period: "week" | "month" | "quarter" | "year"
  ) => Promise<void>;
}

export const usePlanning = (): UsePlanningReturn => {
  const { user } = useAuth();
  const { planningPreferences } = useGlobalPreferences();
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<PlanningAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref pour débouncer refreshData
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger les données initiales
  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      setError(null);

      logger.info("🔄 Chargement des données depuis Firebase...", {
        userId: user.uid,
      });

      const [eventsData, goalsData] = await Promise.all([
        planningService.getUserEvents(user.uid),
        planningService.getUserGoals(user.uid),
      ]);

      logger.info("📊 Données récupérées de Firebase:", {
        eventsCount: eventsData.length,
        goalsCount: goalsData.length,
        events: eventsData.map((e: any) => ({
          id: e.id,
          title: e.title,
          type: e.type,
        })),
        goals: goalsData.map((g) => ({
          id: g.id,
          title: g.title,
          type: g.type,
        })),
      });

      setEvents(eventsData);
      setGoals(goalsData);

      // Synchroniser avec le widget iOS
      // Synchroniser avec le widget et les notifications
      await widgetService.updateWidgetData(goalsData);
      await goalsControlService.createGoalControlNotifications(goalsData);

      logger.info("✅ Données chargées avec succès", {
        eventsCount: eventsData.length,
        goalsCount: goalsData.length,
      });
    } catch (err: any) {
      logger.error("❌ Erreur lors du chargement des données:", err);
      setError("Impossible de charger les données de planification");
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Créer des versions debouncées des setters pour éviter les mises à jour trop fréquentes
  const debouncedSetEvents = useMemo(
    () => debounce((eventsData: PlanningEvent[]) => {
      setEvents((currentEvents) => {
        // Éviter les mises à jour inutiles - comparaison optimisée
        if (currentEvents.length === eventsData.length &&
            currentEvents.every((event, index) => 
              event.id === eventsData[index]?.id &&
              event.updatedAt === eventsData[index]?.updatedAt
            )) {
          return currentEvents;
        }
        return eventsData;
      });
    }, 300),
    []
  );

  const debouncedSetGoals = useMemo(
    () => debounce((goalsData: Goal[]) => {
      setGoals((currentGoals) => {
        // Éviter les mises à jour inutiles - comparaison optimisée
        if (currentGoals.length === goalsData.length &&
            currentGoals.every((goal, index) => 
              goal.id === goalsData[index]?.id &&
              goal.updatedAt === goalsData[index]?.updatedAt
            )) {
          return currentGoals;
        }
        return goalsData;
      });
    }, 300),
    []
  );

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribeEvents: (() => void) | undefined;
    let unsubscribeGoals: (() => void) | undefined;

    try {
      unsubscribeEvents = planningService.subscribeToUserEvents(
        user.uid,
        debouncedSetEvents
      );

      unsubscribeGoals = planningService.subscribeToUserGoals(
        user.uid,
        debouncedSetGoals
      );
    } catch (err: any) {
      logger.error("Erreur lors de l'écoute en temps réel:", err);
      setError("Impossible d'écouter les mises à jour en temps réel");
    }

    return () => {
      try {
        unsubscribeEvents?.();
        unsubscribeGoals?.();
      } catch (err) {
        logger.error("Erreur lors du nettoyage des listeners:", err);
      }
    };
  }, [user?.uid, debouncedSetEvents, debouncedSetGoals]);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions pour les événements
  const createEvent = useCallback(
    async (
      eventData: Omit<
        PlanningEvent,
        "id" | "createdAt" | "updatedAt" | "userId"
      >
    ): Promise<string> => {
      if (!user?.uid) throw new Error("Utilisateur non authentifié");

      try {
        logger.info("🚀 Tentative de création d'événement", {
          userId: user.uid,
          eventTitle: eventData.title,
          eventType: eventData.type,
        });

        const eventId = await planningService.createEvent({
          ...eventData,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        logger.info("✅ Événement créé avec succès", { eventId });

        const newEvent: PlanningEvent = {
          id: eventId,
          ...eventData,
          userId: user.uid,
          status: (eventData as PlanningEvent).status ?? "planned",
          priority: (eventData as PlanningEvent).priority ?? "medium",
          reminders: Array.isArray((eventData as PlanningEvent).reminders)
            ? (eventData as PlanningEvent).reminders
            : [],
          tags: Array.isArray((eventData as PlanningEvent).tags)
            ? (eventData as PlanningEvent).tags
            : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setEvents((currentEvents) => {
          const exists = currentEvents.some((event) => event.id === eventId);
          if (!exists) {
            return [newEvent, ...currentEvents];
          }
          return currentEvents;
        });

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
          loadData();
        }, 50);

        try {
          if (
            planningPreferences?.notificationSettings?.eventReminders?.enabled
          ) {
            const reminderMinutes = (newEvent.reminders || [])
              .map((r) => r.triggerBefore)
              .filter((m) => typeof m === "number" && m > 0);
            for (const minutesBefore of reminderMinutes) {
              await enhancedNotificationService.scheduleEventNotification(
                newEvent,
                minutesBefore
              );
            }
          }
        } catch (notificationError) {
          logger.warn("Notifications d'événement non programmées", {
            error: (notificationError as Error)?.message,
          });
        }

        try {
          const calendarEnabled =
            (planningPreferences?.notificationSettings?.integrations?.calendar
              ?.enabled ?? true) === true;
          if (calendarEnabled) {
            await calendarService.initialize();
            const calendarEventId = await calendarService.syncEventToCalendar(
              newEvent
            );
            if (calendarEventId) {
              await planningService.updateEvent(eventId, { calendarEventId });
              setEvents((current) =>
                current.map((e) =>
                  e.id === eventId ? { ...e, calendarEventId } : e
                )
              );
            }
          }
        } catch (calendarError) {
          logger.warn("Synchronisation calendrier non effectuée", {
            error: (calendarError as Error)?.message,
          });
        }

        return eventId;
      } catch (err: any) {
        logger.error(
          "❌ Erreur détaillée lors de la création de l'événement:",
          {
            error: err,
            errorMessage: err?.message,
            errorCode: err?.code,
            userId: user.uid,
            eventData: {
              title: eventData.title,
              type: eventData.type,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
            },
          }
        );
        throw new Error("Impossible de créer l'événement");
      }
    },
    [user?.uid, loadData]
  );

  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<PlanningEvent>): Promise<void> => {
      try {
        logger.info("🔄 Tentative de mise à jour d'événement", {
          eventId,
          updates,
          userId: user?.uid,
        });

        await planningService.updateEvent(eventId, updates);
        try {
          // Rechercher l'événement courant pour recalculer les rappels et la synchro
          const current = events.find((e) => e.id === eventId);
          if (current) {
            const merged: PlanningEvent = {
              ...current,
              ...updates,
            } as PlanningEvent;

            // Reprogrammer les notifications si activées
            if (
              planningPreferences?.notificationSettings?.eventReminders?.enabled
            ) {
              // Annuler anciennes notifications (si votre implémentation les référence)
              // Puis reprogrammer selon les nouveaux horaires
              const reminderMinutes = merged.reminders
                .map((r) => r.triggerBefore)
                .filter((m) => typeof m === "number" && m > 0);
              for (const minutesBefore of reminderMinutes) {
                await enhancedNotificationService.scheduleEventNotification(
                  merged,
                  minutesBefore
                );
              }
            }

            // MAJ calendrier si activé
            const calendarEnabled =
              planningPreferences?.notificationSettings?.integrations?.calendar
                ?.enabled === true;
            if (calendarEnabled) {
              await calendarService.initialize();
              // Si on a déjà un id calendrier, on peut supprimer puis recréer
              if (merged.calendarEventId) {
                await calendarService.removeEventFromCalendar(
                  merged.calendarEventId
                );
              }
              const newId = await calendarService.syncEventToCalendar(merged);
              if (newId && merged.calendarEventId !== newId) {
                await planningService.updateEvent(eventId, {
                  calendarEventId: newId,
                });
              }
            }
          }
        } catch (sideEffectError) {
          logger.warn("Effets de bord update (rappels/calendrier) ignorés", {
            error: (sideEffectError as Error)?.message,
          });
        }
        logger.info("✅ Événement mis à jour avec succès", { eventId });
      } catch (err: any) {
        logger.error(
          "❌ Erreur détaillée lors de la mise à jour de l'événement:",
          {
            error: err,
            errorMessage: err?.message,
            errorCode: err?.code,
            eventId,
            updates,
            userId: user?.uid,
          }
        );
        throw new Error("Impossible de mettre à jour l'événement");
      }
    },
    [user?.uid]
  );

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      logger.info("🗑️ Tentative de suppression d'événement", { eventId });
      // Retrouver l'event pour nettoyage des rappels et calendrier
      const current = events.find((e) => e.id === eventId);
      await planningService.deleteEvent(eventId);

      try {
        // Annuler rappels (si on gérait des IDs, à brancher ici)
        await enhancedNotificationService.cancelRegisteredNotifications(
          "event",
          eventId
        );
        // Nettoyer calendrier si besoin
        const calendarEnabled =
          planningPreferences?.notificationSettings?.integrations?.calendar
            ?.enabled === true;
        if (calendarEnabled && current?.calendarEventId) {
          await calendarService.initialize();
          await calendarService.removeEventFromCalendar(
            current.calendarEventId
          );
        }
      } catch (cleanupError) {
        logger.warn("Nettoyage rappels/calendrier ignoré", {
          error: (cleanupError as Error)?.message,
        });
      }
      logger.info("✅ Événement supprimé avec succès", { eventId });
    } catch (err: any) {
      logger.error("❌ Erreur lors de la suppression de l'événement:", {
        error: err,
        errorMessage: err?.message,
        errorCode: err?.code,
        eventId,
      });

      // Ne pas relancer l'erreur si l'événement n'existe déjà plus
      if (
        err?.code === "not-found" ||
        err?.message?.includes("No document to update")
      ) {
        logger.info("ℹ️ Événement déjà supprimé", { eventId });
        return;
      }

      throw new Error("Impossible de supprimer l'événement");
    }
  }, []);

  // Actions pour les objectifs
  const createGoal = useCallback(
    async (
      goalData: Omit<
        Goal,
        "id" | "createdAt" | "updatedAt" | "progress" | "userId"
      >
    ): Promise<string> => {
      if (!user?.uid) throw new Error("Utilisateur non authentifié");

      try {
        const goalId = await planningService.createGoal({
          ...goalData,
          userId: user.uid,
        });

        logger.info("Objectif créé avec succès", { goalId });

        const newGoal: Goal = {
          id: goalId,
          ...goalData,
          userId: user.uid,
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setGoals((currentGoals) => {
          const exists = currentGoals.some((goal) => goal.id === goalId);
          if (!exists) {
            return [newGoal, ...currentGoals];
          }
          return currentGoals;
        });

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
          loadData();
        }, 50);

        try {
          const goalSettings =
            planningPreferences?.notificationSettings?.goalReminders;
          if (goalSettings?.enabled) {
            if (goalSettings.dailyProgress) {
              await enhancedNotificationService.scheduleDailyGoalProgressReminder(
                newGoal
              );
            }
            if (goalSettings.weeklyReview) {
              await enhancedNotificationService.scheduleWeeklyGoalReviewReminder(
                newGoal
              );
            }
            if (goalSettings.overdueAlerts) {
              await enhancedNotificationService.scheduleGoalOverdueReminder(
                newGoal
              );
            }
          }
        } catch (e) {
          logger.warn("Programmation rappels objectif ignorée", {
            error: (e as Error)?.message,
          });
        }

        return goalId;
      } catch (err) {
        logger.error("Erreur lors de la création de l'objectif:", err);
        throw new Error("Impossible de créer l'objectif");
      }
    },
    [user?.uid, loadData]
  );

  const updateGoalProgress = useCallback(
    async (goalId: string, current: number): Promise<void> => {
      try {
        await planningService.updateGoalProgress(goalId, current);

        // Recharger les données et synchroniser avec le widget
        await loadData();

        logger.info("Progression de l'objectif mise à jour", {
          goalId,
          current,
        });
        try {
          const goalSettings =
            planningPreferences?.notificationSettings?.goalReminders;
          if (goalSettings?.enabled && current >= 100) {
            const goal = goals.find((g) => g.id === goalId);
            if (goal && goalSettings.achievementCelebrations) {
              await enhancedNotificationService.scheduleGoalNotification(
                { ...goal, progress: 100 },
                "achievement"
              );
            }
          }
        } catch (e) {}
      } catch (err) {
        logger.error("Erreur lors de la mise à jour de la progression:", err);
        throw new Error("Impossible de mettre à jour la progression");
      }
    },
    [loadData, goals, planningPreferences?.notificationSettings?.goalReminders]
  );

  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    try {
      await planningService.deleteGoal(goalId);
      try {
        await enhancedNotificationService.cancelGoalNotifications(goalId);
      } catch (e) {
        logger.warn("Annulation notifications objectif ignorée", {
          error: (e as Error)?.message,
        });
      }
      // Rafraîchir localement
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      logger.error("Erreur lors de la suppression de l'objectif:", err);
      throw err;
    }
  }, []);

  // Utilitaires
  const refreshData = useCallback(async (): Promise<void> => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    return new Promise((resolve) => {
      refreshTimeoutRef.current = setTimeout(async () => {
        await loadData();
        resolve();
      }, 50);
    });
  }, [loadData]);

  const getEventsForDate = useCallback(
    (date: Date): PlanningEvent[] => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      return events.filter((event) => {
        const eventStart = new Date(event.startDate);
        return eventStart >= targetDate && eventStart < nextDay;
      });
    },
    [events]
  );

  const getActiveGoals = useCallback((): Goal[] => {
    return goals.filter((goal) => goal.status === "active");
  }, [goals]);

  const calculateAnalytics = useCallback(
    async (period: "week" | "month" | "quarter" | "year"): Promise<void> => {
      if (!user?.uid) return;

      try {
        const analyticsData = await planningService.calculatePlanningAnalytics(
          user.uid,
          period
        );
        setAnalytics(analyticsData);
      } catch (err) {
        logger.error("Erreur lors du calcul des analytics:", err);
        setError("Impossible de calculer les analytics");
      }
    },
    [user?.uid]
  );

  // Nettoyage des timeouts au démontage
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    // État
    events,
    goals,
    analytics,
    isLoading,
    error,

    // Actions pour les événements
    createEvent,
    updateEvent,
    deleteEvent,

    // Actions pour les objectifs
    createGoal,
    updateGoalProgress,
    deleteGoal,

    // Utilitaires
    refreshData,
    getEventsForDate,
    getActiveGoals,
    calculateAnalytics,
  };
};
