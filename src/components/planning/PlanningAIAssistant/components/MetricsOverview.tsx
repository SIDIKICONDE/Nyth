import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { LABELS } from "../constants";
import { styles } from "../styles";
import { MetricsOverviewProps } from "../types";
import { InsightCard } from "./InsightCard";

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  eventMetrics,
  completionRate,
  hasOverdueEvents,
}) => {
  const { currentTheme } = useTheme();

  if (eventMetrics.total === 0) {
    return null;
  }

  const insightText = `${eventMetrics.completed}/${eventMetrics.total} ${
    LABELS.EVENTS_COMPLETED_TEXT
  } • ${completionRate.toFixed(0)}${LABELS.COMPLETION_SUFFIX}${
    hasOverdueEvents ? ` • ${LABELS.OVERDUE_WARNING}` : ""
  }`;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {LABELS.OVERVIEW_TITLE}
      </Text>
      <InsightCard text={insightText} />
    </View>
  );
};
