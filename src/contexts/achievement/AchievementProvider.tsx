import React, { useEffect, useState } from "react";
import AchievementNotification from "../../components/achievements/AchievementNotification";
import { Achievement } from "../../types/achievements";
import { AchievementContext } from "./context";
import { AchievementProviderProps, AchievementState } from "./types";

export const AchievementProvider: React.FC<AchievementProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<AchievementState>({
    notificationQueue: [],
    currentNotification: null,
  });

  // Traiter la file d'attente des notifications
  useEffect(() => {
    if (!state.currentNotification && state.notificationQueue.length > 0) {
      const [next, ...rest] = state.notificationQueue;
      setState({
        currentNotification: next,
        notificationQueue: rest,
      });
    }
  }, [state.currentNotification, state.notificationQueue]);

  const showAchievement = (achievement: Achievement) => {
    setState((prev) => ({
      ...prev,
      notificationQueue: [...prev.notificationQueue, achievement],
    }));
  };

  const addToQueue = (achievements: Achievement[]) => {
    setState((prev) => ({
      ...prev,
      notificationQueue: [...prev.notificationQueue, ...achievements],
    }));
  };

  const clearQueue = () => {
    setState((prev) => ({
      ...prev,
      notificationQueue: [],
    }));
  };

  const handleDismiss = () => {
    setState((prev) => ({
      ...prev,
      currentNotification: null,
    }));
  };

  const contextValue = {
    showAchievement,
    notificationQueue: state.notificationQueue,
    addToQueue,
    clearQueue,
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      {state.currentNotification && (
        <AchievementNotification
          achievement={state.currentNotification}
          onDismiss={handleDismiss}
        />
      )}
    </AchievementContext.Provider>
  );
};
