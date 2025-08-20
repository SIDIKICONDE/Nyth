import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { NavigationTabsProps } from "../types";

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  sections,
  activeSection,
  onSectionChange,
  themeColors,
}) => {
  const { ui } = useCentralizedFont();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.navContent}
    >
      {sections.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.navButton,
            {
              backgroundColor:
                activeSection === section.id
                  ? themeColors.primary
                  : themeColors.surface,
            },
          ]}
          onPress={() => onSectionChange(section.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={section.icon as any}
            size={16}
            color={
              activeSection === section.id ? "white" : themeColors.textSecondary
            }
          />
          <UIText
            size="sm"
            weight="medium"
            style={[
              ui,
              styles.navText,
              {
                color:
                  activeSection === section.id
                    ? "white"
                    : themeColors.textSecondary,
              },
            ]}
          >
            {section.label}
          </UIText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
