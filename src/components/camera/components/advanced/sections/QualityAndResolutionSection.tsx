import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { OptionButton } from "../OptionButton";
import type {
  AdvancedCameraConfig,
  AdvancedCameraCapabilities,
  Resolution,
  Codec,
  FrameRate,
} from "../../../types/advanced";

interface Props {
  config: AdvancedCameraConfig;
  capabilities: AdvancedCameraCapabilities;
  isDark: boolean;
  onChange: (updates: Partial<AdvancedCameraConfig>) => void;
}

export const QualityAndResolutionSection: React.FC<Props> = ({
  config,
  capabilities,
  isDark,
  onChange,
}) => {
  const { currentTheme } = useTheme();
  return (
    <View>
      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Résolution
      </Text>
      <View style={styles.optionRow}>
        {capabilities.supportedResolutions.map((res) => (
          <OptionButton
            key={res as string}
            label={res as string}
            isActive={config.resolution === (res as Resolution)}
            onPress={() => onChange({ resolution: res as Resolution })}
          />
        ))}
      </View>

      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Codec
      </Text>
      <View style={styles.optionRow}>
        {capabilities.supportedCodecs.map((codec) => (
          <OptionButton
            key={codec as string}
            label={(codec as string).toUpperCase()}
            isActive={config.codec === (codec as Codec)}
            onPress={() => onChange({ codec: codec as Codec })}
          />
        ))}
      </View>

      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Mode de Qualité
      </Text>
      <View style={styles.optionRow}>
        <OptionButton
          label="Vitesse"
          isActive={config.qualityMode === "speed"}
          onPress={() => onChange({ qualityMode: "speed" })}
        />
        <OptionButton
          label="Équilibré"
          isActive={config.qualityMode === "balanced"}
          onPress={() => onChange({ qualityMode: "balanced" })}
        />
        <OptionButton
          label="Qualité"
          isActive={config.qualityMode === "quality"}
          onPress={() => onChange({ qualityMode: "quality" })}
        />
      </View>

      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Images par seconde
      </Text>
      <View style={styles.optionRow}>
        {([24, 30, 60] as FrameRate[]).map((fps) => (
          <OptionButton
            key={fps}
            label={`${fps} FPS`}
            isActive={config.frameRate === fps}
            onPress={() => onChange({ frameRate: fps })}
          />
        ))}
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
