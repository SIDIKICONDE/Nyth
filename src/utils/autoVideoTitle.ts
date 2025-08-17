/**
 * Utilitaire simple pour générer automatiquement des titres de vidéos
 * Basé sur le contenu du script, sans interface utilisateur
 */

/**
 * Génère automatiquement un titre pour une vidéo basé sur le script
 */
export const generateVideoTitle = (
  scriptTitle?: string,
  scriptContent?: string,
  duration?: number
): string => {
  // Si on a un titre de script, l'utiliser comme base
  if (scriptTitle && scriptTitle.trim()) {
    const cleanTitle = scriptTitle.trim();

    // Ajouter la durée si disponible
    if (duration && duration > 0) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;

      if (minutes > 0) {
        return seconds > 0
          ? `${cleanTitle} (${minutes}min ${seconds}s)`
          : `${cleanTitle} (${minutes}min)`;
      } else {
        return `${cleanTitle} (${seconds}s)`;
      }
    }

    return cleanTitle;
  }

  // Si pas de titre mais du contenu, extraire les premiers mots
  if (scriptContent && scriptContent.trim()) {
    const words = scriptContent.trim().split(/\s+/);
    const firstWords = words.slice(0, 6).join(" "); // Prendre les 6 premiers mots

    // Limiter à 40 caractères maximum
    if (firstWords.length > 40) {
      return firstWords.substring(0, 37) + "...";
    }

    return firstWords;
  }

  // Fallback : utiliser la date et l'heure
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Vidéo ${date} ${time}`;
};

/**
 * Génère un titre avec plus d'informations si disponibles
 */
export const generateDetailedVideoTitle = (
  scriptTitle?: string,
  scriptContent?: string,
  duration?: number,
  quality?: string
): string => {
  const baseTitle = generateVideoTitle(scriptTitle, scriptContent, duration);

  // Ajouter la qualité si disponible et différente de la qualité par défaut
  if (quality && quality !== "720p") {
    return `${baseTitle} [${quality}]`;
  }

  return baseTitle;
};
