// utils/performance/PerformanceMonitor.ts
import React from "react";
import { createLogger } from "@/utils/optimizedLogger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InteractionManager, LayoutAnimation } from "react-native";
import DeviceInfo from "react-native-device-info";

const logger = createLogger("PerformanceMonitor");

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  deviceInfo: {
    model: string;
    os: string;
    osVersion: string;
    brand: string;
    totalMemory: number;
    isEmulator: boolean;
  };
  metrics: {
    fps: number;
    jsThreadUsage: number;
    memoryUsage: number;
    batteryLevel: number;
    networkLatency: number;
    diskUsage: number;
  };
  componentMetrics: Map<string, ComponentMetrics>;
  apiMetrics: APIMetrics;
  navigationMetrics: NavigationMetrics;
  timestamp: number;
}

interface ComponentMetrics {
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  lastRenderTime: number;
  memoryLeaks: number;
}

interface APIMetrics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  errorsByEndpoint: Map<string, number>;
  slowestEndpoints: Array<{ endpoint: string; latency: number }>;
}

interface NavigationMetrics {
  screenTransitions: number;
  averageTransitionTime: number;
  screenTimeSpent: Map<string, number>;
  crashedScreens: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private apiMetrics: APIMetrics;
  private navigationMetrics: NavigationMetrics;
  private frameCallbackId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private jsEventLoopTimer: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;
  private performanceObservers: Map<
    string,
    (metric: PerformanceMetric) => void
  > = new Map();

  private constructor() {
    this.apiMetrics = {
      totalRequests: 0,
      successRate: 1,
      averageLatency: 0,
      errorsByEndpoint: new Map(),
      slowestEndpoints: [],
    };

    this.navigationMetrics = {
      screenTransitions: 0,
      averageTransitionTime: 0,
      screenTimeSpent: new Map(),
      crashedScreens: [],
    };

    this.initialize();
  }

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  private async initialize() {
    await this.loadPreviousMetrics();
    this.startFPSMonitoring();
    this.startJSThreadMonitoring();
    this.startPeriodicReporting();
    this.setupCrashReporting();
  }

  /**
   * Démarre le monitoring FPS
   */
  private startFPSMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        this.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.recordMetric({
          name: "fps",
          value: this.fps,
          unit: "fps",
          timestamp: Date.now(),
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      this.frameCallbackId = requestAnimationFrame(measureFPS);
    };

    measureFPS();
  }

  /**
   * Surveille l'utilisation du thread JS
   */
  private startJSThreadMonitoring() {
    let blocked = 0;
    let checks = 0;

    this.jsEventLoopTimer = setInterval(() => {
      const start = performance.now();

      InteractionManager.runAfterInteractions(() => {
        const duration = performance.now() - start;
        checks++;

        if (duration > 16) {
          // Plus de 16ms = frame drop potentiel
          blocked++;
        }

        if (checks >= 60) {
          // Toutes les secondes
          const blockageRate = (blocked / checks) * 100;
          this.recordMetric({
            name: "js_thread_blockage",
            value: blockageRate,
            unit: "%",
            timestamp: Date.now(),
          });

          blocked = 0;
          checks = 0;
        }
      });
    }, 16); // ~60fps
  }

