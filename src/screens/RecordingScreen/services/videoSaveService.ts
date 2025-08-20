import { Alert, Platform } from "react-native";
import RNFS from "react-native-fs";
import { VideoFile } from "react-native-vision-camera";
import hybridStorageService, { VIDEO_DIR } from "@/services/firebase/hybridStorageService";
import { RecordingBackupManager } from "@/services/autoSave";
import { FileManager } from "@/services/social-share/utils/fileManager";
import { Recording } from "@/types";
import { Script, RecordingSettings } from "@/types";
import { createLogger } from "@/utils/optimizedLogger";
import { SaveResult } from "../types";
import { ALERT_MESSAGES } from "../constants";

const logger = createLogger("videoSaveService");

export class VideoSaveService {
  /**
   * Main save function for video recordings
   */
  static async saveRecording({
    video,
    recordingDuration,
    script,
    settings,
    userId,
    onNavigate,
    t,
  }: {
    video: VideoFile;
    recordingDuration: number;
    script?: Script | null;
    settings?: RecordingSettings | null;
    userId?: string;
    onNavigate: () => void;
    t: (key: string, fallback: string) => string;
  }): Promise<SaveResult> {
    try {
      logger.info("Starting video save process", {
        videoPath: video.path,
        duration: video.duration,
        recordingDuration,
      });

      // Verify file exists
      const fileExists = await this.verifyFileExists(video.path);
      if (!fileExists) {
        throw new Error("Video file not found at path: " + video.path);
      }

      // Initialize storage
      await hybridStorageService.initializeLocalStorage();
      const finalUserId = userId || "guest";

      // Save to hybrid storage
      const recordingId = await hybridStorageService.saveRecording(
        finalUserId,
        video.path,
        recordingDuration,
        script?.id,
        script?.title
      );

      // Get final video path
      const savedVideoPath = `${VIDEO_DIR}${recordingId}.mp4`;
      const videoUriWithPrefix = this.ensureFilePrefix(savedVideoPath);

      // Vérifier que le fichier a bien été créé et n'est pas vide
      const savedFileExists = await RNFS.exists(savedVideoPath);
      if (!savedFileExists) {
        throw new Error(`Le fichier vidéo n'a pas été créé correctement: ${savedVideoPath}`);
      }

      const fileInfo = await RNFS.stat(savedVideoPath);
      if (fileInfo.size === 0) {
        throw new Error(`Le fichier vidéo créé est vide: ${savedVideoPath}`);
      }

      logger.info("Video saved to local storage", {
        recordingId,
        savedVideoPath,
        fileSize: fileInfo.size,
        fileExists: true,
      });

      // Create recording object
      const recording = this.createRecordingObject({
        recordingId,
        videoUriWithPrefix,
        recordingDuration,
        script,
        settings,
      });

      // Save to AsyncStorage backup (ne bloque pas le flux en cas d'erreur)
      try {
        await RecordingBackupManager.saveRecording(recording);
        logger.info("Recording saved to AsyncStorage backup", { recordingId });
      } catch (backupErr) {
        logger.warn("Failed to save recording backup (continuing)", backupErr);
      }

      // Save to gallery
      const savedToGallery = await this.saveToGallery(videoUriWithPrefix);

      // Handle navigation based on gallery save result
      this.handlePostSaveNavigation({
        savedToGallery,
        videoUriWithPrefix,
        onNavigate,
        t,
      });

      return {
        success: true,
        recordingId,
        videoUri: videoUriWithPrefix,
      };
    } catch (error) {
      logger.error("Error in saveRecording", error);
      
      // Attempt fallback save
      const fallbackResult = await this.attemptFallbackSave({
        video,
        recordingDuration,
        script,
        settings,
        onNavigate,
        t,
      });

      if (fallbackResult.success) {
        return fallbackResult;
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Verify that a file exists at the given path
   */
  private static async verifyFileExists(path: string): Promise<boolean> {
    try {
      return await RNFS.exists(path);
    } catch (error) {
      logger.error("Error verifying file existence", error);
      return false;
    }
  }

  /**
   * Get file information (iOS specific)
   */
  private static async getFileInfo(path: string) {
    if (Platform.OS !== "ios") return null;

    try {
      const stat = await RNFS.stat(path);
      return {
        path: stat.path,
        size: stat.size,
        isFile: stat.isFile(),
        ctime: stat.ctime,
        mtime: stat.mtime,
      };
    } catch (error) {
      logger.error("Error getting file info", error);
      return null;
    }
  }

  // Import de la fonction centralisée
  private static ensureFilePrefix(path: string): string {
    const { toFileUri } = require("@/utils/pathNormalizer");
    return toFileUri(path);
  }

  /**
   * Create recording object with all necessary metadata
   */
  private static createRecordingObject({
    recordingId,
    videoUriWithPrefix,
    recordingDuration,
    script,
    settings,
  }: {
    recordingId: string;
    videoUriWithPrefix: string;
    recordingDuration: number;
    script?: Script | null;
    settings?: RecordingSettings | null;
  }): Recording {
    const recording: Recording = {
      id: recordingId,
      videoUri: videoUriWithPrefix,
      uri: videoUriWithPrefix,
      duration: recordingDuration,
      scriptId: script?.id,
      scriptTitle: script?.title,
      createdAt: new Date().toISOString(),
      quality: settings?.quality || "high",
    };

    if (settings?.videoSettings) {
      (recording as any).videoSettings = {
        codec: settings.videoSettings.codec || "h264",
        stabilization: settings.videoSettings.stabilization || "auto",
      };
    }

    return recording;
  }

  /**
   * Save video to device gallery
   */
  private static async saveToGallery(videoUri: string): Promise<boolean> {
    try {
      logger.info("Attempting to save to gallery", { videoUri });
      const result = await FileManager.saveToGallery(videoUri);
      logger.info("Gallery save result", { result });
      return result;
    } catch (error) {
      logger.error("Error saving to gallery", error);
      return false;
    }
  }

  /**
   * Handle navigation after save
   */
  private static handlePostSaveNavigation({
    savedToGallery,
    videoUriWithPrefix,
    onNavigate,
    t,
  }: {
    savedToGallery: boolean;
    videoUriWithPrefix: string;
    onNavigate: () => void;
    t: (key: string, fallback: string) => string;
  }) {
    if (savedToGallery) {
      logger.info("Video saved to gallery successfully");
      onNavigate();
    } else {
      logger.error("Failed to save to gallery");
      Alert.alert(
        t("recording.galleryError.title", ALERT_MESSAGES.galleryError.title),
        t("recording.galleryError.message", ALERT_MESSAGES.galleryError.message),
        [
          { text: t("common.ok", "OK"), onPress: onNavigate },
          {
            text: t("recording.galleryError.retry", ALERT_MESSAGES.galleryError.retry),
            onPress: async () => {
              await FileManager.saveToGallery(videoUriWithPrefix);
              onNavigate();
            },
          },
        ]
      );
    }
  }

  /**
   * Attempt fallback save in case of primary save failure
   */
  private static async attemptFallbackSave({
    video,
    recordingDuration,
    script,
    settings,
    onNavigate,
    t,
  }: {
    video: VideoFile;
    recordingDuration: number;
    script?: Script | null;
    settings?: RecordingSettings | null;
    onNavigate: () => void;
    t: (key: string, fallback: string) => string;
  }): Promise<SaveResult> {
    try {
      logger.info("Attempting fallback save");
      
      const fallbackId = `rec_${Date.now()}`;
      const fallbackVideoUri = this.ensureFilePrefix(video.path);
      
      const fallbackRecording = this.createRecordingObject({
        recordingId: fallbackId,
        videoUriWithPrefix: fallbackVideoUri,
        recordingDuration,
        script,
        settings,
      });

      await RecordingBackupManager.saveRecording(fallbackRecording);
      logger.info("Fallback recording saved", { fallbackId });

      // Try to save to gallery
      const savedToGallery = await this.saveToGallery(fallbackVideoUri);
      
      if (savedToGallery) {
        onNavigate();
      } else {
        Alert.alert(
          t("recording.saveError.title", ALERT_MESSAGES.saveError.title),
          t("recording.saveError.message", ALERT_MESSAGES.saveError.message),
          [{ text: t("common.ok", "OK"), onPress: onNavigate }]
        );
      }

      return {
        success: true,
        recordingId: fallbackId,
        videoUri: fallbackVideoUri,
      };
    } catch (backupError) {
      logger.error("Fallback save failed", backupError);
      onNavigate();
      
      return {
        success: false,
        error: backupError instanceof Error ? backupError : new Error("Fallback save failed"),
      };
    }
  }
}