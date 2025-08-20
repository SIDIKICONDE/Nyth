import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import ColorOption from "./ColorOption";
import { ExtendedColorPickerProps } from "../types";

const ExtendedColorPicker: React.FC<ExtendedColorPickerProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.grid, { flexDirection: "row" }]}>
          {colors.map((color, index) => (
            <ColorOption
              key={`extended-${index}-${color}`}
              color={color}
              isSelected={selectedColor === color}
              onSelect={() => onColorSelect(color)}
              size="medium"
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 12,
  },
  scrollContainer: {
    maxHeight: 160,
  },
  grid: {
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
});

export default ExtendedColorPicker;
