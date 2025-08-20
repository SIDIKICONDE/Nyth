import React from "react";
import { View } from "react-native";
import { Recording, Script } from "../../../types";
import { VIDEOS_PER_ROW } from "./VideoDimensions";
import { VideoItem } from "./VideoItem";
import { videoStyles } from "./VideoStyles";

interface VideoShelfProps {
  recordings: Recording[];
  scripts: Script[];
  rowIndex: number;
  selectedRecordings: string[];
  isSelectionModeActive: boolean;
  onRecordingPress: (recordingId: string) => void;
  onRecordingLongPress: (recordingId: string) => void;
  onToggleSelection?: (recordingId: string) => void;
}

export const VideoShelf: React.FC<VideoShelfProps> = ({
  recordings,
  scripts,
  rowIndex,
  selectedRecordings,
  isSelectionModeActive,
  onRecordingPress,
  onRecordingLongPress,
  onToggleSelection,
}) => {
  return (
    <View style={videoStyles.shelf}>
      <View style={videoStyles.rowContainer}>
        {recordings.map((recording, index) => (
          <VideoItem
            key={recording.id}
            recording={recording}
            scripts={scripts}
            index={rowIndex * VIDEOS_PER_ROW + index}
            onPress={() => onRecordingPress(recording.id)}
            onLongPress={() => onRecordingLongPress(recording.id)}
            isSelected={selectedRecordings.includes(recording.id)}
            onToggleSelection={() =>
              onToggleSelection && onToggleSelection(recording.id)
            }
            isSelectionModeActive={isSelectionModeActive}
          />
        ))}
      </View>
    </View>
  );
};
