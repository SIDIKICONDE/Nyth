import React from "react";
import { TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { DetailedCardProps } from "../types";
import { getCardOpacity, getCardTransform } from "../utils";
import { CardMetadata } from "./CardMetadata";
import { CardTags } from "./CardTags";
import { ProgressBar } from "./ProgressBar";

export const DetailedCard: React.FC<DetailedCardProps> = ({
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
  const { showEstimatedTime, showProgress } = customization;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.detailedCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
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
      {/* Header avec couleur personnalisée */}
      <View style={[styles.detailedHeader, { backgroundColor: cardColor }]}>
        <UIText size={16} color="white" style={styles.detailedIcon}>
          {cardIcon}
        </UIText>
        <UIText
          size="sm"
          weight="semibold"
          color="white"
          style={styles.detailedTitle}
          numberOfLines={2}
        >
          {task.title}
        </UIText>
      </View>

      {/* Contenu */}
      <View style={styles.detailedContent}>
        {task.description && (
          <UIText
            size="xs"
            color={themeColors.textSecondary}
            style={styles.description}
            numberOfLines={2}
          >
            {task.description}
          </UIText>
        )}

        {/* Métadonnées */}
        <CardMetadata
          task={task}
          showEstimatedTime={showEstimatedTime}
          themeColors={themeColors}
        />

        {/* Progress bar */}
        {showProgress && (
          <ProgressBar
            status={task.status}
            cardColor={cardColor}
            themeColors={themeColors}
          />
        )}

        {/* Tags */}
        <CardTags
          tags={task.tags}
          cardColor={cardColor}
          themeColors={themeColors}
        />
      </View>
    </TouchableOpacity>
  );
};
