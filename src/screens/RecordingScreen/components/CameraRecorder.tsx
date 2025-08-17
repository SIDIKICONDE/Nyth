import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { VideoFile } from "react-native-vision-camera";
import { Script, RecordingSettings } from "@/types";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";
import { CameraModule } from "@/components/camera";
import { TeleprompterContainer } from "@/components/recording/teleprompter";

interface CameraRecorderProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingComplete?: (video: VideoFile) => void;
  onError?: (error: Error) => void;
  isRecording?: boolean;
  script?: Script;
  settings?: RecordingSettings;
  onSettings?: () => void;
  onEditText?: () => void;
  teleprompterSettings?: Partial<TeleprompterSettings>;
  scrollSpeed?: number;
  backgroundOpacity?: number;
}

export function CameraRecorder({
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  onError,
  isRecording,
  script,
  settings,
  onSettings,
  onEditText,
  teleprompterSettings,
  scrollSpeed = 50,
  backgroundOpacity = 80,
}: CameraRecorderProps) {
  const [teleprompterEnabled, setTeleprompterEnabled] = React.useState(true);
  const fromTeleprompterSettings =
    teleprompterSettings?.teleprompterEnabled ?? true;
  const teleprompterVisible =
    Boolean(script) &&
    Boolean(settings) &&
    teleprompterEnabled &&
    fromTeleprompterSettings;
  const mergedSettings = settings
    ? { ...settings, ...teleprompterSettings }
    : undefined;
  return (
    <View style={tw`flex-1`}>
      <CameraModule
        onRecordingComplete={onRecordingComplete}
        onError={onError}
        initialPosition="back"
        showControls={true}
        onSettingsPress={onSettings}
        onRecordingStart={onRecordingStart}
        onRecordingStop={onRecordingStop}
        onTeleprompterToggle={setTeleprompterEnabled}
      />

      {teleprompterVisible && mergedSettings && (
        <TeleprompterContainer
          script={script || null}
          settings={mergedSettings}
          isRecording={Boolean(isRecording)}
          isPaused={false}
          scrollSpeed={scrollSpeed}
          backgroundOpacity={backgroundOpacity}
          backgroundColor={teleprompterSettings?.backgroundColor || "#000000"}
          hideResizeIndicators={false}
          isScreenFocused={true}
          onSettings={onSettings}
          onEditText={onEditText}
          disabled={!teleprompterVisible}
        />
      )}
    </View>
  );
}
