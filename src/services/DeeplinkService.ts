import { Linking } from "react-native";
import { NavigationContainerRef } from "@react-navigation/native";
import { systemLog } from "./SystemLogService";

export type DeeplinkType =
  | "support"
  | "admin_support"
  | "profile"
  | "settings"
  | "notification"
  | "payment";

interface DeeplinkConfig {
  path: string;
  params?: Record<string, any>;
}

class DeeplinkService {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private pendingDeeplink: string | null = null;

  /**
   * Initialise le service de deeplinks
   */
  initialize(navigationRef: NavigationContainerRef<any>) {
    this.navigationRef = navigationRef;

    // Gérer le deeplink initial (app fermée)
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeeplink(url);
      }
    });

    // Écouter les deeplinks quand l'app est ouverte
    Linking.addEventListener("url", this.handleUrl);

    // Traiter les deeplinks en attente
    if (this.pendingDeeplink) {
      this.handleDeeplink(this.pendingDeeplink);
      this.pendingDeeplink = null;
    }
  }

  /**
   * Nettoie les listeners
   */
  cleanup() {
    Linking.removeAllListeners("url");
  }

  /**
   * Gère l'événement URL
   */
  private handleUrl = (event: { url: string }) => {
    this.handleDeeplink(event.url);
  };

  /**
   * Traite un deeplink
   */
  handleDeeplink(url: string) {
    try {
      console.log("Handling deeplink:", url);

      // Si la navigation n'est pas prête, mettre en attente
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        this.pendingDeeplink = url;
        return;
      }

      // Parser l'URL
      const route = this.parseDeeplink(url);
      if (!route) return;

      // Naviguer vers la route appropriée
      this.navigateToRoute(route);

      systemLog.info("system", "Deeplink traité", { url, route });
    } catch (error) {
      console.error("Erreur traitement deeplink:", error);
      systemLog.error("system", "Erreur traitement deeplink", error as Error, {
        url,
      });
    }
  }

  /**
   * Parse un deeplink et retourne la configuration de route
   */
  private parseDeeplink(url: string): DeeplinkConfig | null {
    try {
      // Formats supportés:
      // app://support
      // app://admin/support/{threadId}
      // app://profile
      // app://settings
      // app://notification/{notificationId}
      // app://payment/{paymentId}
      // https://yourapp.com/support

      const urlParts = url.replace(/.*?:\/\//g, "").split("/");
      const path = urlParts[0];
      const subPath = urlParts[1];
      const id = urlParts[2];

      switch (path) {
        case "support":
          return {
            path: "Support",
            params: {},
          };

        case "admin":
          if (subPath === "support") {
            return {
              path: "AdminSupport",
              params: id ? { threadId: id } : {},
            };
          }
          break;

        case "profile":
          return {
            path: "Profile",
            params: {},
          };

        case "settings":
          return {
            path: "Settings",
            params: {},
          };

        case "notification":
          if (subPath) {
            return {
              path: "NotificationDetail",
              params: { notificationId: subPath },
            };
          }
          return {
            path: "Notifications",
            params: {},
          };

        case "payment":
          if (subPath) {
            return {
              path: "PaymentDetail",
              params: { paymentId: subPath },
            };
          }
          return {
            path: "Payments",
            params: {},
          };

        default:
          console.log("Deeplink non reconnu:", path);
          return null;
      }

      return null;
    } catch (error) {
      console.error("Erreur parsing deeplink:", error);
      return null;
    }
  }

  /**
   * Navigue vers une route
   */
  private navigateToRoute(config: DeeplinkConfig) {
    if (!this.navigationRef) return;

    try {
      // Naviguer vers la route
      (this.navigationRef as any).navigate(config.path, config.params);
    } catch (error) {
      console.error("Erreur navigation:", error);

      // Fallback: essayer de naviguer vers l'écran principal d'abord
      try {
        (this.navigationRef as any).navigate("Main");
        setTimeout(() => {
          (this.navigationRef as any)?.navigate(config.path, config.params);
        }, 100);
      } catch (fallbackError) {
        console.error("Erreur navigation fallback:", fallbackError);
      }
    }
  }

  /**
   * Crée un deeplink pour une route spécifique
   */
  createDeeplink(type: DeeplinkType, params?: Record<string, any>): string {
    const baseUrl = "app://";

    switch (type) {
      case "support":
        return `${baseUrl}support`;

      case "admin_support":
        if (params?.threadId) {
          return `${baseUrl}admin/support/${params.threadId}`;
        }
        return `${baseUrl}admin/support`;

      case "profile":
        return `${baseUrl}profile`;

      case "settings":
        return `${baseUrl}settings`;

      case "notification":
        if (params?.notificationId) {
          return `${baseUrl}notification/${params.notificationId}`;
        }
        return `${baseUrl}notification`;

      case "payment":
        if (params?.paymentId) {
          return `${baseUrl}payment/${params.paymentId}`;
        }
        return `${baseUrl}payment`;

      default:
        return baseUrl;
    }
  }

  /**
   * Ouvre un deeplink externe
   */
  async openExternalDeeplink(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erreur ouverture URL externe:", error);
      return false;
    }
  }

  /**
   * Configure les deeplinks pour iOS (Universal Links)
   */
  configureIOSUniversalLinks() {
    // Configuration pour iOS Universal Links
    // À implémenter selon les besoins spécifiques
  }

  /**
   * Configure les deeplinks pour Android (App Links)
   */
  configureAndroidAppLinks() {
    // Configuration pour Android App Links
    // À implémenter selon les besoins spécifiques
  }
}

// Export d'une instance unique
export const deeplinkService = new DeeplinkService();
export default DeeplinkService;
