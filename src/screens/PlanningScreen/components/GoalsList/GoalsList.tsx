import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Goal } from "../../../../types/planning";
import { ActionMenu, EmptyState, GoalCard } from "./components";
import { useGoalActions } from "./hooks/useGoalActions";
import { GoalsListProps } from "./types";

export const GoalsList: React.FC<GoalsListProps> = ({
  goals,
  onGoalPress,
  onGoalEdit,
  onGoalDelete,
  onGoalProgressUpdate,
  onGoalComplete,
  onGoalReactivate,
  onCancelReminders,
}) => {
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const goalActions = useGoalActions({
    onGoalProgressUpdate,
    onGoalComplete,
    onGoalReactivate,
    onGoalDelete,
  });

  // Définir tous les hooks avant toute condition de retour
  const handleLongPress = useCallback((goalId: string) => {
    setShowActionMenu(goalId);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowActionMenu(null);
  }, []);

  const createGoalHandlers = useCallback((goal: Goal) => ({
    onLongPress: () => handleLongPress(goal.id),
    onQuickIncrement: () => goalActions.handleQuickIncrement(goal),
    onQuickDecrement: () => goalActions.handleQuickDecrement(goal),
    onMarkComplete: () => goalActions.handleMarkComplete(goal),
  }), [handleLongPress, goalActions]);

  const createMenuHandlers = useCallback((goal: Goal) => ({
    onEdit: () => {
      handleCloseMenu();
      onGoalPress?.(goal);
    },
    onComplete: () => {
      handleCloseMenu();
      goalActions.handleMarkComplete(goal);
    },
    onReactivate: () => {
      handleCloseMenu();
      goalActions.handleReactivateGoal(goal);
    },
    onDelete: () => {
      goalActions.handleDeleteGoal(goal);
      handleCloseMenu();
    },
    onCancelReminders: () => {
      onCancelReminders?.(goal.id);
      handleCloseMenu();
    },
  }), [handleCloseMenu, onGoalPress, goalActions, onCancelReminders]);

  // Fonction de rendu optimisée pour FlatList
  const renderGoalItem = useCallback(({ item: goal }: { item: Goal }) => {
    const goalHandlers = createGoalHandlers(goal);
    const menuHandlers = createMenuHandlers(goal);

    return (
      <View>
        <GoalCard goal={goal} {...goalHandlers} />
        <ActionMenu
          goal={goal}
          visible={showActionMenu === goal.id}
          onClose={handleCloseMenu}
          {...menuHandlers}
        />
      </View>
    );
  }, [showActionMenu, createGoalHandlers, createMenuHandlers, handleCloseMenu]);

  // Fonction keyExtractor mémorisée
  const keyExtractor = useCallback((item: Goal) => item.id, []);

  // Configuration optimisée de FlatList
  const flatListConfig = useMemo(() => ({
    windowSize: 10,
    maxToRenderPerBatch: 5,
    initialNumToRender: 10,
    removeClippedSubviews: true,
    updateCellsBatchingPeriod: 50,
  }), []);

  // État vide - maintenant après tous les hooks
  if (goals.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      data={goals}
      renderItem={renderGoalItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      {...flatListConfig}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 6,
  },
});
