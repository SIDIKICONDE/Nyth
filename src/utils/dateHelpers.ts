// Fonction pour convertir une date string ou Date en objet Date
export const toDate = (date: string | Date | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

// Fonction pour formater une date qui peut être string ou Date
export const formatDateSafe = (date: string | Date | undefined, formatter: (date: Date) => string): string => {
  if (!date) return '';
  const dateObj = toDate(date);
  return formatter(dateObj);
}; 