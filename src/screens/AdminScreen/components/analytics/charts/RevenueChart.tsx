import React from "react";
import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { ChartContainer } from "../components/ChartContainer";
import { ChartConfig } from "../types";

const screenWidth = Dimensions.get("window").width;
const CONTAINER_MAX_WIDTH = 800;
const CONTENT_HORIZONTAL_PADDING = 24;
const AVAILABLE_MAX_WIDTH = CONTAINER_MAX_WIDTH - CONTENT_HORIZONTAL_PADDING;

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
  chartConfig: ChartConfig;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  chartConfig,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  return (
    <ChartContainer
      title={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              backgroundColor: colors.success + "20",
              padding: 8,
              borderRadius: 10,
            }}
          >
            <Ionicons name="cash" size={20} color={colors.success} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Revenus mensuels
          </Text>
        </View>
      }
      subtitle={`Total: ${totalRevenue.toFixed(
        2
      )}€ • Moyenne: ${averageRevenue.toFixed(2)}€/mois`}
    >
      {data.length > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <BarChart
            data={{
              labels: data.map((item) => item.month),
              datasets: [
                {
                  data: data.map((item) => item.revenue),
                },
              ],
            }}
            width={Math.min(screenWidth - 72, AVAILABLE_MAX_WIDTH)}
            height={220}
            yAxisLabel="€"
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              barPercentage: 0.7,
              fillShadowGradient: colors.success,
              fillShadowGradientOpacity: 1,
            }}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            withInnerLines={false}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <Ionicons
            name="cash-outline"
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
            Aucune donnée de revenus
          </Text>
        </View>
      )}
    </ChartContainer>
  );
};
