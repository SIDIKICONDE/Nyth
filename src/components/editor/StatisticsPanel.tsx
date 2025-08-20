import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { Caption, HeadingText, UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

interface StatisticsPanelProps {
  wordCount: number;
  content: string;
  isCompact?: boolean;
}

export default function StatisticsPanel({
  wordCount,
  content,
  isCompact = false,
}: StatisticsPanelProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const estimatedDuration = Math.ceil(wordCount / 150);
  const paragraphCount =
    content?.split("\n\n").filter((p) => p.trim()).length || 0;

  if (isCompact) {
    // Compact version for portrait mode
    return (
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <View
          style={[
            tw`flex-row items-center px-3 py-2 rounded-lg`,
            { backgroundColor: currentTheme.colors.primary + "15" },
          ]}
        >
          <UIText
            size="sm"
            weight="bold"
            style={[tw`mr-1`, { color: currentTheme.colors.primary }]}
          >
            {wordCount}
          </UIText>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.words")}
          </Caption>
        </View>

        <View
          style={[
            tw`flex-row items-center px-3 py-2 rounded-lg`,
            { backgroundColor: currentTheme.colors.accent + "15" },
          ]}
        >
          <UIText
            size="sm"
            weight="bold"
            style={[tw`mr-1`, { color: currentTheme.colors.accent }]}
          >
            ~{estimatedDuration}
          </UIText>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.min")}
          </Caption>
        </View>

        <View
          style={[
            tw`flex-row items-center px-3 py-2 rounded-lg`,
            { backgroundColor: currentTheme.colors.success + "15" },
          ]}
        >
          <UIText
            size="sm"
            weight="bold"
            style={[tw`mr-1`, { color: currentTheme.colors.success }]}
          >
            {content.length}
          </UIText>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.chars")}
          </Caption>
        </View>
      </View>
    );
  }

  // Detailed version for landscape mode
  return (
    <View style={tw`mb-4`}>
      <UIText
        size="sm"
        weight="medium"
        style={[tw`mb-3`, { color: currentTheme.colors.textSecondary }]}
      >
        {t("editor.stats.title")}
      </UIText>

      <View style={tw`flex-row justify-between mb-2`}>
        <View style={tw`flex-1 mr-2`}>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.wordsTitle")}
          </Caption>
          <HeadingText
            size="lg"
            weight="bold"
            color={currentTheme.colors.primary}
          >
            {wordCount}
          </HeadingText>
        </View>

        <View style={tw`flex-1 ml-2`}>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.estimatedDuration")}
          </Caption>
          <HeadingText
            size="lg"
            weight="bold"
            color={currentTheme.colors.accent}
          >
            ~{estimatedDuration} {t("editor.stats.min")}
          </HeadingText>
        </View>
      </View>

      <View style={tw`flex-row justify-between`}>
        <View style={tw`flex-1 mr-2`}>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.characters")}
          </Caption>
          <HeadingText
            size="lg"
            weight="bold"
            color={currentTheme.colors.success}
          >
            {content.length}
          </HeadingText>
        </View>

        <View style={tw`flex-1 ml-2`}>
          <Caption style={{ color: currentTheme.colors.textMuted }}>
            {t("editor.stats.paragraphs")}
          </Caption>
          <HeadingText
            size="lg"
            weight="bold"
            color={currentTheme.colors.warning}
          >
            {paragraphCount}
          </HeadingText>
        </View>
      </View>
    </View>
  );
}
