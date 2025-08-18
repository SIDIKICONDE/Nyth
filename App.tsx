import "react-native-get-random-values";
import 'react-native-reanimated';

import { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import ErrorBoundary from "./src/components/common/ErrorBoundary";
import { SplashScreenManager } from "./src/components/common/SplashScreenManager";
import { CombinedProviders } from "./src/contexts/CombinedProviders";
import { NavigationContainer } from "@react-navigation/native";
import { AnalyticsMigrationManager } from "./src/components/common/AnalyticsMigrationManager";


import AppNavigator from "./src/navigation/AppNavigator";

import {
  createOptimizedLogger,
  disableConsoleLogs,
} from "./src/utils/optimizedLogger";
import { performanceMonitor } from "./src/services/performance/PerformanceMonitor";

import { isI18nReady, waitForI18n } from "./src/locales/i18n";
import { useSimpleSessionTracker } from "./src/hooks/useSimpleSessionTracker";
import { OptimizedWarmupService } from "./src/services/performance/OptimizedWarmupService";
import { LazyLoadService } from "./src/services/performance/LazyLoadService";

const logger = createOptimizedLogger("App");

// Désactiver les logs console en production
disableConsoleLogs();

function AppContent() {
  useSimpleSessionTracker();

  return (
    <SplashScreenManager>
      <StatusBar barStyle="default" />
      <NavigationContainer>
        <AnalyticsMigrationManager>
          <AppNavigator />
        </AnalyticsMigrationManager>
      </NavigationContainer>
    </SplashScreenManager>
  );
}

export default function App() {
  logger.info("Application démarrée");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Enregistrer le gestionnaire de messages en arrière-plan
        messaging().setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
          console.log('Message handled in the background!', remoteMessage);
        });

        // Initialisation i18n si nécessaire
        if (!isI18nReady()) {
          logger.debug("Initialisation i18next...");
          await waitForI18n();
          logger.debug("i18next initialisé avec succès");
        }

        // Démarrer le service de warmup optimisé
        OptimizedWarmupService.init();

        // Initialiser le service de notification étendu
        try {
          const { enhancedNotificationService } = await import("./src/services/notifications/EnhancedNotificationService");
          await enhancedNotificationService.initialize();
          logger.info("✅ Service de notification initialisé");
        } catch (error) {
          logger.warn("⚠️ Service de notification non initialisé:", error);
        }

        // Précharger les modules critiques de manière lazy
        LazyLoadService.preloadModules([
          {
            name: "react-native-localize",
            loader: () => import("react-native-localize"),
          },
        ]).catch(() => {
          // Ignorer les erreurs de préchargement
        });

        // Activer le monitoring des performances en développement
        if (__DEV__) {
          performanceMonitor.startMonitoring();
          performanceMonitor.setThresholds({
            minFPS: 50,
            maxMemoryMB: 200,
            maxRenderTimeMS: 16,
            maxInteractionTimeMS: 50,
          });
        }
      } catch (error) {
        logger.error("Erreur lors de l'initialisation:", error);
      }
    };

    initializeApp();

    // Cleanup au démontage
    return () => {
      OptimizedWarmupService.cleanup();
      LazyLoadService.clearCache();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <CombinedProviders>
          <AppContent />
        </CombinedProviders>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
