import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";

import {
  AnalyticsContent,
  AnalyticsHeader,
  EmptyState,
  LoadingState,
  PeriodSelector,
} from "./components";
import { useAnalyticsActions } from "./hooks/useAnalyticsActions";
import { useAnalyticsData } from "./hooks/useAnalyticsData";

export const AnalyticsTabContent: React.FC = () => {
  const { t } = useTranslation();

  // Custom hooks pour la logique
  const {
    selectedPeriod,
    setSelectedPeriod,
    isCalculating,
    localAnalytics,
    events,
    goals,
    isLoading,
    refreshData,
    user,
  } = useAnalyticsData();

  const { handleRefreshData } = useAnalyticsActions({
    refreshData,
    user,
    debugInfo: null,
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header avec bouton refresh et statistiques rapides */}
      <AnalyticsHeader
        onRefresh={handleRefreshData}
        isLoading={isLoading}
        totalEvents={localAnalytics.totalEvents}
        completionRate={localAnalytics.completionRate}
      />

      {/* Sélecteur de période */}
      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Contenu principal */}
      {isLoading || isCalculating ? (
        <LoadingState isLoading={isLoading} isCalculating={isCalculating} />
      ) : events.length === 0 && goals.length === 0 ? (
        <EmptyState />
      ) : (
        <AnalyticsContent
          localAnalytics={localAnalytics}
          selectedPeriod={selectedPeriod}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 16,
  },
});
