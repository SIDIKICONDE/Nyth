import { Animated } from "react-native";
import { RecordingSettings, Script } from "../../../types";
// import { TeleprompterSettings } from '../../../screens/TeleprompterPreview/useTeleprompterSettings';

// Type temporaire pour remplacer TeleprompterSettings
export interface TeleprompterSettings {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  textAlignment: "left" | "center" | "right";
  horizontalMargin: number;
  isMirrored: boolean;
  textShadow: boolean;
  startPosition: "top" | "center" | "bottom";
  positionOffset: number;
  hideControls: boolean;
  glassEnabled?: boolean;
  glassBlurAmount?: number;
  lineHeightMultiplier?: number;
  letterSpacing?: number;
  verticalPaddingTop?: number;
  verticalPaddingBottom?: number;
  isMirroredVertical?: boolean;
  guideEnabled?: boolean;
  guideColor?: string;
  guideOpacity?: number; // 0..1
  guideHeight?: number; // px
  teleprompterEnabled?: boolean;
  settingsIconColor?: string;
  editIconColor?: string;
}

export interface TeleprompterProps {
  script: Script | null;
  settings: RecordingSettings & Partial<TeleprompterSettings>;
  isRecording: boolean;
  isPaused: boolean;
  scrollSpeed?: number; // Speed in percentage (10-100)
  backgroundOpacity?: number; // Background opacity in percentage (0-100)
  backgroundColor?: string; // Background color
  hideResizeIndicators?: boolean; // Hide resize indicators
  isScreenFocused?: boolean; // Whether the screen is currently focused
  onSettings?: () => void; // Callback pour l'icône de réglages
  onEditText?: () => void; // Callback pour l'icône d'édition
  disabled?: boolean;
}

export interface ScrollingState {
  textHeight: number;
  isTextMeasured: boolean;
  currentAnimation: Animated.CompositeAnimation | null;
  pausedPosition: number | null;
  endPosition: number;
  startPosition: number;
}

export interface ContainerState {
  containerY: Animated.Value;
  containerHeight: number;
  isDragging: boolean;
  isResizing: boolean;
  startDragY: React.MutableRefObject<number>;
  startResizeHeight: React.MutableRefObject<number>;
}

export interface ScrollerHandlers {
  startScrolling: () => void;
  stopScrolling: () => void;
  resetScrolling: () => void;
  calculateDuration: () => number;
  updateScrollSpeed?: (speed: number) => void;
  pauseScrolling?: () => void;
}
