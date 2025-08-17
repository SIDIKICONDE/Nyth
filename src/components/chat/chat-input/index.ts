// Export principal
export { default as ChatInput } from "./ChatInput";

// Types
export type {
  ChatInputProps,
  DimensionsConfig,
  InputAnimations,
  InputStyleType,
  PlaceholderOptions,
  StyleConfig,
} from "./types";

// Animations
export {
  createBorderColorInterpolation,
  useInputAnimations,
} from "./animations";

// Styles
export {
  calculateDimensions,
  getCancelButtonStyle,
  getContainerStyle,
  getPlaceholderTextColor,
  getSendButtonStyle,
  getTextInputStyle,
} from "./styles";

// Placeholders
export {
  formatUserNameForPlaceholder,
  getPlaceholderText,
} from "./placeholders";

// Hooks
export { useInputHandlers, useInputState } from "./hooks";
