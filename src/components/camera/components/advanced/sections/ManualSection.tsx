import React from "react";
import { View } from "react-native";
import { SliderControl } from "../SliderControl";
import { SwitchControl } from "../SwitchControl";
import type { AdvancedCameraConfig } from "../../../types/advanced";

interface Props {
  config: AdvancedCameraConfig;
  maxZoom: number;
  onChange: (updates: Partial<AdvancedCameraConfig>) => void;
}

export const ManualSection: React.FC<Props> = ({
  config,
  maxZoom,
  onChange,
}) => {
  return (
    <View>
      <SwitchControl
        label="Activer les contrôles manuels"
        value={config.manualControls}
        onValueChange={(value) => onChange({ manualControls: value })}
      />

      {config.manualControls && (
        <>
          <SliderControl
            label="Zoom"
            value={config.zoom}
            minimumValue={1}
            maximumValue={maxZoom}
            step={0.1}
            onValueChange={(value) => onChange({ zoom: value })}
            formatValue={(value) => `${value.toFixed(1)}x`}
          />

          <SliderControl
            label="Exposition"
            value={config.exposure}
            minimumValue={-2}
            maximumValue={2}
            step={0.1}
            onValueChange={(value) => onChange({ exposure: value })}
            formatValue={(value) =>
              value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
            }
          />

          <SliderControl
            label="ISO"
            value={config.iso}
            minimumValue={50}
            maximumValue={3200}
            step={50}
            onValueChange={(value) => onChange({ iso: value })}
            formatValue={(value) => value.toString()}
          />
        </>
      )}
    </View>
  );
};
