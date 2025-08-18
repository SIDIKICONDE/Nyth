import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  PurchasesOfferings,
  CustomerInfo,
} from "react-native-purchases";
import { createLogger } from "../../utils/optimizedLogger";
import {
  PaymentResult,
  UserSubscription,
  PaymentProvider,
} from "../../types/subscription";
import { StripeService } from "../payment/StripeService";
import { REVENUECAT_API_KEYS, REVENUECAT_CONFIG } from '../../config/revenuecat';
import { FirebaseFunctionsFallbackService } from "../firebaseFunctionsFallback";

const logger = createLogger("PaymentService");

// Interface pour RevenueCat
type RevenueCatOffering = PurchasesOfferings["current"] extends infer _
  ? {
      identifier: string;
      serverDescription: string;
      metadata?: unknown;
      availablePackages: PurchasesPackage[];
    }
  : never;

export class PaymentService {
  private static isInitialized = false;
  private static preferredProvider: PaymentProvider = "revenuecat"; // Default to RevenueCat

  /**
   * Configure le fournisseur de paiement préféré
   */
  static setPreferredProvider(provider: PaymentProvider): void {
    this.preferredProvider = provider;
    logger.info(`📝 Fournisseur de paiement configuré: ${provider}`);
  }

  /**
   * Obtient le fournisseur de paiement préféré
   */
  static getPreferredProvider(): PaymentProvider {
    // Sur web, préférer Stripe
    if (Platform.OS === "web") {
      return "stripe";
    }
    
    // Sur mobile, utiliser le provider configuré
    return this.preferredProvider;
  }

  /**
   * Initialise RevenueCat
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEYS.ios,
        android: REVENUECAT_API_KEYS.android,
      });

      if (!apiKey || apiKey.includes('YOUR_')) {
        logger.warn("RevenueCat API key not configured. Payments will not work.");
        // Ne pas lancer d'erreur pour permettre à l'app de fonctionner sans paiements
        return;
      }

      // Configure uniquement avec la clé, lier l'utilisateur explicitement côté achat/restauration
      await Purchases.configure({ apiKey: apiKey as string });

      // Activer le mode debug en développement
      if (REVENUECAT_CONFIG.useDebugMode) {
        Purchases.setDebugLogsEnabled(true);
      }

      this.isInitialized = true;
      logger.info("✅ PaymentService (RevenueCat) initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize PaymentService:", error);
      // Ne pas lancer d'erreur pour permettre à l'app de fonctionner
    }
  }

  /**
   * S'assure que l'utilisateur RevenueCat courant est bien `userId` (login si nécessaire)
   */
  private static async ensureRevenueCatLogin(userId: string): Promise<void> {
    if (!userId) return;
    try {
      const currentId = await Purchases.getAppUserID();
      if (currentId !== userId) {
        await Purchases.logIn(userId);
        logger.info("🔐 RevenueCat logIn effectué", { userId });
      }
    } catch (error) {
      logger.warn("Impossible de lier l'utilisateur RevenueCat", { error });
    }
  }

  /**
   * Récupère les offres disponibles
   */
  static async getAvailableOfferings(): Promise<RevenueCatOffering[]> {
    try {
      await this.initialize();
      if (!this.isInitialized) return []; // Retourner un tableau vide si non initialisé

      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return [];
      return [
        {
          identifier: current.identifier,
          serverDescription: current.serverDescription || "",
          availablePackages: current.availablePackages,
        },
      ];
    } catch (error) {
      logger.error("Failed to get offerings:", error);
      throw error;
    }
  }

  /**
   * Achète un abonnement (utilise le provider approprié)
   */
  static async purchaseSubscription(
    packageIdentifier: string,
    userId: string,
    userEmail?: string
  ): Promise<PaymentResult> {
    const provider = this.getPreferredProvider();
    
    logger.info("Starting purchase process", { 
      packageIdentifier, 
      userId, 
      provider 
    });

    switch (provider) {
      case "stripe":
        return this.purchaseWithStripe(packageIdentifier, userId, userEmail);
      case "revenuecat":
        return this.purchaseWithRevenueCat(packageIdentifier, userId);
      default:
        return {
          success: false,
          error: `Provider non supporté: ${provider}`,
        };
    }
  }

