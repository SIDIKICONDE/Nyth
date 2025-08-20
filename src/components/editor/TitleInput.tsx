import React, { useState } from "react";
import { TextInput } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useHeadingFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";

interface TitleInputProps {
  title: string;
  onTitleChange: (title: string) => void;
}

export default function TitleInput({ title, onTitleChange }: TitleInputProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const headingStyle = useHeadingFont({ fontSize: 18, fontWeight: "600" });
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      style={[
        headingStyle,
        tw`py-2 px-3 mb-1 rounded-lg`,
        {
          color: currentTheme.colors.text,
          backgroundColor: currentTheme.colors.surface,
          borderRadius: 8,
          minHeight: isFocused ? 44 : 36,
          borderWidth: isFocused ? 1.5 : 1,
          borderColor: isFocused
            ? currentTheme.colors.primary
            : currentTheme.colors.border,
          shadowColor: isFocused ? currentTheme.colors.primary : "transparent",
          shadowOffset: { width: 0, height: isFocused ? 2 : 1 },
          shadowOpacity: isFocused ? 0.15 : 0.05,
          shadowRadius: isFocused ? 4 : 2,
          elevation: isFocused ? 3 : 1,
          transform: isFocused ? [{ scale: 1.01 }] : [{ scale: 1 }],
        },
      ]}
      placeholder={t("editor.titleInput.placeholder")}
      placeholderTextColor={currentTheme.colors.textMuted}
      value={title}
      onChangeText={onTitleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      returnKeyType="next"
      blurOnSubmit={false}
      autoCorrect={true}
      spellCheck={true}
      keyboardType="default"
      maxLength={100}
      selectTextOnFocus={true}
      editable={true}
    />
  );
}
