import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS, ICONS, LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { SuggestionsProps } from "../types";

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onSuggestionPress,
}) => {
  const { currentTheme } = useTheme();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {LABELS.SUGGESTIONS_TITLE}
      </Text>
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.suggestionCard,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: COLORS.BORDER_COLOR,
            },
          ]}
          onPress={() => onSuggestionPress(suggestion)}
        >
          <Text
            style={[styles.suggestionText, { color: currentTheme.colors.text }]}
          >
            {suggestion}
          </Text>
          <Ionicons
            name={ICONS.CHEVRON_FORWARD}
            size={UI_CONFIG.SUGGESTION_CHEVRON_SIZE}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
