import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { VideoFile } from "react-native-vision-camera";
import { Script, RecordingSettings } from "@/types";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";
import { CameraModule, CameraModuleRef } from "@/components/camera";
import { TeleprompterContainer } from "@/components/recording/teleprompter";

export interface CameraRecorderRef {
  stopRecordingAndGetFile: () => Promise<VideoFile | null>;
}

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

export const CameraRecorder = forwardRef<CameraRecorderRef, CameraRecorderProps>(
  (
    {
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
    },
    ref
  ) => {
    const [isPaused, setIsPaused] = React.useState(false);
    const [teleprompterEnabled, setTeleprompterEnabled] = React.useState(true);
    const cameraModuleRef = useRef<CameraModuleRef>(null);

    // Exposer la méthode d'arrêt via la ref du CameraRecorder
    useImperativeHandle(ref, () => ({
      stopRecordingAndGetFile: async () => {
        if (cameraModuleRef.current) {
          return await cameraModuleRef.current.stopRecordingAndGetFile();
        }
        return null;
      },
    }));

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
          ref={cameraModuleRef}
          onRecordingComplete={onRecordingComplete}
          onError={onError}
          initialPosition="back"
          showControls={true}
          onSettingsPress={onSettings}
          onRecordingStart={onRecordingStart}
          onRecordingStop={onRecordingStop}
          onTeleprompterToggle={setTeleprompterEnabled}
          onRecordingStateChange={(state) => setIsPaused(state.isPaused)}
        />

        {teleprompterVisible && mergedSettings && (
          <TeleprompterContainer
            script={script || null}
            settings={mergedSettings}
            isRecording={Boolean(isRecording)}
            isPaused={isPaused}
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
);

