import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { useTranslation } from "../../hooks/useTranslation";

// Fonction pour obtenir l'instance de traduction
let translationInstance: ReturnType<typeof useTranslation>["t"] | null = null;

export const setTranslationInstance = (
  t: ReturnType<typeof useTranslation>["t"]
) => {
  translationInstance = t;
};

const t = (key: string, params?: any) => {
  if (translationInstance) {
    return translationInstance(key, params);
  }
  // Fallback si pas d'instance de traduction
  return key;
};

/**
 * Nettoie tous les caches de l'application
 * @returns {Promise<void>}
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    // Obtenir le dossier de cache
    const cacheDir = RNFS.CachesDirectoryPath;
    if (!cacheDir) {
      throw new Error(String(t("cacheManager.errors.cacheDirectoryNotFound")));
    }

    // Lire les fichiers dans le répertoire de cache
    const files = await RNFS.readDir(cacheDir);

    // Supprimer chaque fichier/dossier dans le cache (sauf les dossiers essentiels)
    for (const file of files) {
      try {
        // Nettoyage plus agressif - supprimer tous les fichiers sauf ceux absolument essentiels
        const filePath = file.path;
        await RNFS.unlink(filePath);
      } catch (error) {}
    }

    // Nettoyer le cache de l'application
    if (Platform.OS === "ios") {
      try {
        // Sur iOS, on essaie de nettoyer le cache de l'application
        const appCacheDir = `${RNFS.DocumentDirectoryPath}../Library/Caches/`;
        const appCacheFiles = await RNFS.readDir(appCacheDir);

        for (const file of appCacheFiles) {
          try {
            const filePath = file.path;
            await RNFS.unlink(filePath);
          } catch (error) {}
        }
      } catch (error) {}
    }
  } catch (error) {
    throw new Error(
      String(
        Platform.OS === "ios"
          ? t("cacheManager.errors.iosError")
          : t("cacheManager.errors.androidError")
      )
    );
  }
};

/**
 * Obtient la taille totale du cache
 * @returns {Promise<number>} Taille du cache en octets
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    const cacheDir = RNFS.CachesDirectoryPath;
    if (!cacheDir) return 0;

    const files = await RNFS.readDir(cacheDir);
    let totalSize = 0;

    for (const file of files) {
      try {
        const filePath = file.path;
        const info = await RNFS.stat(filePath);
        if (info.isFile() && info.size) {
          totalSize += info.size;
        }
      } catch (error) {}
    }

    return totalSize;
  } catch (error) {
    return 0;
  }
};
