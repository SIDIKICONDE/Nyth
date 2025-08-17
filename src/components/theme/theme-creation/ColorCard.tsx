import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import ColorPickerAdvanced from "../../ui/ColorPickerAdvanced";
import { UIText } from "../../ui/Typography";
import { ColorCardProps } from "./types";

const ColorCard: React.FC<ColorCardProps> = ({
  title,
  description,
  icon,
  color,
  onColorChange,
  currentTheme,
}) => {
  const [isEditingHex, setIsEditingHex] = useState(false);
  const [hexValue, setHexValue] = useState(color);

  const handleHexSubmit = () => {
    // Validation basique du format hex
    const cleanHex = hexValue.startsWith("#") ? hexValue : `#${hexValue}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      onColorChange(cleanHex);
      setIsEditingHex(false);
    } else {
      // Revenir à la valeur précédente si invalide
      setHexValue(color);
      setIsEditingHex(false);
    }
  };

  const handleHexCancel = () => {
    setHexValue(color);
    setIsEditingHex(false);
  };

  // Mettre à jour la valeur locale quand la couleur change
  React.useEffect(() => {
    setHexValue(color);
  }, [color]);

  return (
    <View
      style={[
        tw`mb-3 rounded-xl border overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.card,
          borderColor: currentTheme.colors.border,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
    >
      {/* En-tête compact avec aperçu de couleur */}
      <View
        style={[
          tw`p-3 flex-row items-center justify-between`,
          { backgroundColor: color },
        ]}
      >
        <View
          style={[
            tw`w-8 h-8 rounded-full items-center justify-center`,
            { backgroundColor: "rgba(255, 255, 255, 0.25)" },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color="#ffffff"
          />
        </View>

        {/* Champ hex modifiable */}
        {isEditingHex ? (
          <View style={tw`flex-row items-center gap-2`}>
            <TextInput
              value={hexValue}
              onChangeText={setHexValue}
              style={[
                tw`px-2 py-1 rounded-md text-xs font-bold min-w-20`,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: "#000000",
                },
              ]}
              maxLength={7}
              autoCapitalize="characters"
              autoCorrect={false}
              selectTextOnFocus={true}
              onSubmitEditing={handleHexSubmit}
              onBlur={handleHexCancel}
              autoFocus={true}
            />
            <TouchableOpacity onPress={handleHexSubmit}>
              <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              tw`px-2 py-1 rounded-md`,
              { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            ]}
            onPress={() => setIsEditingHex(true)}
          >
            <UIText size="xs" weight="bold" style={[{ color: "#ffffff" }]}>
              {color.toUpperCase()}
            </UIText>
          </TouchableOpacity>
        )}
      </View>

      {/* Informations de la couleur */}
      <View style={tw`p-3`}>
        <UIText
          size="sm"
          weight="semibold"
          style={[tw`mb-1`, { color: currentTheme.colors.text }]}
        >
          {title}
        </UIText>
        <UIText
          size="xs"
          style={[tw`mb-3`, { color: currentTheme.colors.textSecondary }]}
        >
          {description}
        </UIText>

        {/* Sélecteur de couleur */}
        <View
          style={[
            tw`p-2 rounded-lg border`,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <ColorPickerAdvanced
            value={color}
            onChange={onColorChange}
            showLabel={false}
            showHex={true}
            showPreview={true}
            compact={true}
          />
        </View>
      </View>
    </View>
  );
};

export default ColorCard;
