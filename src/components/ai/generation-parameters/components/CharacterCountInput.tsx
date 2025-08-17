import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface CharacterCountInputProps {
  characterCount?: number;
  onCharacterCountChange: (count: number | undefined) => void;
  minCharacters?: number;
  maxCharacters?: number;
}

const CHARACTER_PRESETS = [
  { value: 280, label: "Twitter" },
  { value: 500, label: "LinkedIn" },
  { value: 1000, label: "Instagram" },
  { value: 2200, label: "TikTok" },
  { value: 5000, label: "Facebook" },
  { value: 10000, label: "YouTube" },
];

export const CharacterCountInput: React.FC<CharacterCountInputProps> = ({
  characterCount,
  onCharacterCountChange,
  minCharacters = 50,
  maxCharacters = 50000,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(
    characterCount?.toString() || ""
  );

  const handleInputChange = (text: string) => {
    setInputValue(text);

    if (text === "") {
      onCharacterCountChange(undefined);
      return;
    }

    const numValue = parseInt(text, 10);
    if (
      !isNaN(numValue) &&
      numValue >= minCharacters &&
      numValue <= maxCharacters
    ) {
      onCharacterCountChange(numValue);
    }
  };

  const handlePresetSelect = (preset: number) => {
    setInputValue(preset.toString());
    onCharacterCountChange(preset);
  };

  const isValidInput = () => {
    if (!inputValue) return true;
    const numValue = parseInt(inputValue, 10);
    return (
      !isNaN(numValue) && numValue >= minCharacters && numValue <= maxCharacters
    );
  };

  return (
    <View style={tw`mb-4`}>
      <Text
        style={[
          tw`text-sm font-medium mb-2`,
          { color: currentTheme.colors.text },
        ]}
      >
        {t("ai.parameters.characterCount")}
      </Text>

      {/* Input field */}
      <TextInput
        style={[
          tw`border rounded-lg px-3 py-2 text-base`,
          {
            borderColor: isValidInput()
              ? currentTheme.colors.border
              : "#ef4444",
            backgroundColor: currentTheme.colors.surface,
            color: currentTheme.colors.text,
          },
        ]}
        value={inputValue}
        onChangeText={handleInputChange}
        placeholder={t("ai.parameters.characterCountPlaceholder")}
        placeholderTextColor={currentTheme.colors.textSecondary}
        keyboardType="numeric"
        maxLength={5}
      />

      {/* Validation message */}
      {!isValidInput() && (
        <Text style={[tw`text-xs mt-1`, { color: "#ef4444" }]}>
          {t("ai.parameters.characterCountError", {
            min: minCharacters,
            max: maxCharacters,
          })}
        </Text>
      )}

      {/* Preset buttons */}
      <View style={tw`flex-row flex-wrap mt-2 gap-2`}>
        {CHARACTER_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            onPress={() => handlePresetSelect(preset.value)}
            style={[
              tw`px-3 py-1 rounded-full border`,
              {
                backgroundColor:
                  characterCount === preset.value
                    ? currentTheme.colors.primary
                    : "transparent",
                borderColor: currentTheme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-medium`,
                {
                  color:
                    characterCount === preset.value
                      ? "white"
                      : currentTheme.colors.primary,
                },
              ]}
            >
              {preset.value} ({preset.label})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Helper text */}
      <Text
        style={[tw`text-xs mt-2`, { color: currentTheme.colors.textSecondary }]}
      >
        {t("ai.parameters.characterCountHelper")}
      </Text>
    </View>
  );
};
