import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  DailyStats,
  userActivityService,
} from "../../../../services/userActivityService";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('UserActivityTab');

export const UserActivityTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dailyStats = await userActivityService.getDailyStats(startDate, endDate);
      setStats(dailyStats);
    } catch (err) {
      logger.error("Erreur chargement stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  const getTotalStats = () => {
    return stats.reduce(
      (acc, day) => ({
        totalAppOpens: acc.totalAppOpens + day.appOpens,
        totalLogins: acc.totalLogins + day.logins,
        uniqueUsers: acc.uniqueUsers + day.uniqueUsers,
      }),
      { totalAppOpens: 0, totalLogins: 0, uniqueUsers: 0 }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  const totals = getTotalStats();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Résumé des 7 derniers jours */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Résumé des 7 derniers jours
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {totals.totalAppOpens}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Ouvertures d'app
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {totals.totalLogins}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Connexions
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {totals.uniqueUsers}
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}
            >
              Utilisateurs actifs
            </Text>
          </View>
        </View>
      </View>

      {/* Statistiques quotidiennes */}
      <View
        style={[styles.dailyStatsCard, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Activité quotidienne
        </Text>
        {stats.map((day, index) => (
          <View
            key={day.date}
            style={[
              styles.dayRow,
              index < stats.length - 1 && styles.dayRowBorder,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.dayDate, { color: colors.text }]}>
              {formatDate(day.date)}
            </Text>
            <View style={styles.dayStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {day.appOpens}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  ouvertures
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {day.logins}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  connexions
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {day.uniqueUsers}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  utilisateurs
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Graphique simple avec barres */}
      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Tendance des ouvertures
        </Text>
        <View style={styles.chart}>
          {stats.map((day) => {
            const maxOpens = Math.max(...stats.map((s) => s.appOpens)) || 1;
            const height = (day.appOpens / maxOpens) * 100;
            return (
              <View key={day.date} style={styles.chartBar}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
                <Text
                  style={[styles.chartLabel, { color: colors.textSecondary }]}
                >
                  {new Date(day.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  dailyStatsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  chartCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "60%",
    borderRadius: 4,
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 10,
  },
});
