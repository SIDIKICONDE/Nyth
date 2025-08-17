import { Linking, Platform } from "react-native";
import { SocialApp } from "../types";
import { getAppSchemes, getStoreUrl } from "./schemeUtils";

/**
 * Utilitaire pour lancer les applications
 */
export class AppLauncher {
  /**
   * Ouvre une application spécifique
   */
  public static async openApp(
    app: SocialApp,
    fallbackUrl?: string
  ): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        return await this.openAndroidApp(app, fallbackUrl);
      } else if (Platform.OS === "ios") {
        return await this.openIOSApp(app, fallbackUrl);
      }

      // Fallback pour autres plateformes
      return await this.openWithFallback(app, fallbackUrl);
    } catch (error) {
      return false;
    }
  }

  /**
   * Ouvre une application sur Android
   */
  private static async openAndroidApp(
    app: SocialApp,
    fallbackUrl?: string
  ): Promise<boolean> {
    // Essayer d'abord IntentLauncher
    try {
      const packageUrl = `package:${app.androidPackage}`;
      await Linking.openURL(packageUrl);
      return true;
    } catch (intentError) {
      // Fallback vers URL schemes
      const schemes = getAppSchemes(app);
      for (const scheme of schemes) {
        try {
          const canOpen = await Linking.canOpenURL(scheme);
          if (canOpen) {
            await Linking.openURL(scheme);
            return true;
          }
        } catch (schemeError) {
          continue;
        }
      }
    }

    return await this.openWithFallback(app, fallbackUrl);
  }

  /**
   * Ouvre une application sur iOS
   */
  private static async openIOSApp(
    app: SocialApp,
    fallbackUrl?: string
  ): Promise<boolean> {
    const schemes = getAppSchemes(app);
    for (const scheme of schemes) {
      try {
        const canOpen = await Linking.canOpenURL(scheme);
        if (canOpen) {
          await Linking.openURL(scheme);
          return true;
        }
      } catch (schemeError) {
        continue;
      }
    }

    return await this.openWithFallback(app, fallbackUrl);
  }

  /**
   * Ouvre avec fallback (URL fournie ou store)
   */
  private static async openWithFallback(
    app: SocialApp,
    fallbackUrl?: string
  ): Promise<boolean> {
    try {
      if (fallbackUrl) {
        await Linking.openURL(fallbackUrl);
        return true;
      } else {
        // Rediriger vers le store approprié
        const storeUrl = getStoreUrl(app, Platform.OS);
        await Linking.openURL(storeUrl);
        return true;
      }
    } catch (error) {
      return false;
    }
  }
}
