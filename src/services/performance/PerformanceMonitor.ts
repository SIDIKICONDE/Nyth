import { InteractionManager, NativeModules } from "react-native";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('PerformanceMonitor');

interface PerformanceMetrics {
  fps: number;
  jsFrameRate: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  interactionTime: number;
}

interface PerformanceThresholds {
  minFPS: number;
  maxMemoryMB: number;
  maxRenderTimeMS: number;
  maxInteractionTimeMS: number;
}

type PerformanceCallback = (metrics: PerformanceMetrics) => void;

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    fps: 60,
    jsFrameRate: 60,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    interactionTime: 0,
  };

  private thresholds: PerformanceThresholds = {
    minFPS: 30,
    maxMemoryMB: 300,
    maxRenderTimeMS: 16,
    maxInteractionTimeMS: 100,
  };

  private callbacks: Set<PerformanceCallback> = new Set();
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = Date.now();
  private renderTimings: number[] = [];
  private interactionTimings: number[] = [];

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Démarre le monitoring des performances
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitoring FPS
    this.startFPSMonitoring();

    // Monitoring mémoire
    this.startMemoryMonitoring();

    // Monitoring des interactions
    this.startInteractionMonitoring();

    // Rapport périodique
    this.startPeriodicReporting();
  }

  /**
   * Arrête le monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Ajoute un callback pour recevoir les métriques
   */
  subscribe(callback: PerformanceCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Configure les seuils de performance
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Mesure le temps de rendu d'un composant
   */
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const renderTime = performance.now() - startTime;

    this.renderTimings.push(renderTime);
    if (this.renderTimings.length > 100) {
      this.renderTimings.shift();
    }

    this.metrics.renderTime = this.calculateAverage(this.renderTimings);

    if (renderTime > this.thresholds.maxRenderTimeMS) {
      this.reportSlowRender(componentName, renderTime);
    }
  }

  /**
   * Mesure le temps d'une interaction
   */
  measureInteraction(interactionName: string, interactionFn: () => void | Promise<void>): void {
    const startTime = performance.now();
    
    const complete = () => {
      const interactionTime = performance.now() - startTime;
      
      this.interactionTimings.push(interactionTime);
      if (this.interactionTimings.length > 100) {
        this.interactionTimings.shift();
      }

      this.metrics.interactionTime = this.calculateAverage(this.interactionTimings);

      if (interactionTime > this.thresholds.maxInteractionTimeMS) {
        this.reportSlowInteraction(interactionName, interactionTime);
      }
    };

    const result = interactionFn();
    if (result instanceof Promise) {
      result.then(complete).catch(complete);
    } else {
      complete();
    }
  }

  /**
   * Monitoring FPS
   */
  private startFPSMonitoring(): void {
    const measureFPS = () => {
      if (!this.isMonitoring) return;

      const now = Date.now();
      const delta = now - this.lastFrameTime;
      
      if (delta >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameCount = 0;
        this.lastFrameTime = now;

        if (this.metrics.fps < this.thresholds.minFPS) {
          this.reportLowFPS(this.metrics.fps);
        }
      }

      this.frameCount++;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitoring mémoire
   */
  private startMemoryMonitoring(): void {
    const measureMemory = () => {
      if (!this.isMonitoring) return;

      // Utiliser le module natif si disponible
      if (NativeModules.MemoryModule) {
        NativeModules.MemoryModule.getMemoryInfo((info: any) => {
          this.metrics.memoryUsage = info.usedMemory / 1024 / 1024; // MB
          
          if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
            this.reportHighMemory(this.metrics.memoryUsage);
          }
        });
      }

      // Mesurer toutes les 5 secondes
      setTimeout(measureMemory, 5000);
    };

    measureMemory();
  }

  /**
   * Monitoring des interactions
   */
  private startInteractionMonitoring(): void {
    let pendingInteractions = 0;

    InteractionManager.runAfterInteractions(() => {
      // Interactions terminées
      pendingInteractions = 0;
    });

    // Vérifier les interactions bloquées
    setInterval(() => {
      if (pendingInteractions > 5) {
        this.reportBlockedInteractions(pendingInteractions);
      }
    }, 1000);
  }

  /**
   * Rapport périodique des métriques
   */
  private startPeriodicReporting(): void {
    setInterval(() => {
      if (!this.isMonitoring) return;

      // Notifier tous les callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(this.getMetrics());
        } catch (error) {
          logger.error("Performance callback error:", error);
        }
      });

      // Log en développement
      if (__DEV__) {
        this.logMetrics();
      }
    }, 5000); // Toutes les 5 secondes
  }

  /**
   * Calcule la moyenne d'un tableau
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Rapports d'erreurs
   */
  private reportLowFPS(fps: number): void {
    if (__DEV__) {
      logger.warn(`⚠️ Low FPS detected: ${fps} fps`);
    }
    // TODO: Envoyer à un service de monitoring
  }

  private reportHighMemory(memoryMB: number): void {
    if (__DEV__) {
      logger.warn(`⚠️ High memory usage: ${memoryMB.toFixed(2)} MB`);
    }
    // TODO: Envoyer à un service de monitoring
  }

  private reportSlowRender(component: string, timeMS: number): void {
    if (__DEV__) {
      logger.warn(`⚠️ Slow render in ${component}: ${timeMS.toFixed(2)} ms`);
    }
    // TODO: Envoyer à un service de monitoring
  }

  private reportSlowInteraction(interaction: string, timeMS: number): void {
    if (__DEV__) {
      logger.warn(`⚠️ Slow interaction ${interaction}: ${timeMS.toFixed(2)} ms`);
    }
    // TODO: Envoyer à un service de monitoring
  }

  private reportBlockedInteractions(count: number): void {
    if (__DEV__) {
      logger.warn(`⚠️ ${count} interactions blocked`);
    }
    // TODO: Envoyer à un service de monitoring
  }

  /**
   * Log des métriques en développement
   */
  private logMetrics(): void {
    logger.debug("📊 Performance Metrics:", {
      fps: `${this.metrics.fps} fps`,
      memory: `${this.metrics.memoryUsage.toFixed(2)} MB`,
      renderTime: `${this.metrics.renderTime.toFixed(2)} ms`,
      interactionTime: `${this.metrics.interactionTime.toFixed(2)} ms`,
    });
  }
}

// Export singleton
export const performanceMonitor = PerformanceMonitor.getInstance();