  /**
   * Mesure le temps de rendu d'un composant
   */
  measureComponentRender(componentName: string, renderTime: number) {
    if (!this.componentMetrics.has(componentName)) {
      this.componentMetrics.set(componentName, {
        renderCount: 0,
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        lastRenderTime: 0,
        memoryLeaks: 0,
      });
    }

    const metrics = this.componentMetrics.get(componentName)!;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
    metrics.minRenderTime = Math.min(metrics.minRenderTime, renderTime);
    metrics.averageRenderTime =
      (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
      metrics.renderCount;

    // Détecter les rendus anormalement lents
    if (renderTime > 100) {
      logger.warn(`Rendu lent détecté: ${componentName} (${renderTime}ms)`);
      this.notifyObservers({
        name: "slow_render",
        value: renderTime,
        unit: "ms",
        timestamp: Date.now(),
        metadata: { component: componentName },
      });
    }
  }

  /**
   * Mesure une requête API
   */
  measureAPICall(
    endpoint: string,
    startTime: number,
    success: boolean,
    error?: Error
  ) {
    const latency = Date.now() - startTime;

    this.apiMetrics.totalRequests++;
    this.apiMetrics.averageLatency =
      (this.apiMetrics.averageLatency * (this.apiMetrics.totalRequests - 1) +
        latency) /
      this.apiMetrics.totalRequests;

    if (!success) {
      const errorCount = this.apiMetrics.errorsByEndpoint.get(endpoint) || 0;
      this.apiMetrics.errorsByEndpoint.set(endpoint, errorCount + 1);
    }

    // Mettre à jour le taux de succès
    const successCount =
      this.apiMetrics.totalRequests -
      Array.from(this.apiMetrics.errorsByEndpoint.values()).reduce(
        (a, b) => a + b,
        0
      );
    this.apiMetrics.successRate = successCount / this.apiMetrics.totalRequests;

    // Suivre les endpoints les plus lents
    this.updateSlowestEndpoints(endpoint, latency);

    // Alerter si la latence est élevée
    if (latency > 3000) {
      logger.warn(`API lente: ${endpoint} (${latency}ms)`);
      this.notifyObservers({
        name: "slow_api",
        value: latency,
        unit: "ms",
        timestamp: Date.now(),
        metadata: { endpoint, success, error: error?.message },
      });
    }
  }

  /**
   * Mesure une navigation
   */
  measureNavigation(fromScreen: string, toScreen: string, duration: number) {
    this.navigationMetrics.screenTransitions++;
    this.navigationMetrics.averageTransitionTime =
      (this.navigationMetrics.averageTransitionTime *
        (this.navigationMetrics.screenTransitions - 1) +
        duration) /
      this.navigationMetrics.screenTransitions;

    // Suivre le temps passé sur chaque écran
    const currentTime =
      this.navigationMetrics.screenTimeSpent.get(fromScreen) || 0;
    this.navigationMetrics.screenTimeSpent.set(
      fromScreen,
      currentTime + duration
    );

    if (duration > 500) {
      logger.warn(
        `Navigation lente: ${fromScreen} -> ${toScreen} (${duration}ms)`
      );
    }
  }

  /**
   * Enregistre une métrique
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Limiter la taille du buffer
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Notifier les observateurs
    this.notifyObservers(metric);
  }

  /**
   * Met à jour la liste des endpoints les plus lents
   */
  private updateSlowestEndpoints(endpoint: string, latency: number) {
    const existing = this.apiMetrics.slowestEndpoints.findIndex(
      (e) => e.endpoint === endpoint
    );

    if (existing >= 0) {
      this.apiMetrics.slowestEndpoints[existing].latency = Math.max(
        this.apiMetrics.slowestEndpoints[existing].latency,
        latency
      );
    } else {
      this.apiMetrics.slowestEndpoints.push({ endpoint, latency });
    }

    // Garder seulement le top 10
    this.apiMetrics.slowestEndpoints.sort((a, b) => b.latency - a.latency);
    this.apiMetrics.slowestEndpoints = this.apiMetrics.slowestEndpoints.slice(
      0,
      10
    );
  }

  /**
   * Configure le reporting de crash
   */
  private setupCrashReporting() {
    type RNErrorUtils = {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler: (
        handler: (error: unknown, isFatal?: boolean) => void
      ) => void;
    };
    const errorUtils = (global as unknown as { ErrorUtils?: RNErrorUtils })
      .ErrorUtils;
    if (!errorUtils) return;
    const originalError = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
      const safeError =
        error instanceof Error ? error : new Error(String(error));
      this.recordCrash(safeError, Boolean(isFatal));
      originalError?.(error, isFatal);
    });
  }

  /**
   * Enregistre un crash
   */
  private recordCrash(error: Error, isFatal: boolean) {
    const crashMetric: PerformanceMetric = {
      name: "crash",
      value: isFatal ? 1 : 0,
      unit: "count",
      timestamp: Date.now(),
      metadata: {
        error: error.message,
        stack: error.stack,
        isFatal,
      },
    };

    this.recordMetric(crashMetric);

    // Sauvegarder immédiatement
    this.saveMetrics();
  }

  /**
   * Génère un rapport de performance
   */
  async generateReport(): Promise<PerformanceReport> {
    const deviceInfo = {
      model: DeviceInfo.getModel(),
      os: DeviceInfo.getSystemName(),
      osVersion: DeviceInfo.getSystemVersion(),
      brand: DeviceInfo.getBrand(),
      totalMemory: await DeviceInfo.getTotalMemory(),
      isEmulator: await DeviceInfo.isEmulator(),
    };

    const batteryLevel = await DeviceInfo.getBatteryLevel();
    const usedMemory = await DeviceInfo.getUsedMemory();
    const freeDiskStorage = await DeviceInfo.getFreeDiskStorage();
    const totalDiskCapacity = await DeviceInfo.getTotalDiskCapacity();

    return {
      deviceInfo,
      metrics: {
        fps: this.fps,
        jsThreadUsage: this.calculateJSThreadUsage(),
        memoryUsage: usedMemory,
        batteryLevel: batteryLevel * 100,
        networkLatency: this.apiMetrics.averageLatency,
        diskUsage:
          ((totalDiskCapacity - freeDiskStorage) / totalDiskCapacity) * 100,
      },
      componentMetrics: this.componentMetrics,
      apiMetrics: this.apiMetrics,
      navigationMetrics: this.navigationMetrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Calcule l'utilisation du thread JS
   */
  private calculateJSThreadUsage(): number {
    const recentMetrics = this.metrics.filter(
      (m) => m.name === "js_thread_blockage" && m.timestamp > Date.now() - 60000
    );

    if (recentMetrics.length === 0) return 0;

    return (
      recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
    );
  }

  /**
   * Démarre le reporting périodique
   */
  private startPeriodicReporting() {
    this.reportInterval = setInterval(async () => {
      const report = await this.generateReport();
      await this.saveReport(report);

      // Nettoyer les métriques anciennes
      this.cleanupOldMetrics();
    }, 60000); // Toutes les minutes
  }

  /**
   * Nettoie les métriques anciennes
   */
  private cleanupOldMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter((m) => m.timestamp > oneHourAgo);
  }

  /**
   * Ajoute un observateur de performance
   */
  addObserver(id: string, callback: (metric: PerformanceMetric) => void) {
    this.performanceObservers.set(id, callback);
  }

  /**
   * Retire un observateur
   */
  removeObserver(id: string) {
    this.performanceObservers.delete(id);
  }

  /**
   * Notifie les observateurs
   */
  private notifyObservers(metric: PerformanceMetric) {
    this.performanceObservers.forEach((callback) => {
      try {
        callback(metric);
      } catch (error) {
        logger.error("Erreur dans observateur:", error);
      }
    });
  }

  /**
   * Sauvegarde les métriques
   */
  private async saveMetrics() {
    try {
      await AsyncStorage.setItem(
        "@performance_metrics",
        JSON.stringify(this.metrics.slice(-100))
      );
    } catch (error) {
      logger.error("Erreur sauvegarde métriques:", error);
    }
  }

  /**
   * Charge les métriques précédentes
   */
  private async loadPreviousMetrics() {
    try {
      const saved = await AsyncStorage.getItem("@performance_metrics");
      if (saved) {
        this.metrics = JSON.parse(saved);
      }
    } catch (error) {
      logger.error("Erreur chargement métriques:", error);
    }
  }

  /**
   * Sauvegarde un rapport
   */
  private async saveReport(report: PerformanceReport) {
    try {
      const reports = await this.loadReports();
      reports.push(report);

      // Garder seulement les 24 dernières heures
      const oneDayAgo = Date.now() - 86400000;
      const filteredReports = reports.filter((r) => r.timestamp > oneDayAgo);

      await AsyncStorage.setItem(
        "@performance_reports",
        JSON.stringify(filteredReports)
      );
    } catch (error) {
      logger.error("Erreur sauvegarde rapport:", error);
    }
  }

  /**
   * Charge les rapports
   */
  private async loadReports(): Promise<PerformanceReport[]> {
    try {
      const saved = await AsyncStorage.getItem("@performance_reports");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      logger.error("Erreur chargement rapports:", error);
      return [];
    }
  }

  /**
   * Nettoie toutes les ressources
   */
  cleanup() {
    if (this.frameCallbackId) {
      cancelAnimationFrame(this.frameCallbackId);
    }

    if (this.jsEventLoopTimer) {
      clearInterval(this.jsEventLoopTimer);
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    this.performanceObservers.clear();
    this.saveMetrics();
  }
}

// Hook React pour utiliser le monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();

  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      monitor.measureComponentRender(componentName, renderTime);
    };
  }, [componentName]);

  return {
    measureRender: (callback: () => void) => {
      const start = performance.now();
      callback();
      const duration = performance.now() - start;
      monitor.measureComponentRender(componentName, duration);
    },
    measureAPI: async (endpoint: string, apiCall: () => Promise<any>) => {
      const start = Date.now();
      try {
        const result = await apiCall();
        monitor.measureAPICall(endpoint, start, true);
        return result;
      } catch (error) {
        monitor.measureAPICall(endpoint, start, false, error as Error);
        throw error;
      }
    },
  };
};

export const performanceMonitor = PerformanceMonitor.getInstance();
