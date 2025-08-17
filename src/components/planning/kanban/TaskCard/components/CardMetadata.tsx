import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { PRIORITY_COLORS } from "../constants";
import { styles } from "../styles";
import { MetadataProps } from "../types";
import { formatDate } from "../utils";

export const CardMetadata: React.FC<MetadataProps> = ({
  task,
  showEstimatedTime,
  themeColors,
}) => {
  return (
    <View style={styles.metadata}>
      <View style={styles.metadataRow}>
        <Ionicons
          name="flag"
          size={14}
          color={PRIORITY_COLORS[task.priority]}
        />
        <UIText
          size="xs"
          weight="medium"
          color={themeColors.textSecondary}
          style={styles.metadataText}
        >
          {task.priority}
        </UIText>
      </View>

      {showEstimatedTime && task.estimatedHours && (
        <View style={styles.metadataRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={themeColors.textSecondary}
          />
          <UIText
            size="xs"
            weight="medium"
            color={themeColors.textSecondary}
            style={styles.metadataText}
          >
            {task.estimatedHours}h
          </UIText>
        </View>
      )}

      {task.dueDate && (
        <View style={styles.metadataRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={themeColors.textSecondary}
          />
          <UIText
            size="xs"
            weight="medium"
            color={themeColors.textSecondary}
            style={styles.metadataText}
          >
            {formatDate(task.dueDate)}
          </UIText>
        </View>
      )}
    </View>
  );
};
