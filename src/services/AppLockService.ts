import {
  getFirestore,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { systemLog } from "./SystemLogService";

export interface AppLockConfig {
  isLocked: boolean;
  lockType:
    | "maintenance"
    | "test_ended"
    | "subscription_required"
    | "violation"
    | "custom";
  title: string;
  message: string;
  showCountdown?: boolean;
  unlockDate?: FirebaseFirestoreTypes.Timestamp;
  allowedUsers?: string[]; // UIDs des utilisateurs autorisés malgré le verrouillage
  allowedRoles?: string[]; // Rôles autorisés (admin, super_admin, beta_tester)
  contactEmail?: string;
  contactPhone?: string;
  showContactSupport?: boolean;
  customButtonText?: string;
  customButtonAction?: string;
  backgroundColor?: string;
  textColor?: string;
  iconName?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: FirebaseFirestoreTypes.Timestamp;
}

class AppLockService {
  private lockConfig: AppLockConfig | null = null;
  private unsubscribe: (() => void) | null = null;
  private lockCheckInterval: NodeJS.Timeout | null = null;
  private onLockChangeCallbacks: ((config: AppLockConfig | null) => void)[] =
    [];

  /**
   * Initialise le service de verrouillage
   */
  async initialize(): Promise<void> {
    try {
      // Charger la configuration depuis le cache local d'abord
      await this.loadCachedConfig();

      // Écouter les changements en temps réel
      this.listenToLockChanges();

      // Vérifier périodiquement (toutes les 30 secondes)
      this.startPeriodicCheck();

      systemLog.info("system", "Service de verrouillage initialisé");
    } catch (error) {
      console.error("Erreur initialisation AppLockService:", error);
      systemLog.error(
        "system",
        "Erreur initialisation verrouillage",
        error as Error
      );
    }
  }

  /**
   * Charge la configuration depuis le cache local
   */
  private async loadCachedConfig(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem("@app_lock_config");
      if (cached) {
        this.lockConfig = JSON.parse(cached);
      }
    } catch (error) {
      console.error("Erreur chargement cache verrouillage:", error);
    }
  }

  /**
   * Sauvegarde la configuration dans le cache local
   */
  private async saveCachedConfig(config: AppLockConfig | null): Promise<void> {
    try {
      if (config) {
        await AsyncStorage.setItem("@app_lock_config", JSON.stringify(config));
      } else {
        await AsyncStorage.removeItem("@app_lock_config");
      }
    } catch (error) {
      console.error("Erreur sauvegarde cache verrouillage:", error);
    }
  }

  /**
   * Écoute les changements de configuration en temps réel
   */
  private listenToLockChanges(): void {
    try {
      const db = getFirestore();
      const ref = doc(db, "system", "app_lock");
      this.unsubscribe = onSnapshot(
        ref,
        async (snapshot) => {
          if (snapshot.exists()) {
            const config = snapshot.data() as AppLockConfig;
            if (config.unlockDate && config.unlockDate.toDate() < new Date()) {
              config.isLocked = false;
            }
            this.lockConfig = config;
            await this.saveCachedConfig(config);
            this.notifyLockChange(config);
            if (config.isLocked) {
              systemLog.warning("security", "Application verrouillée", {
                lockType: config.lockType,
                title: config.title,
              });
            }
          } else {
            this.lockConfig = null;
            await this.saveCachedConfig(null);
            this.notifyLockChange(null);
          }
        },
        (error) => {
          console.error("Erreur écoute verrouillage:", error);
          systemLog.error(
            "system",
            "Erreur écoute verrouillage",
            error as Error
          );
        }
      );
    } catch (error) {
      console.error("Erreur configuration listener verrouillage:", error);
    }
  }

  /**
   * Démarre la vérification périodique
   */
  private startPeriodicCheck(): void {
    this.lockCheckInterval = setInterval(async () => {
      await this.checkLockStatus();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Vérifie le statut de verrouillage
   */
  async checkLockStatus(): Promise<AppLockConfig | null> {
    try {
      const db = getFirestore();
      const lockDoc = await getDoc(doc(db, "system", "app_lock"));
      if (lockDoc.exists()) {
        const config = lockDoc.data() as AppLockConfig;

        // Vérifier si le verrouillage a expiré
        if (config.unlockDate && config.unlockDate.toDate() < new Date()) {
          config.isLocked = false;
          // Mettre à jour dans Firestore
          await this.updateLockConfig({ ...config, isLocked: false });
        }

        this.lockConfig = config;
        await this.saveCachedConfig(config);
        return config;
      }

      this.lockConfig = null;
      await this.saveCachedConfig(null);
      return null;
    } catch (error) {
      console.error("Erreur vérification verrouillage:", error);
      // En cas d'erreur réseau, utiliser le cache
      return this.lockConfig;
    }
  }

  /**
   * Vérifie si l'application est verrouillée pour l'utilisateur actuel
   */
  isAppLocked(userId?: string, userRole?: string): boolean {
    if (!this.lockConfig || !this.lockConfig.isLocked) {
      return false;
    }

    // Vérifier si le verrouillage a expiré
    if (
      this.lockConfig.unlockDate &&
      this.lockConfig.unlockDate.toDate() < new Date()
    ) {
      return false;
    }

    // Vérifier les utilisateurs autorisés
    if (userId && this.lockConfig.allowedUsers?.includes(userId)) {
      return false;
    }

    // Vérifier les rôles autorisés
    if (userRole && this.lockConfig.allowedRoles?.includes(userRole)) {
      return false;
    }

    return true;
  }

  /**
   * Obtient la configuration actuelle de verrouillage
   */
  getLockConfig(): AppLockConfig | null {
    return this.lockConfig;
  }

  /**
   * Verrouille l'application (Admin uniquement)
   */
  async lockApp(
    config: Omit<AppLockConfig, "lastUpdatedAt" | "lastUpdatedBy">,
    adminId: string
  ): Promise<void> {
    try {
      const db = getFirestore();
      const lockData: AppLockConfig = {
        ...config,
        isLocked: true,
        lastUpdatedBy: adminId,
        lastUpdatedAt:
          serverTimestamp() as unknown as FirebaseFirestoreTypes.Timestamp,
      };

      await setDoc(doc(db, "system", "app_lock"), lockData);

      systemLog.critical("admin", "Application verrouillée", undefined, {
        adminId,
        lockType: config.lockType,
        title: config.title,
      });

      // Envoyer une notification push à tous les utilisateurs
      if (config.lockType === "test_ended") {
        await this.sendLockNotification(config);
      }
    } catch (error) {
      console.error("Erreur verrouillage application:", error);
      throw error;
    }
  }

  /**
   * Déverrouille l'application (Admin uniquement)
   */
  async unlockApp(adminId: string): Promise<void> {
    try {
      const db = getFirestore();
      await setDoc(
        doc(db, "system", "app_lock"),
        {
          isLocked: false,
          lastUpdatedBy: adminId,
          lastUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      systemLog.info("admin", "Application déverrouillée", { adminId });
    } catch (error) {
      console.error("Erreur déverrouillage application:", error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration de verrouillage
   */
  async updateLockConfig(config: Partial<AppLockConfig>): Promise<void> {
    try {
      const db = getFirestore();
      const currentConfig = await this.checkLockStatus();
      const updatedConfig = {
        ...currentConfig,
        ...config,
        lastUpdatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "system", "app_lock"), updatedConfig, {
        merge: true,
      });
    } catch (error) {
      console.error("Erreur mise à jour configuration verrouillage:", error);
      throw error;
    }
  }

  /**
   * Envoie une notification de verrouillage
   */
  private async sendLockNotification(config: AppLockConfig): Promise<void> {
    try {
      // Utiliser le service de notifications push si disponible
      const { pushNotificationService } = await import(
        "./PushNotificationService"
      );

      // Créer une campagne de notification
      await pushNotificationService.createCampaign({
        name: "App Lock Notification",
        title: config.title,
        body: config.message,
        targetAudience: "all",
        status: "sent",
        createdBy: "system",
      });
    } catch (error) {
      console.error("Erreur envoi notification verrouillage:", error);
    }
  }

  /**
   * Ajoute un callback pour les changements de verrouillage
   */
  onLockChange(callback: (config: AppLockConfig | null) => void): () => void {
    this.onLockChangeCallbacks.push(callback);

    // Retourner une fonction pour se désabonner
    return () => {
      const index = this.onLockChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onLockChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notifie tous les callbacks des changements
   */
  private notifyLockChange(config: AppLockConfig | null): void {
    this.onLockChangeCallbacks.forEach((callback) => {
      try {
        callback(config);
      } catch (error) {
        console.error("Erreur callback verrouillage:", error);
      }
    });
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.lockCheckInterval) {
      clearInterval(this.lockCheckInterval);
      this.lockCheckInterval = null;
    }

    this.onLockChangeCallbacks = [];
  }

  /**
   * Configurations prédéfinies pour différents scénarios
   */
  static getPresetConfigs() {
    return {
      testEnded: {
        lockType: "test_ended" as const,
        title: "🎉 Période de test terminée",
        message:
          "Merci d'avoir participé à notre phase de test ! L'application sera bientôt disponible en version complète. Nous vous contacterons dès le lancement officiel.",
        showContactSupport: true,
        contactEmail: "support@app.com",
        backgroundColor: "#1e40af",
        textColor: "#ffffff",
        iconName: "check-circle",
      },
      maintenance: {
        lockType: "maintenance" as const,
        title: "🔧 Maintenance en cours",
        message:
          "Nous effectuons une mise à jour importante. L'application sera de nouveau disponible dans quelques instants.",
        showCountdown: true,
        backgroundColor: "#ea580c",
        textColor: "#ffffff",
        iconName: "wrench",
      },
    };
  }
}

// Export d'une instance unique
export const appLockService = new AppLockService();
export default AppLockService;
