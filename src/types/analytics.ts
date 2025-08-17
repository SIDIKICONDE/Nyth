export interface UserAnalytics {
  userId: string;
  avgRecordingTime: number;
  totalRecordingTime: number;
  totalRecordings: number;
  totalScripts: number;
  productivity: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  weeklyStats: WeeklyStats;
  monthlyStats: MonthlyStats;
  hourlyDistribution: HourlyDistribution;
  createdAt: string;
  updatedAt: string;
  lifetimeStats?: {
    totalScriptsCreated: number;
    totalRecordingsCreated: number;
    totalRecordingTime: number;
    firstActivityDate: string;
  };
}

export interface WeeklyStats {
  thisWeekTotal: number;
  lastWeekTotal: number;
  weekTrend: number;
  dailyActivity: { [date: string]: DailyActivity };
}

export interface MonthlyStats {
  [month: string]: {
    scripts: number;
    recordings: number;
    totalTime: number;
  };
}

export interface DailyActivity {
  date: string;
  scripts: number;
  recordings: number;
  totalTime: number;
}

export interface HourlyDistribution {
  [hour: number]: number;
}

export interface AnalyticsUpdate {
  type:
    | "script_created"
    | "script_deleted"
    | "recording_created"
    | "recording_deleted";
  timestamp: string;
  data: {
    scriptId?: string;
    recordingId?: string;
    duration?: number;
  };
}
