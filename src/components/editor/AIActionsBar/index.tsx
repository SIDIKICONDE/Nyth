import React, { useMemo } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { AIFriendlyIcon } from "../../icons";
import { ActionButton } from "./components/ActionButton";
import { useAIActions } from "./hooks/useAIActions";
import { AIAction, AIActionsBarProps } from "./types";

export const AIActionsBar: React.FC<AIActionsBarProps> = ({
  content,
  onContentUpdate,
  cursorPosition,
  onOpenAIAssistant,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const {
    isProcessing,
    activeAction,
    handleCorrect,
    handleImprove,
    handleAnalyze,
    handleAIChat,
  } = useAIActions({
    content,
    onContentUpdate,
  });

  const actions: AIAction[] = useMemo(
    () => [
      {
        id: "correct",
        label: t("ai.actions.correct", "Corriger"),
        icon: "spellcheck",
        color: currentTheme.colors.success,
        action: handleCorrect,
      },
      {
        id: "improve",
        label: t("ai.actions.improve", "Améliorer"),
        icon: "magic-staff",
        color: currentTheme.colors.accent,
        action: handleImprove,
      },
      {
        id: "analyze",
        label: t("ai.actions.analyze", "Analyser"),
        icon: "chart-line",
        color: currentTheme.colors.warning,
        action: handleAnalyze,
      },
      {
        id: "chat",
        label: t("ai.actions.chat", "Assistant IA"),
        color: currentTheme.colors.primary,
        showLabel: false,
        iconComponent: (
          <AIFriendlyIcon
            size={54}
            primaryColor={currentTheme.colors.primary}
            secondaryColor={currentTheme.colors.accent}
            animated={true}
          />
        ),
        action: async () => {
          await handleAIChat();
        },
      },
    ],
    [currentTheme, t, handleCorrect, handleImprove, handleAnalyze, handleAIChat]
  );

  return (
    <View
      style={[
        tw`px-2 py-2`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      <View style={tw`flex-row justify-around items-center`}>
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            isProcessing={isProcessing}
            isActive={activeAction === action.id}
            onPress={action.action}
          />
        ))}
      </View>
    </View>
  );
};