  /**
   * Achète un abonnement via Stripe
   */
  private static async purchaseWithStripe(
    priceId: string,
    userId: string,
    userEmail?: string
  ): Promise<PaymentResult> {
    try {
      if (!userEmail) {
        throw new Error("Email utilisateur requis pour Stripe");
      }

      // Mapper priceId vers planId
      const planId = this.mapPriceIdToPlanId(priceId);
      
      const result = await StripeService.purchaseSubscription(
        priceId,
        userId,
        userEmail,
        planId
      );

      return result;
    } catch (error) {
      logger.error("Stripe purchase failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Stripe purchase failed",
      };
    }
  }

  /**
   * Achète un abonnement via RevenueCat
   */
  private static async purchaseWithRevenueCat(
    packageIdentifier: string,
    userId: string
  ): Promise<PaymentResult> {
    try {
      await this.initialize();
      if (!this.isInitialized) {
        return {
          success: false,
          error: "Payment service not initialized.",
        };
      }

      // Validation côté client
      if (!packageIdentifier || !userId) {
        throw new Error("Missing required parameters");
      }

      // Lier l'utilisateur à RevenueCat avant l'achat
      await this.ensureRevenueCatLogin(userId);

      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      const selected = current?.availablePackages.find(
        (p) => p.identifier === packageIdentifier
      );
      if (!selected) {
        throw new Error("Package not found");
      }

      const { customerInfo } = await Purchases.purchasePackage(selected);
      // customerInfo: CustomerInfo
      const entitlementId = this.mapPackageToEntitlement(packageIdentifier);
      const isActive = Boolean(customerInfo.entitlements.active[entitlementId]);
      if (!isActive) {
        throw new Error("Entitlement not active after purchase");
      }

      const latestExpiration = Object.values(customerInfo.entitlements.active)
        .map((e) => e.expirationDate)
        .filter((d): d is string => Boolean(d))
        .sort()
        .pop();
      const subscription = this.convertToUserSubscription(
        latestExpiration,
        packageIdentifier
      );

      // Sauvegarder dans Firebase via fonction cloud
      await this.saveSubscriptionToServer(userId, subscription);

      logger.info("RevenueCat purchase completed successfully", {
        packageIdentifier,
        userId,
      });

      return {
        success: true,
        subscriptionId: packageIdentifier,
      };
    } catch (error) {
      logger.error("RevenueCat purchase failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Purchase failed",
      };
    }
  }

  /**
   * Restaure les achats
   */
  static async restorePurchases(userId: string): Promise<PaymentResult> {
    try {
      await this.initialize();
      if (!this.isInitialized) {
        return {
          success: false,
          error: "Payment service not initialized.",
        };
      }

      logger.info("Restoring purchases for user:", userId);
      await this.ensureRevenueCatLogin(userId);
      const customerInfo: CustomerInfo = await Purchases.restorePurchases();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      const activeKey = activeEntitlements.find(
        (e) => e.includes("starter") || e.includes("pro") || e.includes("enterprise")
      );
      if (!activeKey) {
        return { success: false, error: "No active subscription found" };
      }
      const planId = activeKey.includes("enterprise")
        ? "enterprise"
        : activeKey.includes("pro")
        ? "pro"
        : "starter";
      const latestExpiration = Object.values(customerInfo.entitlements.active)
        .map((e) => e.expirationDate)
        .filter((d): d is string => Boolean(d))
        .sort()
        .pop();
      const subscription: UserSubscription = {
        planId,
        status: "active",
        startDate: new Date().toISOString(),
        endDate: latestExpiration,
        usage: {
          daily: 0,
          monthly: 0,
          total: 0,
          lastReset: new Date().toISOString(),
        },
        paymentMethod: { type: Platform.OS === "ios" ? "apple" : "google" },
      };
      await this.saveSubscriptionToServer(userId, subscription);
      return { success: true, subscriptionId: planId };
    } catch (error) {
      logger.error("Restore failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Restore failed",
      };
    }
  }

  /**
   * Annule un abonnement
   */
  static async cancelSubscription(userId: string): Promise<PaymentResult> {
    try {
      logger.info("Cancelling subscription for user:", userId);

      // Marquer comme annulé côté serveur
      await this.cancelSubscriptionOnServer(userId);

      return {
        success: true,
      };
    } catch (error) {
      logger.error("Cancellation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cancellation failed",
      };
    }
  }

