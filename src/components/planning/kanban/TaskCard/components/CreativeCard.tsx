import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { PRIORITY_COLORS, STATUS_COLORS } from "../constants";
import { styles } from "../styles";
import { CreativeCardProps } from "../types";
import { formatStatus, getCardOpacity, getCardTransform } from "../utils";

export const CreativeCard: React.FC<CreativeCardProps> = ({
  task,
  onPress,
  onEdit,
  onLongPress,
  isDragging = false,
  customStyles,
  cardColor,
  cardIcon,
  customization,
  themeColors,
}) => {
  const { showEstimatedTime } = customization;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.creativeCard,
        {
          backgroundColor: cardColor + "10",
          borderColor: cardColor,
          borderWidth: 2,
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
      <View style={styles.creativeHeader}>
        <View style={[styles.iconContainer, { backgroundColor: cardColor }]}>
          <UIText size={16} color="white" style={styles.creativeIcon}>
            {cardIcon}
          </UIText>
        </View>
        <View style={styles.creativeInfo}>
          <UIText
            size="sm"
            weight="semibold"
            color={themeColors.text}
            style={styles.creativeTitle}
            numberOfLines={2}
          >
            {task.title}
          </UIText>
          <View style={styles.creativeStatus}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: STATUS_COLORS[task.status] },
              ]}
            >
              <UIText
                size="xs"
                weight="semibold"
                color="white"
                style={styles.statusBadgeText}
              >
                {formatStatus(task.status)}
              </UIText>
            </View>
          </View>
        </View>
      </View>

      {task.description && (
        <UIText
          size="xs"
          color={themeColors.textSecondary}
          style={styles.creativeDescription}
          numberOfLines={2}
        >
          {task.description}
        </UIText>
      )}

      <View style={styles.creativeFooter}>
        <View style={styles.creativeMetrics}>
          {showEstimatedTime && task.estimatedHours && (
            <View style={styles.metric}>
              <Ionicons name="time" size={12} color={cardColor} />
              <UIText
                size="xs"
                weight="medium"
                color={cardColor}
                style={styles.metricText}
              >
                {task.estimatedHours}h
              </UIText>
            </View>
          )}
          <View style={styles.metric}>
            <Ionicons
              name="flag"
              size={12}
              color={PRIORITY_COLORS[task.priority]}
            />
            <UIText
              size="xs"
              weight="medium"
              color={PRIORITY_COLORS[task.priority]}
              style={styles.metricText}
            >
              {task.priority}
            </UIText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
