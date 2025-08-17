import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { COLORS } from "../constants";
import { styles } from "../styles";
import { InsightCardProps } from "../types";

export const InsightCard: React.FC<InsightCardProps> = ({ text }) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor:
            currentTheme.colors.primary + COLORS.PRIMARY_OPACITY_10,
          borderLeftColor: COLORS.PRIMARY_BORDER,
        },
      ]}
    >
      <UIText
        size="sm"
        style={[styles.insightText, { color: currentTheme.colors.text }]}
      >
        {text}
      </UIText>
    </View>
  );
};
