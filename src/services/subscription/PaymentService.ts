import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  PurchasesOfferings,
} from "react-native-purchases";
import { createLogger } from "../../utils/optimizedLogger";
import {
  PaymentResult,
  SubscriptionPlan,
  UserSubscription,
} from "../../types/subscription";

const logger = createLogger("PaymentService");

// Interface pour RevenueCat
type RevenueCatOffering = PurchasesOfferings["current"] extends infer _T
  ? {
      identifier: string;
      serverDescription: string;
      metadata?: unknown;
      availablePackages: PurchasesPackage[];
    }
  : never;

export class PaymentService {
  private static isInitialized = false;

  /**
   * Initialise RevenueCat
   */
  static async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      const apiKey = Platform.select({
        ios: process.env.REVENUECAT_IOS_API_KEY,
        android: process.env.REVENUECAT_ANDROID_API_KEY,
      });

      if (!apiKey) {
        throw new Error("RevenueCat API key not found");
      }

      await Purchases.configure({ apiKey: apiKey as string });

      this.isInitialized = true;
      logger.info("PaymentService initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize PaymentService:", error);
      throw error;
    }
  }

  /**
   * Récupère les offres disponibles
   */
  static async getAvailableOfferings(): Promise<RevenueCatOffering[]> {
    try {
      await this.initialize();
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
   * Achète un abonnement
   */
  static async purchaseSubscription(
    packageIdentifier: string,
    userId: string
  ): Promise<PaymentResult> {
    try {
      await this.initialize();

      // Validation côté client
      if (!packageIdentifier || !userId) {
        throw new Error("Missing required parameters");
      }

      logger.info("Starting purchase process", { packageIdentifier, userId });

      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      const selected = current?.availablePackages.find(
        (p) => p.identifier === packageIdentifier
      );
      if (!selected) {
        throw new Error("Package not found");
      }

      const purchaseResult = await Purchases.purchasePackage(selected);
      const customerInfo: any =
        (purchaseResult as any).customerInfo ?? purchaseResult;
      const entitlementId = this.mapPackageToEntitlement(packageIdentifier);
      const isActive = Boolean(
        customerInfo?.entitlements?.active?.[entitlementId]
      );
      if (!isActive) {
        throw new Error("Entitlement not active after purchase");
      }

      const latestExpiration =
        (customerInfo as any).latestExpirationDate || undefined;
      const subscription = this.convertToUserSubscription(
        latestExpiration,
        packageIdentifier
      );

      // Sauvegarder dans Firebase via fonction cloud
      await this.saveSubscriptionToServer(userId, subscription);

      logger.info("Purchase completed successfully", {
        packageIdentifier,
        userId,
      });

      return {
        success: true,
        subscriptionId: packageIdentifier,
      };
    } catch (error) {
      logger.error("Purchase failed:", error);
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

      logger.info("Restoring purchases for user:", userId);
      const restoreResult: any = await Purchases.restorePurchases();
      const customerInfo: any = restoreResult.customerInfo ?? restoreResult;
      const active = Object.keys(customerInfo.entitlements.active);
      const pkg = active.find(
        (e) =>
          e.includes("starter") || e.includes("pro") || e.includes("enterprise")
      );
      if (!pkg) {
        return { success: false, error: "No active subscription found" };
      }
      const planId = this.mapPackageToPlanId(pkg);
      const latestExpiration = customerInfo.latestExpirationDate || undefined;
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
   * Mappe un package à un plan ID
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
   * Sauvegarde l'abonnement côté serveur
   */
  private static async saveSubscriptionToServer(
    userId: string,
    subscription: UserSubscription
  ): Promise<void> {
    try {
      const { FirebaseFunctionsFallbackService } = await import(
        "../firebaseFunctionsFallback"
      );
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
      const { FirebaseFunctionsFallbackService } = await import(
        "../firebaseFunctionsFallback"
      );
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
      const { FirebaseFunctionsFallbackService } = await import(
        "../firebaseFunctionsFallback"
      );
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
