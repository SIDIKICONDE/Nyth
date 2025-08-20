import Share from "react-native-share";
import { Recording, Script } from "../../types";
import hybridStorageService from "./hybridStorageService";

class UnifiedStorageService {
  // === SCRIPTS ===

  async saveScript(
    user: any,
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.saveScript(user.uid, script);
  }

  async getScripts(user: any): Promise<Script[]> {
    if (!user) return [];

    return hybridStorageService.getScripts(user.uid);
  }

  async updateScript(user: any, scriptId: string, updates: Partial<Script>) {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.updateScript(scriptId, updates);
  }

  async deleteScript(user: any, scriptId: string, userId: string) {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.deleteScript(scriptId, userId);
  }

  // === ENREGISTREMENTS ===

  async saveRecording(
    user: any,
    videoUri: string,
    duration: number,
    scriptId?: string,
    scriptTitle?: string,
    thumbnailUri?: string
  ): Promise<string> {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.saveRecording(
      user.uid,
      videoUri,
      duration,
      scriptId,
      scriptTitle,
      thumbnailUri
    );
  }

  async getRecordings(user: any): Promise<Recording[]> {
    if (!user) return [];

    return hybridStorageService.getRecordings(user.uid);
  }

  async deleteRecording(user: any, recordingId: string): Promise<void> {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.deleteRecording(recordingId);
  }

  // === INITIALISATION ===

  async initializeStorage(user: any) {
    if (!user) return;

    await hybridStorageService.initializeLocalStorage();
  }

  // === STATISTIQUES ===

  async updateStats(user: any, stats: any) {
    if (!user) return;

    return hybridStorageService.updateUserStats(user.uid, stats);
  }

  // === PHOTO DE PROFIL ===

  async uploadProfilePhoto(user: any, photoUri: string): Promise<string> {
    if (!user) throw new Error("Utilisateur non connecté");

    return hybridStorageService.uploadProfilePhoto(user.uid, photoUri);
  }

  // === PARTAGE ===

  async shareLocalVideo(user: any, videoUri: string): Promise<boolean> {
    if (!user) throw new Error("Utilisateur non connecté");

    try {
      // Utiliser react-native-share directement
      await Share.open({
        url: videoUri,
        type: "video/*",
        title: "Partager la vidéo",
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new UnifiedStorageService();
