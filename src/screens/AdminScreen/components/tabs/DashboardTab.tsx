import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from "react-native-chart-kit";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApp } from "@react-native-firebase/app";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  Timestamp,
  limit,
  FirebaseFirestoreTypes,
  getFirestore,
} from "@react-native-firebase/firestore";
import { useAdminData } from "../../hooks/useAdminData";

const screenWidth = Dimensions.get("window").width;

interface DashboardData {
  // KPIs principaux
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;

  // Engagement
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  retentionRate: number;
  avgSessionDuration: number;

  // Contenu
  totalRecordings: number;
  recordingsToday: number;
  avgRecordingDuration: number;
  storageUsed: number;

  // Revenus
  totalRevenue: number;
  revenueThisMonth: number;
  activeSubscriptions: number;
  conversionRate: number;
  arpu: number; // Average Revenue Per User

  // Performance
  avgLoadTime: number;
  crashRate: number;
  errorRate: number;
  apiResponseTime: number;
}

interface ChartData {
  userGrowth: { labels: string[]; data: number[] };
  dailyActiveUsers: { labels: string[]; data: number[] };
  revenueGrowth: { labels: string[]; data: number[] };
  deviceTypes: { name: string; count: number; color: string }[];
  usersByCountry: { country: string; count: number }[];
  retentionCohort: { day: number; percentage: number }[];
}

