import { useCallback, useMemo, useRef, useState } from "react";
import { TFunction } from "i18next";
import { useTranslation } from "../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../types/planning";
import { filterEvents, groupEvents, searchEvents, sortEvents } from "../utils";

export const useEventTimeline = (events: PlanningEvent[]) => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<PlanningEvent["status"][]>(
    []
  );
  const [filterType, setFilterType] = useState<PlanningEvent["type"][]>([]);
  const [groupBy, setGroupBy] = useState<
    "date" | "status" | "type" | "priority"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchForceUpdate, setSearchForceUpdate] = useState(0);

  const processedEvents = useMemo(() => {
    let filtered = filterEvents(events, filterStatus, filterType);
    filtered = searchEvents(filtered, searchTerm, t as TFunction);
    return sortEvents(filtered, sortOrder);
  }, [
    events,
    filterStatus,
    filterType,
    searchTerm,
    sortOrder,
    t,
    searchForceUpdate,
  ]);

  const groupedEvents = useMemo(() => {
    return groupEvents(processedEvents, groupBy);
  }, [processedEvents, groupBy]);

  const handleFilterStatusChange = useCallback(
    (status: PlanningEvent["status"][]) => {
      setFilterStatus(status);
    },
    []
  );

  const handleFilterTypeChange = useCallback(
    (types: PlanningEvent["type"][]) => {
      setFilterType(types);
    },
    []
  );

  const handleGroupByChange = useCallback(
    (newGroupBy: "date" | "status" | "type" | "priority") => {
      setGroupBy(newGroupBy);
    },
    []
  );

  const handleSortOrderChange = useCallback((order: "asc" | "desc") => {
    setSortOrder(order);
  }, []);

  // Optimisation : utiliser un debounce pour la recherche
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((term: string) => {
    // Mettre à jour immédiatement pour l'affichage dans l'input
    setSearchTerm(term);

    // Débouncer la mise à jour des résultats pour éviter les re-renders excessifs
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchForceUpdate((prev) => prev + 1);
    }, 150);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterType([]);
    setSearchTerm("");
    setGroupBy("date");
    setSortOrder("desc");
    setSearchForceUpdate((prev) => prev + 1);
  }, []);

  const stats = useMemo(() => {
    const total = processedEvents.length;
    const completed = processedEvents.filter(
      (e) => e.status === "completed"
    ).length;
    const inProgress = processedEvents.filter(
      (e) => e.status === "in_progress"
    ).length;
    const planned = processedEvents.filter(
      (e) => e.status === "planned"
    ).length;
    const overdue = processedEvents.filter((e) => {
      const now = new Date();
      const eventDate = new Date(e.endDate);
      return (
        eventDate < now && e.status !== "completed" && e.status !== "cancelled"
      );
    }).length;

    return {
      total,
      completed,
      inProgress,
      planned,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [processedEvents]);

  return {
    filterStatus,
    filterType,
    groupBy,
    sortOrder,
    searchTerm,
    processedEvents,
    groupedEvents,
    stats,
    handleFilterStatusChange,
    handleFilterTypeChange,
    handleGroupByChange,
    handleSortOrderChange,
    handleSearchChange,
    handleResetFilters,
  };
};
