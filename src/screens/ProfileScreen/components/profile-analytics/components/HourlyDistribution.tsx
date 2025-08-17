import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { ScrollView, View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { Analytics } from "../types/analytics";

interface HourlyDistributionProps {
  analytics: Analytics;
}

export const HourlyDistribution: React.FC<HourlyDistributionProps> = ({
  analytics,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        tw`p-4 rounded-xl mt-4`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <UIText
        size="sm"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        {t("profile.analytics.hourlyDistribution", "Distribution par heure")}
      </UIText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={tw`flex-row items-end`}>
          {analytics.hourlyActivity.map((h, i) => {
            const height =
              h.count > 0
                ? (h.count /
                    Math.max(...analytics.hourlyActivity.map((h) => h.count))) *
                  80
                : 2;
            const isActive = h.hour >= 6 && h.hour <= 22; // Heures actives

            return (
              <View key={i} style={tw`items-center mx-0.5`}>
                <LinearGradient
                  colors={
                    h.count > 0
                      ? [
                          currentTheme.colors.primary,
                          currentTheme.colors.secondary,
                        ]
                      : [currentTheme.colors.border, currentTheme.colors.border]
                  }
                  style={[
                    tw`w-8 rounded-t-sm`,
                    { height: Math.max(height, 2) },
                  ]}
                />
                <UIText
                  size="xs"
                  weight={h.hour % 6 === 0 ? "bold" : "normal"}
                  color={
                    isActive
                      ? currentTheme.colors.textSecondary
                      : currentTheme.colors.border
                  }
                  style={tw`mt-1`}
                >
                  {h.hour % 6 === 0 ? `${h.hour}h` : ""}
                </UIText>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <UIText
        size="xs"
        color={currentTheme.colors.textSecondary}
        align="center"
        style={tw`mt-3`}
      >
        {t(
          "profile.analytics.mostActive",
          `Plus actif entre ${analytics.peakHour.hour}h et ${
            analytics.peakHour.hour + 1
          }h`
        )}
      </UIText>
    </View>
  );
};
