import { Goal } from "../../../types/planning";
import { GoalFormData } from "./types";

// Convertir une date au format français JJ/MM/AAAA
export const formatDateToFrench = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Convertir une date française JJ/MM/AAAA en objet Date
export const parseFrenchDate = (dateString: string): Date => {
  const parts = dateString.split("/");
  if (parts.length !== 3) {
    throw new Error("Invalid date format. Use DD/MM/YYYY");
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  // Vérifier que la date est valide
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    throw new Error("Invalid date");
  }

  return date;
};

// Générer une date de fin par défaut (1 semaine) au format français
export const getDefaultEndDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return formatDateToFrench(date);
};

// Calculer la date de début selon la période
export const calculateStartDate = (
  endDate: Date,
  period: Goal["period"]
): Date => {
  const startDate = new Date(endDate);

  switch (period) {
    case "daily":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "monthly":
      // Méthode sûre pour soustraire un mois
      startDate.setMonth(startDate.getMonth() - 1);
      // Si le jour n'existe pas dans le mois précédent, ajuster au dernier jour du mois
      if (startDate.getDate() !== endDate.getDate()) {
        startDate.setDate(0); // Va au dernier jour du mois précédent
      }
      break;
    case "quarterly":
      // Méthode sûre pour soustraire 3 mois
      startDate.setMonth(startDate.getMonth() - 3);
      // Si le jour n'existe pas, ajuster au dernier jour du mois
      if (startDate.getDate() !== endDate.getDate()) {
        startDate.setDate(0);
      }
      break;
    case "yearly":
      startDate.setFullYear(startDate.getFullYear() - 1);
      // Gérer le cas du 29 février dans une année non bissextile
      if (startDate.getDate() !== endDate.getDate()) {
        startDate.setDate(0);
      }
      break;
    default:
      // Pour les périodes personnalisées, défaut à 7 jours
      startDate.setDate(startDate.getDate() - 7);
      break;
  }

  return startDate;
};

// Valider les données du formulaire
export const validateFormData = (
  formData: GoalFormData,
  t: (key: string, options?: any) => string
): string | null => {
  if (!formData.title.trim()) {
    return t("planning.goals.errors.titleRequired", "Title is required");
  }

  if (!formData.target || isNaN(Number(formData.target))) {
    return t(
      "planning.goals.errors.targetNumeric",
      "Target must be a valid number"
    );
  }

  if (!formData.startDate) {
    return t(
      "planning.goals.errors.startDateRequired",
      "Start date is required"
    );
  }

  if (!formData.endDate) {
    return t("planning.goals.errors.endDateRequired", "End date is required");
  }

  // Valider que les dates sont valides (format français)
  try {
    const startDate = parseFrenchDate(formData.startDate);
    const endDate = parseFrenchDate(formData.endDate);

    // Valider que la date de début n'est pas après la date de fin
    if (startDate >= endDate) {
      return t(
        "planning.goals.errors.startAfterEnd",
        "Start date must be before end date"
      );
    }

    // Valider que la date de fin n'est pas dans le passé
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) {
      return t(
        "planning.goals.errors.endDatePast",
        "End date cannot be in the past"
      );
    }
  } catch (error) {
    return t(
      "planning.goals.errors.invalidDateFormat",
      "Invalid date format. Use DD/MM/YYYY"
    );
  }

  return null;
};

// Transformer les données du formulaire en données d'objectif
export const transformFormDataToGoalData = (
  formData: GoalFormData,
  userId: string
): Omit<
  Goal,
  "id" | "createdAt" | "updatedAt" | "progress" | "completedAt"
> => {
  let startDate: Date;
  let endDate: Date;

  try {
    startDate = parseFrenchDate(formData.startDate);
    endDate = parseFrenchDate(formData.endDate);
  } catch (error) {
    throw new Error("Invalid date format. Use DD/MM/YYYY");
  }

  // Vérifier que les dates calculées sont valides
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("Invalid calculated dates");
  }

  return {
    userId,
    title: formData.title.trim(),
    description: formData.description.trim(),
    type: formData.type,
    period: formData.period,
    target: Number(formData.target),
    current: Number(formData.current) || 0,
    unit: formData.unit.trim() || "units",
    category: formData.category.trim() || "General",
    priority: formData.priority,
    status: "active",
    startDate,
    endDate,
    milestones: [],
    tags: [],
  };
};
