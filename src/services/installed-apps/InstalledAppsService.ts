import { Platform } from 'react-native';
import { 
  SocialApp, 
  InstalledAppsResult, 
  ShareContent, 
  DetectionStats 
} from './types';
import { SOCIAL_APPS, getFallbackApps } from './config/socialApps';
import { IOSDetector } from './detectors/iosDetector';
import { AndroidDetector } from './detectors/androidDetector';
import { ShareUtils } from './utils/shareUtils';
import { AppLauncher } from './utils/appLauncher';

/**
 * Service principal pour la gestion des applications installées
 */
class InstalledAppsService {
  private static instance: InstalledAppsService;

  public static getInstance(): InstalledAppsService {
    if (!InstalledAppsService.instance) {
      InstalledAppsService.instance = new InstalledAppsService();
    }
    return InstalledAppsService.instance;
  }

  /**
   * Détecte les applications installées
   */
  public async getInstalledApps(): Promise<InstalledAppsResult> {
    let installedApps: SocialApp[] = [];
    let detectionMethod: 'url_scheme' | 'package_query' | 'fallback' = 'url_scheme';

    try {
      if (Platform.OS === 'ios') {
        installedApps = await IOSDetector.detectInstalledApps(SOCIAL_APPS);
        detectionMethod = 'url_scheme';
      } else if (Platform.OS === 'android') {
        installedApps = await AndroidDetector.detectInstalledApps(SOCIAL_APPS);
        detectionMethod = 'package_query';
      } else {
        installedApps = getFallbackApps();
        detectionMethod = 'fallback';
      }
    } catch (error) {
      // En cas d'erreur, utiliser le fallback
      installedApps = getFallbackApps();
      detectionMethod = 'fallback';
    }

    return {
      installedApps,
      checkedApps: SOCIAL_APPS,
      detectionMethod,
    };
  }

  /**
   * Ouvre une application spécifique
   */
  public async openApp(app: SocialApp, fallbackUrl?: string): Promise<boolean> {
    return await AppLauncher.openApp(app, fallbackUrl);
  }

  /**
   * Partage du contenu vers une app spécifique
   */
  public async shareToApp(app: SocialApp, content: ShareContent): Promise<boolean> {
    try {
      if (!app.shareSupported) {
        return false;
      }

      // TikTok nécessite un traitement spécial
      if (app.id === 'tiktok') {
        const tiktokOpened = await this.openApp(app);
        if (tiktokOpened) {}
        return tiktokOpened;
      }

      // YouTube nécessite aussi une ouverture simple
      if (app.id === 'youtube') {
        return await this.openApp(app);
      }

      // Utiliser ShareUtils pour les autres applications
      const shareResult = await ShareUtils.executeShare(app, content);
      if (!shareResult) {
        // Fallback: ouvrir l'application
        return await this.openApp(app);
      }

      return shareResult;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie si le partage est possible pour une application
   */
  public async canShareToApp(app: SocialApp, content: ShareContent): Promise<boolean> {
    return await ShareUtils.canShare(app, content);
  }

  /**
   * Obtient les statistiques de détection
   */
  public async getDetectionStats(): Promise<DetectionStats> {
    const result = await this.getInstalledApps();
    
    return {
      totalApps: result.checkedApps.length,
      installedCount: result.installedApps.length,
      detectionRate: Math.round((result.installedApps.length / result.checkedApps.length) * 100),
      platformSupport: result.detectionMethod,
    };
  }

  /**
   * Obtient la liste complète des applications supportées
   */
  public getSupportedApps(): SocialApp[] {
    return [...SOCIAL_APPS];
  }

  /**
   * Trouve une application par son ID
   */
  public findAppById(id: string): SocialApp | undefined {
    return SOCIAL_APPS.find(app => app.id === id);
  }

  /**
   * Filtre les applications par critères
   */
  public filterApps(criteria: {
    shareSupported?: boolean;
    platform?: 'ios' | 'android' | 'all';
  }): SocialApp[] {
    let apps = [...SOCIAL_APPS];

    if (criteria.shareSupported !== undefined) {
      apps = apps.filter(app => app.shareSupported === criteria.shareSupported);
    }

    // Filtrage par plateforme pourrait être ajouté ici si nécessaire

    return apps;
  }
}

export default InstalledAppsService; 