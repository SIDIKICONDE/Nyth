import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

// Components
import { PersonalizeTab } from "./components/PersonalizeTab";

// Hooks
import { useAIAssistantState } from "./hooks/useAIAssistantState";

// Types
import { AIAssistantProps } from "./types";

interface AIAssistantPropsWithVisible extends AIAssistantProps {
  visible?: boolean;
  onClose?: () => void;
}

export const AIAssistant: React.FC<AIAssistantPropsWithVisible> = ({
  isDarkMode,
  onScriptGenerated,
  currentText,
  onTextCorrected,
  visible,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // État de l'assistant
  const { state, personalization, setIsVisible, updatePersonalization } =
    useAIAssistantState();

  // Utiliser visible prop si fourni, sinon utiliser l'état interne
  const isVisible = visible !== undefined ? visible : state.isVisible;
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsVisible(false);
    }
  };

  // Version simplifiée pour debug
  if (!isVisible) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: currentTheme?.colors?.surface || "white",
            padding: 24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <UIText
              size="xl"
              weight="bold"
              style={{
                color: isDarkMode ? "#ffffff" : "#1e293b",
              }}
            >
              {t("ai.personalize.title", "Personnalisation Avancée")}
            </UIText>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={isDarkMode ? "#ffffff" : "#1e293b"}
              />
            </TouchableOpacity>
          </View>

          {/* Content - Directement PersonalizeTab sans tabs */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <PersonalizeTab
              isDarkMode={isDarkMode}
              personalization={personalization}
              onUpdate={updatePersonalization}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
