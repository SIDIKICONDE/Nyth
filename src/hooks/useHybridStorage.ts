import { useCallback, useEffect, useState } from "react";
import Share from "react-native-share";
import { useAuth } from "../contexts/AuthContext";
import { hybridStorageService, migrationService } from "../services/firebase";
import { Recording, Script } from "../types";

export const useHybridStorage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<
    "pending" | "completed" | "error"
  >("pending");

  // Initialiser et migrer au démarrage
  useEffect(() => {
    if (user?.uid) {
      initializeStorage();
    }
  }, [user]);

  const initializeStorage = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Initialiser le stockage local
      await hybridStorageService.initializeLocalStorage();

      // Vérifier et effectuer la migration si nécessaire
      const isMigrated = await migrationService.isMigrationCompleted();
      if (!isMigrated) {
        await migrationService.migrateToFirebase(user.uid);
      }

      setMigrationStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setMigrationStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // === SCRIPTS ===

  const saveScript = useCallback(
    async (
      script: Omit<Script, "id" | "createdAt" | "updatedAt">
    ): Promise<string | null> => {
      if (!user?.uid) {
        setError("Utilisateur non connecté");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const scriptId = await hybridStorageService.saveScript(
          user.uid,
          script
        );
        return scriptId;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getScripts = useCallback(async (): Promise<Script[]> => {
    if (!user?.uid) return [];

    try {
      setLoading(true);
      setError(null);
      const scripts = await hybridStorageService.getScripts(user.uid);
      return scripts;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de récupération");
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateScript = useCallback(
    async (scriptId: string, updates: Partial<Script>): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await hybridStorageService.updateScript(scriptId, updates);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de mise à jour");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteScript = useCallback(
    async (scriptId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await hybridStorageService.deleteScript(scriptId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de suppression");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === VIDÉOS ===

  const saveRecording = useCallback(
    async (
      videoUri: string,
      duration: number,
      scriptId?: string,
      scriptTitle?: string,
      thumbnailUri?: string
    ): Promise<string | null> => {
      if (!user?.uid) {
        setError("Utilisateur non connecté");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const recordingId = await hybridStorageService.saveRecording(
          user.uid,
          videoUri,
          duration,
          scriptId,
          scriptTitle,
          thumbnailUri
        );
        return recordingId;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getRecordings = useCallback(async (): Promise<Recording[]> => {
    if (!user?.uid) return [];

    try {
      setLoading(true);
      setError(null);
      const recordings = await hybridStorageService.getRecordings(user.uid);
      return recordings;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de récupération");
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteRecording = useCallback(
    async (recordingId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await hybridStorageService.deleteRecording(recordingId);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de suppression");
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === PARTAGE ===

  const shareLocalVideo = useCallback(
    async (videoUri: string): Promise<boolean> => {
      try {
        await Share.open({
          url: videoUri,
          type: "video/mp4",
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de partage");
        return false;
      }
    },
    []
  );

  // === PHOTO DE PROFIL ===

  const uploadProfilePhoto = useCallback(
    async (photoUri: string): Promise<string | null> => {
      if (!user?.uid) {
        setError("Utilisateur non connecté");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const photoUrl = await hybridStorageService.uploadProfilePhoto(
          user.uid,
          photoUri
        );
        return photoUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur upload photo");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // === STATISTIQUES ===

  const updateStats = useCallback(
    async (stats: any): Promise<void> => {
      if (!user?.uid) return;

      try {
        await hybridStorageService.updateUserStats(user.uid, stats);
      } catch (err) {}
    },
    [user]
  );

  return {
    // État
    loading,
    error,
    migrationStatus,

    // Scripts
    saveScript,
    getScripts,
    updateScript,
    deleteScript,

    // Vidéos
    saveRecording,
    getRecordings,
    deleteRecording,

    // Partage et profil
    shareLocalVideo,
    uploadProfilePhoto,

    // Stats
    updateStats,

    // Utils
    initializeStorage,
  };
};
