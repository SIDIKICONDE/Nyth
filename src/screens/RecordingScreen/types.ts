import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, Script, RecordingSettings } from "@/types";
import { TeleprompterSettings } from "@/components/recording/teleprompter/types";

// Navigation types
export type RecordingScreenRouteProp = RouteProp<RootStackParamList, "Recording">;
export type RecordingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Recording"
>;

// Component props
export interface RecordingScreenProps {}

// State types
export interface RecordingState {
  script: Script | null;
  settings: RecordingSettings | null;
  isLoading: boolean;
  error: string | null;
  isRecording: boolean;
  recordingDuration: number;
}

export interface TeleprompterState {
  showSettingsModal: boolean;
  customSettings: Partial<TeleprompterSettings>;
  scrollSpeed: number;
  backgroundOpacity: number;
}

// Permission types
export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  storage: boolean;
}

// Save result types
export interface SaveResult {
  success: boolean;
  recordingId?: string;
  videoUri?: string;
  error?: Error;
}