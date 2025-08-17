import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../../components/ui/Typography";

interface ColorPickerProps {
  title: string;
  options: string[];
  selectedColor: string | undefined;
  onSelect: (color: string) => void;
  checkMode?: "auto" | "white";
}

export function ColorPicker({
  title,
  options,
  selectedColor,
  onSelect,
  checkMode = "auto",
}: ColorPickerProps): React.JSX.Element {
  const { currentTheme } = useTheme();
  const getCheckColor = (color: string): string => {
    if (checkMode === "white") return "#FFF";
    return color.toUpperCase() === "#FFFFFF" ? "#000" : "#FFF";
  };
  return (
    <View style={tw`mb-5`}>
      <UIText
        size="sm"
        style={[tw`mb-2`, { color: currentTheme.colors.textSecondary }]}
      >
        {title}
      </UIText>
      <View style={tw`flex-row justify-between`}>
        {options.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              tw`w-10 h-10 rounded-full border-2`,
              {
                backgroundColor: color,
                borderColor:
                  selectedColor === color
                    ? currentTheme.colors.accent
                    : "transparent",
              },
            ]}
            onPress={() => onSelect(color)}
          >
            {selectedColor === color && (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={getCheckColor(color)}
                style={tw`m-auto`}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

interface TextColorPickerProps {
  selectedColor: string | undefined;
  onSelect: (color: string) => void;
}

export function TextColorPicker({
  selectedColor,
  onSelect,
}: TextColorPickerProps): React.JSX.Element {
  return (
    <ColorPicker
      title="Texte"
      options={[
        "#FFFFFF",
        "#000000",
        "#FF4444",
        "#44FF44",
        "#4444FF",
        "#FFFF44",
      ]}
      selectedColor={selectedColor}
      onSelect={onSelect}
      checkMode="auto"
    />
  );
}

interface BackgroundColorPickerProps {
  selectedColor: string | undefined;
  onSelect: (color: string) => void;
}

export function BackgroundColorPicker({
  selectedColor,
  onSelect,
}: BackgroundColorPickerProps): React.JSX.Element {
  return (
    <ColorPicker
      title="Fond"
      options={[
        "#000000",
        "#333333",
        "#666666",
        "#1E3A8A",
        "#7C2D12",
        "#059669",
      ]}
      selectedColor={selectedColor}
      onSelect={onSelect}
      checkMode="white"
    />
  );
}

interface IconColorPickerProps {
  selectedColor: string | undefined;
  onSelect: (color: string) => void;
  title: string;
}

export function IconColorPicker({
  selectedColor,
  onSelect,
  title,
}: IconColorPickerProps): React.JSX.Element {
  return (
    <ColorPicker
      title={title}
      options={[
        "#FFFFFF",
        "#A3A3A3",
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
      ]}
      selectedColor={selectedColor}
      onSelect={onSelect}
      checkMode="auto"
    />
  );
}
