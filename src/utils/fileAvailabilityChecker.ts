import RNFS from "react-native-fs";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("FileAvailabilityChecker");

export interface FileAvailabilityOptions {
  /** Timeout maximum en millisecondes (défaut: 5000ms) */
  timeoutMs?: number;
  /** Intervalle de vérification en millisecondes (défaut: 100ms) */
  checkIntervalMs?: number;
  /** Taille minimale attendue en octets (optionnel) */
  minSizeBytes?: number;
  /** Nombre de vérifications stables requises (défaut: 2) */
  requiredStableChecks?: number;
}

/**
 * Vérifie intelligemment si un fichier est disponible et prêt à être utilisé
 * - Vérifie l'existence du fichier
 * - Attend que la taille soit stable (plus de changements)
 * - Vérifie la taille minimale si spécifiée
 */
export async function waitForFileAvailability(
  filePath: string,
  options: FileAvailabilityOptions = {}
): Promise<boolean> {
  const {
    timeoutMs = 5000,
    checkIntervalMs = 100,
    minSizeBytes = 0,
    requiredStableChecks = 2
  } = options;

  const startTime = Date.now();
  let lastSize = -1;
  let stableChecks = 0;

  logger.debug("Début vérification disponibilité fichier", {
    filePath,
    timeoutMs,
    minSizeBytes
  });

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Vérifier si le fichier existe
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        logger.debug("Fichier n'existe pas encore, attente...", { filePath });
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
        continue;
      }

      // Obtenir les informations du fichier
      const fileInfo = await RNFS.stat(filePath);

      // Vérifier que c'est bien un fichier
      if (!fileInfo.isFile()) {
        logger.debug("Le chemin n'est pas un fichier", { filePath });
        return false;
      }

      // Vérifier la taille minimale
      if (fileInfo.size < minSizeBytes) {
        logger.debug("Fichier trop petit, attente...", {
          filePath,
          currentSize: fileInfo.size,
          minSizeBytes
        });
        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
        continue;
      }

      // Vérifier si la taille est stable
      if (fileInfo.size === lastSize) {
        stableChecks++;
        logger.debug("Taille stable détectée", {
          filePath,
          size: fileInfo.size,
          stableChecks,
          requiredStableChecks
        });

        if (stableChecks >= requiredStableChecks) {
          logger.info("Fichier disponible et stable", {
            filePath,
            finalSize: fileInfo.size,
            timeElapsed: Date.now() - startTime
          });
          return true;
        }
      } else {
        // La taille a changé, réinitialiser le compteur
        stableChecks = 0;
        lastSize = fileInfo.size;
        logger.debug("Taille changée, reset compteur stabilité", {
          filePath,
          newSize: fileInfo.size
        });
      }

      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));

    } catch (error) {
      logger.error("Erreur lors de la vérification du fichier", {
        filePath,
        error
      });
      return false;
    }
  }

  logger.warn("Timeout atteint, fichier pas encore disponible", {
    filePath,
    timeoutMs,
    timeElapsed: Date.now() - startTime
  });
  return false;
}

/**
 * Vérifie rapidement si un fichier est disponible (sans attendre la stabilité)
 */
export async function isFileAvailable(filePath: string, minSizeBytes = 0): Promise<boolean> {
  try {
    const exists = await RNFS.exists(filePath);
    if (!exists) return false;

    const fileInfo = await RNFS.stat(filePath);
    return fileInfo.isFile() && fileInfo.size >= minSizeBytes;
  } catch (error) {
    logger.error("Erreur vérification disponibilité rapide", { filePath, error });
    return false;
  }
}

/**
 * Obtient des informations détaillées sur un fichier
 */
export async function getFileDetails(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  isFile?: boolean;
  modificationTime?: number;
  error?: string;
}> {
  try {
    const exists = await RNFS.exists(filePath);
    if (!exists) {
      return { exists: false };
    }

    const fileInfo = await RNFS.stat(filePath);
    return {
      exists: true,
      size: fileInfo.size,
      isFile: fileInfo.isFile(),
      modificationTime: fileInfo.mtime?.getTime()
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Options par défaut pour différents types de fichiers
 */
export const DEFAULT_FILE_OPTIONS = {
  // Pour les vidéos (attendre qu'elles soient complètement écrites)
  video: {
    timeoutMs: 10000, // 10 secondes max pour les vidéos
    checkIntervalMs: 200,
    minSizeBytes: 1024, // Au moins 1KB
    requiredStableChecks: 3
  },

  // Pour les images (plus rapide)
  image: {
    timeoutMs: 3000,
    checkIntervalMs: 100,
    minSizeBytes: 512, // Au moins 512B
    requiredStableChecks: 2
  },

  // Pour les fichiers génériques
  generic: {
    timeoutMs: 5000,
    checkIntervalMs: 100,
    minSizeBytes: 1,
    requiredStableChecks: 2
  }
} as const;
