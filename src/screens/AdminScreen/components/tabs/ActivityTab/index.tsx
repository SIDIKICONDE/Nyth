import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ActivityItem as ActivityItemType } from "../../../types";
import { UserProfile } from "../../../../../types/user";
import { ActivityItem } from "./ActivityItem";

interface ActivityTabProps {
  activities: ActivityItemType[];
  users: UserProfile[];
}

type FilterType = "all" | "script" | "recording";

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activities,
  users,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  const getUserName = (userId?: string) => {
    if (!userId) return "Utilisateur inconnu";
    const user = users.find((u) => u.uid === userId);
    return user?.displayName || user?.email || "Utilisateur";
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === "all" ? colors.background : colors.text },
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "script" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter("script")}
        >
          <Ionicons
            name="document-text"
            size={16}
            color={filter === "script" ? colors.background : colors.text}
          />
          <Text
            style={[
              styles.filterText,
              { color: filter === "script" ? colors.background : colors.text },
            ]}
          >
            Scripts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "recording" && { backgroundColor: colors.primary },
          ]}
          onPress={() => setFilter("recording")}
        >
          <Ionicons
            name="videocam"
            size={16}
            color={filter === "recording" ? colors.background : colors.text}
          />
          <Text
            style={[
              styles.filterText,
              {
                color: filter === "recording" ? colors.background : colors.text,
              },
            ]}
          >
            Vidéos
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.statsContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {activities.filter((a) => a.type === "script").length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Scripts
          </Text>
        </View>

        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {activities.filter((a) => a.type === "recording").length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Vidéos
          </Text>
        </View>

        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {activities.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pulse-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filter === "all"
          ? "Aucune activité récente"
          : filter === "script"
          ? "Aucun script récent"
          : "Aucune vidéo récente"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityItem activity={item} userName={getUserName(item.userId)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
