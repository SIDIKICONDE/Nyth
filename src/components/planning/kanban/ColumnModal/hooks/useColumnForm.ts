import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { ColumnFormData } from "../types";

interface UseColumnFormReturn {
  formData: ColumnFormData;
  isSaving: boolean;
  updateField: <K extends keyof ColumnFormData>(
    field: K,
    value: ColumnFormData[K]
  ) => void;
  handleSave: () => Promise<void>;
  isValid: boolean;
}

interface UseColumnFormProps {
  visible: boolean;
  column?: any;
  suggestedColor?: string;
  onSave: (formData: ColumnFormData) => Promise<void>;
  onClose: () => void;
}

export const useColumnForm = ({
  visible,
  column,
  suggestedColor,
  onSave,
  onClose,
}: UseColumnFormProps): UseColumnFormReturn => {
  const [formData, setFormData] = useState<ColumnFormData>({
    title: "",
    description: "",
    color: "#3B82F6",
    maxTasks: undefined,
    icon: "list",
    borderStyle: "solid",
    autoProgress: false,
    validationRules: "",
    validationOptions: {},
    template: undefined,
    workflowRules: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser le formulaire
  useEffect(() => {
    if (visible) {
      if (column) {
        // Mode édition
        setFormData({
          title: column.title,
          description: column.description || "",
          color: column.color,
          maxTasks: column.maxTasks,
          icon: column.icon || "list",
          borderStyle: column.borderStyle || "solid",
          autoProgress: column.autoProgress || false,
          validationRules: column.validationRules || "",
          validationOptions: column.validationOptions || {},
          template: column.template,
          workflowRules: column.workflowRules || [],
        });
      } else {
        // Mode création
        setFormData({
          title: "",
          description: "",
          color: suggestedColor || "#3B82F6",
          maxTasks: undefined,
          icon: "list",
          borderStyle: "solid",
          autoProgress: false,
          validationRules: "",
          validationOptions: {},
          template: undefined,
          workflowRules: [],
        });
      }
    }
  }, [visible, column, suggestedColor]);

  const updateField = useCallback(
    <K extends keyof ColumnFormData>(field: K, value: ColumnFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const isValid = formData.title.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!isValid) {
      Alert.alert("Erreur", "Le titre de la colonne est obligatoire");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder la colonne");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isValid, onSave, onClose]);

  return {
    formData,
    isSaving,
    updateField,
    handleSave,
    isValid,
  };
};
