import React from "react";
import { Text, View } from "react-native";
import { styles } from "../styles";
import { TaskCardTagsProps } from "../types";

export const TaskCardTags: React.FC<TaskCardTagsProps> = ({
  tags,
  themeColors,
  primaryColor,
}) => {
  if (!tags || tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.slice(0, 3).map((tag, index) => (
        <View
          key={index}
          style={[styles.tag, { backgroundColor: primaryColor + "20" }]}
        >
          <Text style={[styles.tagText, { color: primaryColor }]}>{tag}</Text>
        </View>
      ))}
      {tags.length > 3 && (
        <Text
          style={[styles.moreTagsText, { color: themeColors.textSecondary }]}
        >
          +{tags.length - 3}
        </Text>
      )}
    </View>
  );
};
