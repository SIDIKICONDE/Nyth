import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { PRIORITY_COLORS } from "../constants";
import { styles } from "../styles";
import { DefaultCardProps } from "../types";
import { getCardOpacity, getCardTransform } from "../utils";

export const KanbanCard: React.FC<DefaultCardProps> = ({
  task,
  onPress,
  onLongPress,
  isDragging = false,
  customStyles,
  cardIcon,
  cardColor,
  customization,
  themeColors,
}) => {
  const { showEstimatedTime } = customization;

  const getStatusIcon = () => {
    switch (task.status) {
      case "todo":
        return "⭕";
      case "in_progress":
        return "🔄";
      case "review":
        return "👀";
      case "completed":
        return "✅";
      default:
        return "📝";
    }
  };

  const getPriorityLevel = () => {
    switch (task.priority) {
      case "low":
        return 1;
      case "medium":
        return 2;
      case "high":
        return 3;
      default:
        return 1;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderLeftWidth: 4,
          borderLeftColor: cardColor,
          transform: getCardTransform(isDragging),
          opacity: getCardOpacity(isDragging),
          borderRadius: 12,
          padding: 12,
        },
        customStyles,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      {/* En-tête avec statut */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <UIText size={16}>{cardIcon}</UIText>
          <UIText size="xs">{getStatusIcon()}</UIText>
        </View>

        {/* Indicateurs de priorité */}
        <View style={{ flexDirection: "row", gap: 2 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <View
              key={i}
              style={{
                width: 4,
                height: 12,
                borderRadius: 2,
                backgroundColor:
                  i < getPriorityLevel()
                    ? PRIORITY_COLORS[task.priority]
                    : `${themeColors.border}40`,
              }}
            />
          ))}
        </View>
      </View>

      {/* Titre */}
      <UIText
        size="sm"
        weight="semibold"
        color={themeColors.text}
        style={[
          styles.cardTitle,
          {
            marginBottom: 4,
            lineHeight: 16,
          },
        ]}
        numberOfLines={2}
      >
        {task.title}
      </UIText>

      {/* Description courte */}
      {task.description && (
        <UIText
          size="xs"
          color={themeColors.textSecondary}
          style={[
            styles.description,
            {
              marginBottom: 8,
              lineHeight: 16,
            },
          ]}
          numberOfLines={1}
        >
          {task.description}
        </UIText>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 8,
          }}
        >
          {task.tags.slice(0, 2).map((tag, index) => (
            <View
              key={index}
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: `${cardColor}15`,
              }}
            >
              <UIText size="xs" weight="medium" color={cardColor}>
                {tag}
              </UIText>
            </View>
          ))}
          {task.tags.length > 2 && (
            <UIText
              size="xs"
              color={themeColors.textSecondary}
              style={{
                fontStyle: "italic",
                paddingTop: 2,
              }}
            >
              +{task.tags.length - 2}
            </UIText>
          )}
        </View>
      )}

      {/* Footer */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 2,
          marginTop: 4,
        }}
      >
        <UIText
          size="xs"
          weight="medium"
          color={themeColors.textSecondary}
          style={{
            textTransform: "uppercase",
          }}
        >
          {task.status.replace("_", " ")}
        </UIText>

        {showEstimatedTime && task.estimatedHours && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <UIText size={8}>⏲️</UIText>
            <UIText size="xs" weight="medium" color={themeColors.textSecondary}>
              {task.estimatedHours}h
            </UIText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
