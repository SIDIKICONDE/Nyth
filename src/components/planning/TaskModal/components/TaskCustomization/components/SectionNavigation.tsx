import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { styles } from "../styles";
import { SectionNavigationProps } from "../types";

export const SectionNavigation: React.FC<SectionNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.sectionNav}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionNavContent}
      >
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionNavButton,
              {
                backgroundColor:
                  activeSection === section.id
                    ? currentTheme.colors.primary
                    : currentTheme.colors.surface,
              },
            ]}
            onPress={() => onSectionChange(section.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={section.icon as any}
              size={16}
              color={
                activeSection === section.id
                  ? "white"
                  : currentTheme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.sectionNavText,
                {
                  color:
                    activeSection === section.id
                      ? "white"
                      : currentTheme.colors.textSecondary,
                },
              ]}
            >
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
