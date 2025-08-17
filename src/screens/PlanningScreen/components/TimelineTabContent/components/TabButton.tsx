import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { ANIMATION_CONFIG, TAB_STYLES } from "../constants";
import { TabButtonProps } from "../types";

export const TabButton: React.FC<TabButtonProps> = ({
  tab,
  icon,
  label,
  count,
  isActive,
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const handlePress = () => {
    onPress(tab);
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isActive
            ? currentTheme.colors.primary
            : currentTheme.colors.surface,
        },
      ]}
      onPress={handlePress}
      activeOpacity={ANIMATION_CONFIG.activeOpacity}
    >
      <UIText
        style={[
          ui,
          styles.buttonText,
          {
            color: isActive
              ? currentTheme.colors.background
              : currentTheme.colors.text,
          },
        ]}
        size="sm"
        weight="semibold"
      >
        {icon} {label}
      </UIText>

      {count > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isActive
                ? currentTheme.colors.background + "30"
                : currentTheme.colors.primary + "20",
            },
          ]}
        >
          <UIText
            style={[
              ui,
              styles.badgeText,
              {
                color: isActive
                  ? currentTheme.colors.background
                  : currentTheme.colors.primary,
              },
            ]}
            size="xs"
            weight="semibold"
          >
            {count}
          </UIText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: TAB_STYLES.buttonPadding.vertical,
    paddingHorizontal: TAB_STYLES.buttonPadding.horizontal,
    borderRadius: TAB_STYLES.borderRadius,
    gap: 4,
    minHeight: 28,
  },
  buttonText: {},
  badge: {
    paddingHorizontal: TAB_STYLES.badgePadding.horizontal,
    paddingVertical: TAB_STYLES.badgePadding.vertical,
    borderRadius: TAB_STYLES.badgeBorderRadius,
    minWidth: TAB_STYLES.badgeMinWidth,
    alignItems: "center",
  },
  badgeText: {},
});
