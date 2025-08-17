import { useCallback } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { Goal } from "../../../../../types/planning";
import { goalUtils } from "../utils/goalUtils";

interface UseGoalActionsProps {
  onGoalProgressUpdate?: (goalId: string, newCurrent: number) => void;
  onGoalComplete?: (goalId: string) => void;
  onGoalReactivate?: (goalId: string) => void;
  onGoalDelete?: (goalId: string) => void;
}

export const useGoalActions = ({
  onGoalProgressUpdate,
  onGoalComplete,
  onGoalReactivate,
  onGoalDelete,
}: UseGoalActionsProps) => {
  const { t } = useTranslation();

  const handleQuickIncrement = useCallback(
    (goal: Goal) => {
      const newCurrent = goalUtils.calculateIncrement(goal);
      onGoalProgressUpdate?.(goal.id, newCurrent);
    },
    [onGoalProgressUpdate]
  );

  const handleQuickDecrement = useCallback(
    (goal: Goal) => {
      const newCurrent = goalUtils.calculateDecrement(goal);
      onGoalProgressUpdate?.(goal.id, newCurrent);
    },
    [onGoalProgressUpdate]
  );

  const handleMarkComplete = useCallback(
    (goal: Goal) => {
      Alert.alert(
        t("planning.goals.markComplete.title", "Marquer comme accompli"),
        t(
          "planning.goals.markComplete.message",
          "Êtes-vous sûr d'avoir accompli cet objectif ?"
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("common.confirm", "Confirmer"),
            onPress: () => onGoalComplete?.(goal.id),
          },
        ]
      );
    },
    [onGoalComplete, t]
  );

  const handleReactivateGoal = useCallback(
    (goal: Goal) => {
      Alert.alert(
        t("planning.goals.reactivate.title", "Réactiver l'objectif"),
        t(
          "planning.goals.reactivate.message",
          "Voulez-vous remettre cet objectif en mode actif ?"
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("common.confirm", "Confirmer"),
            onPress: () => onGoalReactivate?.(goal.id),
          },
        ]
      );
    },
    [onGoalReactivate, t]
  );

  const handleDeleteGoal = useCallback(
    (goal: Goal) => {
      Alert.alert(
        t("planning.goals.delete.title", "Supprimer l'objectif"),
        t(
          "planning.goals.delete.message",
          `Êtes-vous sûr de vouloir supprimer "${goal.title}" ? Cette action est irréversible.`
        ),
        [
          {
            text: t("common.cancel", "Annuler"),
            style: "cancel",
          },
          {
            text: t("common.delete", "Supprimer"),
            style: "destructive",
            onPress: () => onGoalDelete?.(goal.id),
          },
        ]
      );
    },
    [onGoalDelete, t]
  );

  return {
    handleQuickIncrement,
    handleQuickDecrement,
    handleMarkComplete,
    handleReactivateGoal,
    handleDeleteGoal,
  };
};
