import { getApp } from "@react-native-firebase/app";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { InteractionManager } from "react-native";
import { LazyLoadService } from "./LazyLoadService";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('OptimizedWarmupService');

// Types pour requestIdleCallback
interface RequestIdleCallbackOptions {
  timeout?: number;
}

interface RequestIdleCallbackHandle {
  didTimeout: boolean;
  timeRemaining: () => number;
}

type RequestIdleCallback = (
  callback: (deadline: RequestIdleCallbackHandle) => void,
  options?: RequestIdleCallbackOptions
) => NodeJS.Timeout;

// Extension du type global pour requestIdleCallback
declare global {
  var requestIdleCallback: RequestIdleCallback | undefined;
}

export class OptimizedWarmupService {
  private static started = false;
  private static criticalTasksComplete = false;

  /**
   * Initialisation avec priorités
   */
  static init(): void {
    if (this.started) return;
    this.started = true;

    // Tâches critiques (exécutées immédiatement)
    this.executeCriticalTasks();

    // Tâches non-critiques (différées)
    InteractionManager.runAfterInteractions(() => {
      this.executeNonCriticalTasks();
    });
  }

  /**
   * Tâches critiques pour le démarrage
   */
  private static executeCriticalTasks(): void {
    try {
      const auth = getAuth(getApp());
      
      // Écouter les changements d'authentification (critique)
      onAuthStateChanged(auth, (user) => {
        if (user?.uid && this.criticalTasksComplete) {
          // Charger les données utilisateur de manière lazy
          this.lazyLoadUserData(user.uid);
        }
      });

      this.criticalTasksComplete = true;
    } catch (error) {
      // Fail silently pour ne pas bloquer l'app
      if (__DEV__) {
        logger.error("Critical warmup task failed:", error);
      }
    }
  }

  /**
   * Tâches non-critiques (peuvent être différées)
   */
  private static async executeNonCriticalTasks(): Promise<void> {
    try {
      // Précharger le token d'authentification après 2 secondes
      setTimeout(async () => {
        const auth = getAuth(getApp());
        if (auth.currentUser) {
          try {
            await auth.currentUser.getIdToken(false); // false = pas de force refresh
          } catch {
            // Ignorer les erreurs de token
          }
        }
      }, 2000);

      // Précharger les modules lourds de manière lazy
      await LazyLoadService.preloadModules([
        {
          name: "netinfo",
          loader: () => import("@react-native-community/netinfo"),
        },
      ]);
    } catch {
      // Fail silently
    }
  }

  /**
   * Chargement lazy des données utilisateur
   */
  private static async lazyLoadUserData(userId: string): Promise<void> {
    try {
      // Vérifier la connexion avant de charger les données
      const netInfoModule = await LazyLoadService.loadModule(
        "netinfo",
        () => import("@react-native-community/netinfo")
      );

      if (!netInfoModule) return;

      const { default: NetInfo } = netInfoModule;
      const state = await NetInfo.fetch();

      // Ne pas charger sur connexion cellulaire pour économiser les données
      if (!state.isConnected || state.type === "cellular") {
        return;
      }

      // Charger le MemoryManager uniquement si nécessaire et en WiFi
      setTimeout(async () => {
        const memoryModule = await LazyLoadService.loadModule(
          "memory-manager",
          () => import("../memory/MemoryManager")
        );

        if (memoryModule) {
          const { memoryManager } = memoryModule;
          
          // Charger les données en arrière-plan avec priorité basse
          global.requestIdleCallback?.(
            () => {
              memoryManager.loadUserMemory(userId).catch(() => {
                // Ignorer les erreurs de chargement mémoire
              });
            },
            { timeout: 5000 }
          );
        }
      }, 3000); // Attendre 3 secondes après connexion
    } catch {
      // Fail silently
    }
  }

  /**
   * Nettoyer les ressources (appelé lors du logout)
   */
  static cleanup(): void {
    this.started = false;
    this.criticalTasksComplete = false;
    LazyLoadService.clearCache();
  }

  /**
   * Vérifier si le service est prêt
   */
  static isReady(): boolean {
    return this.started && this.criticalTasksComplete;
  }
}

// Polyfill pour requestIdleCallback si non disponible
if (typeof global.requestIdleCallback === "undefined") {
  global.requestIdleCallback = (
    callback: (deadline: RequestIdleCallbackHandle) => void,
    options?: RequestIdleCallbackOptions
  ): NodeJS.Timeout => {
    const timeout = options?.timeout || 1000;
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, timeout - Date.now())
      });
    }, timeout);
  };
}