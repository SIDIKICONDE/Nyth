import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Card } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { ScriptTemplate } from "../../../../services/ai/TemplateManager";
import { ContentText, UIText } from "../../../ui/Typography";

interface TemplateCardProps {
  template: ScriptTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  const { currentTheme } = useTheme();
  const { ui, content } = useCentralizedFont();

  return (
    <TouchableOpacity onPress={onSelect}>
      <Card
        style={[
          tw`mb-3 p-4 rounded-lg`,
          {
            backgroundColor: isSelected
              ? `${currentTheme.colors.primary}15`
              : currentTheme.colors.card,
            borderWidth: isSelected ? 1 : 0,
            borderColor: currentTheme.colors.primary,
          },
        ]}
      >
        <View style={tw`flex-row items-center`}>
          <UIText
            size="lg"
            weight="bold"
            style={[ui, tw`mr-2`]}
            color={currentTheme.colors.text}
          >
            {template.icon}
          </UIText>
          <UIText
            size="base"
            weight="medium"
            style={[ui, { color: currentTheme.colors.text }]}
          >
            {template.name}
          </UIText>
        </View>

        <ContentText
          size="sm"
          style={[
            content,
            tw`mt-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {template.description}
        </ContentText>

        <View style={tw`flex-row flex-wrap mt-2`}>
          {template.structure.map((step, index) => (
            <View
              key={index}
              style={[
                tw`mr-2 mb-1 px-2 py-1 rounded-full`,
                { backgroundColor: `${currentTheme.colors.accent}15` },
              ]}
            >
              <UIText
                size="xs"
                style={[ui, { color: currentTheme.colors.accent }]}
              >
                {step}
              </UIText>
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
};
