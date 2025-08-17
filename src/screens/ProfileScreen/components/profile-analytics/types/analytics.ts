export interface DayActivity {
  date: Date;
  day: string;
  scripts: number;
  recordings: number;
  total: number;
}

export interface HourlyActivity {
  hour: number;
  count: number;
}

export interface Analytics {
  avgRecordingTime: number;
  activityByDay: DayActivity[];
  maxActivity: number;
  hourlyActivity: HourlyActivity[];
  peakHour: HourlyActivity;
  totalDays: number;
  thisWeekTotal: number;
  weekTrend: number;
  productivity: string;
} 