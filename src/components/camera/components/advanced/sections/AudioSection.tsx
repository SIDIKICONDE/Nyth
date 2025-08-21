import React, { memo, useCallback } from "react";
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

const AudioSectionComponent: React.FC<Props> = ({ config, onChange }) => {
  const { currentTheme } = useTheme();
  
  // Mémoiser les callbacks pour éviter les re-renders
  const handleAudioQualityChange = useCallback((quality: "standard" | "high" | "lossless") => {
    onChange({ audioQuality: quality });
  }, [onChange]);
  
  const handleMicrophoneGainChange = useCallback((value: number) => {
    onChange({ microphoneGain: value });
  }, [onChange]);
  
  const handleNoiseReductionChange = useCallback((value: boolean) => {
    onChange({ noiseReduction: value });
  }, [onChange]);
  return (
    <View>
      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Qualité Audio
      </Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Standard"
          isActive={config.audioQuality === "standard"}
          onPress={() => handleAudioQualityChange("standard")}
        />
        <OptionButton
          label="Haute"
          isActive={config.audioQuality === "high"}
          onPress={() => handleAudioQualityChange("high")}
        />
        <OptionButton
          label="Sans perte"
          isActive={config.audioQuality === "lossless"}
          onPress={() => handleAudioQualityChange("lossless")}
        />
      </View>

      <SliderControl
        label="Gain du microphone"
        value={config.microphoneGain}
        minimumValue={0}
        maximumValue={100}
        step={5}
        onValueChange={handleMicrophoneGainChange}
        formatValue={(value) => `${value}%`}
      />

      <SwitchControl
        label="Réduction de bruit"
        value={config.noiseReduction}
        onValueChange={handleNoiseReductionChange}
      />
    </View>
  );
};

// Mémoiser le composant pour éviter les re-renders inutiles
export const AudioSection = memo(AudioSectionComponent, (prevProps, nextProps) => {
  return (
    prevProps.config.audioQuality === nextProps.config.audioQuality &&
    prevProps.config.microphoneGain === nextProps.config.microphoneGain &&
    prevProps.config.noiseReduction === nextProps.config.noiseReduction &&
    prevProps.onChange === nextProps.onChange
  );
});

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
