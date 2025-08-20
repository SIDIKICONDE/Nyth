import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { AdminStats } from "../../../types";
import { StatCard } from "./StatCard";

interface StatsTabProps {
  stats: AdminStats | null;
}

export const StatsTab: React.FC<StatsTabProps> = React.memo(({ stats }) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { t } = useTranslation();

  const statCards = useMemo(
    () => [
      {
        icon: "people" as const,
        iconColor: colors.primary,
        value: stats?.totalUsers || 0,
        label: t("admin.stats.users", "Utilisateurs"),
      },
      {
        icon: "shield" as const,
        iconColor: colors.primary,
        value: stats?.totalAdmins || 0,
        label: t("admin.stats.admins", "Admins"),
      },
      {
        icon: "today" as const,
        iconColor: colors.primary,
        value: stats?.activeToday || 0,
        label: t("admin.stats.activeToday", "Actifs aujourd'hui"),
      },
      {
        icon: "document-text" as const,
        iconColor: colors.primary,
        value: stats?.totalScripts || 0,
        label: t("admin.stats.scripts", "Scripts créés"),
      },
      {
        icon: "videocam" as const,
        iconColor: colors.primary,
        value: stats?.totalRecordings || 0,
        label: t("admin.stats.recordings", "Enregistrements"),
      },
      {
        icon: "card" as const,
        iconColor: colors.warning,
        value: stats?.activeSubscriptions || 0,
        label: "Abonnements actifs",
      },
      {
        icon: "diamond" as const,
        iconColor: colors.warning,
        value: stats?.premiumUsers || 0,
        label: "Utilisateurs Premium",
      },
      {
        icon: "cash" as const,
        iconColor: colors.success,
        value: `${stats?.monthlyRevenue?.toFixed(2) || 0}€`,
        label: "Revenus mensuels",
      },
    ],
    [stats, colors, t]
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsContainer}>
        {statCards.map((card, index) => (
          <StatCard key={`${card.label}-${index}`} {...card} />
        ))}
      </View>
    </ScrollView>
  );
});

StatsTab.displayName = "StatsTab";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});
