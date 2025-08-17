import { useCallback } from "react";
import { TaskWithDynamicStatus } from "../../../../../types/planning";
import { UseTaskOrganizationProps } from "../types";

export const useTaskOrganization = ({
  externalTasks,
  getTasksByColumn,
}: UseTaskOrganizationProps) => {
  // Fonction pour organiser les tâches par colonne
  const getTasksForColumn = useCallback(
    (columnId: string): TaskWithDynamicStatus[] => {
      if (externalTasks) {
        // Utiliser les tâches externes - filtrer par status/columnId
        const filtered = externalTasks.filter(
          (task: any) => task.status === columnId || task.columnId === columnId
        );
        return filtered;
      } else {
        // Utiliser la fonction interne pour les tâches du hook
        const internal = getTasksByColumn(columnId);
        return internal;
      }
    },
    [externalTasks, getTasksByColumn]
  );

  return {
    getTasksForColumn,
  };
};
