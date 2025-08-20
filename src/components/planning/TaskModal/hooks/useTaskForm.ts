import { useCallback, useEffect, useState } from "react";
import { Task, TaskFormData } from "../../../../types/planning";
import { DEFAULT_FORM_DATA, FORM_VALIDATION } from "../constants";
import { TaskFormState } from "../types";

interface UseTaskFormProps {
  task?: Task;
  initialStatus?: Task["status"];
  onSave: (taskData: TaskFormData) => void;
}

export const useTaskForm = ({
  task,
  initialStatus,
  onSave,
}: UseTaskFormProps) => {
  const [formData, setFormData] = useState<Omit<TaskFormState, "errors">>(
    () => {
      if (task) {
        // Mode édition
        const initialFormData = {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          estimatedHours: task.estimatedHours,
          tags: task.tags || [],
          category: task.category,
          assignedTo: task.assignedTo || [],
          projectId: task.projectId,
          dependencies: task.dependencies || [],
          customization: (task as any).customization || undefined,
          attachments: task.attachments || [],
          images: task.images || [],
          subtasks: task.subtasks || [],
        };
        return initialFormData;
      }
      // Mode création
      return {
        ...DEFAULT_FORM_DATA,
        status: initialStatus || "todo",
        customization: undefined,
        attachments: [],
        images: [],
        subtasks: [],
      };
    }
  );

  const [errors, setErrors] = useState<
    Partial<Record<keyof TaskFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Réinitialiser le formulaire quand la tâche change
  useEffect(() => {
    if (task) {
      const newFormData = {
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        estimatedHours: task.estimatedHours,
        tags: task.tags || [],
        category: task.category,
        assignedTo: task.assignedTo || [],
        projectId: task.projectId,
        dependencies: task.dependencies || [],
        customization: (task as any).customization || undefined,
        attachments: task.attachments || [],
        images: task.images || [],
        subtasks: task.subtasks || [],
      };
      setFormData(newFormData);
    } else {
      setFormData({
        ...DEFAULT_FORM_DATA,
        status: initialStatus || "todo",
        customization: undefined,
        attachments: [],
        images: [],
        subtasks: [],
      });
    }
  }, [task?.id, task?.title, initialStatus]); // Déclencher sur les changements de propriétés spécifiques

  useEffect(() => {
    const validate = () => {
      const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

      // Validation du titre
      if (
        formData.title.trim().length > 0 &&
        formData.title.trim().length < FORM_VALIDATION.title.minLength
      ) {
        newErrors.title = `Le titre doit contenir au moins ${FORM_VALIDATION.title.minLength} caractères`;
      } else if (formData.title.length > FORM_VALIDATION.title.maxLength) {
        newErrors.title = `Le titre ne peut pas dépasser ${FORM_VALIDATION.title.maxLength} caractères`;
      }

      // Validation de la description
      if (
        formData.description &&
        formData.description.length > FORM_VALIDATION.description.maxLength
      ) {
        newErrors.description = `La description ne peut pas dépasser ${FORM_VALIDATION.description.maxLength} caractères`;
      }

      // Validation des heures estimées
      if (
        formData.estimatedHours !== undefined &&
        formData.estimatedHours !== null
      ) {
        if (formData.estimatedHours < FORM_VALIDATION.estimatedHours.min) {
          newErrors.estimatedHours = `Les heures estimées doivent être d'au moins ${FORM_VALIDATION.estimatedHours.min}h`;
        } else if (
          formData.estimatedHours > FORM_VALIDATION.estimatedHours.max
        ) {
          newErrors.estimatedHours = `Les heures estimées ne peuvent pas dépasser ${FORM_VALIDATION.estimatedHours.max}h`;
        }
      }

      // Validation des dates
      if (formData.startDate && formData.dueDate) {
        if (new Date(formData.startDate) > new Date(formData.dueDate)) {
          newErrors.dueDate =
            "La date d'échéance doit être après la date de début";
        }
      }

      setErrors(newErrors);
      setIsValid(
        Object.keys(newErrors).length === 0 &&
          formData.title.trim().length >= FORM_VALIDATION.title.minLength
      );
    };

    validate();
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Assurer que les dates sont bien des objets Date
      const taskData: TaskFormData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        startDate: formData.startDate
          ? new Date(formData.startDate)
          : undefined,
        subtasks: formData.subtasks || [],
      };

      await onSave(taskData);
    } catch (error) {
      // L'erreur sera gérée par le parent (TasksTabContent)
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isValid, onSave]);

  const resetForm = useCallback(() => {
    if (task) {
      // Mode édition - réinitialiser avec les données de la tâche
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        estimatedHours: task.estimatedHours,
        tags: task.tags || [],
        category: task.category,
        assignedTo: task.assignedTo || [],
        projectId: task.projectId,
        dependencies: task.dependencies || [],
        customization: (task as any).customization || undefined,
        attachments: task.attachments || [],
        images: task.images || [],
        subtasks: task.subtasks || [],
      });
    } else {
      // Mode création - réinitialiser avec les valeurs par défaut
      setFormData({
        ...DEFAULT_FORM_DATA,
        status: initialStatus || "todo",
        customization: undefined,
        attachments: [],
        images: [],
        subtasks: [],
      });
    }
    setErrors({});
  }, [task, initialStatus]);

  const hasChanges = useCallback(() => {
    if (!task) {
      // Pour une nouvelle tâche, on considère qu'il y a des changements si le titre n'est pas vide.
      return (
        Object.values(formData).some(
          (value, index) =>
            value !== Object.values(DEFAULT_FORM_DATA)[index] &&
            formData.title.trim().length > 0
        ) || formData.title.trim().length > 0
      );
    }

    // Pour une tâche existante, on compare chaque champ.
    return (
      formData.title !== task.title ||
      formData.description !== (task.description || "") ||
      formData.priority !== task.priority ||
      formData.status !== task.status ||
      (formData.dueDate ? new Date(formData.dueDate).getTime() : undefined) !==
        (task.dueDate ? new Date(task.dueDate).getTime() : undefined) ||
      (formData.startDate
        ? new Date(formData.startDate).getTime()
        : undefined) !==
        (task.startDate ? new Date(task.startDate).getTime() : undefined) ||
      formData.estimatedHours !== task.estimatedHours ||
      JSON.stringify(formData.tags) !== JSON.stringify(task.tags || []) ||
      formData.category !== task.category ||
      JSON.stringify(formData.customization) !==
        JSON.stringify((task as any).customization) ||
      JSON.stringify(formData.attachments) !==
        JSON.stringify(task.attachments || []) ||
      JSON.stringify(formData.images) !== JSON.stringify(task.images || []) ||
      JSON.stringify(formData.subtasks) !== JSON.stringify(task.subtasks || [])
    );
  }, [formData, task]);

  return {
    formState: { ...formData, errors },
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    hasChanges: hasChanges(),
    isValid,
  };
};
