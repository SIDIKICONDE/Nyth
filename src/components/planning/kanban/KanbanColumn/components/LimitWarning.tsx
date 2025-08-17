import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { styles } from "../styles";
import { LimitWarningProps } from "../types";

export const LimitWarning: React.FC<LimitWarningProps> = ({
  color,
  maxTasks,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <View style={[styles.limitWarning, { backgroundColor: color + "20" }]}>
      <Ionicons name="warning" size={12} color={color} />
      <UIText
        style={[styles.limitWarningText, { color: color }]}
        size="xs"
        weight="medium"
      >
        Limite atteinte ({maxTasks} tâches)
      </UIText>
    </View>
  );
};
