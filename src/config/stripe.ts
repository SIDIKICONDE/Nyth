/**
 * Configuration Stripe pour l'application
 */

// Stripe disabled: keep structure for type safety but with empty defaults
export const STRIPE_CONFIG = {
  // Clés API (à configurer dans les variables d'environnement)
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  
  // Configuration pour les webhooks
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",

  // URLs de redirection par défaut
  defaultUrls: {
    success: "/subscription/success",
    cancel: "/subscription/cancel",
    customerPortal: "/subscription/manage",
  },

  // Configuration des produits et prix Stripe
  products: {},

  // Configuration des fonctionnalités
  features: {},

  // Métadonnées par défaut pour les sessions de checkout
  defaultMetadata: {
    source: "nyth_app",
    version: "1.0.0",
  },
};

/**
 * Mappings entre les plans internes et Stripe
 */
export const STRIPE_PLAN_MAPPING = {
  planToPriceId: {},
  priceIdToPlan: {},
  productIdToPlan: {},
} as const;

/**
 * Configuration des webhooks Stripe
 */
export const STRIPE_WEBHOOK_EVENTS = [] as const;

/**
 * Types des événements webhook
 */
export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];

/**
 * Vérifie si Stripe est configuré correctement
 */
export function isStripeConfigured(): boolean {
  return false;
}

/**
 * Obtient l'URL complète pour les redirections
 */
export function getStripeRedirectUrl(type: "success" | "cancel", baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}`;
}

/**
 * Obtient le price ID Stripe pour un plan et une période
 */
export function getStripePriceId(planId: string, period: "monthly" | "yearly" = "monthly"): string {
  return "";
}

/**
 * Obtient le plan à partir d'un price ID Stripe
 */
export function getPlanFromPriceId(priceId: string): string {
  return "free";
}

/**
 * Obtient le plan à partir d'un product ID Stripe
 */
export function getPlanFromProductId(productId: string): string {
  return "free";
}

/**
 * Configuration des paramètres de session Stripe
 */
export const STRIPE_SESSION_CONFIG = {
  // Placeholder object
};

/**
 * Messages d'erreur Stripe localisés
 */
export const STRIPE_ERROR_MESSAGES = {
  disabled: "Le paiement par Stripe est désactivé.",
};

/**
 * Obtient un message d'erreur localisé pour un code d'erreur Stripe
 */
export function getStripeErrorMessage(errorCode: string): string {
  return STRIPE_ERROR_MESSAGES.disabled;
}
