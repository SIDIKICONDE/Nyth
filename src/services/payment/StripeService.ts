import { createLogger } from "../../utils/optimizedLogger";
import { PaymentResult, UserSubscription } from "../../types/subscription";

const logger = createLogger("StripeService");

// Configuration Stripe
const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  apiVersion: "2025-07-30.basil" as const,
};

// Types Stripe
export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: "month" | "year";
    interval_count: number;
  } | null;
  lookup_key?: string;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: "active" | "past_due" | "unpaid" | "canceled" | "incomplete" | "incomplete_expired" | "trialing";
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      price: StripePrice;
    }>;
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  customer: string;
  subscription?: string;
}

export class StripeService {
  private static stripe: any = null;
  private static isInitialized = false;

  /**
   * Initialise Stripe côté client
   */
  static async initializeClient(): Promise<void> {
    try {
      if (this.isInitialized && this.stripe) return;

      // Import dynamique pour éviter les erreurs SSR
      const { loadStripe } = await import("@stripe/stripe-js");
      
      if (!STRIPE_CONFIG.publishableKey) {
        throw new Error("Clé publique Stripe manquante");
      }

      this.stripe = await loadStripe(STRIPE_CONFIG.publishableKey, {
        apiVersion: STRIPE_CONFIG.apiVersion,
        locale: "fr",
      });

      if (!this.stripe) {
        throw new Error("Échec du chargement de Stripe");
      }

      this.isInitialized = true;
      logger.info("✅ Stripe initialisé côté client");
    } catch (error) {
      logger.error("❌ Erreur lors de l'initialisation de Stripe:", error);
      throw error;
    }
  }

