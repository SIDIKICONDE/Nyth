/**
 * Configuration Stripe pour l'application
 */

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
  products: {
    starter: {
      productId: "prod_starter", // À remplacer par vos vrais IDs Stripe
      prices: {
        monthly: "price_starter_monthly",
        yearly: "price_starter_yearly",
      },
    },
    pro: {
      productId: "prod_pro",
      prices: {
        monthly: "price_pro_monthly",
        yearly: "price_pro_yearly", 
      },
    },
    enterprise: {
      productId: "prod_enterprise",
      prices: {
        monthly: "price_enterprise_monthly",
        yearly: "price_enterprise_yearly",
      },
    },
  },

  // Configuration des fonctionnalités
  features: {
    // Activer le portail client Stripe
    customerPortal: true,
    
    // Activer les codes promotionnels
    promotionCodes: true,
    
    // Collecte automatique des adresses
    collectBillingAddress: true,
    
    // Mise à jour automatique des informations client
    updateCustomerDetails: true,
  },

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
  // Plan -> Price ID (mensuel par défaut)
  planToPriceId: {
    starter: STRIPE_CONFIG.products.starter.prices.monthly,
    pro: STRIPE_CONFIG.products.pro.prices.monthly,
    enterprise: STRIPE_CONFIG.products.enterprise.prices.monthly,
  },

  // Price ID -> Plan
  priceIdToPlan: {
    [STRIPE_CONFIG.products.starter.prices.monthly]: "starter",
    [STRIPE_CONFIG.products.starter.prices.yearly]: "starter",
    [STRIPE_CONFIG.products.pro.prices.monthly]: "pro",
    [STRIPE_CONFIG.products.pro.prices.yearly]: "pro",
    [STRIPE_CONFIG.products.enterprise.prices.monthly]: "enterprise",
    [STRIPE_CONFIG.products.enterprise.prices.yearly]: "enterprise",
  },

  // Product ID -> Plan
  productIdToPlan: {
    [STRIPE_CONFIG.products.starter.productId]: "starter",
    [STRIPE_CONFIG.products.pro.productId]: "pro",
    [STRIPE_CONFIG.products.enterprise.productId]: "enterprise",
  },
};

/**
 * Configuration des webhooks Stripe
 */
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.created",
  "customer.updated",
] as const;

/**
 * Types des événements webhook
 */
export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[number];

/**
 * Vérifie si Stripe est configuré correctement
 */
export function isStripeConfigured(): boolean {
  return !!(STRIPE_CONFIG.publishableKey);
}

/**
 * Obtient l'URL complète pour les redirections
 */
export function getStripeRedirectUrl(type: "success" | "cancel", baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${STRIPE_CONFIG.defaultUrls[type]}`;
}

/**
 * Obtient le price ID Stripe pour un plan et une période
 */
export function getStripePriceId(planId: string, period: "monthly" | "yearly" = "monthly"): string {
  const product = STRIPE_CONFIG.products[planId as keyof typeof STRIPE_CONFIG.products];
  return product?.prices[period] || "";
}

/**
 * Obtient le plan à partir d'un price ID Stripe
 */
export function getPlanFromPriceId(priceId: string): string {
  return STRIPE_PLAN_MAPPING.priceIdToPlan[priceId] || "free";
}

/**
 * Obtient le plan à partir d'un product ID Stripe
 */
export function getPlanFromProductId(productId: string): string {
  return STRIPE_PLAN_MAPPING.productIdToPlan[productId] || "free";
}

/**
 * Configuration des paramètres de session Stripe
 */
export const STRIPE_SESSION_CONFIG = {
  mode: "subscription" as const,
  paymentMethodTypes: ["card"] as const,
  
  // Configuration de la facturation
  billingAddressCollection: "auto" as const,
  
  // Configuration des mises à jour client
  customerUpdate: {
    address: "auto" as const,
    name: "auto" as const,
  },
  
  // Configuration des codes promo
  allowPromotionCodes: STRIPE_CONFIG.features.promotionCodes,
  
  // Configuration des taxes automatiques
  automaticTax: {
    enabled: true,
  },
  
  // Durée d'expiration de la session (30 minutes)
  expiresAt: Math.floor(Date.now() / 1000) + (30 * 60),
};

/**
 * Messages d'erreur Stripe localisés
 */
export const STRIPE_ERROR_MESSAGES = {
  card_declined: "Votre carte a été refusée. Veuillez essayer avec une autre carte.",
  expired_card: "Votre carte a expiré. Veuillez mettre à jour vos informations de paiement.",
  insufficient_funds: "Fonds insuffisants. Veuillez vérifier le solde de votre compte.",
  incorrect_cvc: "Le code de sécurité de votre carte est incorrect.",
  processing_error: "Une erreur s'est produite lors du traitement de votre paiement.",
  incorrect_number: "Le numéro de carte est incorrect.",
  invalid_expiry_month: "Le mois d'expiration de la carte est invalide.",
  invalid_expiry_year: "L'année d'expiration de la carte est invalide.",
  generic_decline: "Votre paiement n'a pas pu être traité. Veuillez réessayer.",
};

/**
 * Obtient un message d'erreur localisé pour un code d'erreur Stripe
 */
export function getStripeErrorMessage(errorCode: string): string {
  return STRIPE_ERROR_MESSAGES[errorCode as keyof typeof STRIPE_ERROR_MESSAGES] || 
         "Une erreur inattendue s'est produite. Veuillez réessayer.";
}
