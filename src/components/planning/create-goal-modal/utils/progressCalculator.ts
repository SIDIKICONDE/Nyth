interface FormData {
  title: string;
  description?: string;
  type: string;
  period: string;
  target: string;
  unit: string;
  category?: string;
  priority: string;
  startDate: string;
  endDate: string;
  current?: string;
}

export const calculateProgress = (
  formData: FormData,
  isEditMode: boolean = false
): number => {
  const requiredFields = [
    "title",
    "type",
    "period",
    "target",
    "unit",
    "priority",
    "startDate",
    "endDate",
  ];

  const optionalFields = ["description", "category"];

  // En mode édition, inclure la progression actuelle comme champ requis
  if (isEditMode) {
    requiredFields.push("current");
  }

  const allFields = [...requiredFields, ...optionalFields];

  let filledFields = 0;
  const totalFields = allFields.length;

  // Compter les champs requis remplis (poids double)
  requiredFields.forEach((field) => {
    if (
      formData[field as keyof FormData] &&
      String(formData[field as keyof FormData]).trim() !== ""
    ) {
      filledFields += 2; // Poids double pour les champs requis
    }
  });

  // Compter les champs optionnels remplis (poids simple)
  optionalFields.forEach((field) => {
    if (
      formData[field as keyof FormData] &&
      String(formData[field as keyof FormData]).trim() !== ""
    ) {
      filledFields += 1;
    }
  });

  // Calculer le total pondéré
  const totalWeightedFields = requiredFields.length * 2 + optionalFields.length;

  return Math.min(100, Math.round((filledFields / totalWeightedFields) * 100));
};

export const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return "#EF4444"; // Rouge
  if (percentage < 70) return "#F59E0B"; // Orange
  return "#10B981"; // Vert
};

export const getProgressMessage = (percentage: number): string => {
  if (percentage < 30) return "Complétez les informations de base";
  if (percentage < 70) return "Ajoutez plus de détails";
  if (percentage < 90) return "Presque terminé !";
  return "Objectif prêt à être créé";
};
