import { Recording, Script } from "../../../types";
import { BaseStorageService } from "./base.service";
import { ProfilePhotoService } from "./profile.service";
import { RecordingsService } from "./recordings.service";
import { ScriptsService } from "./scripts.service";
import { StatsService } from "./stats.service";

/**
 * Service hybride de stockage combinant stockage local et cloud
 * - Scripts : Cloud (Firestore)
 * - Vidéos : Local + métadonnées Cloud
 * - Photos de profil : Cloud (Firebase Storage)
 * - Statistiques : Cloud (Firestore)
 */
class HybridStorageService {
  private baseService: BaseStorageService;
  private scriptsService: ScriptsService;
  private recordingsService: RecordingsService;
  private profileService: ProfilePhotoService;
  private statsService: StatsService;

  constructor() {
    this.baseService = new BaseStorageService();
    this.scriptsService = new ScriptsService();
    this.recordingsService = new RecordingsService();
    this.profileService = new ProfilePhotoService();
    this.statsService = new StatsService();
  }

  // === INITIALISATION ===
  async initializeLocalStorage() {
    return this.baseService.initializeLocalStorage();
  }

  // === SCRIPTS (Cloud) ===
  async saveScript(
    userId: string,
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    return this.scriptsService.saveScript(userId, script);
  }

  async getScripts(userId: string): Promise<Script[]> {
    return this.scriptsService.getScripts(userId);
  }

  async updateScript(scriptId: string, updates: Partial<Script>) {
    return this.scriptsService.updateScript(scriptId, updates);
  }

  async deleteScript(scriptId: string, userId?: string) {
    return this.scriptsService.deleteScript(scriptId, userId);
  }

  // === VIDÉOS (Local + Métadonnées Cloud) ===
  async saveRecording(
    userId: string,
    videoUri: string,
    duration: number,
    scriptId?: string,
    scriptTitle?: string,
    thumbnailUri?: string
  ): Promise<string> {
    return this.recordingsService.saveRecording(
      userId,
      videoUri,
      duration,
      scriptId,
      scriptTitle,
      thumbnailUri
    );
  }

  async getRecordings(userId: string): Promise<Recording[]> {
    return this.recordingsService.getRecordings(userId);
  }

  async deleteRecording(recordingId: string): Promise<void> {
    return this.recordingsService.deleteRecording(recordingId);
  }

  // === PHOTOS DE PROFIL (Cloud) ===
  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    return this.profileService.uploadProfilePhoto(userId, photoUri);
  }

  async uploadProfilePhotoBase64(
    userId: string,
    photoUri: string
  ): Promise<string> {
    return this.profileService.uploadProfilePhotoBase64(userId, photoUri);
  }

  // === STATISTIQUES (Cloud) ===
  async updateUserStats(userId: string, stats: any) {
    return this.statsService.updateUserStats(userId, stats);
  }
}

// Export singleton
export default new HybridStorageService();

// Export types pour utilisation externe
export * from "./constants";
export * from "./types";
