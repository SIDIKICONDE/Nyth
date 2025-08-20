import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../utils/optimizedLogger";
import { adminRealtimeService } from "../realtime/adminRealtimeService";
import { adminDataCompressor } from "../compression/adminDataCompressor";

const logger = createLogger("AdminMonitoringService");

interface PerformanceMetric {
  id: string;
  type: "load_time" | "api_call" | "user_action" | "error" | "memory_usage";
  name: string;
  value: number;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  target?: string;
  details?: Record<string, any>;
  timestamp: Timestamp;
  duration?: number;
  success: boolean;
  error?: string;
}

/**
 * Service de monitoring temps réel pour le système administrateur
 * Collecte et analyse les métriques de performance et d'utilisation
 */
class AdminMonitoringService {
  private metricsBuffer: PerformanceMetric[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 secondes

  constructor() {
    this.startPeriodicFlush();
    this.initializeRealtime();
  }

  /**
   * Enregistre une métrique de performance
   */
  recordMetric(
    type: PerformanceMetric["type"],
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name,
      value,
      timestamp: Timestamp.now(),
      metadata,
    };

    this.metricsBuffer.push(metric);

    // Flush automatique si le buffer est plein
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }

    logger.debug("Métrique enregistrée:", { type, name, value });
  }

  /**
   * Enregistre le temps de chargement d'un composant
   */
  recordLoadTime(componentName: string, loadTime: number): void {
    this.recordMetric("load_time", `load_${componentName}`, loadTime, {
      component: componentName,
    });
  }

  /**
   * Enregistre un appel API
   */
  recordApiCall(endpoint: string, duration: number, success: boolean): void {
    this.recordMetric("api_call", `api_${endpoint}`, duration, {
      endpoint,
      success,
    });
  }

  /**
   * Enregistre une action utilisateur
   */
  recordUserAction(action: string, details?: Record<string, any>): void {
    this.recordMetric("user_action", action, 1, details);
  }

  /**
   * Enregistre une erreur
   */
  recordError(error: Error, context?: Record<string, any>): void {
    this.recordMetric("error", error.name, 1, {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Enregistre l'utilisation mémoire
   */
  recordMemoryUsage(usedMemory: number, totalMemory: number): void {
    this.recordMetric("memory_usage", "memory_usage_mb", usedMemory, {
      totalMemory,
      percentage: (usedMemory / totalMemory) * 100,
    });
  }

  /**
   * Flush les métriques vers Firestore et WebSocket
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const db = getFirestore(getApp());
      const batch = this.metricsBuffer.splice(0, this.BATCH_SIZE);

      // Envoyer vers Firestore (fallback)
      const firestorePromise = Promise.all(
        batch.map(metric =>
          addDoc(collection(db, "adminMetrics"), metric)
        )
      );

      // Envoyer vers WebSocket (temps réel)
      const websocketPromise = this.sendMetricsViaWebSocket(batch);

      // Attendre les deux méthodes
      await Promise.allSettled([firestorePromise, websocketPromise]);

      logger.debug(`${batch.length} métriques flushées vers Firestore et WebSocket`);
    } catch (error) {
      logger.error("Erreur lors du flush des métriques:", error);
      // Remettre les métriques dans le buffer en cas d'erreur
      const batch = this.metricsBuffer.splice(0, this.BATCH_SIZE);
      this.metricsBuffer.unshift(...batch);
    }
  }

  /**
   * Envoie les métriques via WebSocket avec compression
   */
  private async sendMetricsViaWebSocket(metrics: PerformanceMetric[]): Promise<void> {
    try {
      if (adminRealtimeService.getConnectionStatus().isConnected) {
        // Compresser les métriques avant l'envoi
        const compressedData = await adminDataCompressor.compressMetricsBatch(metrics);

        // Calculer les économies de bande passante
        const originalSize = JSON.stringify(metrics).length;
        const compressedSize = compressedData.compressedSize;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        await adminRealtimeService.sendRequest('admin_metrics_compressed', {
          compressedData,
          metricsCount: metrics.length,
          bandwidthSavings: `${savings}%`,
          timestamp: Date.now()
        });

        logger.debug(`${metrics.length} métriques compressées et envoyées via WebSocket (${savings}% d'économie)`);
      } else {
        logger.debug("WebSocket non connecté, métriques stockées pour plus tard");
      }
    } catch (error) {
      logger.warn("Erreur lors de l'envoi compressé via WebSocket:", error);
      // L'erreur est gérée silencieusement car Firestore fait office de fallback
    }
  }

  /**
   * Initialise la connexion temps réel
   */
  private initializeRealtime(): void {
    // Écouter les événements temps réel
    adminRealtimeService.onSpecificEvent('metric_update', (data) => {
      logger.debug("Métriques reçues via WebSocket:", data);
      // Traiter les métriques temps réel si nécessaire
    });

    // Écouter les changements de statut de connexion
    adminRealtimeService.on('connected', () => {
      logger.info("Connexion WebSocket établie pour le monitoring");
    });

    adminRealtimeService.on('disconnected', () => {
      logger.warn("Connexion WebSocket perdue pour le monitoring");
    });
  }

  /**
   * Démarre le flush périodique
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Enregistre une activité administrateur
   */
  async logAdminActivity(
    adminId: string,
    action: string,
    target?: string,
    details?: Record<string, any>,
    duration?: number,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const activityLog: Omit<AdminActivityLog, 'id'> = {
        adminId,
        action,
        target,
        details,
        timestamp: Timestamp.now(),
        duration,
        success,
        error,
      };

      await addDoc(collection(db, "adminActivityLogs"), activityLog);
      logger.info("Activité admin enregistrée:", { action, adminId });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de l'activité admin:", error);
    }
  }

  /**
   * Récupère les métriques récentes
   */
  async getRecentMetrics(hours: number = 24): Promise<PerformanceMetric[]> {
    try {
      const db = getFirestore(getApp());
      const cutoffTime = Timestamp.fromMillis(
        Date.now() - hours * 60 * 60 * 1000
      );

      const q = query(
        collection(db, "adminMetrics"),
        orderBy("timestamp", "desc"),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PerformanceMetric))
        .filter(metric => metric.timestamp.toMillis() > cutoffTime.toMillis());
    } catch (error) {
      logger.error("Erreur lors de la récupération des métriques:", error);
      return [];
    }
  }

  /**
   * Récupère les logs d'activité récents
   */
  async getRecentActivityLogs(hours: number = 24): Promise<AdminActivityLog[]> {
    try {
      const db = getFirestore(getApp());
      const cutoffTime = Timestamp.fromMillis(
        Date.now() - hours * 60 * 60 * 1000
      );

      const q = query(
        collection(db, "adminActivityLogs"),
        orderBy("timestamp", "desc"),
        limit(500)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AdminActivityLog))
        .filter(log => log.timestamp.toMillis() > cutoffTime.toMillis());
    } catch (error) {
      logger.error("Erreur lors de la récupération des logs d'activité:", error);
      return [];
    }
  }

  /**
   * Génère un rapport de performance
   */
  async generatePerformanceReport(hours: number = 24): Promise<{
    averageLoadTime: number;
    errorCount: number;
    apiCallCount: number;
    averageApiResponseTime: number;
    topErrors: Array<{ name: string; count: number }>;
  }> {
    const metrics = await this.getRecentMetrics(hours);

    const loadTimes = metrics.filter(m => m.type === "load_time");
    const errors = metrics.filter(m => m.type === "error");
    const apiCalls = metrics.filter(m => m.type === "api_call");

    const averageLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((sum, m) => sum + m.value, 0) / loadTimes.length
      : 0;

    const averageApiResponseTime = apiCalls.length > 0
      ? apiCalls.reduce((sum, m) => sum + m.value, 0) / apiCalls.length
      : 0;

    // Compter les erreurs par type
    const errorCounts = new Map<string, number>();
    errors.forEach(error => {
      const key = error.name;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageLoadTime,
      errorCount: errors.length,
      apiCallCount: apiCalls.length,
      averageApiResponseTime,
      topErrors,
    };
  }

  /**
   * Nettoyage automatique des vieilles données
   */
  async cleanupOldData(daysOld: number = 30): Promise<void> {
    try {
      // Cette fonction serait appelée périodiquement pour nettoyer les anciennes données
      logger.info(`Nettoyage des données de plus de ${daysOld} jours`);
      // Implémentation du nettoyage...
    } catch (error) {
      logger.error("Erreur lors du nettoyage:", error);
    }
  }
}

export const adminMonitoringService = new AdminMonitoringService();
