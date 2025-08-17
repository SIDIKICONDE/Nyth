import React from "react";
import { View } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { TagsProps } from "../types";

export const CardTags: React.FC<TagsProps> = ({
  tags,
  cardColor,
  themeColors,
}) => {
  if (!tags.length) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.slice(0, 3).map((tag, index) => (
        <View
          key={index}
          style={[styles.tag, { backgroundColor: cardColor + "20" }]}
        >
          <UIText
            size="xs"
            weight="medium"
            color={cardColor}
            style={styles.tagText}
            numberOfLines={1}
          >
            {tag}
          </UIText>
        </View>
      ))}
      {tags.length > 3 && (
        <UIText
          size="xs"
          weight="medium"
          color={themeColors.textSecondary}
          style={styles.moreTagsText}
        >
          +{tags.length - 3}
        </UIText>
      )}
    </View>
  );
};
