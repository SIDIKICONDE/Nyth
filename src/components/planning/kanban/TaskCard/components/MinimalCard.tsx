import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { STATUS_COLORS } from "../constants";
import { styles } from "../styles";
import { MinimalCardProps } from "../types";
import { formatStatus, getCardOpacity, getCardTransform } from "../utils";

export const MinimalCard: React.FC<MinimalCardProps> = ({
  task,
  onPress,
  onLongPress,
  isDragging = false,
  customStyles,
  cardColor,
  cardIcon,
  themeColors,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.minimalCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderLeftColor: cardColor,
          transform: getCardTransform(isDragging),
          opacity: getCardOpacity(isDragging),
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: customStyles?.shadowOpacity ?? 0.1,
          shadowRadius: 3,
          elevation: customStyles?.elevation ?? 3,
        },
        customStyles,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <UIText size={16} style={styles.cardIcon}>
          {cardIcon}
        </UIText>
        <UIText
          size="sm"
          weight="medium"
          color={themeColors.text}
          style={styles.cardTitle}
          numberOfLines={1}
        >
          {task.title}
        </UIText>
      </View>

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: STATUS_COLORS[task.status] },
          ]}
        />
        <UIText
          size="xs"
          weight="medium"
          color={themeColors.textSecondary}
          style={styles.statusText}
        >
          {formatStatus(task.status)}
        </UIText>
      </View>
    </TouchableOpacity>
  );
};
