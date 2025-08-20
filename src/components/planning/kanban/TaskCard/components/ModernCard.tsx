import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { PRIORITY_COLORS } from "../constants";
import { styles } from "../styles";
import { DefaultCardProps } from "../types";
import { getCardOpacity, getCardTransform } from "../utils";

import { createOptimizedLogger } from '../../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ModernCard');

export const ModernCard: React.FC<DefaultCardProps> = ({
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

  // Couleur par défaut si cardColor est vide
  const actualCardColor = cardColor || themeColors.primary;

  logger.debug("✨ ModernCard rendu pour:", task.title);
  logger.debug("✨ cardColor reçu:", cardColor);
  logger.debug("✨ actualCardColor utilisé:", actualCardColor);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          borderTopWidth: 4,
          borderTopColor: cardColor,
          transform: getCardTransform(isDragging),
          opacity: getCardOpacity(isDragging),
          borderRadius: 12,
          padding: 12,
          shadowColor: cardColor,
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: customStyles?.shadowOpacity ?? 0.15,
          shadowRadius: 8,
          elevation: customStyles?.elevation ?? 4,
        },
        customStyles,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      {/* En-tête moderne */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: cardColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UIText size={16} color="white">
            {cardIcon}
          </UIText>
        </View>

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

          {/* Badge moderne */}
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: `${cardColor}20`,
              alignSelf: "flex-start",
            }}
          >
            <UIText
              size="xs"
              weight="semibold"
              color={cardColor}
              style={{
                textTransform: "uppercase",
              }}
            >
              {task.status.replace("_", " ")}
            </UIText>
          </View>
        </View>
      </View>

      {/* Description */}
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
          numberOfLines={2}
        >
          {task.description}
        </UIText>
      )}

      {/* Footer moderne */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 4,
          marginTop: 6,
        }}
      >
        {/* Priorité compacte */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: PRIORITY_COLORS[task.priority],
            }}
          />
          <UIText
            size="xs"
            weight="medium"
            color={themeColors.textSecondary}
            style={{
              textTransform: "uppercase",
            }}
          >
            {task.priority}
          </UIText>
        </View>

        {/* Temps estimé */}
        {showEstimatedTime && task.estimatedHours && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <UIText size={8}>⏱️</UIText>
            <UIText size="xs" weight="medium" color={themeColors.textSecondary}>
              {task.estimatedHours}h
            </UIText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
