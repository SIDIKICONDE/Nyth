export interface TimeRange {
  label: string;
  value: "week" | "month" | "quarter" | "year";
  days: number;
}

export interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  scriptCreation: { date: string; count: number }[];
  recordingActivity: { date: string; count: number }[];
  subscriptionDistribution: {
    name: string;
    count: number;
    color: string;
    legendFontColor: string;
  }[];
  monthlyRevenue: { month: string; revenue: number }[];
  aiUsage: { date: string; count: number }[];
  deviceTypes: { name: string; percentage: number }[];
}

export interface ChartConfig {
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  decimalPlaces: number;
  color: (opacity?: number) => string;
  labelColor: (opacity?: number) => string;
  style?: any;
  propsForDots?: any;
  propsForBackgroundLines?: any;
  barPercentage?: number;
  fillShadowGradient?: string;
  fillShadowGradientOpacity?: number;
}

export const TIME_RANGES: TimeRange[] = [
  { label: "7 jours", value: "week", days: 7 },
  { label: "30 jours", value: "month", days: 30 },
  { label: "3 mois", value: "quarter", days: 90 },
  { label: "1 an", value: "year", days: 365 },
];
