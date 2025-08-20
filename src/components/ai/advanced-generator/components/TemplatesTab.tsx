import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../hooks/useTranslation";
import { ScriptTemplate } from "../../../../services/ai/TemplateManager";
import { UIText } from "../../../ui/Typography";
import { TopicInputSection } from "../../TopicInputSection";
import { TemplateCard } from "./TemplateCard";

interface TemplatesTabProps {
  templates: ScriptTemplate[];
  selectedTemplate: string | null;
  onTemplateSelect: (templateId: string) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  topic,
  onTopicChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Regrouper les templates par catégorie
  const templatesByCategory: Record<string, ScriptTemplate[]> = {};

  templates.forEach((template) => {
    const category = template.category || "general";
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    templatesByCategory[category].push(template);
  });

  // Traduire les noms des catégories
  const getCategoryName = (category: string): string => {
    switch (category) {
      case "general":
        return t("ai.templates.categories.general");
      case "social":
        return t("ai.templates.categories.social");
      case "business":
        return t("ai.templates.categories.business");
      case "educational":
        return t("ai.templates.categories.educational");
      case "creative":
        return t("ai.templates.categories.creative");
      default:
        return category;
    }
  };

  return (
    <View style={tw`px-4 py-3`}>
      <TopicInputSection topic={topic} onTopicChange={onTopicChange} />

      <UIText
        size="base"
        weight="medium"
        style={[ui, tw`mb-2 mt-4`, { color: currentTheme.colors.text }]}
      >
        {t("ai.templates.chooseTemplate")}
      </UIText>

      {Object.entries(templatesByCategory).map(
        ([category, categoryTemplates]) => (
          <View key={category} style={tw`mb-4`}>
            <UIText
              size="sm"
              weight="medium"
              style={[
                ui,
                tw`mb-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {getCategoryName(category)}
            </UIText>

            {categoryTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate === template.id}
                onSelect={() => onTemplateSelect(template.id)}
              />
            ))}
          </View>
        )
      )}
    </View>
  );
};
