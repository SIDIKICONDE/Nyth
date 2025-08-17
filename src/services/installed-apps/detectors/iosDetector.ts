import { Linking } from 'react-native';
import { SocialApp } from '../types';

/**
 * Détecteur d'applications pour iOS
 */
export class IOSDetector {
  /**
   * Vérifie si une app est installée sur iOS
   */
  public static async checkApp(app: SocialApp): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(app.iosScheme);
      return canOpen;
    } catch (error) {
      return false;
    }
  }

  /**
   * Détecte toutes les applications installées sur iOS
   */
  public static async detectInstalledApps(apps: SocialApp[]): Promise<SocialApp[]> {
    const installedApps: SocialApp[] = [];

    for (const app of apps) {
      const isInstalled = await this.checkApp(app);
      if (isInstalled) {
        installedApps.push(app);
      } else {}
    }

    return installedApps;
  }
} 