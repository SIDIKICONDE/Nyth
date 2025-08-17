import { Animated } from "react-native";

// Props pour le ChatInput
export interface ChatInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => Promise<void>;
  isLoading: boolean;
  onFocus?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

// Types pour les styles d'input
export type InputStyleType = "classic" | "glass" | "sheet" | "neon";

// Interface pour les animations
export interface InputAnimations {
  sendButtonScale: Animated.Value;
  inputBorderAnimation: Animated.Value;
  pulseAnimation: Animated.Value;
  loadingRotation: Animated.Value;
}

// Options pour les placeholders
export interface PlaceholderOptions {
  isEditing?: boolean;
  wasInterrupted?: boolean;
  selectedInputStyle: InputStyleType;
  userName: string;
  t: any; // Type de fonction de traduction
}

// Configuration des styles
export interface StyleConfig {
  selectedInputStyle: InputStyleType;
  isFocused: boolean;
  currentTheme: any;
  canSend: boolean;
  isLoading: boolean;
  borderColor: any;
  pulseAnimation: Animated.Value;
}

// Configuration des dimensions
export interface DimensionsConfig {
  screenWidth: number;
  maxInputHeight: number;
}
