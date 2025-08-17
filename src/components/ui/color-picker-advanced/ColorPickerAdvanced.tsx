import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { UIText } from "../Typography";
import { ColorPalette, ColorPreview } from "./components";
import { useColorPicker } from "./hooks/useColorPicker";
import { useColorPickerTranslations } from "./hooks/useColorPickerTranslations";
import { ColorPickerAdvancedProps } from "./types";
import { DEFAULT_PRESET_COLORS } from "./utils/colorConstants";

const ColorPickerAdvanced: React.FC<ColorPickerAdvancedProps> = ({
  label,
  value,
  onChange,
  showLabel = true,
  showHex = true,
  showPreview = true,
  presetColors = DEFAULT_PRESET_COLORS,
  compact = false,
}) => {
  const { getColorLabel } = useColorPickerTranslations();
  const { currentTheme } = useTheme();

  const defaultLabel = label || getColorLabel("color");

  const { selectedColor, handleColorSelect, handleHexChange } = useColorPicker({
    initialColor: value,
    onChange,
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      {showLabel && (
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.text}
          style={styles.label}
        >
          {defaultLabel}
        </UIText>
      )}

      {showPreview && (
        <ColorPreview
          color={selectedColor}
          onHexChange={handleHexChange}
          showHex={showHex}
        />
      )}

      <ColorPalette
        colors={presetColors}
        selectedColor={selectedColor}
        onColorSelect={handleColorSelect}
        compact={compact}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    // fontSize et fontWeight supprimés - gérés par UIText
    marginBottom: 8,
  },
});

export default ColorPickerAdvanced;
