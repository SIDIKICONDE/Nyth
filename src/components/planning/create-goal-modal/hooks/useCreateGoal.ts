import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { planningService } from "../../../../services/firebase/planningService";
import { Goal } from "../../../../types/planning";
import { INITIAL_FORM_DATA } from "../constants";
import { GoalFormData } from "../types";
import { transformFormDataToGoalData, validateFormData } from "../utils";

export const useCreateGoal = (
  onGoalCreated?: (goalId: string) => void,
  onClose?: () => void,
  existingGoal?: Goal,
  onGoalUpdated?: (goal: Goal) => void
) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(INITIAL_FORM_DATA);

  const isEditMode = !!existingGoal;

  useEffect(() => {
    if (existingGoal) {
      setFormData({
        title: existingGoal.title,
        description: existingGoal.description,
        type: existingGoal.type,
        period: existingGoal.period,
        target: existingGoal.target.toString(),
        current: existingGoal.current.toString(),
        unit: existingGoal.unit,
        category: existingGoal.category,
        priority: existingGoal.priority,
        startDate:
          existingGoal.startDate instanceof Date
            ? existingGoal.startDate
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("/")
            : new Date(existingGoal.startDate)
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("/"),
        endDate:
          existingGoal.endDate instanceof Date
            ? existingGoal.endDate
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("/")
            : new Date(existingGoal.endDate)
                .toISOString()
                .split("T")[0]
                .split("-")
                .reverse()
                .join("/"),
      });
    } else {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      setFormData({
        ...INITIAL_FORM_DATA,
        startDate: today
          .toISOString()
          .split("T")[0]
          .split("-")
          .reverse()
          .join("/"),
        endDate: nextWeek
          .toISOString()
          .split("T")[0]
          .split("-")
          .reverse()
          .join("/"),
      });
    }
  }, [existingGoal]);

  const updateFormData = (updates: Partial<GoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(
        t("common.error", "Error"),
        t(
          "planning.goals.errors.notConnected",
          "You must be logged in to create a goal"
        )
      );
      return;
    }

    const validationError = validateFormData(formData, t);
    if (validationError) {
      Alert.alert(t("common.error", "Error"), validationError);
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && existingGoal) {
        const updatedGoalData = {
          ...existingGoal,
          ...transformFormDataToGoalData(formData, user.uid),
          id: existingGoal.id,
          createdAt: existingGoal.createdAt,
          updatedAt: new Date().toISOString(),
        };

        await planningService.updateGoal(existingGoal.id, updatedGoalData);

        Alert.alert(
          t("common.success", "Success"),
          t("planning.goals.updateSuccess", "Goal updated successfully!")
        );

        onGoalUpdated?.(updatedGoalData);
      } else {
        const goalData = transformFormDataToGoalData(formData, user.uid);
        const goalId = await planningService.createGoal(goalData);

        Alert.alert(
          t("common.success", "Success"),
          t("planning.goals.createSuccess", "Goal created successfully!")
        );

        onGoalCreated?.(goalId);
      }

      handleClose();
    } catch (error) {
      Alert.alert(
        t("common.error", "Error"),
        isEditMode
          ? t("planning.goals.errors.updateFailed", "Could not update goal")
          : t("planning.goals.errors.createFailed", "Could not create goal")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  return {
    formData,
    loading,
    updateFormData,
    handleSubmit,
    handleClose,
    isEditMode,
  };
};