  /**
   * Crée une session de checkout Stripe
   */
  static async createCheckoutSession(
    priceId: string,
    userId: string,
    userEmail: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
  ): Promise<{ sessionId: string; url: string }> {
    try {
      logger.info("🛒 Création d'une session de checkout Stripe", { priceId, userId });

      const sessionData = {
        price_id: priceId,
        user_id: userId,
        user_email: userEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: metadata || {},
      };

      // Appel à la fonction cloud pour créer la session
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "createStripeCheckoutSession",
        sessionData
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Échec de la création de la session");
      }

      const { sessionId, url } = result.data as { sessionId: string; url: string };
      logger.info("✅ Session de checkout créée:", sessionId);

      return { sessionId, url };
    } catch (error) {
      logger.error("❌ Erreur lors de la création de la session de checkout:", error);
      throw error;
    }
  }

  /**
   * Redirige vers la session de checkout
   */
  static async redirectToCheckout(sessionId: string): Promise<{ error?: Error }> {
    try {
      await this.initializeClient();
      
      if (!this.stripe) {
        throw new Error("Stripe non initialisé");
      }

      logger.info("🔄 Redirection vers le checkout Stripe:", sessionId);

      const { error } = await this.stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        logger.error("❌ Erreur lors de la redirection:", error);
        return { error };
      }

      return {};
    } catch (error) {
      logger.error("❌ Erreur lors de la redirection vers le checkout:", error);
      return { error: error as Error };
    }
  }

  /**
   * Crée et redirige vers le checkout en une seule opération
   */
  static async purchaseSubscription(
    priceId: string,
    userId: string,
    userEmail: string,
    planId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<PaymentResult> {
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const defaultSuccessUrl = successUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const defaultCancelUrl = cancelUrl || `${baseUrl}/subscription/cancel`;

      // Créer la session de checkout
      const { sessionId, url } = await this.createCheckoutSession(
        priceId,
        userId,
        userEmail,
        defaultSuccessUrl,
        defaultCancelUrl,
        { planId, source: "subscription_upgrade" }
      );

      // Rediriger vers le checkout (pour web) ou retourner l'URL (pour mobile)
      if (typeof window !== "undefined") {
        const { error } = await this.redirectToCheckout(sessionId);
        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      }

      return {
        success: true,
        subscriptionId: sessionId,
        checkoutUrl: url,
      };
    } catch (error) {
      logger.error("❌ Erreur lors de l'achat d'abonnement:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Récupère les informations d'un abonnement Stripe
   */
  static async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    try {
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "getStripeSubscription",
        { subscriptionId }
      );

      if (result.success && result.data) {
        return result.data as StripeSubscription;
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération de l'abonnement:", error);
      return null;
    }
  }

  /**
   * Annule un abonnement Stripe
   */
  static async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    try {
      logger.info("🚫 Annulation de l'abonnement Stripe:", subscriptionId);

      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "cancelStripeSubscription",
        { subscriptionId }
      );

      if (result.success) {
        logger.info("✅ Abonnement annulé avec succès");
        return { success: true };
      }

      return {
        success: false,
        error: result.error || "Échec de l'annulation",
      };
    } catch (error) {
      logger.error("❌ Erreur lors de l'annulation:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Crée ou récupère un client Stripe
   */
  static async createOrGetCustomer(
    userId: string,
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<StripeCustomer | null> {
    try {
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "createOrGetStripeCustomer",
        { userId, email, name, metadata }
      );

      if (result.success && result.data) {
        return result.data as StripeCustomer;
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la création/récupération du client:", error);
      return null;
    }
  }

  /**
   * Crée un portail client pour la gestion des abonnements
   */
  static async createCustomerPortalSession(
    customerId: string,
    returnUrl?: string
  ): Promise<{ url: string } | null> {
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const defaultReturnUrl = returnUrl || `${baseUrl}/subscription`;

      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "createStripeCustomerPortal",
        { customerId, return_url: defaultReturnUrl }
      );

      if (result.success && result.data) {
        return { url: (result.data as { url: string }).url };
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la création du portail client:", error);
      return null;
    }
  }

  /**
   * Récupère les prix disponibles pour un produit
   */
  static async getProductPrices(productId: string): Promise<StripePrice[]> {
    try {
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "getStripeProductPrices",
        { productId }
      );

      if (result.success && result.data) {
        return result.data as StripePrice[];
      }

      return [];
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des prix:", error);
      return [];
    }
  }

  /**
   * Valide un webhook Stripe
   */
  static validateWebhook(payload: string, signature: string): boolean {
    try {
      if (!STRIPE_CONFIG.webhookSecret) {
        logger.warn("⚠️ Secret webhook Stripe manquant");
        return false;
      }

      // Note: La validation réelle doit être faite côté serveur
      // Ici on fait une validation basique
      return !!(payload && signature);
    } catch (error) {
      logger.error("❌ Erreur lors de la validation du webhook:", error);
      return false;
    }
  }

  /**
   * Convertit un abonnement Stripe en UserSubscription
   */
  static convertStripeSubscriptionToUserSubscription(
    stripeSubscription: StripeSubscription,
    planId: string
  ): UserSubscription {
    const now = new Date().toISOString();
    
    return {
      planId,
      status: this.mapStripeStatusToUserStatus(stripeSubscription.status),
      startDate: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      endDate: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      usage: {
        daily: 0,
        monthly: 0,
        total: 0,
        lastReset: now,
      },
      paymentMethod: {
        type: "card",
      },
    };
  }

  /**
   * Mappe le statut Stripe vers notre statut utilisateur
   */
  private static mapStripeStatusToUserStatus(
    stripeStatus: StripeSubscription["status"]
  ): UserSubscription["status"] {
    switch (stripeStatus) {
      case "active":
        return "active";
      case "canceled":
        return "cancelled";
      case "past_due":
      case "unpaid":
      case "incomplete":
      case "incomplete_expired":
        return "expired";
      case "trialing":
        return "trial";
      default:
        return "expired";
    }
  }

  /**
   * Récupère les abonnements d'un client
   */
  static async getCustomerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
    try {
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "getCustomerStripeSubscriptions",
        { customerId }
      );

      if (result.success && result.data) {
        return result.data as StripeSubscription[];
      }

      return [];
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des abonnements client:", error);
      return [];
    }
  }

  /**
   * Met à jour les métadonnées d'un abonnement
   */
  static async updateSubscriptionMetadata(
    subscriptionId: string,
    metadata: Record<string, string>
  ): Promise<boolean> {
    try {
      const { FirebaseFunctionsFallbackService } = await import("../firebaseFunctionsFallback");
      const result = await FirebaseFunctionsFallbackService.callFunction(
        "updateStripeSubscriptionMetadata",
        { subscriptionId, metadata }
      );

      return result.success;
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour des métadonnées:", error);
      return false;
    }
  }

  /**
   * Obtient l'instance Stripe (pour usage avancé)
   */
  static async getStripeInstance(): Promise<any> {
    await this.initializeClient();
    return this.stripe;
  }

  /**
   * Vérifie si Stripe est configuré correctement
   */
  static isConfigured(): boolean {
    return !!(STRIPE_CONFIG.publishableKey && STRIPE_CONFIG.secretKey);
  }
}
