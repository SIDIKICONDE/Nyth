import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { usePlanning } from "../../../../hooks/usePlanning";
import { useTasks } from "../../../../hooks/useTasks";
import { CalendarGridProps } from "../types";
import {
  generateCalendarDays,
  getEventsForDate,
  getGoalsForDate,
  getTasksForDate,
  isSelected,
  isToday,
} from "../utils";
import { DayCell } from "./DayCell";

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDatePress,
  onDateLongPress,
  onEventPress,
  onItemPress,
}) => {
  const { events, goals } = usePlanning();
  const { tasks } = useTasks();

  const calendarDays = generateCalendarDays(currentDate);

  return (
    <ScrollView style={styles.calendarGrid}>
      <View style={styles.weeksContainer}>
        {Array.from(
          { length: Math.ceil(calendarDays.length / 7) },
          (_, weekIndex) => (
            <View key={weekIndex} style={styles.week}>
              {calendarDays
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((date, dayIndex) => {
                  const dayEvents = date ? getEventsForDate(events, date) : [];
                  const dayGoals = date ? getGoalsForDate(goals, date) : [];
                  const dayTasks = date ? getTasksForDate(tasks, date) : [];
                  const isCurrentDay = date ? isToday(date) : false;
                  const isSelectedDay = date
                    ? isSelected(date, selectedDate)
                    : false;

                  return (
                    <DayCell
                      key={dayIndex}
                      date={date}
                      isToday={isCurrentDay}
                      isSelected={isSelectedDay}
                      events={dayEvents}
                      goals={dayGoals}
                      tasks={dayTasks}
                      onPress={onDatePress}
                      onLongPress={onDateLongPress}
                      onEventPress={onEventPress}
                      onItemPress={onItemPress}
                      hasItems={
                        dayEvents.length + dayGoals.length + dayTasks.length > 0
                      }
                    />
                  );
                })}
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  calendarGrid: {
    flex: 1,
  },
  weeksContainer: {
    paddingBottom: 16,
  },
  week: {
    flexDirection: "row",
  },
});
