import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyStats {
  date: string;
  scriptsCreated: number;
  recordingsCreated: number;
  totalRecordingTime: number;
}

interface AnalyticsHistory {
  dailyStats: DailyStats[];
  lastUpdated: string;
}

const ANALYTICS_HISTORY_KEY = '@analytics_history';

export function useAnalyticsHistory() {
  const [history, setHistory] = useState<AnalyticsHistory>({
    dailyStats: [],
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  const saveHistory = async (newHistory: AnalyticsHistory) => {
    try {
      await AsyncStorage.setItem(ANALYTICS_HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {}
  };

  const updateTodayStats = async (stats: Omit<DailyStats, 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newHistory = { ...history };
    
    const todayIndex = newHistory.dailyStats.findIndex(s => s.date === today);
    
    if (todayIndex >= 0) {
      newHistory.dailyStats[todayIndex] = {
        ...stats,
        date: today,
      };
    } else {
      newHistory.dailyStats.push({
        ...stats,
        date: today,
      });
    }
    
    // Garder seulement les 90 derniers jours
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    newHistory.dailyStats = newHistory.dailyStats.filter(
      s => new Date(s.date) >= ninetyDaysAgo
    );
    
    newHistory.lastUpdated = new Date().toISOString();
    await saveHistory(newHistory);
  };

  const getWeeklyTrend = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeek = history.dailyStats.filter(s => {
      const date = new Date(s.date);
      return date >= weekAgo && date <= today;
    });

    const lastWeek = history.dailyStats.filter(s => {
      const date = new Date(s.date);
      return date >= twoWeeksAgo && date < weekAgo;
    });

    const thisWeekTotal = thisWeek.reduce((sum, s) => 
      sum + s.scriptsCreated + s.recordingsCreated, 0
    );
    const lastWeekTotal = lastWeek.reduce((sum, s) => 
      sum + s.scriptsCreated + s.recordingsCreated, 0
    );

    if (lastWeekTotal === 0) return 0;
    return Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
  };

  const getMonthlyTrend = () => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const thisMonth = history.dailyStats.filter(s => {
      const date = new Date(s.date);
      return date >= monthAgo && date <= today;
    });

    const lastMonth = history.dailyStats.filter(s => {
      const date = new Date(s.date);
      return date >= twoMonthsAgo && date < monthAgo;
    });

    const thisMonthTotal = thisMonth.reduce((sum, s) => 
      sum + s.scriptsCreated + s.recordingsCreated, 0
    );
    const lastMonthTotal = lastMonth.reduce((sum, s) => 
      sum + s.scriptsCreated + s.recordingsCreated, 0
    );

    if (lastMonthTotal === 0) return 0;
    return Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
  };

  const getStreak = () => {
    if (history.dailyStats.length === 0) return 0;

    // Trier par date décroissante
    const sorted = [...history.dailyStats].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sorted.length; i++) {
      const statsDate = new Date(sorted[i].date);
      statsDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (statsDate.getTime() === expectedDate.getTime() && 
          (sorted[i].scriptsCreated > 0 || sorted[i].recordingsCreated > 0)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  return {
    history,
    isLoading,
    updateTodayStats,
    getWeeklyTrend,
    getMonthlyTrend,
    getStreak,
  };
}

export default useAnalyticsHistory; 