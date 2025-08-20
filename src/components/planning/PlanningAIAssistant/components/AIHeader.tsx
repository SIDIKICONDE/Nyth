import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { H4 } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { ICONS, LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { AIHeaderProps } from "../types";

export const AIHeader: React.FC<AIHeaderProps> = ({ isExpanded, onToggle }) => {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.header}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.headerLeft}>
        <Ionicons
          name={ICONS.HEADER}
          size={UI_CONFIG.HEADER_ICON_SIZE}
          color={currentTheme.colors.primary}
        />
        <H4 style={[styles.headerTitle, { color: currentTheme.colors.text }]}>
          {LABELS.HEADER_TITLE}
        </H4>
      </View>
      <Ionicons
        name={isExpanded ? ICONS.CHEVRON_UP : ICONS.CHEVRON_DOWN}
        size={UI_CONFIG.CHEVRON_SIZE}
        color={currentTheme.colors.textSecondary}
      />
    </TouchableOpacity>
  );
};
