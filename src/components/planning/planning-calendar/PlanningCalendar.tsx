import React, { useCallback, useMemo } from "react";
import { View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { PlanningEvent } from "../../../types/planning";
import { CalendarGrid } from "./components/CalendarGrid";
import { CalendarHeader } from "./components/CalendarHeader";
import { DayNameHeader } from "./components/DayNameHeader";
import { DateContextMenu } from "./components/DateContextMenu";
import { usePlanningCalendar } from "./hooks/usePlanningCalendar";
import { useContextMenu } from "./hooks/useContextMenu";
import { styles } from "./styles";
import { PlanningCalendarProps } from "./types";

export const PlanningCalendar: React.FC<PlanningCalendarProps> = React.memo(
  ({
    onEventPress,
    onDatePress,
    onCreateEvent,
    onCreateGoal,
    onCreateTask,
  }) => {
    const { currentTheme } = useTheme();
    const {
      currentDate,
      selectedDate,
      handleNavigateMonth,
      handleGoToToday,
      handleDatePress,
      getItemsForDay,
    } = usePlanningCalendar();

    const {
      isVisible: isContextMenuVisible,
      contextMenuDate,
      showContextMenu,
      hideContextMenu,
    } = useContextMenu();

    const handleDatePressInternal = useCallback(
      (date: Date) => {
        handleDatePress(date);
        onDatePress?.(date);
        hideContextMenu();
      },
      [handleDatePress, onDatePress, hideContextMenu]
    );

    const handleDateLongPress = useCallback(
      (date: Date) => {
        handleDatePress(date);
        showContextMenu(date);
      },
      [handleDatePress, showContextMenu]
    );

    const handleCreateEventInternal = useCallback(
      (date: Date) => {
        onCreateEvent?.(date);
      },
      [onCreateEvent]
    );

    const handleCreateGoalInternal = useCallback(
      (date: Date) => {
        onCreateGoal?.(date);
      },
      [onCreateGoal]
    );

    const handleCreateTaskInternal = useCallback(
      (date: Date) => {
        onCreateTask?.(date);
      },
      [onCreateTask]
    );

    const handleCloseContextMenu = useCallback(() => {
      hideContextMenu();
    }, [hideContextMenu]);

    const dayNames = useMemo(() => {
      const format = new Intl.DateTimeFormat(undefined, { weekday: "short" });
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - date.getDay() + i);
        days.push(format.format(date));
      }
      return days;
    }, []);

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <CalendarHeader
          currentDate={currentDate}
          onNavigateMonth={handleNavigateMonth}
          onGoToToday={handleGoToToday}
        />

        <DayNameHeader dayNames={dayNames} />

        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDatePress={handleDatePressInternal}
          onDateLongPress={handleDateLongPress}
          onEventPress={onEventPress}
        />

        {/* Menu contextuel */}
        {contextMenuDate && (
          <DateContextMenu
            isVisible={isContextMenuVisible}
            onClose={handleCloseContextMenu}
            selectedDate={contextMenuDate}
            onCreateEvent={handleCreateEventInternal}
            onCreateGoal={handleCreateGoalInternal}
            onCreateTask={handleCreateTaskInternal}
          />
        )}
      </View>
    );
  }
);

PlanningCalendar.displayName = "PlanningCalendar";
