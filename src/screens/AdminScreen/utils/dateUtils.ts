export const formatDate = (date: any): string => {
  if (!date) return "N/A";

  // Si c'est un timestamp Firestore
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Si c'est une string ISO
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "N/A";
}; 