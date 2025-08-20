import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { ChartContainer } from "../components/ChartContainer";
import { ChartConfig } from "../types";

const screenWidth = Dimensions.get("window").width;
const CONTAINER_MAX_WIDTH = 800;
const CONTENT_HORIZONTAL_PADDING = 24;
const AVAILABLE_MAX_WIDTH = CONTAINER_MAX_WIDTH - CONTENT_HORIZONTAL_PADDING;

interface UserGrowthChartProps {
  data: { date: string; count: number }[];
  chartConfig: ChartConfig;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data,
  chartConfig,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const totalUsers = data.length > 0 ? data[data.length - 1].count : 0;
  const growth =
    data.length > 1
      ? (
          ((data[data.length - 1].count - data[0].count) / data[0].count) *
          100
        ).toFixed(1)
      : "0";

  return (
    <ChartContainer
      title={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              backgroundColor: colors.primary + "20",
              padding: 8,
              borderRadius: 10,
            }}
          >
            <Ionicons name="trending-up" size={20} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Croissance des utilisateurs
          </Text>
        </View>
      }
      subtitle={`${totalUsers} utilisateurs • +${growth}% de croissance`}
    >
      {data.length > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <LineChart
            data={{
              labels: data.map((item) => item.date.split("/")[0]),
              datasets: [
                {
                  data: data.map((item) => item.count),
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                },
              ],
            }}
            width={Math.min(screenWidth - 72, AVAILABLE_MAX_WIDTH)}
            height={200}
            chartConfig={chartConfig}
            bezier
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            formatYLabel={(value) => Math.round(parseFloat(value)).toString()}
          />
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <Ionicons
            name="analytics-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              marginTop: 12,
            }}
          >
            Aucune donnée disponible
          </Text>
        </View>
      )}
    </ChartContainer>
  );
};
