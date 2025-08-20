/**
 * Service de gestion de session utilisateur
 * Permet de contrôler la durée de session et l'activité utilisateur
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import { SESSION_CONFIG, SessionConfig } from "../config/sessionConfig";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("SessionManager");

interface SessionData {
  userId: string;
  loginTime: number;
  lastActivity: number;
  isActive: boolean;
  deviceInfo: {
    platform: string;
    version: string;
  };
}

class SessionManager {
  private static readonly SESSION_KEY = "@user_session";
  private static readonly ACTIVITY_KEY = "@user_activity";
  private currentSession: SessionData | null = null;
  private activityInterval: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Initialise une nouvelle session utilisateur
   */
  async initializeSession(userId: string): Promise<void> {
    const sessionData: SessionData = {
      userId,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      isActive: true,
      deviceInfo: {
        platform: "unknown",
        version: "unknown",
      },
    };

    this.currentSession = sessionData;

    try {
      await AsyncStorage.setItem(SessionManager.SESSION_KEY, JSON.stringify(sessionData));
      await AsyncStorage.setItem(SessionManager.ACTIVITY_KEY, Date.now().toString());
      logger.info("✅ Session utilisateur initialisée", { userId });
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation de la session:", error);
    }
  }

  /**
   * Met à jour la dernière activité de l'utilisateur
   */
  async updateActivity(): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.lastActivity = now;

    try {
      await AsyncStorage.setItem(SessionManager.ACTIVITY_KEY, now.toString());

      // Mettre à jour la session complète moins fréquemment
      if (now - this.currentSession.lastActivity > 60000) { // Toutes les minutes
        await AsyncStorage.setItem(SessionManager.SESSION_KEY, JSON.stringify(this.currentSession));
      }

      logger.debug("🔄 Activité utilisateur mise à jour");
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour de l'activité:", error);
    }
  }

  /**
   * Vérifie si la session est encore valide
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const sessionStr = await AsyncStorage.getItem(SessionManager.SESSION_KEY);
      if (!sessionStr) return false;

      const session: SessionData = JSON.parse(sessionStr);
      const timeSinceActivity = Date.now() - session.lastActivity;
      const maxInactivity = SESSION_CONFIG.sessionExpiryDays * 24 * 60 * 60 * 1000;

      const isValid = timeSinceActivity < maxInactivity && session.isActive;

      if (!isValid) {
        logger.info("⏰ Session invalide détectée", {
          daysSinceActivity: Math.round(timeSinceActivity / 1000 / 60 / 60 / 24),
          maxDays: SESSION_CONFIG.sessionExpiryDays
        });
      }

      return isValid;
    } catch (error) {
      logger.error("❌ Erreur lors de la vérification de la session:", error);
      return false;
    }
  }

  /**
   * Prolonge la session en renouvelant le token Firebase
   */
  async extendSession(): Promise<boolean> {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        logger.warn("⚠️ Aucun utilisateur Firebase pour prolonger la session");
        return false;
      }

      // Renouveler le token Firebase
      await currentUser.getIdToken(true);

      // Mettre à jour l'activité
      await this.updateActivity();

      logger.info("🔄 Session prolongée avec succès");
      return true;
    } catch (error) {
      logger.error("❌ Erreur lors de la prolongation de la session:", error);
      return false;
    }
  }

  /**
   * Termine la session utilisateur
   */
  async terminateSession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession.isActive = false;
        await AsyncStorage.setItem(SessionManager.SESSION_KEY, JSON.stringify(this.currentSession));
      }

      await AsyncStorage.removeItem(SessionManager.SESSION_KEY);
      await AsyncStorage.removeItem(SessionManager.ACTIVITY_KEY);

      this.currentSession = null;
      logger.info("👤 Session utilisateur terminée");
    } catch (error) {
      logger.error("❌ Erreur lors de la terminaison de la session:", error);
    }
  }

  /**
   * Obtient les informations de la session actuelle
   */
  async getCurrentSession(): Promise<SessionData | null> {
    if (this.currentSession) return this.currentSession;

    try {
      const sessionStr = await AsyncStorage.getItem(SessionManager.SESSION_KEY);
      if (sessionStr) {
        this.currentSession = JSON.parse(sessionStr);
        return this.currentSession;
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération de la session:", error);
    }

    return null;
  }

  /**
   * Démarre la surveillance d'activité
   */
  startActivityMonitoring(): void {
    if (this.activityInterval) return;

    // Mettre à jour l'activité toutes les 30 secondes
    this.activityInterval = setInterval(() => {
      this.updateActivity();
    }, 30000);

    logger.info("👁️ Surveillance d'activité démarrée");
  }

  /**
   * Arrête la surveillance d'activité
   */
  stopActivityMonitoring(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
      logger.info("👁️ Surveillance d'activité arrêtée");
    }
  }

  /**
   * Démarre la vérification automatique de session
   */
  startSessionChecking(): void {
    if (this.checkInterval) return;

    const checkIntervalMs = SESSION_CONFIG.sessionCheckIntervalMinutes * 60 * 1000;

    this.checkInterval = setInterval(async () => {
      const isValid = await this.isSessionValid();
      if (!isValid) {
        logger.warn("⏰ Session invalide détectée - déconnexion nécessaire");
        // Ici vous pourriez émettre un événement pour déconnecter l'utilisateur
        // EventEmitter.emit('sessionExpired');
      }
    }, checkIntervalMs);

    logger.info("🔍 Vérification automatique de session démarrée");
  }

  /**
   * Arrête la vérification automatique de session
   */
  stopSessionChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info("🔍 Vérification automatique de session arrêtée");
    }
  }

  /**
   * Obtient des statistiques de session pour le debugging
   */
  async getSessionStats(): Promise<{
    isValid: boolean;
    daysSinceLogin: number;
    hoursSinceActivity: number;
    sessionData: SessionData | null;
  } | null> {
    try {
      const session = await this.getCurrentSession();
      if (!session) return null;

      const now = Date.now();
      const daysSinceLogin = Math.round((now - session.loginTime) / 1000 / 60 / 60 / 24);
      const hoursSinceActivity = Math.round((now - session.lastActivity) / 1000 / 60 / 60);
      const isValid = await this.isSessionValid();

      return {
        isValid,
        daysSinceLogin,
        hoursSinceActivity,
        sessionData: session,
      };
    } catch (error) {
      logger.error("❌ Erreur lors du calcul des statistiques de session:", error);
      return null;
    }
  }

  /**
   * Nettoie les anciennes sessions
   */
  async cleanup(): Promise<void> {
    this.stopActivityMonitoring();
    this.stopSessionChecking();
    await this.terminateSession();
  }
}

// Singleton
export const sessionManager = new SessionManager();
