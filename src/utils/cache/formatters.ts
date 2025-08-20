import { useTranslation } from "react-i18next";

// Fonction pour obtenir l'instance de traduction
let translationInstance: ReturnType<typeof useTranslation>["t"] | null = null;

export const setTranslationInstance = (
  t: ReturnType<typeof useTranslation>["t"]
) => {
  translationInstance = t;
};

const t = (key: string) => {
  if (translationInstance) {
    return translationInstance(key);
  }
  // Fallback si pas d'instance de traduction
  return key;
};

/**
 * Formate la taille du cache en une chaîne lisible
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return `0 ${t("cacheManager.sizes.bytes")}`;

  const k = 1024;
  const sizes = [
    t("cacheManager.sizes.bytes"),
    t("cacheManager.sizes.kilobytes"),
    t("cacheManager.sizes.megabytes"),
    t("cacheManager.sizes.gigabytes"),
  ];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
