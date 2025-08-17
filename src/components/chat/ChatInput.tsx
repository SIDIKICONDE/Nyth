import { useFont } from "@/contexts/FontContext";
import { useInputStyle } from "@/contexts/InputStyleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import AIFriendlyIcon from "../icons/AIFriendlyIcon";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('ChatInput');

interface ChatInputProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => Promise<void>;
  isLoading: boolean;
  onFocus?: () => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

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
  const { getContentFontStyle } = useFont();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);
  const { t } = useTranslation();
  const { selectedInputStyle } = useInputStyle();
  const { profile } = useUserProfile();
  const userName = profile?.displayName || "Vous";

  // Animations
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;
  const inputBorderAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;

  const { width: screenWidth } = Dimensions.get("window");
  const maxInputHeight =
    selectedInputStyle === "sheet"
      ? 300
      : selectedInputStyle === "neon"
      ? 250
      : 200;

  // Animation du bouton d'envoi
  useEffect(() => {
    const canSend = inputText.trim().length > 0;
    Animated.spring(sendButtonScale, {
      toValue: canSend ? 1 : 0.8,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [inputText, sendButtonScale]);

  // Animation de la bordure lors du focus
  useEffect(() => {
    Animated.timing(inputBorderAnimation, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, inputBorderAnimation]);

  // Animation de pulsation pour l'input focus (JavaScript)
  useEffect(() => {
    if (
      isFocused &&
      selectedInputStyle !== "sheet" &&
      selectedInputStyle !== "neon"
    ) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isFocused, pulseAnimation, selectedInputStyle]);

  // Animation de rotation pour le loading (Native)
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotation.setValue(0);
    }
  }, [isLoading, loadingRotation]);

  // Gestion du focus
  const handleInputFocus = () => {
    setIsFocused(true);
    setWasInterrupted(false);
    onFocus();
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  // Détecter l'interruption de l'AI
  React.useEffect(() => {
    if (!isLoading && wasInterrupted) {
      // Réinitialiser après 3 secondes
      const timer = setTimeout(() => {
        setWasInterrupted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [isLoading, wasInterrupted]);

  // Gestion de la hauteur dynamique
  const handleContentSizeChange = (event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    logger.debug("Content height:", contentHeight);
    // La hauteur est maintenant gérée automatiquement par minHeight/maxHeight
  };

  // Fonction d'envoi
  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      await handleSendMessage();
      // La hauteur se réinitialise automatiquement quand le texte est vidé
    }
  };

  // Styles animés
  const borderColor = inputBorderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      currentTheme.colors.border,
      currentTheme.colors.accent || "#007AFF",
    ],
  });

  const canSend = inputText.trim().length > 0;

  // Obtenir les styles de police centralisés
  const contentFontStyle = getContentFontStyle();

  return (
    <Animated.View
      style={[tw`px-0 pb-0 pt-0`, { backgroundColor: "transparent" }]}
    >
      {/* Container principal de l'input futuriste */}
      <Animated.View
        style={[
          tw`flex-row items-end rounded-3xl px-5 py-3`,
          {
            ...(selectedInputStyle === "glass"
              ? {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.6)",
                  borderWidth: 1,
                  borderColor: currentTheme.isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                  shadowColor: currentTheme.isDark ? "#000" : "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 6,
                }
              : selectedInputStyle === "sheet"
              ? {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(38,38,40,1)"
                    : "rgba(255,255,255,1)",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderWidth: 1,
                  borderColor: currentTheme.colors.border,
                  borderBottomWidth: 0,
                  shadowColor: currentTheme.isDark ? "#000" : "#000",
                  shadowOffset: { width: 0, height: -8 },
                  shadowOpacity: currentTheme.isDark ? 0.6 : 0.3,
                  shadowRadius: 20,
                  elevation: 15,
                }
              : selectedInputStyle === "neon"
              ? {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(0, 0, 0, 0.9)"
                    : "rgba(15, 15, 15, 0.95)",
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: isFocused ? "#00F5FF" : "#00CED1",
                  shadowColor: "#00F5FF",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isFocused ? 0.8 : 0.4,
                  shadowRadius: isFocused ? 20 : 10,
                  elevation: 20,
                  // Effet de glow interne
                  boxShadow: isFocused
                    ? "inset 0 0 20px rgba(0, 245, 255, 0.2), 0 0 30px rgba(0, 245, 255, 0.6)"
                    : "inset 0 0 10px rgba(0, 206, 209, 0.1), 0 0 15px rgba(0, 206, 209, 0.3)",
                }
              : {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(28, 28, 30, 0.9)"
                    : "rgba(255, 255, 255, 0.95)",
                  borderWidth: 2,
                  borderColor,
                  shadowColor: currentTheme.isDark ? "#000" : "#000",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.4,
                  shadowRadius: 24,
                  elevation: 12,
                }),
            transform: [{ scale: pulseAnimation }],
            ...((selectedInputStyle === "sheet" ||
              selectedInputStyle === "neon") && { transform: [] }),
          },
        ]}
      >
        {/* Input de texte futuriste */}
        <TextInput
          ref={inputRef}
          style={[
            tw`flex-1 text-base leading-6 px-2`,
            contentFontStyle,
            {
              color:
                selectedInputStyle === "neon"
                  ? "#00F5FF"
                  : currentTheme.colors.text,
              minHeight:
                selectedInputStyle === "sheet"
                  ? 80
                  : selectedInputStyle === "neon"
                  ? 60
                  : 44,
              maxHeight: maxInputHeight,
              backgroundColor: "transparent",
              textAlign: "left",
              textAlignVertical:
                selectedInputStyle === "sheet" ? "top" : "center",
              fontWeight: selectedInputStyle === "neon" ? "500" : undefined,
              letterSpacing: selectedInputStyle === "neon" ? 0.5 : 0,
            },
          ]}
          placeholder={
            isEditing
              ? t("chat.input.editPlaceholder", "✏️ Modifiez votre message...")
              : wasInterrupted
              ? t(
                  "chat.input.interruptedPlaceholder",
                  "Generation interrupted - Type your new message..."
                )
              : selectedInputStyle === "neon"
              ? t(
                  "chat.input.neonPlaceholder",
                  "⚡ {{name}}, tapez dans le futur...",
                  { name: userName }
                )
              : t(
                  "chat.input.placeholderNamed",
                  "✨ Demandez n'importe quoi à {{name}}...",
                  { name: userName }
                )
          }
          placeholderTextColor={
            selectedInputStyle === "neon"
              ? "rgba(0, 206, 209, 0.6)"
              : currentTheme.colors.textSecondary + "80"
          }
          value={inputText}
          onChangeText={setInputText}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onContentSizeChange={handleContentSizeChange}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={true}
          editable={!isLoading}
        />

        {/* Bouton d'envoi futuriste */}
        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
          {isEditing && onCancelEdit && (
            <TouchableOpacity
              onPress={onCancelEdit}
              style={[
                tw`mr-2 p-3 rounded-full items-center justify-center`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(60, 60, 62, 0.6)"
                    : "rgba(229, 229, 234, 0.8)",
                  borderWidth: 1,
                  borderColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={currentTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || isLoading}
            style={[
              tw`ml-3 p-3 rounded-full items-center justify-center`,
              {
                backgroundColor:
                  canSend && !isLoading
                    ? currentTheme.colors.accent || "#007AFF"
                    : currentTheme.isDark
                    ? "rgba(60, 60, 62, 0.6)"
                    : "rgba(229, 229, 234, 0.8)",
                borderWidth: 1,
                borderColor:
                  canSend && !isLoading
                    ? currentTheme.colors.accent || "#007AFF"
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                shadowColor: canSend
                  ? currentTheme.colors.accent || "#007AFF"
                  : "transparent",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: canSend ? 6 : 0,
              },
            ]}
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
