import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { COLORS, UI_CONFIG } from "../task-modal-constants";
import { styles } from "../task-modal-styles";
import { TabNavigationProps } from "../task-modal-types";

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Définir les onglets avec traductions
  const tabs = [
    {
      id: "details" as const,
      label: t("planning.tasks.taskModal.detailsTab", "Détails"),
      icon: "document-text-outline",
    },
    {
      id: "customization" as const,
      label: t("planning.tasks.taskModal.customizationTab", "Personnalisation"),
      icon: "color-palette-outline",
    },
  ];

  return (
    <View style={styles.tabNavigation}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? currentTheme.colors.primary
                  : currentTheme.colors.surface,
              },
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={UI_CONFIG.TAB_ICON_SIZE}
              color={
                isActive ? COLORS.WHITE : currentTheme.colors.textSecondary
              }
            />
            <UIText
              style={[
                styles.tabText,
                {
                  color: isActive
                    ? COLORS.WHITE
                    : currentTheme.colors.textSecondary,
                },
              ]}
              size="sm"
              weight="medium"
            >
              {tab.label}
            </UIText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