export const DashboardTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const firestore = getFirestore(getApp());
  const toJsDate = (v: unknown): Date | undefined => {
    if (!v) return undefined;
    const anyV: any = v as any;
    if (typeof anyV?.toDate === "function") {
      const d = anyV.toDate();
      return d instanceof Date ? d : new Date(d);
    }
    if (anyV && typeof anyV.seconds === "number") {
      return new Date(anyV.seconds * 1000);
    }
    if (typeof v === "string") {
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? undefined : d;
    }
    if (v instanceof Date) return v;
    return undefined;
  };
  useEffect(() => {
    try {
      getFirestore(getApp());
    } catch (_e) {
      // noop; App.tsx initialisera Firebase via AuthProvider
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">(
    "week"
  );
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    retentionRate: 0,
    avgSessionDuration: 0,
    totalRecordings: 0,
    recordingsToday: 0,
    avgRecordingDuration: 0,
    storageUsed: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    arpu: 0,
    avgLoadTime: 0,
    crashRate: 0,
    errorRate: 0,
    apiResponseTime: 0,
  });

  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: { labels: [], data: [] },
    dailyActiveUsers: { labels: [], data: [] },
    revenueGrowth: { labels: [], data: [] },
    deviceTypes: [],
    usersByCountry: [],
    retentionCohort: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserMetrics(),
        loadEngagementMetrics(),
        loadContentMetrics(),
        loadRevenueMetrics(),
        loadPerformanceMetrics(),
        loadChartData(),
      ]);
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserMetrics = async () => {
    try {
      // Charger les utilisateurs
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const totalUsers = usersSnapshot.size;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let newUsersToday = 0;
      let newUsersThisWeek = 0;
      let newUsersThisMonth = 0;
      let activeUsers = 0;

      usersSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const userData = doc.data();
          const createdAt = toJsDate(userData.createdAt);
          const lastSeen = toJsDate(userData.lastSeen);

          if (createdAt) {
            if (createdAt >= today) newUsersToday++;
            if (createdAt >= weekAgo) newUsersThisWeek++;
            if (createdAt >= monthAgo) newUsersThisMonth++;
          }

          if (lastSeen && lastSeen >= weekAgo) {
            activeUsers++;
          }
        }
      );

      setDashboardData((prev) => ({
        ...prev,
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des métriques utilisateurs:",
        error
      );
    }
  };

  const loadEngagementMetrics = async () => {
    try {
      // Charger les sessions actives
      const sessionsQuery = query(
        collection(firestore, "active_sessions"),
        where(
          "lastActivity",
          ">=",
          Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const uniqueUsersDay = new Set();
      const uniqueUsersWeek = new Set();
      const uniqueUsersMonth = new Set();
      let totalSessionDuration = 0;
      let sessionCount = 0;

      sessionsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const session = doc.data();
          const lastActivity = toJsDate(session.lastActivity);
          const userId = session.userId;

          if (lastActivity) {
            if (lastActivity >= dayAgo) uniqueUsersDay.add(userId);
            if (lastActivity >= weekAgo) uniqueUsersWeek.add(userId);
            if (lastActivity >= monthAgo) uniqueUsersMonth.add(userId);
          }

          if (session.startTime && session.lastActivity) {
            const start = toJsDate(session.startTime)?.getTime();
            const end = toJsDate(session.lastActivity)?.getTime();
            const duration = end && start ? end - start : 0;
            totalSessionDuration += duration;
            sessionCount++;
          }
        }
      );

      const avgSessionDuration =
        sessionCount > 0 ? totalSessionDuration / sessionCount / 1000 / 60 : 0; // en minutes

      // Calcul du taux de rétention (simplifié)
      const retentionRate =
        uniqueUsersWeek.size > 0
          ? (uniqueUsersDay.size / uniqueUsersWeek.size) * 100
          : 0;

      setDashboardData((prev) => ({
        ...prev,
        dau: uniqueUsersDay.size,
        wau: uniqueUsersWeek.size,
        mau: uniqueUsersMonth.size,
        retentionRate,
        avgSessionDuration,
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des métriques d'engagement:",
        error
      );
    }
  };

  const loadContentMetrics = async () => {
    try {
      // Charger les enregistrements
      const recordingsSnapshot = await getDocs(
        collection(firestore, "recordings")
      );
      const totalRecordings = recordingsSnapshot.size;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let recordingsToday = 0;
      let totalDuration = 0;
      let totalSize = 0;

      recordingsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const recording = doc.data();
          const createdAt = toJsDate(recording.createdAt);

          if (createdAt && createdAt >= today) {
            recordingsToday++;
          }

          if (recording.duration) {
            totalDuration += recording.duration;
          }

          if (recording.fileSize) {
            totalSize += recording.fileSize;
          }
        }
      );

      const avgRecordingDuration =
        totalRecordings > 0 ? totalDuration / totalRecordings / 60 : 0; // en minutes
      const storageUsed = totalSize / (1024 * 1024 * 1024); // en GB

      setDashboardData((prev) => ({
        ...prev,
        totalRecordings,
        recordingsToday,
        avgRecordingDuration,
        storageUsed,
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des métriques de contenu:",
        error
      );
    }
  };

  const loadRevenueMetrics = async () => {
    try {
      // Charger les abonnements
      const subscriptionsSnapshot = await getDocs(
        collection(firestore, "user_subscriptions")
      );
      let activeSubscriptions = 0;
      let totalRevenue = 0;
      let revenueThisMonth = 0;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      subscriptionsSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const subscription = doc.data();

          if (subscription.status === "active") {
            activeSubscriptions++;
          }

          if (subscription.amount) {
            totalRevenue += subscription.amount;

            const startDate = subscription.startDate?.toDate();
            if (startDate && startDate >= startOfMonth) {
              revenueThisMonth += subscription.amount;
            }
          }
        }
      );

      const totalUsers = dashboardData.totalUsers || 1;
      const conversionRate =
        totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;
      const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      setDashboardData((prev) => ({
        ...prev,
        totalRevenue,
        revenueThisMonth,
        activeSubscriptions,
        conversionRate,
        arpu,
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des métriques de revenus:",
        error
      );
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      // Charger les métriques de performance
      const performanceQuery = query(
        collection(firestore, "performance_metrics"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
      const performanceSnapshot = await getDocs(performanceQuery);

      let totalLoadTime = 0;
      let loadTimeCount = 0;
      let totalApiTime = 0;
      let apiTimeCount = 0;
      let errorCount = 0;
      let crashCount = 0;

      performanceSnapshot.forEach(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const metric = doc.data();

          if (metric.metric === "page_load" && metric.duration) {
            totalLoadTime += metric.duration;
            loadTimeCount++;
          }

          if (metric.metric === "api_call" && metric.duration) {
            totalApiTime += metric.duration;
            apiTimeCount++;
          }

          if (metric.metric === "error") {
            errorCount++;
          }

          if (metric.metric === "crash") {
            crashCount++;
          }
        }
      );

      const avgLoadTime = loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0;
      const apiResponseTime =
        apiTimeCount > 0 ? totalApiTime / apiTimeCount : 0;
      const totalMetrics = performanceSnapshot.size || 1;
      const crashRate = (crashCount / totalMetrics) * 100;
      const errorRate = (errorCount / totalMetrics) * 100;

      setDashboardData((prev) => ({
        ...prev,
        avgLoadTime,
        crashRate,
        errorRate,
        apiResponseTime,
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des métriques de performance:",
        error
      );
    }
  };

  const loadChartData = async () => {
    try {
      const now = new Date();
      const start = new Date(now);
      const isYear = timeRange === "year";
      if (isYear) {
        start.setMonth(start.getMonth() - 11);
        start.setDate(1);
      } else if (timeRange === "month") {
        start.setDate(start.getDate() - 29);
      } else if (timeRange === "week") {
        start.setDate(start.getDate() - 6);
      } else {
        start.setDate(start.getDate() - 6);
      }

      // Helper pour clés jour/mois
      const fmtDay = (d: Date) =>
        `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
      const fmtMonth = (d: Date) =>
        d.toLocaleString("fr-FR", { month: "short" });

      const makeLabels = (): string[] => {
        const labels: string[] = [];
        if (isYear) {
          const temp = new Date(start);
          for (let i = 0; i < 12; i++) {
            labels.push(fmtMonth(temp));
            temp.setMonth(temp.getMonth() + 1);
          }
        } else {
          const temp = new Date(start);
          while (temp <= now) {
            labels.push(fmtDay(temp));
            temp.setDate(temp.getDate() + 1);
          }
        }
        return labels;
      };

      const labels = makeLabels();
      const initSeries = (len: number) => new Array(len).fill(0);

      // 1) Croissance utilisateurs réelle (par jour/mois)
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      const userSeries = initSeries(labels.length);
      usersSnapshot.forEach(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const createdAt = toJsDate(d.data().createdAt);
          if (!createdAt || createdAt < start || createdAt > now) return;
          if (isYear) {
            const idx =
              (createdAt.getFullYear() - start.getFullYear()) * 12 +
              createdAt.getMonth() -
              start.getMonth();
            if (idx >= 0 && idx < userSeries.length) userSeries[idx] += 1;
          } else {
            const key = fmtDay(createdAt);
            const idx = labels.indexOf(key);
            if (idx !== -1) userSeries[idx] += 1;
          }
        }
      );

      // 2) DAU réel (sessions actives, par jour)
      const sessionsSnapshot = await getDocs(
        collection(firestore, "active_sessions")
      );
      const dauSeries = initSeries(labels.length);
      const dayUserSet: Array<Set<string>> = labels.map(() => new Set());
      sessionsSnapshot.forEach(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = d.data() as { lastActivity?: unknown; userId?: string };
          const last = toJsDate(data.lastActivity);
          if (!last || last < start || last > now) return;
          const key = isYear ? fmtMonth(last) : fmtDay(last);
          const idx = labels.indexOf(key);
          if (idx !== -1 && data.userId) dayUserSet[idx].add(data.userId);
        }
      );
      dayUserSet.forEach((s, i) => (dauSeries[i] = s.size));

      // 3) Revenus réels (par jour/mois)
      const subsSnapshot = await getDocs(
        collection(firestore, "user_subscriptions")
      );
      const revenueSeries = initSeries(labels.length);
      subsSnapshot.forEach(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = d.data() as { amount?: number; startDate?: any };
          const date = toJsDate(data.startDate);
          if (!date || date < start || date > now) return;
          const inc = Number(data.amount || 0);
          if (isYear) {
            const idx =
              (date.getFullYear() - start.getFullYear()) * 12 +
              date.getMonth() -
              start.getMonth();
            if (idx >= 0 && idx < revenueSeries.length)
              revenueSeries[idx] += inc;
          } else {
            const key = fmtDay(date);
            const idx = labels.indexOf(key);
            if (idx !== -1) revenueSeries[idx] += inc;
          }
        }
      );

      // 4) Types de devices réels (depuis user_devices)
      const devicesSnapshot = await getDocs(
        collection(firestore, "user_devices")
      );
      let ios = 0,
        android = 0,
        other = 0;
      devicesSnapshot.forEach(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = d.data() as { platform?: string };
          const p = (data.platform || "").toLowerCase();
          if (p.includes("ios")) ios++;
          else if (p.includes("android")) android++;
          else other++;
        }
      );

      setChartData({
        userGrowth: { labels, data: userSeries },
        dailyActiveUsers: { labels, data: dauSeries },
        revenueGrowth: { labels, data: revenueSeries },
        deviceTypes: [
          { name: "iOS", count: ios, color: "#007AFF" },
          { name: "Android", count: android, color: "#4CAF50" },
          {
            name: "Autres",
            count: other,
            color: currentTheme.colors.textSecondary,
          },
        ],
        usersByCountry: [],
        retentionCohort: [],
      });
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données de graphiques:",
        error
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const KPICard = ({
    title,
    value,
    subtitle,
    icon,
    color,
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <View
      style={[
        tw`p-4 rounded-lg mb-3`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <View style={tw`flex-row items-center justify-between mb-2`}>
        <View
          style={[
            tw`w-10 h-10 rounded-full items-center justify-center`,
            { backgroundColor: color + "20" },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name={trend.isPositive ? "trending-up" : "trending-down"}
              size={16}
              color={
                trend.isPositive
                  ? currentTheme.colors.success
                  : currentTheme.colors.error
              }
            />
            <Text
              style={[
                tw`text-xs ml-1`,
                {
                  color: trend.isPositive
                    ? currentTheme.colors.success
                    : currentTheme.colors.error,
                },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[tw`text-2xl font-bold`, { color: currentTheme.colors.text }]}
      >
        {value}
      </Text>
      <Text style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            tw`text-xs mt-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const chartConfig = {
    backgroundColor: currentTheme.colors.surface,
    backgroundGradientFrom: currentTheme.colors.surface,
    backgroundGradientTo: currentTheme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => currentTheme.colors.primary,
    labelColor: (opacity = 1) => currentTheme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: currentTheme.colors.primary,
    },
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={tw`flex-1`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[currentTheme.colors.primary]}
        />
      }
    >
      <View style={tw`p-4`}>
        {/* Header avec sélecteur de période */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text
            style={[tw`text-xl font-bold`, { color: currentTheme.colors.text }]}
          >
            Dashboard Analytics
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["day", "week", "month", "year"].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  tw`px-3 py-2 rounded-full mr-2`,
                  {
                    backgroundColor:
                      timeRange === range
                        ? currentTheme.colors.primary
                        : currentTheme.colors.surface,
                  },
                ]}
                onPress={() => setTimeRange(range as any)}
              >
                <Text
                  style={{
                    color:
                      timeRange === range
                        ? "#FFFFFF"
                        : currentTheme.colors.text,
                  }}
                >
                  {range === "day"
                    ? "Jour"
                    : range === "week"
                    ? "Semaine"
                    : range === "month"
                    ? "Mois"
                    : "Année"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* KPIs principaux */}
        <View style={tw`flex-row flex-wrap -mx-1`}>
          <View style={tw`w-1/2 px-1`}>
            <KPICard
              title="Utilisateurs totaux"
              value={dashboardData.totalUsers}
              icon="account-group"
              color={currentTheme.colors.primary}
              trend={{ value: 12, isPositive: true }}
            />
          </View>
          <View style={tw`w-1/2 px-1`}>
            <KPICard
              title="Utilisateurs actifs"
              value={dashboardData.activeUsers}
              subtitle={`${(
                (dashboardData.activeUsers / dashboardData.totalUsers) *
                100
              ).toFixed(1)}% du total`}
              icon="account-check"
              color={currentTheme.colors.success}
              trend={{ value: 5, isPositive: true }}
            />
          </View>
          <View style={tw`w-1/2 px-1`}>
            <KPICard
              title="Revenus du mois"
              value={`€${dashboardData.revenueThisMonth.toFixed(0)}`}
              icon="cash"
              color={currentTheme.colors.warning}
              trend={{ value: 18, isPositive: true }}
            />
          </View>
          <View style={tw`w-1/2 px-1`}>
            <KPICard
              title="Taux de conversion"
              value={`${dashboardData.conversionRate.toFixed(1)}%`}
              subtitle={`${dashboardData.activeSubscriptions} abonnés`}
              icon="chart-line"
              color={currentTheme.colors.error}
              trend={{ value: 3, isPositive: false }}
            />
          </View>
        </View>

        {/* Graphique de croissance des utilisateurs */}
        <View
          style={[
            tw`p-4 rounded-lg mb-4`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <Text
            style={[
              tw`text-lg font-bold mb-3`,
              { color: currentTheme.colors.text },
            ]}
          >
            Croissance des utilisateurs
          </Text>
          <View style={tw`items-center`}>
            <LineChart
              data={{
                labels: chartData.userGrowth.labels,
                datasets: [
                  {
                    data: chartData.userGrowth.data,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
                alignSelf: "center",
              }}
            />
          </View>
        </View>

        {/* Métriques d'engagement */}
        <View
          style={[
            tw`p-4 rounded-lg mb-4`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <Text
            style={[
              tw`text-lg font-bold mb-3`,
              { color: currentTheme.colors.text },
            ]}
          >
            Engagement
          </Text>
          <View style={tw`flex-row justify-between mb-3`}>
            <View style={tw`items-center`}>
              <Text
                style={[
                  tw`text-2xl font-bold`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {dashboardData.dau}
              </Text>
              <Text
                style={[
                  tw`text-xs`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                DAU
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text
                style={[
                  tw`text-2xl font-bold`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {dashboardData.wau}
              </Text>
              <Text
                style={[
                  tw`text-xs`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                WAU
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text
                style={[
                  tw`text-2xl font-bold`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {dashboardData.mau}
              </Text>
              <Text
                style={[
                  tw`text-xs`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                MAU
              </Text>
            </View>
            <View style={tw`items-center`}>
              <Text
                style={[
                  tw`text-2xl font-bold`,
                  { color: currentTheme.colors.primary },
                ]}
              >
                {dashboardData.retentionRate.toFixed(1)}%
              </Text>
              <Text
                style={[
                  tw`text-xs`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Rétention
              </Text>
            </View>
          </View>

          <View style={tw`items-center`}>
            <BarChart
              data={{
                labels: chartData.dailyActiveUsers.labels,
                datasets: [
                  {
                    data: chartData.dailyActiveUsers.data,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              style={{
                marginVertical: 8,
                borderRadius: 16,
                alignSelf: "center",
              }}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        </View>

        {/* Répartition des devices */}
        <View
          style={[
            tw`p-4 rounded-lg mb-4`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <Text
            style={[
              tw`text-lg font-bold mb-3`,
              { color: currentTheme.colors.text },
            ]}
          >
            Répartition des plateformes
          </Text>
          <View style={tw`items-center`}>
            <PieChart
              data={chartData.deviceTypes}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              accessor={"count"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
