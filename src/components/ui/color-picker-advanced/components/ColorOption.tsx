import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ColorOptionProps } from "../types";
import { getContrastColor } from "../utils/colorUtils";
import { useColorPickerTranslations } from "../hooks/useColorPickerTranslations";

const ColorOption: React.FC<ColorOptionProps> = ({
  color,
  isSelected,
  onSelect,
  compact = false,
  size = "medium",
}) => {
  const { getAccessibilityLabel } = useColorPickerTranslations();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { width: 32, height: 32, borderRadius: 16 };
      case "large":
        return { width: 48, height: 48, borderRadius: 24 };
      default:
        return { width: 40, height: 40, borderRadius: 20 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 22;
      default:
        return compact ? 16 : 20;
    }
  };

  const sizeStyles = getSizeStyles();
  const iconSize = getIconSize();
  const contrastColor = getContrastColor(color);

  return (
    <TouchableOpacity
      style={[
        styles.colorOption,
        sizeStyles,
        { backgroundColor: color },
        isSelected && styles.selectedOption,
        { marginRight: compact ? 6 : 10 },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
      accessibilityLabel={getAccessibilityLabel("colorOption", { color })}
      accessibilityState={{ selected: isSelected }}
      accessibilityRole="button"
    >
      {isSelected && (
        <MaterialCommunityIcons
          name="check"
          size={iconSize}
          color={contrastColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  colorOption: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ColorOption;
