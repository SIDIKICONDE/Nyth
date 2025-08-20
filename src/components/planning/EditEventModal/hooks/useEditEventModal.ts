import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { LABELS } from "../constants";
import { EditEventModalProps } from "../types";

export const useEditEventModal = (props: EditEventModalProps) => {
  const { event, onClose, onSave } = props;
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser les champs quand l'événement change
  React.useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
    }
  }, [event]);

  // Vérifier si le formulaire est valide
  const isValid = title.trim().length > 0;

  // Gestion de la sauvegarde
  const handleSave = useCallback(async () => {
    if (!event || !isValid) {
      Alert.alert(
        t("common.error", LABELS.ERROR_TITLE),
        t("planning.events.errors.titleRequired", LABELS.TITLE_REQUIRED_ERROR)
      );
      return;
    }

    try {
      setIsLoading(true);
      await onSave(event.id, {
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (error) {
      Alert.alert(
        t("common.error", LABELS.ERROR_TITLE),
        t("planning.events.errors.saveFailed", LABELS.SAVE_FAILED_ERROR)
      );
    } finally {
      setIsLoading(false);
    }
  }, [event, isValid, title, description, onSave, onClose, t]);

  // Gestion des changements de champs
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleDescriptionChange = useCallback((newDescription: string) => {
    setDescription(newDescription);
  }, []);

  return {
    // État
    title,
    description,
    isLoading,
    isValid,

    // Actions
    handleSave,
    handleTitleChange,
    handleDescriptionChange,
  };
};
