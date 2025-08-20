import React from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { View, Platform } from "react-native";
import { HeadingText, UIText } from "../../../../../components/ui/Typography";
import { styles } from "../styles";
import { ColumnHeaderProps } from "../types";
import { ColumnBadge } from "./ColumnBadge";
import { ColumnMenu } from "./ColumnMenu";

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  title,
  color,
  description,
  tasksCount,
  maxTasks,
  onColumnEdit,
  onColumnDelete,
  onCycleColor,
  availableColors,
  onSelectColor,
  themeColors,
  icon,
  borderStyle = "solid",
}) => {
  const isGradient = borderStyle === "gradient";
  const computedBorderStyle: "solid" | "dashed" =
    Platform.OS === "ios"
      ? "solid"
      : borderStyle === "dashed"
      ? "dashed"
      : "solid";

  const gradientColors = [color, `${color}66`];

  return (
    <View
      style={[
        styles.header,
        {
          borderLeftColor: isGradient ? "transparent" : color,
          borderStyle: isGradient ? undefined : computedBorderStyle,
          borderLeftWidth: isGradient ? 0 : 4,
        },
      ]}
    >
      {isGradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 12,
          }}
        />
      )}

      <View style={styles.headerLeft}>
        <HeadingText
          style={[styles.title, { color: themeColors.text }]}
          size="sm"
          weight="semibold"
        >
          {title}
        </HeadingText>
        {description && (
          <UIText
            style={[styles.description, { color: themeColors.textSecondary }]}
            size="xs"
          >
            {description}
          </UIText>
        )}
      </View>

      <View style={styles.headerActions}>
        {icon ? (
          <Ionicons name={icon} size={16} color={themeColors.textSecondary} />
        ) : null}
        <ColumnBadge color={color} count={tasksCount} maxTasks={maxTasks} />
        <ColumnMenu
          onColumnEdit={onColumnEdit}
          onColumnDelete={onColumnDelete}
          onCycleColor={onCycleColor}
          availableColors={availableColors}
          onSelectColor={onSelectColor}
          themeColors={themeColors}
        />
      </View>
    </View>
  );
};
