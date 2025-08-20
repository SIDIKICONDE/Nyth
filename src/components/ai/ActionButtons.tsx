import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useAIStatus } from "../../hooks/useAIStatus";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

interface ActionButtonsProps {
  topic: string;
  selectedPlatform: string;
  isLoading: boolean;
  onGenerate: () => void;
  onNavigateToSettings: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  topic,
  selectedPlatform,
  isLoading,
  onGenerate,
  onNavigateToSettings,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { isConfigured } = useAIStatus();

  const canGenerate =
    topic.trim().length > 0 && selectedPlatform && isConfigured && !isLoading;

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={tw`gap-3`}>
      {/* Generate button */}
      <TouchableOpacity
        style={[
          tw`py-3 px-5 rounded-lg flex-row items-center justify-center overflow-hidden`,
          {
            backgroundColor: canGenerate
              ? currentTheme.colors.accent
              : currentTheme.colors.border,
            opacity: canGenerate ? 1 : 0.6,
            shadowColor: canGenerate
              ? currentTheme.colors.accent
              : "transparent",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: canGenerate ? 3 : 0,
          },
        ]}
        onPress={onGenerate}
        disabled={!canGenerate}
      >
        {canGenerate && (
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "transparent"]}
            style={tw`absolute top-0 left-0 right-0 h-1`}
          />
        )}
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={18}
          color={canGenerate ? "#ffffff" : currentTheme.colors.textSecondary}
          style={tw`mr-1.5`}
        />
        <UIText
          size={16}
          weight="bold"
          color={canGenerate ? "#ffffff" : currentTheme.colors.textSecondary}
        >
          {isLoading
            ? t("aiGenerator.actions.generating")
            : t("aiGenerator.actions.generate")}
        </UIText>
      </TouchableOpacity>

      {/* Settings button */}
      {!isConfigured && (
        <TouchableOpacity
          style={[
            tw`py-3 px-6 rounded-xl border-2 flex-row items-center justify-center`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.accent,
              shadowColor: currentTheme.colors.accent,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            },
          ]}
          onPress={onNavigateToSettings}
        >
          <MaterialCommunityIcons
            name="cog"
            size={18}
            color={currentTheme.colors.accent}
            style={tw`mr-2`}
          />
          <UIText
            size={16}
            weight="semibold"
            color={currentTheme.colors.accent}
          >
            {t("aiGenerator.actions.configure")}
          </UIText>
        </TouchableOpacity>
      )}

      {/* Help text */}
      {!canGenerate && isConfigured && (
        <View
          style={[
            tw`p-3 rounded-lg flex-row items-center`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={currentTheme.colors.textSecondary}
            style={tw`mr-2`}
          />
          <UIText
            size="sm"
            style={tw`flex-1`}
            color={currentTheme.colors.textSecondary}
          >
            {!topic.trim()
              ? t("aiGenerator.actions.enterTopic")
              : !selectedPlatform
              ? t("aiGenerator.actions.selectPlatform")
              : t("aiGenerator.actions.checkingSettings")}
          </UIText>
        </View>
      )}
    </Animated.View>
  );
};
