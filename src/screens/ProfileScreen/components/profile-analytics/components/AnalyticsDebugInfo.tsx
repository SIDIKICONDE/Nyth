import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useCloudAnalytics } from '../../../../../hooks/useCloudAnalytics';

export const AnalyticsDebugInfo: React.FC = () => {
  const { currentTheme } = useTheme();
  const { analytics, isLoading, error, refreshAnalytics } = useCloudAnalytics();

  if (__DEV__ && analytics) {
    return (
      <View style={[
        tw`p-3 rounded-lg mb-4`,
        { backgroundColor: currentTheme.colors.surface + '20' }
      ]}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={[
            tw`text-xs font-mono`,
            { color: currentTheme.colors.textSecondary }
          ]}>
            🐛 Debug Analytics
          </Text>
          <TouchableOpacity 
            onPress={refreshAnalytics}
            style={tw`p-1`}
          >
            <MaterialCommunityIcons 
              name="refresh" 
              size={16} 
              color={currentTheme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={[
          tw`text-xs font-mono`,
          { color: currentTheme.colors.textMuted }
        ]}>
          {JSON.stringify({
            isLoading,
            error,
            totalScripts: analytics?.totalScripts,
            totalRecordings: analytics?.totalRecordings,
            avgTime: analytics?.avgRecordingTime,
            streak: analytics?.currentStreak,
            lastUpdate: analytics?.updatedAt ? new Date(analytics.updatedAt).toLocaleTimeString() : 'N/A'
          }, null, 2)}
        </Text>
      </View>
    );
  }

  return null;
}; 