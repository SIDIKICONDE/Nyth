import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { SectionType } from "../types";

interface SectionSelectorProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const sections: Array<{
    id: SectionType;
    title: string;
    icon: string;
    color: string;
  }> = [
    {
      id: "tutorials",
      title: t("help.sections.tutorials", "Tutoriels"),
      icon: "school",
      color: "#3B82F6",
    },
    {
      id: "documentation",
      title: "Documentation",
      icon: "book-open-page-variant",
      color: "#6366F1",
    },
    {
      id: "quickhelp",
      title: "Aide Rapide",
      icon: "lightning-bolt",
      color: "#10B981",
    },
    {
      id: "settings",
      title: "Réglages",
      icon: "cog",
      color: "#F59E0B",
    },
    {
      id: "planning",
      title: "Planification",
      icon: "calendar-star",
      color: "#F59E0B",
    },
    {
      id: "aichat",
      title: "AI Chat",
      icon: "robot-outline",
      color: "#8B5CF6",
    },
  ];

  return (
    <View style={tw`px-4 mb-4`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`gap-2`}
      >
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => onSectionChange(section.id)}
            style={[
              tw`px-4 py-3 rounded-xl flex-row items-center`,
              {
                backgroundColor:
                  activeSection === section.id
                    ? section.color + "20"
                    : currentTheme.colors.surface,
                borderWidth: 1,
                borderColor:
                  activeSection === section.id
                    ? section.color
                    : currentTheme.colors.border,
                minWidth: 120,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={section.icon as any}
              size={18}
              color={
                activeSection === section.id
                  ? section.color
                  : currentTheme.colors.textSecondary
              }
              style={tw`mr-2`}
            />
            <Text
              style={[
                tw`text-sm font-semibold`,
                {
                  color:
                    activeSection === section.id
                      ? section.color
                      : currentTheme.colors.text,
                },
              ]}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
