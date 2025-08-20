interface ProgressFields {
  title: string;
  location: string;
  type: string | null;
  priority: string | null;
  estimatedDuration: number;
}

export const calculateProgressPercentage = (fields: ProgressFields): number => {
  let completedFields = 0;
  const totalFields = 5;

  if (fields.title.trim()) completedFields++;
  if (fields.location.trim()) completedFields++;
  if (fields.type) completedFields++;
  if (fields.priority) completedFields++;
  if (fields.estimatedDuration > 0) completedFields++;

  return (completedFields / totalFields) * 100;
};

export const getProgressStatus = (percentage: number): string => {
  if (percentage === 0) return "Commencez à remplir";
  if (percentage < 50) return "En cours de création";
  if (percentage < 100) return "Presque terminé";
  return "Prêt à créer";
};

export const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return "#EF4444"; // Rouge
  if (percentage < 70) return "#F59E0B"; // Orange
  return "#10B981"; // Vert
};
