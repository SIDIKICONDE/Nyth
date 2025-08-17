import React, { useMemo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

interface MonthlyChartProps {
  scripts: any[];
  recordings: any[];
}

const { width: screenWidth } = Dimensions.get('window');

export default function MonthlyChart({ scripts, recordings }: MonthlyChartProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const monthlyData = useMemo(() => {
    // Obtenir les 6 derniers mois
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        date,
        month: date.toLocaleDateString('fr-FR', { month: 'short' }),
        year: date.getFullYear(),
      });
    }

    return months.map(({ date, month, year }) => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const scriptsCount = scripts.filter(s => {
        const createdAt = new Date(s.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      const recordingsCount = recordings.filter(r => {
        const createdAt = new Date(r.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length;

      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        scripts: scriptsCount,
        recordings: recordingsCount,
        total: scriptsCount + recordingsCount,
      };
    });
  }, [scripts, recordings]);

  const maxValue = Math.max(...monthlyData.map(d => d.total), 10);
  const chartWidth = screenWidth - 64;
  const chartHeight = 150;
  const barWidth = (chartWidth - 20) / monthlyData.length - 10;

  return (
    <View style={[
      tw`p-4 rounded-xl`,
      { backgroundColor: currentTheme.colors.surface }
    ]}>
      <Text style={[
        tw`text-sm font-semibold mb-3`,
        { color: currentTheme.colors.text }
      ]}>
        {t('profile.analytics.monthlyProgress', 'Progression mensuelle')}
      </Text>

      <Svg width={chartWidth} height={chartHeight + 30}>
        {monthlyData.map((data, index) => {
          const x = 10 + index * (barWidth + 10);
          const scriptsHeight = (data.scripts / maxValue) * chartHeight;
          const recordingsHeight = (data.recordings / maxValue) * chartHeight;
          const totalHeight = scriptsHeight + recordingsHeight;

          return (
            <G key={index}>
              {/* Barre des enregistrements */}
              <Rect
                x={x}
                y={chartHeight - recordingsHeight}
                width={barWidth}
                height={recordingsHeight}
                fill={currentTheme.colors.secondary}
                rx={4}
              />

              {/* Barre des scripts */}
              <Rect
                x={x}
                y={chartHeight - totalHeight}
                width={barWidth}
                height={scriptsHeight}
                fill={currentTheme.colors.primary}
                rx={4}
              />

              {/* Valeur totale */}
              {data.total > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - totalHeight - 5}
                  fontSize="10"
                  fill={currentTheme.colors.text}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {data.total}
                </SvgText>
              )}

              {/* Label du mois */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 15}
                fontSize="11"
                fill={currentTheme.colors.textSecondary}
                textAnchor="middle"
              >
                {data.month}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      {/* Légende */}
              <View style={tw`flex-row justify-center mt-3 gap-4`}>
        <View style={tw`flex-row items-center`}>
          <View style={[
            tw`w-3 h-3 rounded mr-1`,
            { backgroundColor: currentTheme.colors.primary }
          ]} />
          <Text style={[
            tw`text-xs`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {t('profile.analytics.scripts', 'Scripts')}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={[
            tw`w-3 h-3 rounded mr-1`,
            { backgroundColor: currentTheme.colors.secondary }
          ]} />
          <Text style={[
            tw`text-xs`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            {t('profile.analytics.recordings', 'Enregistrements')}
          </Text>
        </View>
      </View>
    </View>
  );
} 