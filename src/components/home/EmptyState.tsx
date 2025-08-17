import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { ContentText, HeadingText } from "../ui";

interface EmptyStateProps {
  type: "scripts" | "videos";
  onCreateScript?: () => void;
}

export default function EmptyState({ type, onCreateScript }: EmptyStateProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const iconName = type === "scripts" ? "script-text" : "video-outline";

  return (
    <View style={tw`flex-1 justify-center items-center px-8`}>
      <View
        style={[
          tw`w-24 h-24 rounded-full items-center justify-center mb-6`,
          { backgroundColor: `${currentTheme.colors.primary}20` },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={48}
          color={currentTheme.colors.primary}
        />
      </View>

      <HeadingText
        size={18}
        weight="600"
        style={[tw`text-center mb-2`, { color: currentTheme.colors.text }]}
      >
        {t(`home.emptyState.${type}.title`)}
      </HeadingText>

      <ContentText
        size={14}
        style={[
          tw`text-center px-8`,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {t(`home.emptyState.${type}.subtitle`)}
      </ContentText>
    </View>
  );
}
