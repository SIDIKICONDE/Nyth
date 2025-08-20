import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { OptionButton } from "../OptionButton";
import type { AdvancedCameraConfig } from "../../../types/advanced";

interface Props {
  config: AdvancedCameraConfig;
  onChange: (updates: Partial<AdvancedCameraConfig>) => void;
}

export const FormatSection: React.FC<Props> = ({ config, onChange }) => {
  const { currentTheme } = useTheme();
  return (
    <View>
      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Orientation
      </Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Auto"
          isActive={config.orientation === "auto"}
          onPress={() => onChange({ orientation: "auto" })}
        />
        <OptionButton
          label="Portrait"
          isActive={config.orientation === "portrait"}
          onPress={() => onChange({ orientation: "portrait" })}
        />
        <OptionButton
          label="Paysage"
          isActive={config.orientation === "landscape"}
          onPress={() => onChange({ orientation: "landscape" })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
});
