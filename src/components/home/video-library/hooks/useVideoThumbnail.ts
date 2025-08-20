import { useCallback, useEffect, useState } from "react";
import { createThumbnail } from "react-native-video-thumbnail";
import RNFS from "react-native-fs";

interface ThumbnailConfig {
  timeStamp: number;
  quality: number;
}

interface UseVideoThumbnailResult {
  thumbnailUri: string | null;
  isLoading: boolean;
  hasError: boolean;
  error: string | null;
  retryGeneration: () => void;
}

/**
 * Hook personnalisé pour la gestion robuste des miniatures vidéo
 * Implémente plusieurs stratégies de fallback et un diagnostic détaillé
 */
export const useVideoThumbnail = (
  videoUri: string
): UseVideoThumbnailResult => {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurations multiples pour maximiser les chances de succès
  const configs: ThumbnailConfig[] = [
    { timeStamp: 100, quality: 30 }, // Très tôt, très basse qualité
    { timeStamp: 300, quality: 40 }, // 0.3s, basse qualité
    { timeStamp: 500, quality: 50 }, // 0.5s, qualité moyenne
    { timeStamp: 1000, quality: 60 }, // 1s, qualité correcte
    { timeStamp: 2000, quality: 50 }, // 2s, qualité moyenne (au cas où)
  ];

  const generateThumbnail = useCallback(async () => {
    if (!videoUri) {
      setError("URI vidéo manquante");
      setHasError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      setError(null);

      // 1. Vérifier l'existence du fichier
      const fileExists = await RNFS.exists(videoUri);
      if (!fileExists) {
        const errorMsg = "Fichier vidéo introuvable";
        setError(errorMsg);
        setHasError(true);
        return;
      }

      // 2. Obtenir les informations du fichier
      const fileInfo = await RNFS.stat(videoUri);
      if (!fileInfo.isFile()) {
        const errorMsg = "Le chemin ne pointe pas vers un fichier valide";
        setError(errorMsg);
        setHasError(true);
        return;
      }

      // 3. Essayer chaque configuration
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];

        try {
          const response = await createThumbnail({
            url: videoUri,
            timeStamp: config.timeStamp,
            quality: config.quality,
            format: "jpeg",
          });

          if (response && response.path) {
            // Vérifier que la miniature a bien été créée
            const thumbnailExists = await RNFS.exists(response.path);

            if (thumbnailExists) {
              setThumbnailUri(response.path);
              return; // Succès !
            } else {
              continue;
            }
          }
        } catch (configError) {
          // Si c'est la dernière tentative, garder l'erreur
          if (i === configs.length - 1) {
            setError(
              configError instanceof Error
                ? `Dernière tentative échouée: ${configError.message}`
                : "Toutes les tentatives ont échoué"
            );
          }
          continue;
        }
      }

      // Toutes les configurations ont échoué
      const errorMsg =
        "Impossible de générer une miniature avec toutes les configurations";
      setError(errorMsg);
      setHasError(true);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMsg);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [videoUri]);

  // Fonction pour relancer la génération
  const retryGeneration = useCallback(() => {
    generateThumbnail();
  }, [generateThumbnail]);

  // Déclencher la génération quand l'URI change
  useEffect(() => {
    if (videoUri) {
      generateThumbnail();
    } else {
      setThumbnailUri(null);
      setIsLoading(false);
      setHasError(false);
      setError(null);
    }
  }, [videoUri, generateThumbnail]);

  return {
    thumbnailUri,
    isLoading,
    hasError,
    error,
    retryGeneration,
  };
};
