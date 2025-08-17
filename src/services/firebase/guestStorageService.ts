import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";
import { Recording, Script } from "../../types";

// Répertoires locaux pour les invités
const GUEST_VIDEO_DIR = `${RNFS.DocumentDirectoryPath}guest_videos/`;
const GUEST_THUMBNAIL_DIR = `${RNFS.DocumentDirectoryPath}guest_thumbnails/`;

class GuestStorageService {
  // Initialiser les répertoires locaux pour les invités
  async initializeGuestStorage() {
    try {
      await RNFS.mkdir(GUEST_VIDEO_DIR);
      await RNFS.mkdir(GUEST_THUMBNAIL_DIR);
    } catch (error) {}
  }

  // === SCRIPTS (Local uniquement) ===

  async saveScript(
    guestId: string,
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const scriptId = `script_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newScript: Script = {
        id: scriptId,
        ...script,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Récupérer les scripts existants
      const scriptsKey = `@scripts_${guestId}`;
      const existingScriptsJson = await AsyncStorage.getItem(scriptsKey);
      const existingScripts: Script[] = existingScriptsJson
        ? JSON.parse(existingScriptsJson)
        : [];

      // Ajouter le nouveau script
      const updatedScripts = [newScript, ...existingScripts];
      await AsyncStorage.setItem(scriptsKey, JSON.stringify(updatedScripts));

      return scriptId;
    } catch (error) {
      throw error;
    }
  }

  async getScripts(guestId: string): Promise<Script[]> {
    try {
      const scriptsKey = `@scripts_${guestId}`;
      const scriptsJson = await AsyncStorage.getItem(scriptsKey);

      if (!scriptsJson) return [];

      const scripts: Script[] = JSON.parse(scriptsJson);
      return scripts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  async updateScript(
    guestId: string,
    scriptId: string,
    updates: Partial<Script>
  ) {
    try {
      const scripts = await this.getScripts(guestId);
      const scriptIndex = scripts.findIndex((s) => s.id === scriptId);

      if (scriptIndex === -1) {
        throw new Error("Script non trouvé");
      }

      scripts[scriptIndex] = {
        ...scripts[scriptIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const scriptsKey = `@scripts_${guestId}`;
      await AsyncStorage.setItem(scriptsKey, JSON.stringify(scripts));
    } catch (error) {
      throw error;
    }
  }

  async deleteScript(guestId: string, scriptId: string) {
    try {
      const scripts = await this.getScripts(guestId);
      const filteredScripts = scripts.filter((s) => s.id !== scriptId);

      const scriptsKey = `@scripts_${guestId}`;
      await AsyncStorage.setItem(scriptsKey, JSON.stringify(filteredScripts));
    } catch (error) {
      throw error;
    }
  }

  // === VIDÉOS (Local uniquement) ===

  async saveRecording(
    guestId: string,
    videoUri: string,
    duration: number,
    scriptId?: string,
    scriptTitle?: string,
    thumbnailUri?: string
  ): Promise<string> {
    try {
      const recordingId = `rec_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const videoFileName = `${recordingId}.mp4`;
      const thumbnailFileName = thumbnailUri
        ? `${recordingId}_thumb.jpg`
        : undefined;

      // 1. Sauvegarder la vidéo localement
      const videoPath = GUEST_VIDEO_DIR + videoFileName;
      await RNFS.copyFile(videoUri, videoPath);

      // 2. Sauvegarder le thumbnail localement (si fourni)
      let savedThumbnailPath: string | undefined;
      if (thumbnailUri && thumbnailFileName) {
        savedThumbnailPath = GUEST_THUMBNAIL_DIR + thumbnailFileName;
        await RNFS.copyFile(thumbnailUri, savedThumbnailPath);
      }

      // 3. Sauvegarder les métadonnées localement
      const newRecording: Recording = {
        id: recordingId,
        videoUri: videoPath,
        uri: videoPath,
        thumbnailUri: savedThumbnailPath,
        duration,
        scriptId,
        scriptTitle,
        createdAt: new Date().toISOString(),
      };

      const recordingsKey = `@recordings_${guestId}`;
      const existingRecordingsJson = await AsyncStorage.getItem(recordingsKey);
      const existingRecordings: Recording[] = existingRecordingsJson
        ? JSON.parse(existingRecordingsJson)
        : [];

      const updatedRecordings = [newRecording, ...existingRecordings];
      await AsyncStorage.setItem(
        recordingsKey,
        JSON.stringify(updatedRecordings)
      );

      return recordingId;
    } catch (error) {
      throw error;
    }
  }

  async getRecordings(guestId: string): Promise<Recording[]> {
    try {
      const recordingsKey = `@recordings_${guestId}`;
      const recordingsJson = await AsyncStorage.getItem(recordingsKey);

      if (!recordingsJson) return [];

      const recordings: Recording[] = JSON.parse(recordingsJson);
      const validRecordings: Recording[] = [];

      // Vérifier que les fichiers existent toujours
      for (const recording of recordings) {
        const videoUri = recording.uri || recording.videoUri;
        try {
          const videoInfo = await RNFS.stat(videoUri);
          // Vérifier que le fichier existe (isFile() pour les fichiers)
          if (videoInfo.isFile()) {
            validRecordings.push(recording);
          } else {}
        } catch (error) {}
      }

      return validRecordings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  async deleteRecording(guestId: string, recordingId: string): Promise<void> {
    try {
      const recordings = await this.getRecordings(guestId);
      const recording = recordings.find((r) => r.id === recordingId);

      if (!recording) {
        throw new Error("Enregistrement non trouvé");
      }

      // Supprimer les fichiers
      const videoUri = recording.uri || recording.videoUri;
      await RNFS.unlink(videoUri);

      if (recording.thumbnailUri) {
        await RNFS.unlink(recording.thumbnailUri);
      }

      // Mettre à jour la liste
      const filteredRecordings = recordings.filter((r) => r.id !== recordingId);
      const recordingsKey = `@recordings_${guestId}`;
      await AsyncStorage.setItem(
        recordingsKey,
        JSON.stringify(filteredRecordings)
      );
    } catch (error) {
      throw error;
    }
  }

  // === STATISTIQUES (Local) ===

  async updateStats(guestId: string, stats: any) {
    try {
      const statsKey = `@stats_${guestId}`;
      const existingStatsJson = await AsyncStorage.getItem(statsKey);
      const existingStats = existingStatsJson
        ? JSON.parse(existingStatsJson)
        : {};

      const updatedStats = {
        ...existingStats,
        ...stats,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(statsKey, JSON.stringify(updatedStats));
    } catch (error) {}
  }

  async getStats(guestId: string): Promise<any> {
    try {
      const statsKey = `@stats_${guestId}`;
      const statsJson = await AsyncStorage.getItem(statsKey);
      return statsJson ? JSON.parse(statsJson) : {};
    } catch (error) {
      return {};
    }
  }
}

export default new GuestStorageService();
