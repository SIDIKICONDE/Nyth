import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Recording, Script } from "../../../types";
import EmptyState from "../EmptyState";
import { FloatingParticles } from "./FloatingParticles";
import { VideoActionModal } from "./VideoActionModal";
import { VIDEOS_PER_ROW } from "./VideoDimensions";
import { VideoLibraryHeader } from "./VideoLibraryHeader";
import { VideoShelf } from "./VideoShelf";

interface VideoLibraryListProps {
  recordings: Recording[];
  scripts: Script[];
  selectedRecordings: string[];
  isSelectionModeActive: boolean;
  onRecordingPress: (recordingId: string) => void;
  onRecordingLongPress: (recordingId: string) => void;
  onToggleSelection?: (recordingId: string) => void;
  onDeleteSelected?: () => void;
  onSendToPreview?: (recording: Recording) => void;
}

export const VideoLibraryList: React.FC<VideoLibraryListProps> = ({
  recordings,
  scripts,
  selectedRecordings,
  isSelectionModeActive,
  onRecordingPress,
  onRecordingLongPress,
  onToggleSelection,
  onDeleteSelected,
  onSendToPreview,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );

  // Organiser les enregistrements par étagères
  const organizeRecordingsIntoShelves = () => {
    const shelves: Recording[][] = [];
    for (let i = 0; i < recordings.length; i += VIDEOS_PER_ROW) {
      shelves.push(recordings.slice(i, i + VIDEOS_PER_ROW));
    }
    return shelves;
  };

  const shelves = organizeRecordingsIntoShelves();

  const handleRecordingPress = (recordingId: string) => {
    if (isSelectionModeActive) {
      // En mode sélection, utiliser la fonction de toggle
      onToggleSelection?.(recordingId);
    } else {
      // En mode normal, ouvrir le modal
      const recording = recordings.find((r) => r.id === recordingId);
      if (recording) {
        setSelectedRecording(recording);
        setModalVisible(true);
      }
    }
  };

  const handlePlayVideo = (recording: Recording) => {
    // Appeler la fonction originale pour lire la vidéo
    onRecordingPress(recording.id);
  };

  const handleSendToPreview = (recording: Recording) => {
    // Utiliser la nouvelle fonction pour envoyer vers prévisualisation
    if (onSendToPreview) {
      onSendToPreview(recording);
    } else {
      // Fallback vers la fonction originale
      onRecordingPress(recording.id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedRecording(null);
  };

  if (recordings.length === 0) {
    return <EmptyState type="videos" />;
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VideoLibraryHeader videosCount={recordings.length} />

        {shelves.map((shelfRecordings, shelfIndex) => (
          <VideoShelf
            key={`shelf-${shelfIndex}`}
            recordings={shelfRecordings}
            scripts={scripts}
            rowIndex={shelfIndex}
            selectedRecordings={selectedRecordings}
            isSelectionModeActive={isSelectionModeActive}
            onRecordingPress={handleRecordingPress}
            onRecordingLongPress={onRecordingLongPress}
            onToggleSelection={onToggleSelection}
          />
        ))}

        {/* Espacement en bas pour éviter que les dernières cassettes soient coupées */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Particules flottantes pour un effet sophistiqué */}
      <FloatingParticles />

      {/* Modal d'actions vidéo */}
      <VideoActionModal
        visible={modalVisible}
        recording={selectedRecording}
        onClose={closeModal}
        onPlayVideo={handlePlayVideo}
        onSendToPreview={handleSendToPreview}
      />

      {/* Bouton de suppression en mode sélection */}
      {isSelectionModeActive &&
        selectedRecordings.length > 0 &&
        onDeleteSelected && (
          <View style={tw`absolute bottom-4 left-4 right-4`}>
            <TouchableOpacity
              onPress={onDeleteSelected}
              style={[
                tw`py-3 px-4 rounded-xl flex-row items-center justify-center`,
                { backgroundColor: currentTheme.colors.error },
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color="white"
                style={tw`mr-2`}
              />
              <UIText weight="bold" style={{ color: "white" }}>
                {t("home.recording.deleteSelected", {
                  count: selectedRecordings.length,
                  videos:
                    selectedRecordings.length > 1
                      ? t("home.recording.videos")
                      : t("home.recording.video"),
                })}
              </UIText>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
};
