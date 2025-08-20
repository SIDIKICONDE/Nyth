import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { PRIORITY_COLORS } from "../constants";
import { styles } from "../styles";
import { DefaultCardProps } from "../types";
import { getCardOpacity, getCardTransform } from "../utils";

import { createOptimizedLogger } from '../../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('CompactCard');

export const CompactCard: React.FC<DefaultCardProps> = ({
  task,
  onPress,
  onLongPress,
  isDragging = false,
  customStyles,
  cardIcon,
  themeColors,
}) => {
  logger.debug("📝 CompactCard rendu pour:", task.title);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderLeftWidth: 4,
          borderLeftColor: PRIORITY_COLORS[task.priority],
          transform: getCardTransform(isDragging),
          opacity: getCardOpacity(isDragging),
          borderRadius: 12,
          padding: 12,
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <UIText size={16}>{cardIcon}</UIText>

        <View style={{ flex: 1 }}>
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

          <View style={{ alignSelf: "flex-start" }}>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: PRIORITY_COLORS[task.priority],
              }}
            >
              <UIText
                size="xs"
                weight="semibold"
                color="white"
                style={{
                  textTransform: "uppercase",
                }}
              >
                {task.status.replace("_", " ")}
              </UIText>
            </View>
          </View>
        </View>

        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: PRIORITY_COLORS[task.priority],
          }}
        />
      </View>

      {task.estimatedHours && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingTop: 0,
          }}
        >
          <UIText size={10}>⏲️</UIText>
          <UIText size="xs" weight="medium" color={themeColors.textSecondary}>
            {task.estimatedHours}h
          </UIText>
        </View>
      )}
    </TouchableOpacity>
  );
};
