import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { OptionButton } from "../OptionButton";
import { SwitchControl } from "../SwitchControl";
import type { AdvancedCameraConfig } from "../../../types/advanced";

interface Props {
  config: AdvancedCameraConfig;
  supportsHDR: boolean;
  supportsLowLight: boolean;
  onChange: (updates: Partial<AdvancedCameraConfig>) => void;
}

export const EffectsSection: React.FC<Props> = ({
  config,
  supportsHDR,
  supportsLowLight,
  onChange,
}) => {
  const { currentTheme } = useTheme();
  const { width: screenWidth } = Dimensions.get("window");

  // Calcul responsive pour l'espacement des boutons
  const getResponsiveLayout = () => {
    const baseGap = 12;
    const minGap = 8;
    const maxGap = 16;

    const responsiveGap = Math.max(
      minGap,
      Math.min(maxGap, screenWidth * 0.03)
    );

    return {
      gap: responsiveGap,
      buttonMaxWidth: (screenWidth - 48 - responsiveGap * 2) / 3, // 48 = padding horizontal total
    };
  };

  const layout = getResponsiveLayout();

  return (
    <View>
      <Text style={[styles.optionLabel, { color: currentTheme.colors.text }]}>
        Stabilisation
      </Text>
      <View style={[styles.optionRow, { gap: layout.gap }]}>
        <OptionButton
          label="Désactivée"
          isActive={config.stabilization === "off"}
          onPress={() => onChange({ stabilization: "off" })}
        />
        <OptionButton
          label="Standard"
          isActive={config.stabilization === "standard"}
          onPress={() => onChange({ stabilization: "standard" })}
        />
        <OptionButton
          label="Cinématique"
          isActive={config.stabilization === "cinematic"}
          onPress={() => onChange({ stabilization: "cinematic" })}
        />
      </View>

      <SwitchControl
        label="Afficher le téléprompteur"
        value={config.teleprompterEnabled}
        onValueChange={(value) => onChange({ teleprompterEnabled: value })}
      />

      <SwitchControl
        label="HDR (Plage dynamique élevée)"
        value={config.hdr}
        onValueChange={(value) => onChange({ hdr: value })}
        disabled={!supportsHDR}
      />
      <SwitchControl
        label="Mode faible luminosité"
        value={config.lowLightBoost}
        onValueChange={(value) => onChange({ lowLightBoost: value })}
        disabled={!supportsLowLight}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    // Le gap est maintenant défini dynamiquement dans le composant
  },
});
