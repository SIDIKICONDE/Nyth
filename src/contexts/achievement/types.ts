import { Achievement } from "../../types/achievements";

export interface AchievementContextType {
  showAchievement: (achievement: Achievement) => void;
  notificationQueue: Achievement[];
  addToQueue: (achievements: Achievement[]) => void;
  clearQueue: () => void;
}

export interface AchievementProviderProps {
  children: React.ReactNode;
}

export interface AchievementState {
  notificationQueue: Achievement[];
  currentNotification: Achievement | null;
}
