import React from "react";
import { TouchableWithoutFeedback, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { ActionGrid } from "./ActionGrid";
import { TeleprompterSelectionModalProps } from "./types";

interface ModalContentProps
  extends Omit<TeleprompterSelectionModalProps, "visible" | "onClose"> {}

export const ModalContent: React.FC<ModalContentProps> = (props) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleModalContentPress = (e: any) => {
    e.stopPropagation();
  };

  return (
    <TouchableWithoutFeedback onPress={handleModalContentPress}>
      <View
        style={[
          tw`rounded-3xl overflow-hidden`,
          {
            backgroundColor: currentTheme.colors.surface,
            shadowColor: currentTheme.isDark ? "#000" : "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: currentTheme.isDark ? 0.6 : 0.15,
            shadowRadius: 35,
            elevation: 25,
            borderWidth: currentTheme.isDark ? 0.5 : 0,
            borderColor: currentTheme.isDark
              ? "rgba(255,255,255,0.08)"
              : "transparent",
            minWidth: 320,
            maxWidth: 380,
            marginHorizontal: 20,
          },
        ]}
      >
        {/* Header avec gradient subtil */}
        <View
          style={[
            tw`px-6 py-5 border-b border-opacity-10`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255,255,255,0.02)"
                : "rgba(0,0,0,0.01)",
              borderBottomColor: currentTheme.isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          {/* Indicateur de modal */}
          <View style={tw`items-center mb-3`}>
            <View
              style={[
                tw`w-12 h-1 rounded-full opacity-40`,
                { backgroundColor: currentTheme.colors.text },
              ]}
            />
          </View>

          {/* Titre principal */}
          <UIText
            size="lg"
            weight="bold"
            align="center"
            style={{
              color: currentTheme.colors.text,
              letterSpacing: -0.3,
              lineHeight: 26,
            }}
          >
            {t("home.script.actions")}
          </UIText>

          {/* Sous-titre */}
          <UIText
            size="sm"
            weight="medium"
            align="center"
            style={{
              color: currentTheme.colors.text,
              opacity: 0.6,
              marginTop: 4,
              letterSpacing: 0.1,
            }}
          >
            Choisissez une action
          </UIText>
        </View>

        {/* Contenu principal */}
        <View style={tw`px-6 py-6`}>
          <ActionGrid {...props} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
