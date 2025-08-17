import { useInputStyle } from "@/contexts/InputStyleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as React from "react";
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import AIFriendlyIcon from "../../icons/AIFriendlyIcon";
import {
  createBorderColorInterpolation,
  useInputAnimations,
} from "./animations";
import { useInputHandlers, useInputState } from "./hooks";
import {
  formatUserNameForPlaceholder,
  getPlaceholderText,
} from "./placeholders";
import {
  calculateDimensions,
  getCancelButtonStyle,
  getContainerStyle,
  getPlaceholderTextColor,
  getSendButtonStyle,
  getTextInputStyle,
} from "./styles";
import { ChatInputProps } from "./types";

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  handleSendMessage,
  isLoading,
  onFocus = () => {},
  isEditing,
  onCancelEdit,
}) => {
  const { currentTheme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const { t } = useTranslation();
  const { selectedInputStyle } = useInputStyle();
  const { profile } = useUserProfile();

  // État et handlers
  const { isFocused, wasInterrupted, handleInputFocus, handleInputBlur } =
    useInputState(isLoading);

  const { handleContentSizeChange, handleSend, canSend } = useInputHandlers(
    inputText,
    isLoading,
    handleSendMessage
  );

  // Animations
  const animations = useInputAnimations(
    inputText,
    isFocused,
    isLoading,
    selectedInputStyle
  );

  // Dimensions et styles
  const { width: screenWidth } = Dimensions.get("window");
  const { maxInputHeight } = calculateDimensions(
    selectedInputStyle,
    screenWidth
  );

  const borderColor = createBorderColorInterpolation(
    animations.inputBorderAnimation,
    currentTheme
  );

  // Configuration des styles
  const styleConfig = {
    selectedInputStyle,
    isFocused,
    currentTheme,
    canSend,
    isLoading,
    borderColor,
    pulseAnimation: animations.pulseAnimation,
  };

  // Gestion du focus avec callback
  const handleFocusWithCallback = () => {
    handleInputFocus();
    onFocus();
  };

  // Nom utilisateur et placeholder
  const userName = formatUserNameForPlaceholder(profile?.displayName, "Vous");
  const placeholderText = getPlaceholderText({
    isEditing,
    wasInterrupted,
    selectedInputStyle,
    userName,
    t,
  });

  const placeholderTextColor = getPlaceholderTextColor(
    selectedInputStyle,
    currentTheme
  );

  return (
    <Animated.View
      style={[tw`px-0 pb-0 pt-0`, { backgroundColor: "transparent" }]}
    >
      {/* Container principal de l'input */}
      <Animated.View style={getContainerStyle(styleConfig)}>
        {/* Input de texte */}
        <TextInput
          ref={inputRef}
          style={getTextInputStyle(
            selectedInputStyle,
            currentTheme,
            maxInputHeight
          )}
          placeholder={placeholderText}
          placeholderTextColor={placeholderTextColor}
          value={inputText}
          onChangeText={setInputText}
          onFocus={handleFocusWithCallback}
          onBlur={handleInputBlur}
          onContentSizeChange={handleContentSizeChange}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
          editable={!isLoading}
        />

        {/* Boutons d'action */}
        <Animated.View
          style={{ transform: [{ scale: animations.sendButtonScale }] }}
        >
          {/* Bouton d'annulation (mode édition) */}
          {isEditing && onCancelEdit && (
            <TouchableOpacity
              onPress={onCancelEdit}
              style={getCancelButtonStyle(currentTheme)}
            >
              <Ionicons
                name="close"
                size={20}
                color={currentTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {/* Bouton d'envoi */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || isLoading}
            style={getSendButtonStyle(styleConfig)}
          >
            {isLoading ? (
              <AIFriendlyIcon
                size={32}
                primaryColor="#FFFFFF"
                secondaryColor="#E5E7EB"
                animated={true}
              />
            ) : (
              <Ionicons
                name={isEditing ? "checkmark" : "send"}
                size={20}
                color={canSend ? "#FFFFFF" : currentTheme.colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default ChatInput;
