import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { ToggleControlProps } from "../types";

export const ToggleControl: React.FC<ToggleControlProps> = ({
  setting,
  onToggle,
  themeColors,
}) => {
  const { ui } = useCentralizedFont();

  return (
    <TouchableOpacity
      style={[styles.toggleOption, { backgroundColor: themeColors.surface }]}
      onPress={() => onToggle(setting.key, !setting.enabled)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={setting.icon as any}
        size={20}
        color={themeColors.primary}
      />
      <View style={styles.toggleInfo}>
        <UIText
          size="base"
          weight="medium"
          style={[ui, styles.toggleLabel, { color: themeColors.text }]}
        >
          {setting.label}
        </UIText>
        <UIText
          size="sm"
          weight="medium"
          style={[
            ui,
            styles.toggleDescription,
            { color: themeColors.textSecondary },
          ]}
        >
          {setting.description}
        </UIText>
      </View>
      <View
        style={[
          styles.toggle,
          {
            backgroundColor: setting.enabled
              ? themeColors.primary
              : themeColors.border,
          },
        ]}
      >
        <View
          style={[
            styles.toggleIndicator,
            {
              backgroundColor: "white",
              transform: [{ translateX: setting.enabled ? 16 : 2 }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};
