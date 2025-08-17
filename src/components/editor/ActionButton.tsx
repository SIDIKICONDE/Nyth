import React from "react";
import { TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Script } from "../../types";
import { UIText } from "../ui/Typography";

interface ActionButtonProps {
  currentScript: Script | null;
  onSaveScript: () => void;
  onDismissKeyboard: () => void;
}

export default function ActionButton({
  currentScript,
  onSaveScript,
  onDismissKeyboard,
}: ActionButtonProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => {
        onDismissKeyboard();
        onSaveScript();
      }}
      style={[
        tw`py-3 rounded-lg items-center`,
        {
          backgroundColor: currentTheme.colors.primary,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      activeOpacity={0.8}
    >
      <UIText size={16} weight="bold" style={tw`text-white`}>
        {currentScript
          ? `💾 ${t("editor.actions.saveAndContinue")}`
          : `🚀 ${t("editor.actions.createAndContinue")}`}
      </UIText>
    </TouchableOpacity>
  );
}
