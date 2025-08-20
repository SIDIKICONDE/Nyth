// Composants principaux
export { CameraModule } from "./CameraModule";
export { CameraView } from "./components/CameraView";

// Composants d'options avancées
export {
  AdvancedCameraSettings,
  ManualControls,
  CameraPresets,
  CameraControls,
} from "./components";

// Hooks
export { useCamera } from "./hooks/useCamera";
export { useAdvancedCamera } from "./hooks/useAdvancedCamera";

// Types
export type {
  CameraConfig,
  RecordingState,
  CameraControls as CameraControlsType,
  CameraModuleRef,
} from "./types";

export type { AdvancedCameraConfig } from "./types/advanced";
