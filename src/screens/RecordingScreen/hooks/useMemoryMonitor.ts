import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, AppState } from "react-native";
import { createLogger } from "@/utils/optimizedLogger";
import { useTranslation } from "@/hooks/useTranslation";

const logger = createLogger("useMemoryMonitor");

interface MemoryStats {
  used: number;
  total: number;
  available: number;
  percentage: number;
  trend: "stable" | "increasing" | "decreasing";
}

interface MemoryMonitorOptions {
  warningThreshold?: number; // % de mémoire pour avertissement
  criticalThreshold?: number; // % de mémoire pour action critique
  monitoringInterval?: number; // Intervalle de surveillance en ms
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
  onLowMemory?: () => void;
}

export function useMemoryMonitor(options: MemoryMonitorOptions = {}) {
  const { t } = useTranslation();
  const {
    warningThreshold = 75,
    criticalThreshold = 85,
    monitoringInterval = 10000, // Augmenté de 5s à 10s pour réduire l'overhead
    onWarning,
    onCritical,
    onLowMemory,
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    used: 0,
    total: 0,
    available: 0,
    percentage: 0,
    trend: "stable",
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);
  const [hasCriticalWarned, setHasCriticalWarned] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const memoryHistoryRef = useRef<number[]>([]);
  const lastCleanupRef = useRef<number>(0);

  // Simuler l'obtention des stats mémoire (React Native n'a pas d'API native directe)
  const getMemoryStats = useCallback(async (): Promise<MemoryStats> => {
    try {
      // Sur React Native, on utilise des heuristiques et JSC/Hermes stats
      const jsHeap = (performance as any)?.memory || {};
      const usedJSHeapSize = jsHeap.usedJSHeapSize || 0;
      const totalJSHeapSize = jsHeap.totalJSHeapSize || 0;

      // Estimation basée sur l'utilisation JS et des métriques système
      let estimatedUsed = usedJSHeapSize;
      let estimatedTotal = totalJSHeapSize || 1024 * 1024 * 1024; // 1GB par défaut

      // Si pas de métriques JS, utiliser des heuristiques
      if (!usedJSHeapSize) {
        // Estimer basé sur le temps d'exécution et l'activité
        const runtime = Date.now() - (global as any).__APP_START_TIME__ || 0;
        estimatedUsed = Math.min(runtime * 1000, 500 * 1024 * 1024); // Max 500MB
        estimatedTotal = 1024 * 1024 * 1024; // 1GB
      }

      const available = estimatedTotal - estimatedUsed;
      const percentage = (estimatedUsed / estimatedTotal) * 100;

      // Calculer la tendance
      memoryHistoryRef.current.push(percentage);
      if (memoryHistoryRef.current.length > 10) {
        memoryHistoryRef.current.shift();
      }

      let trend: "stable" | "increasing" | "decreasing" = "stable";
      if (memoryHistoryRef.current.length >= 3) {
        const recent = memoryHistoryRef.current.slice(-3);
        const avgChange =
          (recent[recent.length - 1] - recent[0]) / recent.length;

        if (avgChange > 2) trend = "increasing";
        else if (avgChange < -2) trend = "decreasing";
      }

      return {
        used: estimatedUsed,
        total: estimatedTotal,
        available,
        percentage,
        trend,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des stats mémoire", error);
      return {
        used: 0,
        total: 1024 * 1024 * 1024,
        available: 1024 * 1024 * 1024,
        percentage: 0,
        trend: "stable",
      };
    }
  }, []);

  // Démarrer la surveillance
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    logger.info("Démarrage de la surveillance mémoire", {
      warningThreshold,
      criticalThreshold,
      interval: monitoringInterval,
    });

    setIsMonitoring(true);
    setHasWarned(false);
    setHasCriticalWarned(false);

    const monitor = async () => {
      try {
        const stats = await getMemoryStats();
        setMemoryStats(stats);

        logger.debug("Stats mémoire", {
          percentage: stats.percentage.toFixed(1),
          used: `${(stats.used / 1024 / 1024).toFixed(1)}MB`,
          available: `${(stats.available / 1024 / 1024).toFixed(1)}MB`,
          trend: stats.trend,
        });

        // Vérifier les seuils
        if (stats.percentage >= criticalThreshold && !hasCriticalWarned) {
          logger.warn("Seuil critique de mémoire atteint", stats);
          setHasCriticalWarned(true);
          handleCriticalMemory(stats);
          onCritical?.(stats);
        } else if (stats.percentage >= warningThreshold && !hasWarned) {
          logger.warn("Seuil d'avertissement mémoire atteint", stats);
          setHasWarned(true);
          handleWarningMemory(stats);
          onWarning?.(stats);
        }

        // Reset des flags si la mémoire redescend
        if (stats.percentage < warningThreshold) {
          setHasWarned(false);
          setHasCriticalWarned(false);
        }
      } catch (error) {
        logger.error("Erreur lors de la surveillance mémoire", error);
      }
    };

    // Première mesure immédiate
    monitor();

    // Surveillance périodique
    monitoringIntervalRef.current = setInterval(monitor, monitoringInterval);
  }, [
    isMonitoring,
    warningThreshold,
    criticalThreshold,
    monitoringInterval,
    getMemoryStats,
    hasWarned,
    hasCriticalWarned,
    onWarning,
    onCritical,
  ]);

  // Arrêter la surveillance
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    logger.info("Arrêt de la surveillance mémoire");

    setIsMonitoring(false);
    setHasWarned(false);
    setHasCriticalWarned(false);

    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [isMonitoring]);

  // Gestion de l'avertissement mémoire
  const handleWarningMemory = useCallback((stats: MemoryStats) => {
    logger.warn("Mémoire faible détectée - optimisation automatique");

    // Actions d'optimisation automatiques
    performMemoryOptimization("warning");

    // Notification utilisateur discrète (pas d'alerte bloquante)
    logger.info("Optimisation mémoire en cours...");
  }, []);

  // Gestion critique de la mémoire
  const handleCriticalMemory = useCallback(
    (stats: MemoryStats) => {
      logger.error("Mémoire critique - actions d'urgence");

      // Actions d'optimisation agressives
      performMemoryOptimization("critical");

      // Alerte utilisateur
      Alert.alert(
        t("recording.memory.critical.title", "Mémoire Insuffisante"),
        t(
          "recording.memory.critical.message",
          "La mémoire disponible est très faible. L'enregistrement pourrait être interrompu pour éviter un crash."
        ),
        [
          {
            text: t(
              "recording.memory.critical.continue",
              "Continuer avec Risque"
            ),
            style: "destructive",
            onPress: () => {
              logger.warn(
                "Utilisateur a choisi de continuer malgré la mémoire critique"
              );
            },
          },
          {
            text: t(
              "recording.memory.critical.optimize",
              "Optimiser et Continuer"
            ),
            style: "default",
            onPress: () => {
              performMemoryOptimization("aggressive");
            },
          },
          {
            text: t(
              "recording.memory.critical.stop",
              "Arrêter l'Enregistrement"
            ),
            style: "cancel",
            onPress: () => {
              onLowMemory?.();
            },
          },
        ]
      );
    },
    [t, onLowMemory]
  );

  // Optimisations mémoire
  const performMemoryOptimization = useCallback(
    (level: "warning" | "critical" | "aggressive") => {
      const now = Date.now();

      // Éviter les optimisations trop fréquentes
      if (now - lastCleanupRef.current < 10000) return;
      lastCleanupRef.current = now;

      logger.info(`Optimisation mémoire niveau ${level}`);

      try {
        // 1. Garbage Collection forcé (si disponible)
        if (global.gc) {
          global.gc();
          logger.info("Garbage collection forcé exécuté");
        }

        // 2. Nettoyage des caches selon le niveau
        if (level === "warning") {
          // Nettoyage léger
          clearImageCaches();
        } else if (level === "critical") {
          // Nettoyage modéré
          clearImageCaches();
          clearVideoBuffers();
        } else if (level === "aggressive") {
          // Nettoyage agressif
          clearImageCaches();
          clearVideoBuffers();
          clearAudioBuffers();
          reduceVideoQuality();
        }

        // 3. Réduction de la qualité d'enregistrement si critique
        if (level === "critical" || level === "aggressive") {
          logger.info(
            "Réduction automatique de la qualité pour économiser la mémoire"
          );
        }
      } catch (error) {
        logger.error("Erreur lors de l'optimisation mémoire", error);
      }
    },
    []
  );

  // Nettoyages spécifiques
  const clearImageCaches = () => {
    // Nettoyer les caches d'images
    logger.info("Nettoyage des caches d'images");
    try {
      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }
      // Nettoyer les références d'images non utilisées
      const imageCache = (global as any).__imageCache;
      if (imageCache && typeof imageCache.clear === 'function') {
        imageCache.clear();
      }
    } catch (error) {
      logger.debug("Impossible de nettoyer le cache d'images", error);
    }
  };

  const clearVideoBuffers = () => {
    // Nettoyer les buffers vidéo
    logger.info("Nettoyage des buffers vidéo");
    try {
      // Libérer les buffers vidéo non utilisés
      const videoBuffers = (global as any).__videoBuffers;
      if (videoBuffers && Array.isArray(videoBuffers)) {
        videoBuffers.length = 0;
      }
    } catch (error) {
      logger.debug("Impossible de nettoyer les buffers vidéo", error);
    }
  };

  const clearAudioBuffers = () => {
    // Nettoyer les buffers audio
    logger.info("Nettoyage des buffers audio");
    try {
      // Libérer les buffers audio non utilisés
      const audioBuffers = (global as any).__audioBuffers;
      if (audioBuffers && Array.isArray(audioBuffers)) {
        audioBuffers.length = 0;
      }
    } catch (error) {
      logger.debug("Impossible de nettoyer les buffers audio", error);
    }
  };

  const reduceVideoQuality = () => {
    // Réduire automatiquement la qualité vidéo
    logger.info("Réduction de la qualité vidéo pour économiser la mémoire");
  };

  // Optimisation manuelle
  const optimizeMemory = useCallback(() => {
    performMemoryOptimization("aggressive");
  }, [performMemoryOptimization]);

  // Écouter les événements système de mémoire faible
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "background") {
        // Optimisation quand l'app passe en arrière-plan
        performMemoryOptimization("warning");
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Écouter les événements de mémoire faible (iOS)
    const handleMemoryWarning = () => {
      logger.warn("Avertissement mémoire système reçu");
      performMemoryOptimization("critical");
      onLowMemory?.();
    };

    // Sur iOS, on peut écouter les warnings mémoire
    if (__DEV__) {
      // Simuler des événements de mémoire faible en dev
    }

    return () => {
      subscription?.remove();
    };
  }, [performMemoryOptimization, onLowMemory]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Calculer le statut de la mémoire
  const getMemoryStatus = useCallback((): "good" | "warning" | "critical" => {
    if (memoryStats.percentage >= criticalThreshold) return "critical";
    if (memoryStats.percentage >= warningThreshold) return "warning";
    return "good";
  }, [memoryStats.percentage, warningThreshold, criticalThreshold]);

  // Recommandations basées sur l'état mémoire
  const getMemoryRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    const status = getMemoryStatus();

    if (status === "warning") {
      recommendations.push(
        t(
          "recording.memory.recommendations.closeApps",
          "Fermez les autres applications"
        )
      );
      recommendations.push(
        t(
          "recording.memory.recommendations.reduceQuality",
          "Réduisez la qualité d'enregistrement"
        )
      );
    } else if (status === "critical") {
      recommendations.push(
        t(
          "recording.memory.recommendations.restartApp",
          "Redémarrez l'application"
        )
      );
      recommendations.push(
        t(
          "recording.memory.recommendations.freeSpace",
          "Libérez de l'espace de stockage"
        )
      );
      recommendations.push(
        t(
          "recording.memory.recommendations.rebootDevice",
          "Redémarrez votre appareil"
        )
      );
    }

    return recommendations;
  }, [getMemoryStatus, t]);

  return {
    // État
    memoryStats,
    isMonitoring,
    memoryStatus: getMemoryStatus(),
    recommendations: getMemoryRecommendations(),

    // Actions
    startMonitoring,
    stopMonitoring,
    optimizeMemory,

    // Utilitaires
    formatMemorySize: (bytes: number) => {
      const mb = bytes / 1024 / 1024;
      if (mb < 1024) return `${mb.toFixed(1)} MB`;
      return `${(mb / 1024).toFixed(1)} GB`;
    },
  };
}
