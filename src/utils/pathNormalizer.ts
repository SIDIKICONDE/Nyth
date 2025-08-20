import { Platform } from "react-native";
import { createLogger } from "./optimizedLogger";

const logger = createLogger("PathNormalizer");

/**
 * Options de normalisation des chemins
 */
export interface PathNormalizationOptions {
  /** Force l'ajout du préfixe file:// */
  forceFilePrefix?: boolean;
  /** Décode les caractères URI encodés */
  decodeUri?: boolean;
  /** Vérifie l'existence du fichier */
  validateExistence?: boolean;
}

/**
 * Normalise un chemin de fichier pour toutes les plateformes
 * Cette fonction centralise toute la logique de gestion des chemins
 */
export async function normalizeFilePath(
  inputPath: string,
  options: PathNormalizationOptions = {}
): Promise<string> {
  const {
    forceFilePrefix = false,
    decodeUri = true,
    validateExistence = false
  } = options;

  let normalizedPath = inputPath;

  try {
    logger.debug("Normalisation du chemin", { input: inputPath, options });

    // Étape 1: Décoder l'URI si demandé
    if (decodeUri && normalizedPath.includes('%')) {
      try {
        normalizedPath = decodeURIComponent(normalizedPath);
        logger.debug("URI décodé", { original: inputPath, decoded: normalizedPath });
      } catch (decodeError) {
        logger.warn("Erreur lors du décodage URI", decodeError);
        // Continuer avec le chemin original si le décodage échoue
      }
    }

    // Étape 2: Gérer le préfixe file:// selon la plateforme
    if (Platform.OS === "ios") {
      // iOS: toujours utiliser file:// pour la cohérence
      if (!normalizedPath.startsWith("file://")) {
        normalizedPath = `file://${normalizedPath}`;
      }
    } else {
      // Android: flexible, mais ajouter file:// si demandé
      if (forceFilePrefix && !normalizedPath.startsWith("file://")) {
        normalizedPath = `file://${normalizedPath}`;
      }
    }

    // Étape 3: Validation d'existence si demandée
    if (validateExistence) {
      const { exists } = await import('react-native-fs');
      const fileExists = await exists(normalizedPath.replace("file://", ""));
      if (!fileExists) {
        logger.error("Fichier introuvable après normalisation", {
          original: inputPath,
          normalized: normalizedPath
        });
        throw new Error(`Fichier introuvable: ${normalizedPath}`);
      }
    }

    logger.debug("Chemin normalisé avec succès", {
      original: inputPath,
      normalized: normalizedPath
    });

    return normalizedPath;

  } catch (error) {
    logger.error("Erreur lors de la normalisation du chemin", {
      input: inputPath,
      error
    });
    throw error;
  }
}

/**
 * Convertit un chemin en chemin local (sans préfixe file://)
 */
export function toLocalPath(uri: string): string {
  return uri.startsWith("file://") ? uri.replace("file://", "") : uri;
}

/**
 * Convertit un chemin local en URI (avec préfixe file://)
 */
export function toFileUri(localPath: string): string {
  return localPath.startsWith("file://") ? localPath : `file://${localPath}`;
}

/**
 * Vérifie si un chemin est une URI de fichier valide
 */
export function isValidFileUri(path: string): boolean {
  return path.startsWith("file://") || path.includes("/");
}

/**
 * Extrait le nom de fichier d'un chemin
 */
export function getFileName(path: string): string {
  const localPath = toLocalPath(path);
  return localPath.split('/').pop() || localPath;
}

/**
 * Extrait le répertoire parent d'un chemin
 */
export function getDirectoryPath(path: string): string {
  const localPath = toLocalPath(path);
  const lastSlashIndex = localPath.lastIndexOf('/');
  return lastSlashIndex >= 0 ? localPath.substring(0, lastSlashIndex) : localPath;
}
