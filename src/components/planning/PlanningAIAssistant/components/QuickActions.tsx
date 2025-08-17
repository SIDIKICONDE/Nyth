import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS, LABELS } from "../constants";
import { styles } from "../styles";
import { QuickActionsProps } from "../types";

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onActionPress,
}) => {
  const { currentTheme } = useTheme();

  if (actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {LABELS.QUICK_ACTIONS_TITLE}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActions}
      >
        {actions.map((action: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  currentTheme.colors.primary + COLORS.PRIMARY_OPACITY_20,
              },
            ]}
            onPress={() => onActionPress(action)}
          >
            <Text
              style={[
                styles.actionButtonText,
                { color: currentTheme.colors.primary },
              ]}
            >
              {action}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
