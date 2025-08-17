import { useGlobalPreferencesContext } from '../contexts/GlobalPreferencesContext';
import { RecordingSettings } from '../types';

export const useRecordingPreferences = () => {
  const { recordingSettings, updateRecordingSettings, isLoading } = useGlobalPreferencesContext();

  const updateSetting = <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => {
    if (!recordingSettings) return;
    
    const newSettings = { ...recordingSettings, [key]: value };
    
    // Mise à jour avec log
    updateRecordingSettings(newSettings)
      .then(() => {})
      .catch((error) => {});
  };

  const toggleMicrophone = (enabled: boolean) => {
    updateSetting('isMicEnabled', enabled);
  };

  const toggleVideo = (enabled: boolean) => {
    updateSetting('isVideoEnabled', enabled);
  };

  const toggleCountdown = (enabled: boolean) => {
    updateSetting('showCountdown', enabled);
  };

  return {
    recordingSettings,
    updateSetting,
    toggleMicrophone,
    toggleVideo,
    toggleCountdown,
    isLoading
  };
}; 