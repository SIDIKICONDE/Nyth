import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { useColorPickerTranslations } from "../hooks/useColorPickerTranslations";
import { ColorPreviewProps } from "../types";

const ColorPreview: React.FC<ColorPreviewProps> = ({
  color,
  onHexChange,
  showHex,
}) => {
  const { labels, getAccessibilityLabel } = useColorPickerTranslations();
  const { currentTheme } = useTheme();
  const { code } = useCentralizedFont(); // Utiliser la police code pour le style monospace

  return (
    <View style={tw`flex-row items-center mb-3`}>
      {/* Aperçu de la couleur */}
      <View
        style={[
          styles.colorPreview,
          {
            backgroundColor: color,
            marginRight: 12,
          },
        ]}
      />

      {/* Champ de saisie hexadécimale */}
      {showHex && (
        <TextInput
          value={color}
          onChangeText={onHexChange}
          style={[
            styles.hexInput,
            code, // Utiliser la police centralisée pour le code
            {
              color: currentTheme.colors.text,
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            },
          ]}
          placeholder={labels.hexInput || "#000000"}
          placeholderTextColor={currentTheme.colors.textMuted}
          maxLength={7}
          autoCapitalize="characters"
          autoCorrect={false}
          selectTextOnFocus={true}
          keyboardType="default"
          accessibilityLabel={getAccessibilityLabel("hexInput")}
          accessibilityHint={labels.enterHex}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  hexInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    // fontSize, fontFamily et fontWeight supprimés - gérés par useCentralizedFont
    minWidth: 100,
  },
});

export default ColorPreview;
