import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  placeholder: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder,
}) => {
  const { currentTheme } = useTheme();

  return (
    <TextInput
      style={[
        styles.searchInput,
        {
          backgroundColor: currentTheme.colors.background,
          borderColor: currentTheme.colors.border,
          color: currentTheme.colors.text,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={currentTheme.colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      autoFocus
      returnKeyType="search"
      onSubmitEditing={onSubmitEditing}
    />
  );
};

const styles = StyleSheet.create({
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    minHeight: 40,
  },
});
