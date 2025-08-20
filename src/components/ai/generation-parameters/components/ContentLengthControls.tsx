import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../hooks/useTranslation";
import { CharacterCountInput } from "./CharacterCountInput";
import { ParagraphCountInput } from "./ParagraphCountInput";
import { WordCountInput } from "./WordCountInput";

interface ContentLengthControlsProps {
  wordCount?: number;
  onWordCountChange: (count: number | undefined) => void;
  characterCount?: number;
  onCharacterCountChange: (count: number | undefined) => void;
  paragraphCount?: number;
  onParagraphCountChange: (count: number | undefined) => void;
}

type ContentLengthTab = "words" | "characters" | "paragraphs";

export const ContentLengthControls: React.FC<ContentLengthControlsProps> = ({
  wordCount,
  onWordCountChange,
  characterCount,
  onCharacterCountChange,
  paragraphCount,
  onParagraphCountChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [activeTab, setActiveTab] = useState<ContentLengthTab>("words");

  const tabs: { id: ContentLengthTab; label: string; icon: string }[] = [
    { id: "words", label: t("ai.parameters.contentLength.words"), icon: "📝" },
    {
      id: "characters",
      label: t("ai.parameters.contentLength.characters"),
      icon: "🔤",
    },
    {
      id: "paragraphs",
      label: t("ai.parameters.contentLength.paragraphs"),
      icon: "📄",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "words":
        return (
          <WordCountInput
            wordCount={wordCount}
            onWordCountChange={onWordCountChange}
          />
        );
      case "characters":
        return (
          <CharacterCountInput
            characterCount={characterCount}
            onCharacterCountChange={onCharacterCountChange}
          />
        );
      case "paragraphs":
        return (
          <ParagraphCountInput
            paragraphCount={paragraphCount}
            onParagraphCountChange={onParagraphCountChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={tw`mb-4`}>
      <UIText
        size="base"
        weight="medium"
        style={[ui, tw`mb-4`, { color: currentTheme.colors.text }]}
      >
        {t("ai.parameters.contentLength.title")}
      </UIText>

      {/* Tab navigation */}
      <View
        style={[
          tw`flex-row mb-4 rounded-lg p-1`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              tw`flex-1 flex-row items-center justify-center py-2 px-3 rounded-md`,
              {
                backgroundColor:
                  activeTab === tab.id
                    ? currentTheme.colors.primary
                    : "transparent",
              },
            ]}
          >
            <UIText style={[ui, tw`mr-2`, { color: currentTheme.colors.text }]}>
              {tab.icon}
            </UIText>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                {
                  color:
                    activeTab === tab.id ? "white" : currentTheme.colors.text,
                },
              ]}
            >
              {tab.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View
        style={[
          tw`p-4 rounded-lg border`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        {renderTabContent()}
      </View>

      {/* Summary */}
      <View
        style={[
          tw`mt-3 p-3 rounded-lg`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        <UIText
          size="sm"
          weight="medium"
          style={[ui, tw`mb-1`, { color: currentTheme.colors.text }]}
        >
          {t("ai.parameters.contentLength.summary")}
        </UIText>
        <UIText
          size="xs"
          style={[ui, { color: currentTheme.colors.textSecondary }]}
        >
          {wordCount &&
            `${t("ai.parameters.contentLength.words")}: ${wordCount} • `}
          {characterCount &&
            `${t(
              "ai.parameters.contentLength.characters"
            )}: ${characterCount} • `}
          {paragraphCount &&
            `${t("ai.parameters.contentLength.paragraphs")}: ${paragraphCount}`}
          {!wordCount &&
            !characterCount &&
            !paragraphCount &&
            t("ai.parameters.contentLength.noLimits")}
        </UIText>
      </View>
    </View>
  );
};
