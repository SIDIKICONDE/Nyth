import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  AIHeader,
  ChatButton,
  MetricsOverview,
  QuickActions,
  Suggestions,
} from "./components";
import { usePlanningAIAssistant } from "./hooks";
import { styles } from "./styles";
import { PlanningAIAssistantProps } from "./types";

export const PlanningAIAssistantComponent: React.FC<
  PlanningAIAssistantProps
> = (props) => {
  const { currentTheme } = useTheme();
  const {
    displayExpanded,
    shouldRender,
    suggestions,
    eventMetrics,
    completionRate,
    hasOverdueEvents,
    quickActions,
    handleToggleVisibility,
    handleSuggestionPress,
    handleChatButtonPress,
  } = usePlanningAIAssistant(props);

  if (!shouldRender) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <AIHeader
        isExpanded={displayExpanded}
        onToggle={handleToggleVisibility}
      />

      {displayExpanded && (
        <View style={styles.content}>
          <Suggestions
            suggestions={suggestions}
            onSuggestionPress={handleSuggestionPress}
          />

          <MetricsOverview
            eventMetrics={eventMetrics}
            completionRate={completionRate}
            hasOverdueEvents={hasOverdueEvents}
          />

          <QuickActions
            actions={quickActions}
            onActionPress={handleSuggestionPress}
          />

          <ChatButton onPress={handleChatButtonPress} />
        </View>
      )}
    </View>
  );
};
