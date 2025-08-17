import React, { useState } from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { TimeRange, TIME_RANGES } from "./analytics/types";
import { useAnalyticsData } from "./analytics/hooks/useAnalyticsData";
import { TimeRangeSelector } from "./analytics/components/TimeRangeSelector";
import {
  UserGrowthChart,
  ActivityChart,
  SubscriptionChart,
  RevenueChart,
} from "./analytics/charts";

export const AnalyticsTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[1]);
  const { loading, analyticsData, exportData, chartConfig } =
    useAnalyticsData(selectedRange);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TimeRangeSelector
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        exportData={exportData}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <UserGrowthChart
          data={analyticsData.userGrowth}
          chartConfig={chartConfig}
        />

        <ActivityChart
          scriptData={analyticsData.scriptCreation}
          recordingData={analyticsData.recordingActivity}
          chartConfig={chartConfig}
        />

        <SubscriptionChart
          data={analyticsData.subscriptionDistribution}
          chartConfig={chartConfig}
        />

        <RevenueChart
          data={analyticsData.monthlyRevenue}
          chartConfig={chartConfig}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    alignItems: "center",
  },
});
