import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import TrendCard from "../../../../../components/analytics/TrendCard";
import { Caption, HeadingText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { Analytics } from "../types/analytics";
import { formatDuration } from "../utils/analytics";

interface StatsCardsProps {
  analytics: Analytics;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ analytics }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* Cartes de tendances */}
      <View style={tw`flex-row flex-wrap justify-between mb-4`}>
        <View style={{ width: "48%", marginBottom: 8 }}>
          <TrendCard
            title={t(
              "profile.analytics.weekActivity",
              "Activité cette semaine"
            )}
            value={analytics.thisWeekTotal}
            subtitle={t("profile.analytics.actions", "actions")}
            trend={
              analytics.weekTrend > 0
                ? "up"
                : analytics.weekTrend < 0
                ? "down"
                : "stable"
            }
            trendValue={`${Math.abs(analytics.weekTrend)}%`}
            icon="chart-line"
            iconColor={currentTheme.colors.primary}
          />
        </View>

        <View style={{ width: "48%", marginBottom: 8 }}>
          <TrendCard
            title={t("profile.analytics.productivity", "Productivité")}
            value={analytics.productivity}
            subtitle={t(
              "profile.analytics.recordingsPerScript",
              "enreg./script"
            )}
            icon="rocket-launch"
            iconColor="#F59E0B"
          />
        </View>
      </View>

      {/* Cartes de statistiques */}
      <View style={tw`flex-row flex-wrap justify-between mb-4`}>
        <View
          style={[
            tw`p-3 rounded-xl mb-2`,
            {
              width: "48%",
              backgroundColor: currentTheme.colors.surface,
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color={currentTheme.colors.primary}
            />
            <Caption
              style={[tw`ml-2`, { color: currentTheme.colors.textSecondary }]}
            >
              {t("profile.analytics.avgTime", "Temps moyen")}
            </Caption>
          </View>
          <HeadingText size="xl" weight="bold" color={currentTheme.colors.text}>
            {formatDuration(analytics.avgRecordingTime)}
          </HeadingText>
        </View>

        <View
          style={[
            tw`p-3 rounded-xl mb-2`,
            {
              width: "48%",
              backgroundColor: currentTheme.colors.surface,
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons
              name="trending-up"
              size={20}
              color={currentTheme.colors.secondary}
            />
            <Caption
              style={[tw`ml-2`, { color: currentTheme.colors.textSecondary }]}
            >
              {t("profile.analytics.peakHour", "Heure de pointe")}
            </Caption>
          </View>
          <HeadingText size="xl" weight="bold" color={currentTheme.colors.text}>
            {analytics.peakHour.hour}h - {analytics.peakHour.hour + 1}h
          </HeadingText>
        </View>
      </View>
    </>
  );
};
