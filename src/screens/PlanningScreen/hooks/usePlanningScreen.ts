import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { usePlanning } from "../../../hooks/usePlanning";
import { PlanningEvent } from "../../../types/planning";
import { TabType } from "../types";
import { useGlobalPreferences } from "../../../hooks/useGlobalPreferences";

export const usePlanningScreen = () => {
  const { user } = useAuth();
  const { events, goals, createEvent, updateEvent, deleteEvent, refreshData } =
    usePlanning();
  const { preferences } = useGlobalPreferences();

  // État local
  const [activeTab, setActiveTab] = useState<TabType>("timeline");
  const [showEventModal, setShowEventModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const appliedDefaultTabRef = useRef<string | null>(null);

  useEffect(() => {
    const desired = preferences?.planningPreferences?.defaultTab;
    if (
      desired === "timeline" ||
      desired === "tasks" ||
      desired === "calendar"
    ) {
      if (appliedDefaultTabRef.current !== desired) {
        setActiveTab(desired);
        appliedDefaultTabRef.current = desired;
      }
    }
  }, [preferences?.planningPreferences?.defaultTab]);

  // Protection contre les appels multiples
  const deletingEventsRef = useRef<Set<string>>(new Set());

  // Handlers pour les événements
  const handleEventPress = useCallback((event: PlanningEvent) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  }, []);

  const handleEventEdit = useCallback((event: PlanningEvent) => {
    setSelectedEvent(event);
    // Fermer le modal de détails et ouvrir le modal d'édition
    setShowEventDetailModal(false);
    setShowEventModal(true);
  }, []);

  const handleEventSave = useCallback(
    async (eventId: string, updates: Partial<PlanningEvent>) => {
      try {
        await updateEvent(eventId, updates);
      } catch (error) {
        throw error;
      }
    },
    [updateEvent]
  );

  const handleEventDelete = useCallback(
    async (eventId: string) => {
      // Vérifier si la suppression est déjà en cours
      if (deletingEventsRef.current.has(eventId)) {
        return;
      }

      try {
        // Marquer comme en cours de suppression
        deletingEventsRef.current.add(eventId);

        // Fermer le modal immédiatement pour éviter les double-clics
        setShowEventDetailModal(false);
        setSelectedEvent(null);

        await deleteEvent(eventId);
      } catch (error) {} finally {
        // Retirer de la liste des suppressions en cours
        deletingEventsRef.current.delete(eventId);
      }
    },
    [deleteEvent]
  );

  const handleEventStatusChange = useCallback(
    async (eventId: string, newStatus: PlanningEvent["status"]) => {
      // Protection contre les appels multiples
      if (deletingEventsRef.current.has(eventId)) {
        return;
      }

      try {
        // Marquer comme en cours de traitement
        deletingEventsRef.current.add(eventId);

        await updateEvent(eventId, { status: newStatus });
      } catch (error) {} finally {
        // Retirer de la liste des opérations en cours
        requestAnimationFrame(() => {
          deletingEventsRef.current.delete(eventId);
        });
      }
    },
    [updateEvent]
  );

  const handleDatePress = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
  }, []);

  const handleCreateEvent = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  }, []);

  const handleEventCreate = useCallback(
    async (
      eventData: Omit<
        PlanningEvent,
        "id" | "createdAt" | "updatedAt" | "userId"
      >
    ) => {
      try {
        const eventId = await createEvent(eventData);
      } catch (error) {
        throw error;
      }
    },
    [createEvent]
  );

  const handleGoalCreated = useCallback(
    async (goalId: string) => {
      try {
        // Fermer le modal immédiatement
        setShowGoalModal(false);

        // Rafraîchir les données de manière optimisée
        requestAnimationFrame(() => {
          refreshData();
        });
      } catch (error) {}
    },
    [refreshData]
  );

  // Actions pour l'en-tête
  const handleCreateEventFromHeader = useCallback(() => {
    if (activeTab === "calendar" || activeTab === "timeline") {
      handleCreateEvent(new Date());
    }
  }, [activeTab, handleCreateEvent]);

  const handleOpenGoalModal = useCallback(() => {
    setShowGoalModal(true);
  }, []);

  const handleOpenSettingsModal = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  // Version optimisée de la fermeture du modal d'événement
  const handleCloseEventModal = useCallback(() => {
    // Fermer le modal immédiatement
    setShowEventModal(false);

    // Nettoyer l'événement sélectionné de manière optimisée
    requestAnimationFrame(() => {
      setSelectedEvent(null);
    });
  }, []);

  // Fermeture du modal de détail d'événement
  const handleCloseEventDetailModal = useCallback(() => {
    // Fermer le modal immédiatement
    setShowEventDetailModal(false);

    // Nettoyer l'événement sélectionné de manière optimisée
    requestAnimationFrame(() => {
      setSelectedEvent(null);
    });
  }, []);

  return {
    // État
    events,
    goals,
    activeTab,
    showEventModal,
    showGoalModal,
    showSettingsModal,
    showEventDetailModal,
    selectedEvent,
    selectedDate,

    // Setters
    setActiveTab,
    setShowEventModal,
    setShowGoalModal,
    setShowSettingsModal,
    setSelectedEvent,

    // Handlers
    handleEventPress,
    handleEventEdit,
    handleEventSave,
    handleEventDelete,
    handleEventStatusChange,
    handleDatePress,
    handleCreateEvent,
    handleEventCreate,
    handleGoalCreated,
    handleCreateEventFromHeader,
    handleOpenGoalModal,
    handleOpenSettingsModal,
    handleCloseEventModal,
    handleCloseEventDetailModal,

    // Debug
    refreshData,
  };
};