  /**
   * Mappe un package à un entitlement
   */
  private static mapPackageToEntitlement(packageIdentifier: string): string {
    const mapping: { [key: string]: string } = {
      starter_monthly: "starter_features",
      pro_monthly: "pro_features",
      enterprise_monthly: "enterprise_features",
    };

    return mapping[packageIdentifier] || "free_features";
  }

  /**
   * Convertit PurchaserInfo en UserSubscription
   */
  private static convertToUserSubscription(
    latestExpirationDate: string | undefined,
    packageIdentifier: string
  ): UserSubscription {
    const planId = this.mapPackageToPlanId(packageIdentifier);

    return {
      planId,
      status: "active",
      startDate: new Date().toISOString(),
      endDate: latestExpirationDate,
      usage: {
        daily: 0,
        monthly: 0,
        total: 0,
        lastReset: new Date().toISOString(),
      },
      paymentMethod: {
        type: Platform.OS === "ios" ? "apple" : "google",
      },
    };
  }

  /**
   * Mappe un package à un plan ID (RevenueCat)
   */
  private static mapPackageToPlanId(packageIdentifier: string): string {
    const mapping: { [key: string]: string } = {
      starter_monthly: "starter",
      pro_monthly: "pro",
      enterprise_monthly: "enterprise",
    };

    return mapping[packageIdentifier] || "free";
  }

  /**
   * Mappe un price ID Stripe vers un plan ID
   */
  private static mapPriceIdToPlanId(priceId: string): string {
    // Configuration des price IDs Stripe (à adapter selon votre configuration Stripe)
    const mapping: { [key: string]: string } = {
      "price_starter_monthly": "starter",
      "price_pro_monthly": "pro", 
      "price_enterprise_monthly": "enterprise",
      "price_starter_yearly": "starter",
      "price_pro_yearly": "pro",
      "price_enterprise_yearly": "enterprise",
    };

    return mapping[priceId] || "free";
  }

  /**
   * Mappe un plan ID vers un price ID Stripe
   */
  static mapPlanIdToPriceId(planId: string, period: "monthly" | "yearly" = "monthly"): string {
    const mapping: { [key: string]: { [period: string]: string } } = {
      starter: {
        monthly: "price_starter_monthly",
        yearly: "price_starter_yearly",
      },
      pro: {
        monthly: "price_pro_monthly", 
        yearly: "price_pro_yearly",
      },
      enterprise: {
        monthly: "price_enterprise_monthly",
        yearly: "price_enterprise_yearly",
      },
    };

    return mapping[planId]?.[period] || "";
  }

  /**
   * Sauvegarde l'abonnement côté serveur
   */
  private static async saveSubscriptionToServer(
    userId: string,
    subscription: UserSubscription
  ): Promise<void> {
    try {
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "saveSubscription",
        { userId, subscription }
      );
      if (!result.success) {
        throw new Error(result.error || "saveSubscription failed");
      }
      logger.info("Subscription saved to server successfully");
    } catch (error) {
      logger.error("Failed to save subscription to server:", error);
      throw error;
    }
  }

  /**
   * Récupère l'abonnement depuis le serveur
   */
  private static async getSubscriptionFromServer(
    userId: string
  ): Promise<UserSubscription | null> {
    try {
      const result =
        await FirebaseFunctionsFallbackService.callFunction<UserSubscription | null>(
          "getSubscription",
          { userId }
        );
      if (result.success)
        return (result.data as UserSubscription | null) ?? null;
      return null;
    } catch (error) {
      logger.error("Failed to get subscription from server:", error);
      return null;
    }
  }

  /**
   * Annule l'abonnement côté serveur
   */
  private static async cancelSubscriptionOnServer(
    userId: string
  ): Promise<void> {
    try {
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "cancelSubscription",
        { userId }
      );
      if (!result.success) {
        throw new Error(result.error || "cancelSubscription failed");
      }
    } catch (error) {
      logger.error("Failed to cancel subscription on server:", error);
      throw error;
    }
  }

  /**
   * Récupère le token Firebase ID pour l'authentification
   */
  private static async getFirebaseIdToken(): Promise<string> {
    return "";
  }
}
