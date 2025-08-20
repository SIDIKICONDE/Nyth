import React from "react";
import { Dimensions, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Stop,
  LinearGradient as SvgLinearGradient,
  Text as SvgText,
} from "react-native-svg";
import tw from "twrnc";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { Analytics } from "../types/analytics";
import { createLinePath } from "../utils/analytics";

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - 32;
const chartHeight = 200;

// Constantes pour les tailles de police SVG
const SVG_FONT_SIZE_SMALL = "10";
const SVG_FONT_SIZE_MEDIUM = "12";

interface WeekActivityChartProps {
  analytics: Analytics;
}

export const WeekActivityChart: React.FC<WeekActivityChartProps> = ({
  analytics,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Si pas de données, afficher un message
  if (!analytics.activityByDay || analytics.activityByDay.length === 0) {
    return (
      <View
        style={[
          tw`p-4 rounded-xl mb-4 mt-4`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <UIText
          size="sm"
          weight="semibold"
          style={[tw`mb-3`, { color: currentTheme.colors.text }]}
        >
          {t("profile.analytics.weekActivity", "Activité des 7 derniers jours")}
        </UIText>
        <UIText
          style={[
            tw`text-center py-8`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t("profile.analytics.noData", "Aucune donnée disponible")}
        </UIText>
      </View>
    );
  }

  return (
    <View
      style={[
        tw`p-4 rounded-xl mb-4 mt-4`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <UIText
        size="sm"
        weight="semibold"
        style={[tw`mb-3`, { color: currentTheme.colors.text }]}
      >
        {t("profile.analytics.weekActivity", "Activité des 7 derniers jours")}
      </UIText>

      <Svg width={chartWidth - 32} height={chartHeight}>
        {/* Grille horizontale avec labels de pourcentage */}
        {[0, 25, 50, 75, 100].map((percentage, i) => {
          const y = 20 + ((4 - i) * (chartHeight - 60)) / 4;
          const value = Math.round((percentage / 100) * analytics.maxActivity);
          return (
            <React.Fragment key={i}>
              <Line
                x1={40}
                y1={y}
                x2={chartWidth - 52}
                y2={y}
                stroke={currentTheme.colors.border}
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity={0.3}
              />
              <SvgText
                x={30}
                y={y + 4}
                fontSize={SVG_FONT_SIZE_SMALL}
                fill={currentTheme.colors.textSecondary}
                textAnchor="end"
              >
                {value}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Ligne de graphique */}
        {analytics.activityByDay.length > 0 && (
          <Path
            d={createLinePath(
              analytics.activityByDay,
              chartWidth,
              chartHeight,
              analytics.maxActivity
            )}
            stroke={currentTheme.colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Zone sous la courbe avec gradient */}
        {analytics.activityByDay.length > 0 && (
          <Path
            d={`${createLinePath(
              analytics.activityByDay,
              chartWidth,
              chartHeight,
              analytics.maxActivity
            )} L ${chartWidth - 52} ${chartHeight - 40} L 40 ${
              chartHeight - 40
            } Z`}
            fill={`url(#gradient)`}
            opacity={0.1}
          />
        )}

        {/* Gradient pour la zone sous la courbe */}
        <Defs>
          <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop
              offset="0%"
              stopColor={currentTheme.colors.primary}
              stopOpacity={0.3}
            />
            <Stop
              offset="100%"
              stopColor={currentTheme.colors.primary}
              stopOpacity={0}
            />
          </SvgLinearGradient>
        </Defs>

        {/* Points de données */}
        {analytics.activityByDay.map((d, i) => {
          const x =
            analytics.activityByDay.length > 1
              ? 40 +
                (i * (chartWidth - 92)) / (analytics.activityByDay.length - 1)
              : 40;
          const y =
            chartHeight -
            40 -
            (d.total / analytics.maxActivity) * (chartHeight - 60);

          return (
            <React.Fragment key={i}>
              <Circle
                cx={x}
                cy={y}
                r="5"
                fill={currentTheme.colors.primary}
                stroke="white"
                strokeWidth="2"
              />
              {/* Label du jour */}
              <SvgText
                x={x}
                y={chartHeight - 10}
                fontSize={SVG_FONT_SIZE_SMALL}
                fill={currentTheme.colors.textSecondary}
                textAnchor="middle"
              >
                {d.day}
              </SvgText>
              {/* Valeur */}
              {d.total > 0 && (
                <SvgText
                  x={x}
                  y={y - 10}
                  fontSize={SVG_FONT_SIZE_MEDIUM}
                  fill={currentTheme.colors.text}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {d.total}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={tw`flex-row justify-center mt-3`}>
        <View style={tw`flex-row items-center mr-4`}>
          <View
            style={[
              tw`w-3 h-3 rounded-full mr-1`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
          />
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.analytics.totalActivity", "Activité totale")}
          </UIText>
        </View>
      </View>
    </View>
  );
};
