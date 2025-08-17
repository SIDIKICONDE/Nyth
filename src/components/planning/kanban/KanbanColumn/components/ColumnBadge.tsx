import React from "react";
import { View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { styles } from "../styles";
import { ColumnBadgeProps } from "../types";

export const ColumnBadge: React.FC<ColumnBadgeProps> = ({
  color,
  count,
  maxTasks,
}) => {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <UIText style={styles.badgeText} size="xs" weight="semibold" color="#fff">
        {maxTasks ? `${count}/${maxTasks}` : count}
      </UIText>
    </View>
  );
};
