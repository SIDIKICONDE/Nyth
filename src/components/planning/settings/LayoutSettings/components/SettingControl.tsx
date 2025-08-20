import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { SettingControlProps } from "../types";

export const SettingControl: React.FC<SettingControlProps> = ({
  label,
  currentValue,
  values,
  unit,
  onValueChange,
  themeColors,
}) => {
  const { ui } = useCentralizedFont();

  return (
    <View style={styles.settingContainer}>
      <UIText
        size="base"
        weight="medium"
        style={[ui, styles.settingLabel, { color: themeColors.text }]}
      >
        {label}: {currentValue}
        {unit}
      </UIText>
      <View style={styles.buttonRow}>
        {values.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.valueButton,
              {
                backgroundColor:
                  currentValue === value
                    ? themeColors.primary
                    : themeColors.surface,
              },
            ]}
            onPress={() => onValueChange(value)}
            activeOpacity={0.7}
          >
            <UIText
              size="sm"
              weight="semibold"
              style={[
                ui,
                styles.valueButtonText,
                {
                  color: currentValue === value ? "white" : themeColors.text,
                },
              ]}
            >
              {value}
              {unit}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
