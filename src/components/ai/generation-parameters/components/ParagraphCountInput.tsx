import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface ParagraphCountInputProps {
  paragraphCount?: number;
  onParagraphCountChange: (count: number | undefined) => void;
  minParagraphs?: number;
  maxParagraphs?: number;
}

const PARAGRAPH_PRESETS = [1, 3, 5, 7, 10, 15];

export const ParagraphCountInput: React.FC<ParagraphCountInputProps> = ({
  paragraphCount,
  onParagraphCountChange,
  minParagraphs = 1,
  maxParagraphs = 50,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(
    paragraphCount?.toString() || ""
  );

  const handleInputChange = (text: string) => {
    setInputValue(text);

    if (text === "") {
      onParagraphCountChange(undefined);
      return;
    }

    const numValue = parseInt(text, 10);
    if (
      !isNaN(numValue) &&
      numValue >= minParagraphs &&
      numValue <= maxParagraphs
    ) {
      onParagraphCountChange(numValue);
    }
  };

  const handlePresetSelect = (preset: number) => {
    setInputValue(preset.toString());
    onParagraphCountChange(preset);
  };

  const isValidInput = () => {
    if (!inputValue) return true;
    const numValue = parseInt(inputValue, 10);
    return (
      !isNaN(numValue) && numValue >= minParagraphs && numValue <= maxParagraphs
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
        {t("ai.parameters.paragraphCount")}
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
        placeholder={t("ai.parameters.paragraphCountPlaceholder")}
        placeholderTextColor={currentTheme.colors.textSecondary}
        keyboardType="numeric"
        maxLength={2}
      />

      {/* Validation message */}
      {!isValidInput() && (
        <Text style={[tw`text-xs mt-1`, { color: "#ef4444" }]}>
          {t("ai.parameters.paragraphCountError", {
            min: minParagraphs,
            max: maxParagraphs,
          })}
        </Text>
      )}

      {/* Preset buttons */}
      <View style={tw`flex-row flex-wrap mt-2 gap-2`}>
        {PARAGRAPH_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            onPress={() => handlePresetSelect(preset)}
            style={[
              tw`px-3 py-1 rounded-full border`,
              {
                backgroundColor:
                  paragraphCount === preset
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
                    paragraphCount === preset
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
        {t("ai.parameters.paragraphCountHelper")}
      </Text>
    </View>
  );
};
