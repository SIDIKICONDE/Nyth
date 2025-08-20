import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

type LegacyBorderStyle = "solid" | "dashed" | "gradient" | "dotted";
interface ColumnWithBorderStyle {
  borderStyle?: LegacyBorderStyle;
}
import { useTranslation } from "react-i18next";
import {
  ColumnFormData,
  DynamicKanbanColumn,
  TaskWithDynamicStatus,
} from "../types/planning";

const STORAGE_KEY = "dynamic_kanban_config";
const COLUMNS_STORAGE_KEY = "kanban_columns";
const KANBAN_THEME_STORAGE_KEY = "kanban_theme";

// Couleur par défaut du Kanban
const DEFAULT_KANBAN_COLOR = "#3B82F6";

// Fonction pour générer les colonnes par défaut avec traductions
const getDefaultColumns = (t: any): DynamicKanbanColumn[] => [
  {
    id: "todo",
    title: t("planning.tasks.kanban.defaultColumns.todo", "À faire"),
    color: "#6B7280",
    description: t(
      "planning.tasks.kanban.statusOptions.todo.description",
      "Tâche non commencée"
    ),
    order: 0,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "in_progress",
    title: t("planning.tasks.kanban.defaultColumns.inProgress", "En cours"),
    color: "#3B82F6",
    description: t(
      "planning.tasks.kanban.statusOptions.inProgress.description",
      "Travail en cours"
    ),
    order: 1,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "review",
    title: t("planning.tasks.kanban.defaultColumns.review", "En révision"),
    color: "#F59E0B",
    description: t(
      "planning.tasks.kanban.statusOptions.review.description",
      "En attente de validation"
    ),
    order: 2,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "blocked",
    title: t("planning.tasks.kanban.defaultColumns.blocked", "Bloquée"),
    color: "#EF4444",
    description: t(
      "planning.tasks.kanban.statusOptions.blocked.description",
      "Tâche bloquée"
    ),
    order: 3,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "completed",
    title: t("planning.tasks.kanban.defaultColumns.completed", "Terminé"),
    color: "#10B981",
    description: t(
      "planning.tasks.kanban.statusOptions.done.description",
      "Tâche complétée"
    ),
    order: 4,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Couleurs prédéfinies pour les nouvelles colonnes
const PRESET_COLORS = [
  "#EF4444", // Rouge
  "#F59E0B", // Orange
  "#EAB308", // Jaune
  "#22C55E", // Vert
  "#06B6D4", // Cyan
  "#3B82F6", // Bleu
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#6B7280", // Gris
  "#78716C", // Pierre
];

export const useDynamicKanban = () => {
  const { t } = useTranslation();
  const [columns, setColumns] = useState<DynamicKanbanColumn[]>([]);
  const [tasks, setTasks] = useState<TaskWithDynamicStatus[]>([]);
  const [kanbanColor, setKanbanColor] = useState<string>(DEFAULT_KANBAN_COLOR);
  const [isLoading, setIsLoading] = useState(true);

  // Obtenir les colonnes par défaut avec traductions
  const getDefaultColumnsWithTranslation = useCallback(() => {
    return getDefaultColumns(t);
  }, [t]);

  // Sauvegarder les colonnes sans mettre à jour l'état (pour éviter les boucles)
  const saveColumnsToStorage = useCallback(
    async (newColumns: DynamicKanbanColumn[]) => {
      try {
        await AsyncStorage.setItem(
          COLUMNS_STORAGE_KEY,
          JSON.stringify(newColumns)
        );
      } catch (error) {}
    },
    []
  );

  // Charger les colonnes depuis le stockage
  const loadColumnsFromStorage = useCallback(async () => {
    try {
      const storedColumns = await AsyncStorage.getItem(COLUMNS_STORAGE_KEY);

      if (storedColumns) {
        const parsedColumns = JSON.parse(storedColumns);

        // Migration et normalisation du style de bordure
        let migrated = false;
        const sanitizedColumns = parsedColumns.map(
          (col: Record<string, unknown>) => {
            if (!col) return col;
            const column = col as ColumnWithBorderStyle;
            const current = column.borderStyle;

            if (current === "dotted") {
              migrated = true;
              return {
                ...col,
                borderStyle: Platform.OS === "ios" ? "solid" : "dashed",
              };
            }
            if (Platform.OS === "ios" && current === "dashed") {
              migrated = true;
              return { ...col, borderStyle: "solid" };
            }
            return col;
          }
        );

        if (migrated) {
          await AsyncStorage.setItem(
            COLUMNS_STORAGE_KEY,
            JSON.stringify(sanitizedColumns)
          );
        }

        // Vérifier si les colonnes contiennent "blocked"
        const hasBlockedColumn = sanitizedColumns.some(
          (col: Record<string, unknown>) => col.id === "blocked"
        );

        if (!hasBlockedColumn) {
          // Ajouter la colonne "blocked" aux colonnes existantes
          const updatedColumns = [
            ...sanitizedColumns,
            {
              id: "blocked",
              title: t(
                "planning.tasks.kanban.defaultColumns.blocked",
                "Bloquée"
              ),
              color: "#EF4444",
              description: t(
                "planning.tasks.kanban.statusOptions.blocked.description",
                "Tâche bloquée"
              ),
              order:
                Math.max(...sanitizedColumns.map((col: any) => col.order)) + 1,
              isDefault: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];

          // Sauvegarder les colonnes mises à jour
          await AsyncStorage.setItem(
            COLUMNS_STORAGE_KEY,
            JSON.stringify(updatedColumns)
          );
          setColumns(updatedColumns);
        } else {
          setColumns(sanitizedColumns);
        }
      } else {
        // Aucune colonne sauvegardée, utiliser les colonnes par défaut
        const defaultColumns = getDefaultColumnsWithTranslation();
        await saveColumnsToStorage(defaultColumns);
        setColumns(defaultColumns);
      }
    } catch (error) {
      // En cas d'erreur, utiliser les colonnes par défaut
      const defaultColumns = getDefaultColumnsWithTranslation();
      setColumns(defaultColumns);
    } finally {
      setIsLoading(false);
    }
  }, [getDefaultColumnsWithTranslation, saveColumnsToStorage, t]);

  // Fonction de chargement complète (pour compatibilité)
  const loadColumns = useCallback(async () => {
    await loadColumnsFromStorage();
  }, [loadColumnsFromStorage]);

  // Charger la couleur du Kanban
  const loadKanbanColor = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(KANBAN_THEME_STORAGE_KEY);
      if (stored) {
        setKanbanColor(stored);
      }
    } catch (error) {}
  }, []);

  // Sauvegarder la couleur du Kanban
  const saveKanbanColor = useCallback(async (color: string) => {
    try {
      await AsyncStorage.setItem(KANBAN_THEME_STORAGE_KEY, color);
      setKanbanColor(color);
    } catch (error) {}
  }, []);

  // Sauvegarder les colonnes
  const saveColumns = useCallback(async (newColumns: DynamicKanbanColumn[]) => {
    try {
      await AsyncStorage.setItem(
        COLUMNS_STORAGE_KEY,
        JSON.stringify(newColumns)
      );
      setColumns(newColumns);
    } catch (error) {}
  }, []);

  // Créer une nouvelle colonne
  const createColumn = useCallback(
    async (formData: ColumnFormData) => {
      const newColumn: DynamicKanbanColumn = {
        id: `column_${Date.now()}`,
        title: formData.title,
        color: formData.color,
        description: formData.description,
        maxTasks: formData.maxTasks,
        order: columns.length,
        isDefault: false,
        icon: formData.icon || "list",
        borderStyle:
          Platform.OS === "ios"
            ? formData.borderStyle === "gradient"
              ? "gradient"
              : "solid"
            : formData.borderStyle || "solid",
        autoProgress: formData.autoProgress ?? false,
        validationRules: formData.validationRules,
        validationOptions: (formData as any).validationOptions,
        template: formData.template,
        workflowRules: formData.workflowRules,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedColumns = [...columns, newColumn];
      await saveColumns(updatedColumns);
      return newColumn;
    },
    [columns, saveColumns]
  );

  // Modifier une colonne
  const updateColumn = useCallback(
    async (columnId: string, updates: Partial<ColumnFormData>) => {
      const updatedColumns = columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              ...updates,
              icon: updates.icon ?? column.icon,
              borderStyle:
                Platform.OS === "ios"
                  ? (updates as any).borderStyle === "gradient"
                    ? "gradient"
                    : "solid"
                  : (updates as any).borderStyle ?? column.borderStyle,
              autoProgress:
                (updates as any).autoProgress ?? column.autoProgress,
              validationRules:
                (updates as any).validationRules ?? column.validationRules,
              validationOptions:
                (updates as any).validationOptions ?? column.validationOptions,
              template: (updates as any).template ?? column.template,
              workflowRules:
                (updates as any).workflowRules ?? column.workflowRules,
              updatedAt: new Date().toISOString(),
            }
          : column
      );

      await saveColumns(updatedColumns);
    },
    [columns, saveColumns]
  );

  // Supprimer une colonne
  const deleteColumn = useCallback(
    async (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);

      // Empêcher la suppression des colonnes par défaut
      if (column?.isDefault) {
        throw new Error(
          "Les colonnes par défaut ne peuvent pas être supprimées"
        );
      }

      // Déplacer les tâches vers la première colonne
      const tasksToMove = tasks.filter((task) => task.columnId === columnId);
      const firstColumn = columns.find((col) => col.order === 0);

      if (tasksToMove.length > 0 && firstColumn) {
        const updatedTasks = tasks.map((task) =>
          task.columnId === columnId
            ? { ...task, columnId: firstColumn.id, status: firstColumn.id }
            : task
        );
        setTasks(updatedTasks);
      }

      // Supprimer la colonne et réorganiser les ordres
      const filteredColumns = columns.filter((col) => col.id !== columnId);
      const reorderedColumns = filteredColumns.map((col, index) => ({
        ...col,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      await saveColumns(reorderedColumns);
    },
    [columns, tasks, saveColumns]
  );

  // Réorganiser les colonnes
  const reorderColumns = useCallback(
    async (columnId: string, newOrder: number) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return;

      const otherColumns = columns.filter((col) => col.id !== columnId);

      // Réorganiser
      const reorderedColumns = [
        ...otherColumns.slice(0, newOrder),
        { ...column, order: newOrder },
        ...otherColumns.slice(newOrder),
      ].map((col, index) => ({
        ...col,
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      await saveColumns(reorderedColumns);
    },
    [columns, saveColumns]
  );

  // Obtenir une couleur prédéfinie pour une nouvelle colonne
  const getNextPresetColor = useCallback(() => {
    const usedColors = columns.map((col) => col.color);
    const availableColors = PRESET_COLORS.filter(
      (color) => !usedColors.includes(color)
    );

    return availableColors.length > 0
      ? availableColors[0]
      : PRESET_COLORS[columns.length % PRESET_COLORS.length];
  }, [columns]);

  // Déplacer une tâche vers une autre colonne
  const moveTask = useCallback(
    (taskId: string, newColumnId: string) => {
      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? { ...task, columnId: newColumnId, status: newColumnId }
          : task
      );
      setTasks(updatedTasks);
    },
    [tasks]
  );

  // Organiser les tâches par colonne
  const getTasksByColumn = useCallback(
    (columnId: string) => {
      return tasks.filter((task) => task.columnId === columnId);
    },
    [tasks]
  );

  // Vérifier si une colonne peut être supprimée
  const canDeleteColumn = useCallback(
    (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      return column && !column.isDefault && columns.length > 1;
    },
    [columns]
  );

  // Réinitialiser aux colonnes par défaut
  const resetToDefaults = useCallback(async () => {
    const defaultColumns = getDefaultColumnsWithTranslation();
    await saveColumns(defaultColumns);
  }, [saveColumns, getDefaultColumnsWithTranslation]);

  // Dupliquer une colonne
  const duplicateColumn = useCallback(
    async (columnId: string) => {
      const column = columns.find((col) => col.id === columnId);
      if (!column) return;

      const duplicatedColumn: DynamicKanbanColumn = {
        ...column,
        id: `column_${Date.now()}`,
        title: `${column.title} (Copie)`,
        order: columns.length,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedColumns = [...columns, duplicatedColumn];
      await saveColumns(updatedColumns);
      return duplicatedColumn;
    },
    [columns, saveColumns]
  );

  // Charger au montage
  useEffect(() => {
    loadColumnsFromStorage();
    loadKanbanColor();
  }, [loadColumnsFromStorage, loadKanbanColor]);

  return {
    // État
    columns,
    tasks,
    kanbanColor,
    isLoading,

    // Actions sur les colonnes
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    duplicateColumn,
    resetToDefaults,

    // Actions sur les tâches
    moveTask,
    getTasksByColumn,

    // Actions sur le thème
    saveKanbanColor,

    // Utilitaires
    getNextPresetColor,
    canDeleteColumn,
    PRESET_COLORS,

    // Rechargement
    reload: loadColumnsFromStorage,
  };
};
