import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface WordCountInputProps {
  wordCount?: number;
  onWordCountChange: (count: number | undefined) => void;
  minWords?: number;
  maxWords?: number;
}

const WORD_PRESETS = [50, 100, 200, 300, 500, 1000];

export const WordCountInput: React.FC<WordCountInputProps> = ({
  wordCount,
  onWordCountChange,
  minWords = 10,
  maxWords = 2000,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(wordCount?.toString() || "");

  const handleInputChange = (text: string) => {
    setInputValue(text);

    if (text === "") {
      onWordCountChange(undefined);
      return;
    }

    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= minWords && numValue <= maxWords) {
      onWordCountChange(numValue);
    }
  };

  const handlePresetSelect = (preset: number) => {
    setInputValue(preset.toString());
    onWordCountChange(preset);
  };

  const isValidInput = () => {
    if (!inputValue) return true;
    const numValue = parseInt(inputValue, 10);
    return !isNaN(numValue) && numValue >= minWords && numValue <= maxWords;
  };

  return (
    <View style={tw`mb-4`}>
      <Text
        style={[
          tw`text-sm font-medium mb-2`,
          { color: currentTheme.colors.text },
        ]}
      >
        {t("ai.parameters.wordCount")}
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
        placeholder={t("ai.parameters.wordCountPlaceholder")}
        placeholderTextColor={currentTheme.colors.textSecondary}
        keyboardType="numeric"
        maxLength={4}
      />

      {/* Validation message */}
      {!isValidInput() && (
        <Text style={[tw`text-xs mt-1`, { color: "#ef4444" }]}>
          {t("ai.parameters.wordCountError", { min: minWords, max: maxWords })}
        </Text>
      )}

      {/* Preset buttons */}
      <View style={tw`flex-row flex-wrap mt-2 gap-2`}>
        {WORD_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            onPress={() => handlePresetSelect(preset)}
            style={[
              tw`px-3 py-1 rounded-full border`,
              {
                backgroundColor:
                  wordCount === preset
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
                    wordCount === preset
                      ? "white"
                      : currentTheme.colors.primary,
                },
              ]}
            >
              {preset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Helper text */}
      <Text
        style={[tw`text-xs mt-2`, { color: currentTheme.colors.textSecondary }]}
      >
        {t("ai.parameters.wordCountHelper")}
      </Text>
    </View>
  );
};
