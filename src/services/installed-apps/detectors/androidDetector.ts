import { Linking } from "react-native";
import { SocialApp } from "../types";
import { getAppSchemes } from "../utils/schemeUtils";

/**
 * Détecteur d'applications pour Android
 */
export class AndroidDetector {
  /**
   * Vérifie si une app est installée sur Android
   */
  public static async checkApp(app: SocialApp): Promise<boolean> {
    try {
      // Méthode spéciale pour TikTok
      if (app.id === "tiktok") {
        return await this.checkTikTok();
      }

      // Méthode 1: Essayer d'ouvrir l'app avec IntentLauncher
      try {
        const packageUrl = `package:${app.androidPackage}`;
        await Linking.openURL(packageUrl);
        return true;
      } catch (intentError) {
        // Méthode 2: Vérifier avec URL scheme
        const schemes = getAppSchemes(app);
        for (const scheme of schemes) {
          try {
            const canOpen = await Linking.canOpenURL(scheme);
            if (canOpen) {
              return true;
            }
          } catch (e) {
            continue;
          }
        }
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Vérification spéciale pour TikTok avec plusieurs schemes
   */
  private static async checkTikTok(): Promise<boolean> {
    const tiktokSchemes = [
      "tiktok://",
      "snssdk1233://",
      "snssdk1180://",
      "aweme://",
    ];

    for (const scheme of tiktokSchemes) {
      try {
        const canOpen = await Linking.canOpenURL(scheme);
        if (canOpen) {
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  /**
   * Détecte toutes les applications installées sur Android
   */
  public static async detectInstalledApps(
    apps: SocialApp[]
  ): Promise<SocialApp[]> {
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
