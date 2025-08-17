import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { OptionButton } from "../OptionButton";
import { SliderControl } from "../SliderControl";
import { SwitchControl } from "../SwitchControl";
import type { AdvancedCameraConfig } from "../../../types/advanced";

interface Props {
  config: AdvancedCameraConfig;
  onChange: (updates: Partial<AdvancedCameraConfig>) => void;
}

export const AudioSection: React.FC<Props> = ({ config, onChange }) => {
  const { currentTheme } = useTheme();
  return (
    <View>
      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Qualité Audio
      </Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Standard"
          isActive={config.audioQuality === "standard"}
          onPress={() => onChange({ audioQuality: "standard" })}
        />
        <OptionButton
          label="Haute"
          isActive={config.audioQuality === "high"}
          onPress={() => onChange({ audioQuality: "high" })}
        />
        <OptionButton
          label="Sans perte"
          isActive={config.audioQuality === "lossless"}
          onPress={() => onChange({ audioQuality: "lossless" })}
        />
      </View>

      <SliderControl
        label="Gain du microphone"
        value={config.microphoneGain}
        minimumValue={0}
        maximumValue={100}
        step={5}
        onValueChange={(value) => onChange({ microphoneGain: value })}
        formatValue={(value) => `${value}%`}
      />

      <SwitchControl
        label="Réduction de bruit"
        value={config.noiseReduction}
        onValueChange={(value) => onChange({ noiseReduction: value })}
      />
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
