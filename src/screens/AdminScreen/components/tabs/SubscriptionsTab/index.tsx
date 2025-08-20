import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { UserProfile } from "../../../../../types/user";
import { SubscriptionItem } from "../../../types";
import { formatDate } from "../../../utils/dateUtils";

interface SubscriptionsTabProps {
  subscriptions: SubscriptionItem[];
  users: UserProfile[];
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = React.memo(
  ({ subscriptions, users }) => {
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    // Mémoriser la map des utilisateurs pour un accès rapide
    const usersMap = useMemo(() => {
      const map = new Map<string, UserProfile>();
      users.forEach((user) => {
        map.set(user.uid, user);
      });
      return map;
    }, [users]);

    const getUser = (userId: string) => {
      return usersMap.get(userId);
    };

    const getPlanColor = (plan: string) => {
      switch (plan) {
        case "premium":
          return colors.warning;
        case "pro":
          return colors.primary;
        case "basic":
          return colors.success;
        default:
          return colors.textSecondary;
      }
    };

    const getPlanIcon = (plan: string) => {
      switch (plan) {
        case "premium":
          return "diamond";
        case "pro":
          return "star";
        case "basic":
          return "checkmark-circle";
        default:
          return "help-circle";
      }
    };

    // Mémoriser les statistiques d'en-tête
    const headerStats = useMemo(() => {
      const activeCount = subscriptions.filter(
        (s) => s.status === "active"
      ).length;
      const revenue = subscriptions
        .filter((s) => s.status === "active")
        .reduce((total, sub) => {
          const prices: any = { basic: 9.99, pro: 19.99, premium: 39.99 };
          return total + (prices[sub.plan] || 0);
        }, 0);

      return { activeCount, revenue };
    }, [subscriptions]);

    const renderSubscription = ({ item }: { item: SubscriptionItem }) => {
      const user = getUser(item.userId);
      const planColor = getPlanColor(item.plan);
      const isActive = item.status === "active";

      return (
        <View
          style={[styles.subscriptionCard, { backgroundColor: colors.surface }]}
        >
          <View
            style={[styles.planIcon, { backgroundColor: planColor + "20" }]}
          >
            <Ionicons
              name={getPlanIcon(item.plan) as any}
              size={24}
              color={planColor}
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.displayName || user?.email || "Utilisateur inconnu"}
            </Text>

            <View style={styles.planInfo}>
              <View style={[styles.planBadge, { backgroundColor: planColor }]}>
                <Text style={[styles.planText, { color: colors.background }]}>
                  {item.plan.toUpperCase()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isActive
                      ? colors.success + "20"
                      : colors.error + "20",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isActive ? colors.success : colors.error,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? colors.success : colors.error },
                  ]}
                >
                  {isActive ? "Actif" : "Inactif"}
                </Text>
              </View>
            </View>

            <Text style={[styles.date, { color: colors.textSecondary }]}>
              Expire le {item.endDate ? formatDate(item.endDate) : "N/A"}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: colors.text }]}>
              {item.plan === "premium"
                ? "39.99"
                : item.plan === "pro"
                ? "19.99"
                : "9.99"}
              €
            </Text>
            <Text style={[styles.period, { color: colors.textSecondary }]}>
              /mois
            </Text>
          </View>
        </View>
      );
    };

    const renderHeader = () => {
      return (
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerStat}>
              <Text style={[styles.headerValue, { color: colors.background }]}>
                {headerStats.activeCount}
              </Text>
              <Text
                style={[
                  styles.headerLabel,
                  { color: colors.background + "CC" },
                ]}
              >
                Abonnements actifs
              </Text>
            </View>

            <View
              style={[
                styles.headerDivider,
                { backgroundColor: colors.background + "33" },
              ]}
            />

            <View style={styles.headerStat}>
              <Text style={[styles.headerValue, { color: colors.background }]}>
                {headerStats.revenue.toFixed(2)}€
              </Text>
              <Text
                style={[
                  styles.headerLabel,
                  { color: colors.background + "CC" },
                ]}
              >
                Revenus mensuels
              </Text>
            </View>
          </View>
        </View>
      );
    };

    const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aucun abonnement trouvé
        </Text>
      </View>
    );

    return (
      <View style={styles.wrapper}>
        <FlatList
          data={subscriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubscription}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </View>
    );
  }
);

SubscriptionsTab.displayName = "SubscriptionsTab";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingBottom: 20,
  },
  header: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-around",
  },
  headerStat: {
    alignItems: "center",
  },
  headerValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerDivider: {
    width: 1,
    height: 50,
  },
  subscriptionCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  planIcon: {
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
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  planInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
  },
  period: {
    fontSize: 12,
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
