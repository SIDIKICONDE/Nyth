import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { ChartContainer } from "../components/ChartContainer";
import { ChartConfig } from "../types";

const screenWidth = Dimensions.get("window").width;
const CONTAINER_MAX_WIDTH = 800;
const CONTENT_HORIZONTAL_PADDING = 24;
const AVAILABLE_MAX_WIDTH = CONTAINER_MAX_WIDTH - CONTENT_HORIZONTAL_PADDING;

interface SubscriptionChartProps {
  data: {
    name: string;
    count: number;
    color: string;
    legendFontColor: string;
  }[];
  chartConfig: ChartConfig;
}

export const SubscriptionChart: React.FC<SubscriptionChartProps> = ({
  data,
  chartConfig,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const totalSubscriptions = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartContainer
      title={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              backgroundColor: colors.warning + "20",
              padding: 8,
              borderRadius: 10,
            }}
          >
            <Ionicons name="card" size={20} color={colors.warning} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Distribution des abonnements
          </Text>
        </View>
      }
      subtitle={`${totalSubscriptions} abonnements actifs`}
    >
      {data.length > 0 && totalSubscriptions > 0 ? (
        <View>
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={data}
              width={Math.min(screenWidth - 72, AVAILABLE_MAX_WIDTH)}
              height={220}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
              hasLegend={false}
              center={[10, 0]}
            />
          </View>
          <View style={{ marginTop: 16, gap: 12 }}>
            {data.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {item.name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {item.count} (
                  {((item.count / totalSubscriptions) * 100).toFixed(1)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 60 }}>
          <Ionicons
            name="card-outline"
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
            Aucun abonnement actif
          </Text>
        </View>
      )}
    </ChartContainer>
  );
};
