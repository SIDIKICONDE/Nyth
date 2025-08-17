import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { ActivityItem as ActivityItemType } from "../../../types";
import { formatDate } from "../../../utils/dateUtils";

interface ActivityItemProps {
  activity: ActivityItemType;
  userName?: string;
  onPress?: () => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  userName,
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const getActivityIcon = () => {
    switch (activity.type) {
      case "script":
        return { name: "document-text", color: colors.primary };
      case "recording":
        return { name: "videocam", color: colors.error };
      default:
        return { name: "pulse", color: colors.textSecondary };
    }
  };

  const icon = getActivityIcon();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: icon.color + "15" }]}
      >
        <Ionicons name={icon.name as any} size={24} color={icon.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {activity.title || "Sans titre"}
        </Text>

        <View style={styles.metaContainer}>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Par {userName || "Utilisateur"}
          </Text>
          <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {formatDate(activity.createdAt)}
          </Text>
        </View>

        {activity.description && (
          <Text
            style={[styles.description, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {activity.description}
          </Text>
        )}
      </View>

      <View style={styles.typeContainer}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor:
                activity.type === "script"
                  ? colors.primary + "20"
                  : colors.error + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              {
                color:
                  activity.type === "script" ? colors.primary : colors.error,
              },
            ]}
          >
            {activity.type === "script" ? "Script" : "Vidéo"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  typeContainer: {
    marginLeft: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
