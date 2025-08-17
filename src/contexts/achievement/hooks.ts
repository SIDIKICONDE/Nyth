import { useContext } from "react";
import { AchievementContext } from "./context";

export const useAchievementNotifications = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error(
      "useAchievementNotifications must be used within AchievementProvider"
    );
  }
  return context;
};
