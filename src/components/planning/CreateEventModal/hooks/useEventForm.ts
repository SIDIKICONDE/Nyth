import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import { PlanningEvent } from "../../../../types/planning";
import { isEditMode } from "../types";

export const useEventForm = (
  event?: PlanningEvent | null,
  selectedDate?: Date,
  onCreate?: (
    eventData: Omit<PlanningEvent, "id" | "createdAt" | "updatedAt" | "userId">
  ) => Promise<void>,
  onSave?: (eventId: string, updates: Partial<PlanningEvent>) => Promise<void>,
  onClose?: () => void
) => {
  const { t } = useTranslation();

  // États du formulaire
  const [title, setTitle] = useState(event?.title ?? "");
  const [type, setType] = useState<PlanningEvent["type"]>(
    event?.type ?? "script_creation"
  );
  const [priority, setPriority] = useState<PlanningEvent["priority"]>(
    event?.priority ?? "medium"
  );
  const initialDate = event
    ? new Date(event.startDate)
    : selectedDate ?? new Date();
  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialDate);
  const [estimatedDuration, setEstimatedDuration] = useState(
    event?.estimatedDuration ?? 60
  );
  const [tags, setTags] = useState(event?.tags?.join(", ") ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Cet effet synchronise le formulaire avec l'événement sélectionné
  useEffect(() => {
    if (event) {
      // Mode édition : charger les données de l'événement
      setTitle(event.title ?? "");
      setType(event.type ?? "script_creation");
      setPriority(event.priority ?? "medium");
      const eventDate = new Date(event.startDate);
      setStartDate(eventDate);
      setStartTime(eventDate);
      setEstimatedDuration(event.estimatedDuration ?? 60);
      setTags(event.tags?.join(", ") ?? "");
      setLocation(event.location ?? "");
    } else {
      // Mode création : réinitialiser le formulaire
      resetForm();
      const initialDate = selectedDate ?? new Date();
      setStartDate(initialDate);
      setStartTime(initialDate);
    }
  }, [event, selectedDate]);

  const resetForm = useCallback(() => {
    setTitle("");
    setType("script_creation");
    setPriority("medium");
    setEstimatedDuration(60);
    setTags("");
    setLocation("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(
        t("common.error", "Error"),
        t("planning.events.errors.titleRequired", "Title is required")
      );
      return;
    }

    if (!onCreate || !onSave || !onClose) return;

    try {
      setIsLoading(true);

      // Combiner date et heure
      const combinedStartDate = new Date(startDate);
      combinedStartDate.setHours(startTime.getHours());
      combinedStartDate.setMinutes(startTime.getMinutes());

      // Calculer la date de fin basée sur la durée
      const endDate = new Date(combinedStartDate);
      endDate.setMinutes(endDate.getMinutes() + estimatedDuration);

      const eventData: Omit<
        PlanningEvent,
        "id" | "createdAt" | "updatedAt" | "userId"
      > = {
        title: title.trim(),
        type,
        priority,
        status: "planned",
        startDate: combinedStartDate,
        endDate: endDate,
        estimatedDuration,
        location: location.trim() || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        reminders: [
          {
            id: Date.now().toString(),
            type: "notification",
            triggerBefore: 15, // 15 minutes avant
            sent: false,
          },
        ],
      };

      if (isEditMode(event)) {
        await onSave(event.id, eventData as Partial<PlanningEvent>);
      } else {
        await onCreate(eventData);
      }

      // Reset form seulement en mode création
      if (!isEditMode(event)) resetForm();

      // Fermer avec un délai minimal pour éviter les conflits
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      Alert.alert(
        t("common.error", "Error"),
        isEditMode(event)
          ? t("planning.events.errors.saveFailed", "Could not save changes")
          : t("planning.events.errors.createFailed", "Could not create event")
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    onCreate,
    onSave,
    onClose,
    startDate,
    startTime,
    estimatedDuration,
    type,
    priority,
    tags,
    location,
    event,
    resetForm,
    t,
  ]);

  const onDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  }, []);

  const onTimeChange = useCallback((event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  }, []);

  return {
    // Form state
    title,
    setTitle,
    type,
    setType,
    priority,
    setPriority,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    estimatedDuration,
    setEstimatedDuration,
    tags,
    setTags,
    location,
    setLocation,
    isLoading,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,

    // Actions
    handleSubmit,
    onDateChange,
    onTimeChange,
  };
};
