import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';

interface ActivityHeatmapProps {
  scripts: any[];
  recordings: any[];
}

export default function ActivityHeatmap({ scripts, recordings }: ActivityHeatmapProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Obtenir les 5 dernières semaines
    const weeks = [];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 34); // 5 semaines
    
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= today) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayActivity = [
        ...scripts.filter(s => {
          const createdAt = new Date(s.createdAt);
          return createdAt >= dayStart && createdAt <= dayEnd;
        }),
        ...recordings.filter(r => {
          const createdAt = new Date(r.createdAt);
          return createdAt >= dayStart && createdAt <= dayEnd;
        })
      ].length;
      
      data.push({
        date: new Date(currentDate),
        activity: dayActivity,
        dayOfWeek: currentDate.getDay(),
        weekIndex: Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }, [scripts, recordings]);

  const maxActivity = Math.max(...heatmapData.map(d => d.activity), 1);

  const getActivityColor = (activity: number) => {
    if (activity === 0) return currentTheme.isDark ? '#1F2937' : '#F3F4F6';
    const intensity = activity / maxActivity;
    
    if (intensity < 0.25) return currentTheme.colors.primary + '40';
    if (intensity < 0.5) return currentTheme.colors.primary + '60';
    if (intensity < 0.75) return currentTheme.colors.primary + '80';
    return currentTheme.colors.primary;
  };

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <View style={[
      tw`p-4 rounded-xl`,
      { backgroundColor: currentTheme.colors.surface }
    ]}>
      <Text style={[
        tw`text-sm font-semibold mb-3`,
        { color: currentTheme.colors.text }
      ]}>
        {t('profile.analytics.activityHeatmap', 'Carte d\'activité')}
      </Text>

      <View style={tw`flex-row`}>
        {/* Labels des jours */}
        <View style={tw`mr-2`}>
          {weekDays.map((day, i) => (
            <View key={i} style={tw`h-4 justify-center mb-0.5`}>
              <Text style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary }
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Grille de la heatmap */}
        <View style={tw`flex-1`}>
          <View style={tw`flex-row flex-wrap`}>
            {Array.from({ length: 5 }, (_, weekIndex) => (
              <View key={weekIndex} style={tw`mr-0.5`}>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayData = heatmapData.find(
                    d => d.weekIndex === weekIndex && d.dayOfWeek === dayIndex
                  );
                  
                  if (!dayData) return <View key={dayIndex} style={tw`w-4 h-4 mb-0.5`} />;
                  
                  return (
                    <View
                      key={dayIndex}
                      style={[
                        tw`w-4 h-4 rounded-sm mb-0.5`,
                        { backgroundColor: getActivityColor(dayData.activity) }
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Légende */}
      <View style={tw`flex-row items-center justify-end mt-3`}>
        <Text style={[
          tw`text-xs mr-2`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('profile.analytics.less', 'Moins')}
        </Text>
        {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
          <View
            key={i}
            style={[
              tw`w-3 h-3 rounded-sm mr-0.5`,
              { 
                backgroundColor: intensity === 0 
                  ? (currentTheme.isDark ? '#1F2937' : '#F3F4F6')
                  : currentTheme.colors.primary + Math.round(intensity * 255).toString(16).padStart(2, '0')
              }
            ]}
          />
        ))}
        <Text style={[
          tw`text-xs ml-1`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('profile.analytics.more', 'Plus')}
        </Text>
      </View>
    </View>
  );
} 