import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { EventTimeline } from "../../../../../components/planning/event-timeline";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { GoalsList } from "../../GoalsList";
import { ERROR_MESSAGES } from "../constants";
import { TabContentProps } from "../types";

import { createOptimizedLogger } from '../../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('TabContent');

export const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  events,
  goals,
  eventHandlers,
  goalHandlers,
  onCreateGoal,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const renderContent = () => {
    try {
      if (activeTab === "events") {
        return (
          <View style={styles.eventsContainer}>
            <EventTimeline
              events={events}
              onEventPress={eventHandlers.onEventPress}
              onEventEdit={eventHandlers.onEventEdit}
              onEventDelete={eventHandlers.onEventDelete}
              onEventStatusChange={eventHandlers.onEventStatusChange}
              onCreateEvent={eventHandlers.onCreateEvent}
            />
          </View>
        );
      } else {
        return (
          <View style={styles.goalsContainer}>
            <ScrollView style={styles.goalsScrollView}>
              <GoalsList
                goals={goals}
                onGoalPress={goalHandlers.onGoalPress}
                onGoalEdit={goalHandlers.onGoalEdit}
                onGoalDelete={goalHandlers.onGoalDelete}
                onGoalProgressUpdate={goalHandlers.onGoalProgressUpdate}
                onGoalComplete={goalHandlers.onGoalComplete}
                onGoalReactivate={goalHandlers.onGoalReactivate}
                onCancelReminders={goalHandlers.onCancelReminders}
              />
            </ScrollView>

            {/* Bouton FAB pour créer un objectif */}
            {onCreateGoal && (
              <TouchableOpacity
                style={[
                  styles.createGoalFAB,
                  { backgroundColor: currentTheme.colors.success },
                ]}
                onPress={onCreateGoal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        );
      }
    } catch (error) {
      logger.error("❌ Erreur dans renderContent:", error);
      return (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <UIText
            size="lg"
            weight="semibold"
            color={currentTheme.colors.text}
            style={[ui, styles.errorText]}
          >
            {ERROR_MESSAGES.renderError.title}
          </UIText>
          <UIText
            size="sm"
            color={currentTheme.colors.textSecondary}
            style={[ui, styles.errorSubtext]}
          >
            {ERROR_MESSAGES.renderError.subtitle}
          </UIText>
        </View>
      );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventsContainer: {
    flex: 1,
  },
  goalsContainer: {
    flex: 1,
    position: "relative",
  },
  goalsScrollView: {
    flex: 1,
  },
  createGoalFAB: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginBottom: 12,
    textAlign: "center",
  },
  errorSubtext: {
    textAlign: "center",
  },
});
