import { useAuth } from "../contexts/AuthContext";
import unifiedStorageService from "../services/firebase/unifiedStorageService";
import { Script } from "../types";

export const useStorage = () => {
  const { user } = useAuth();

  // Scripts
  const saveScript = async (
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ) => {
    return unifiedStorageService.saveScript(user, script);
  };

  const getScripts = async () => {
    return unifiedStorageService.getScripts(user);
  };

  const updateScript = async (scriptId: string, updates: Partial<Script>) => {
    return unifiedStorageService.updateScript(user, scriptId, updates);
  };

  const deleteScript = async (scriptId: string, userId: string) => {
    if (!user) throw new Error("Utilisateur non connecté pour la suppression");
    return unifiedStorageService.deleteScript(user, scriptId, userId);
  };

  // Enregistrements
  const saveRecording = async (
    videoUri: string,
    duration: number,
    scriptId?: string,
    scriptTitle?: string,
    thumbnailUri?: string
  ) => {
    return unifiedStorageService.saveRecording(
      user,
      videoUri,
      duration,
      scriptId,
      scriptTitle,
      thumbnailUri
    );
  };

  const getRecordings = async () => {
    return unifiedStorageService.getRecordings(user);
  };

  const deleteRecording = async (recordingId: string) => {
    return unifiedStorageService.deleteRecording(user, recordingId);
  };

  // Autres
  const initializeStorage = async () => {
    return unifiedStorageService.initializeStorage(user);
  };

  const updateStats = async (stats: any) => {
    return unifiedStorageService.updateStats(user, stats);
  };

  const uploadProfilePhoto = async (photoUri: string) => {
    return unifiedStorageService.uploadProfilePhoto(user, photoUri);
  };

  const shareLocalVideo = async (videoUri: string) => {
    return unifiedStorageService.shareLocalVideo(user, videoUri);
  };

  // Vérifier si l'utilisateur peut utiliser certaines fonctionnalités
  const canUploadProfilePhoto = () => {
    return user && !user.isGuest;
  };

  const canShareVideo = () => {
    // Tous les utilisateurs peuvent partager localement
    return true;
  };

  const isGuest = () => {
    return user?.isGuest === true;
  };

  return {
    // Scripts
    saveScript,
    getScripts,
    updateScript,
    deleteScript,

    // Enregistrements
    saveRecording,
    getRecordings,
    deleteRecording,

    // Autres
    initializeStorage,
    updateStats,
    uploadProfilePhoto,
    shareLocalVideo,

    // Helpers
    canUploadProfilePhoto,
    canShareVideo,
    isGuest,

    // User info
    user,
  };
};
