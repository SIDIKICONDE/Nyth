import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { styles } from "../styles";
import { CategorySeparatorProps } from "../types";

export const CategorySeparator: React.FC<CategorySeparatorProps> = ({
  title,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        styles.separator,
        { backgroundColor: currentTheme.colors.border },
      ]}
    >
      <Text
        style={[
          styles.separatorText,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {title}
      </Text>
    </View>
  );
};
