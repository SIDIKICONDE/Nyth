import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useHomeData } from "../../../../../components/home/useHomeData";
import { Caption, UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { Analytics } from "../types/analytics";
import { formatDuration } from "../utils/analytics";

interface InsightsSectionProps {
  analytics: Analytics;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  analytics,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { recordings } = useHomeData();

  const weeklyTime = recordings
    .filter((r: any) => {
      const createdAt = new Date(r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt >= weekAgo;
    })
    .reduce((sum: number, r: any) => sum + (r.duration || 0), 0);

  const mostActiveDay =
    analytics.activityByDay.length > 0
      ? analytics.activityByDay.reduce((max, curr) =>
          curr.total > max.total ? curr : max
        )
      : { date: new Date(), day: "-", scripts: 0, recordings: 0, total: 0 };

  const currentStreak = analytics.activityByDay.filter(
    (d) => d.total > 0
  ).length;

  return (
    <View style={tw`mt-4`}>
      <UIText
        size="sm"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        {t("profile.analytics.insights", "Insights")}
      </UIText>

      <View style={tw`gap-2`}>
        {/* Jours les plus actifs */}
        <View
          style={[
            tw`p-3 rounded-lg flex-row items-center`,
            { backgroundColor: currentTheme.colors.surface + "50" },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-check"
            size={20}
            color={currentTheme.colors.primary}
          />
          <View style={tw`ml-3 flex-1`}>
            <Caption style={{ color: currentTheme.colors.textSecondary }}>
              {t("profile.analytics.mostActiveDay", "Jour le plus actif")}
            </Caption>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {mostActiveDay.day}
            </UIText>
          </View>
        </View>

        {/* Temps total cette semaine */}
        <View
          style={[
            tw`p-3 rounded-lg flex-row items-center`,
            { backgroundColor: currentTheme.colors.surface + "50" },
          ]}
        >
          <MaterialCommunityIcons
            name="clock-time-eight"
            size={20}
            color="#10B981"
          />
          <View style={tw`ml-3 flex-1`}>
            <Caption style={{ color: currentTheme.colors.textSecondary }}>
              {t("profile.analytics.weeklyTime", "Temps total cette semaine")}
            </Caption>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {formatDuration(weeklyTime)}
            </UIText>
          </View>
        </View>

        {/* Streak */}
        <View
          style={[
            tw`p-3 rounded-lg flex-row items-center`,
            { backgroundColor: currentTheme.colors.surface + "50" },
          ]}
        >
          <MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />
          <View style={tw`ml-3 flex-1`}>
            <Caption style={{ color: currentTheme.colors.textSecondary }}>
              {t("profile.analytics.currentStreak", "Série actuelle")}
            </Caption>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {currentStreak} {t("profile.analytics.days", "jours")}
            </UIText>
          </View>
        </View>
      </View>
    </View>
  );
};
