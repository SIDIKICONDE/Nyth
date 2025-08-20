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

interface ActivityChartProps {
  scriptData: { date: string; count: number }[];
  recordingData: { date: string; count: number }[];
  chartConfig: ChartConfig;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({
  scriptData,
  recordingData,
  chartConfig,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const totalScripts = scriptData.reduce((sum, item) => sum + item.count, 0);
  const totalRecordings = recordingData.reduce(
    (sum, item) => sum + item.count,
    0
  );

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
            <Ionicons name="create" size={20} color={colors.success} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
            Activité des contenus
          </Text>
        </View>
      }
      subtitle={`${totalScripts} scripts • ${totalRecordings} enregistrements`}
    >
      {scriptData.length > 0 || recordingData.length > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Scripts
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.error,
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Enregistrements
              </Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: scriptData.map((item) => item.date.split("/")[0]),
              datasets: [
                {
                  data: scriptData.map((item) => item.count),
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                },
                {
                  data: recordingData.map((item) => item.count),
                  color: (opacity = 1) => colors.error,
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
