import { Linking } from 'react-native';
import { SocialPlatform } from '../types';

/**
 * Utilitaire pour détecter les applications installées
 */
export class AppDetector {
  /**
   * Vérifie si une app est installée sur l'appareil
   */
  public static async isAppInstalled(platform: SocialPlatform): Promise<boolean> {
    try {
      if (platform.urlScheme) {
        const canOpen = await Linking.canOpenURL(platform.urlScheme);
        return canOpen;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérifie quelles plateformes sont installées
   */
  public static async getInstalledPlatforms(platforms: SocialPlatform[]): Promise<SocialPlatform[]> {
    const installedPlatforms: SocialPlatform[] = [];

    for (const platform of platforms) {
      const isInstalled = await this.isAppInstalled(platform);
      if (isInstalled) {
        installedPlatforms.push(platform);
      } else {}
    }

    return installedPlatforms;
  }

  /**
   * Obtient les statistiques d'installation
   */
  public static async getInstallationStats(platforms: SocialPlatform[]): Promise<{
    totalPlatforms: number;
    installedCount: number;
    installationRate: number;
    installedPlatforms: string[];
  }> {
    const installedPlatforms = await this.getInstalledPlatforms(platforms);
    
    return {
      totalPlatforms: platforms.length,
      installedCount: installedPlatforms.length,
      installationRate: Math.round((installedPlatforms.length / platforms.length) * 100),
      installedPlatforms: installedPlatforms.map(p => p.name),
    };
  }
}