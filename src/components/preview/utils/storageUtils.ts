import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recording } from "../../../types";

// Type pour la fonction de traduction
type TranslationFunction = (key: string, options?: any) => string;

export const loadRecordingFromStorage = async (
  recordingId: string,
  t?: TranslationFunction
): Promise<Recording | null> => {
  try {
    const savedRecordings = await AsyncStorage.getItem("recordings");

    if (savedRecordings) {
      const recordings: Recording[] = JSON.parse(savedRecordings);

      const foundRecording = recordings.find((r) => r.id === recordingId);

      if (foundRecording) {} else {
        recordings.forEach((r, index) => {});
      }

      return foundRecording || null;
    }

    return null;
  } catch (error) {
    const errorMessage = t
      ? t("exportOptions.storage.recording.loadError")
      : "❌ Error loading recording:";
    return null;
  }
};

export const deleteRecordingFromStorage = async (
  recordingId: string
): Promise<void> => {
  const savedRecordings = await AsyncStorage.getItem("recordings");
  if (savedRecordings) {
    let recordings: Recording[] = JSON.parse(savedRecordings);
    recordings = recordings.filter((r) => r.id !== recordingId);
    await AsyncStorage.setItem("recordings", JSON.stringify(recordings));
  }
};

export const getRecordingSettings = async (t?: TranslationFunction) => {
  try {
    const savedSettings = await AsyncStorage.getItem("recordingSettings");
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    const errorMessage = t
      ? t("exportOptions.storage.recording.settingsError")
      : "❌ Error retrieving settings:";
    return null;
  }
};
