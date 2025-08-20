import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "react-native-slider-x";
import { useTheme } from "../../../../contexts/ThemeContext";

interface SliderControlProps {
  label: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 0.1,
  onValueChange,
  formatValue,
}) => {
  const { currentTheme } = useTheme();
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: currentTheme.colors.text }]}>{label}</Text>
        <Text
          style={[
            styles.sliderValue,
            { color: currentTheme.colors.accent, borderColor: currentTheme.colors.accent },
          ]}
        >
          {formatValue ? formatValue(value) : value.toFixed(1)}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        value={value}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={currentTheme.colors.primary}
        maximumTrackTintColor={currentTheme.colors.border}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    marginVertical: 20,
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  slider: {
    width: "100%",
    height: 44,
  },
});
