import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import ActivityHeatmap from "../../../components/analytics/ActivityHeatmap";
import MonthlyChart from "../../../components/analytics/MonthlyChart";
import { useHomeData } from "../../../components/home/useHomeData";
import { H4, UIText } from "../../../components/ui/Typography";
import { useAuth } from "../../../contexts/AuthContext";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCloudAnalytics } from "../../../hooks/useCloudAnalytics";
import { useTranslation } from "../../../hooks/useTranslation";
import { useContrastOptimization } from "../../../hooks/useContrastOptimization";
import analyticsService from "../../../services/firebase/analyticsService";
import {
  HourlyDistribution,
  InsightsSection,
  LifetimeStats,
  StatsCards,
  WeekActivityChart,
  useProfileAnalytics,
} from "./profile-analytics";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ProfileAnalytics');

export default function ProfileAnalytics() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { scripts } = useScripts();
  const { recordings } = useHomeData();
  const analytics = useProfileAnalytics();
  const { isLoading: isLoadingCloud } = useCloudAnalytics();
  const { user } = useAuth();

  const handleDebugAnalytics = async () => {
    if (user?.uid) {
      logger.debug("Debug analytics for user:", user.uid);
    }
  };

  // Afficher un indicateur de chargement si les données sont en cours de chargement
  if (isLoadingCloud) {
    return (
      <View style={tw`pb-8`}>
        <View style={tw`flex-row items-center mb-4`}>
          <H4 style={{ color: currentTheme.colors.text }}>
            📈 {t("profile.analytics.title", "Analytics")}
          </H4>
          <View
            style={[
              tw`flex-1 h-0.5 ml-4`,
              { backgroundColor: currentTheme.colors.border },
            ]}
          />
        </View>

        <View
          style={[
            tw`p-4 rounded-lg items-center`,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <UIText size="sm" color={currentTheme.colors.textSecondary}>
            {t("profile.analytics.loading", "Chargement des analytics...")}
          </UIText>

          {/* Boutons de débogage temporaires */}
          {/* {__DEV__ && (
            <View style={tw`mt-4 gap-2`}>
              <TouchableOpacity
                onPress={handleDebugAnalytics}
                style={[
                  tw`p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.primary }
                ]}
              >
                <UIText weight="bold" style={tw`text-white text-center`}>
                  🔍 Vérifier Analytics Firebase (Debug)
                </UIText>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={async () => {
                  if (user?.uid) {
                    logger.debug('🔄 Recalcul forcé des analytics...');
                    await analyticsService.recalculateAllAnalytics(user.uid, scripts, recordings);
                    logger.debug('✅ Recalcul terminé');
                  }
                }}
                style={[
                  tw`p-3 rounded-lg`,
                  { backgroundColor: currentTheme.colors.secondary }
                ]}
              >
                <UIText weight="bold" style={tw`text-white text-center`}>
                  🔄 Forcer le recalcul (Debug)
                </UIText>
              </TouchableOpacity>
            </View>
          )} */}
        </View>
      </View>
    );
  }

  return (
    <View style={tw`pb-8`}>
      {/* Titre avec ligne */}
      <View style={tw`flex-row items-center mb-4`}>
        <H4 style={{ color: currentTheme.colors.text }}>
          📈 {t("profile.analytics.title", "Analytics")}
        </H4>
        <View
          style={[
            tw`flex-1 h-0.5 ml-4`,
            { backgroundColor: currentTheme.colors.border },
          ]}
        />
      </View>

      {/* Debug info en mode développement */}
      {/* <AnalyticsDebugInfo /> */}

      {/* Boutons de debug supplémentaires */}
      {/* {__DEV__ && (
        <View style={[
          tw`mb-4 p-3 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface }
        ]}>
          <TouchableOpacity
            onPress={async () => {
              if (user?.uid) {
                logger.debug('📊 === ÉTAT COMPLET DES ANALYTICS ===');
                const analytics = await analyticsService.getUserAnalytics(user.uid);
                logger.debug('Analytics complètes:', JSON.stringify(analytics, null, 2));
                logger.debug('Scripts locaux:', scripts.length);
                logger.debug('Recordings locaux:', recordings.length);
                logger.debug('📊 === FIN DE L\'ÉTAT ===');
              }
            }}
            style={[
              tw`p-2 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary }
            ]}
          >
            <UIText size="xs" weight="bold" style={tw`text-white text-center`}>
              📊 Afficher l'état complet (Console)
            </UIText>
          </TouchableOpacity>
        </View>
      )} */}

      {/* Analytics content */}
      <View style={tw`mt-4`}>
        {/* Statistiques à vie */}
        <LifetimeStats />

        {/* Cartes de statistiques */}
        <StatsCards analytics={analytics} />

        {/* Graphique mensuel */}
        <MonthlyChart scripts={scripts} recordings={recordings} />

        {/* Graphique d'activité */}
        <WeekActivityChart analytics={analytics} />

        {/* Heatmap d'activité */}
        <ActivityHeatmap scripts={scripts} recordings={recordings} />

        {/* Distribution horaire */}
        <HourlyDistribution analytics={analytics} />

        {/* Statistiques supplémentaires */}
        <InsightsSection analytics={analytics} />
      </View>
    </View>
  );
}
