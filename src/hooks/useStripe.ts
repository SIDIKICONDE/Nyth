import { useState, useEffect, useCallback } from "react";
import { StripeService, StripePrice, StripeCustomer } from "../services/payment/StripeService";
import { PaymentService } from "../services/subscription/PaymentService";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { getStripePriceId, STRIPE_CONFIG } from "../config/stripe";
import { createOptimizedLogger } from "../utils/optimizedLogger";

const logger = createOptimizedLogger("useStripe");

export interface UseStripeReturn {
  // État
  isLoading: boolean;
  isInitialized: boolean;
  customer: StripeCustomer | null;
  availablePrices: StripePrice[];
  error: string | null;

  // Actions
  initializeStripe: () => Promise<boolean>;
  createCheckout: (planId: string, period?: "monthly" | "yearly") => Promise<{ success: boolean; url?: string; error?: string }>;
  openCustomerPortal: () => Promise<boolean>;
  getOrCreateCustomer: () => Promise<StripeCustomer | null>;
  loadProductPrices: (productId: string) => Promise<StripePrice[]>;
  
  // Utilitaires
  getPriceForPlan: (planId: string, period?: "monthly" | "yearly") => string;
  isStripeConfigured: () => boolean;
}

/**
 * Hook personnalisé pour gérer Stripe
 */
export const useStripe = (): UseStripeReturn => {
  const { currentUser } = useAuth();
  const { syncSubscription } = useSubscription();

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);
  const [availablePrices, setAvailablePrices] = useState<StripePrice[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialise Stripe
   */
  const initializeStripe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!StripeService.isConfigured()) {
        throw new Error("Stripe n'est pas configuré");
      }

      await StripeService.initializeClient();
      setIsInitialized(true);
      
      logger.info("✅ Stripe initialisé via le hook");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur d'initialisation";
      setError(errorMessage);
      logger.error("❌ Erreur d'initialisation Stripe:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crée ou récupère le client Stripe
   */
  const getOrCreateCustomer = useCallback(async (): Promise<StripeCustomer | null> => {
    try {
      if (!currentUser || !currentUser.email) {
        throw new Error("Utilisateur non connecté");
      }

      setIsLoading(true);
      
      const stripeCustomer = await StripeService.createOrGetCustomer(
        currentUser.uid,
        currentUser.email,
        currentUser.displayName || undefined,
        { source: "nyth_app" }
      );

      if (stripeCustomer) {
        setCustomer(stripeCustomer);
        logger.info("✅ Client Stripe récupéré:", stripeCustomer.id);
      }

      return stripeCustomer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur client";
      setError(errorMessage);
      logger.error("❌ Erreur lors de la gestion du client:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  /**
   * Crée une session de checkout
   */
  const createCheckout = useCallback(async (
    planId: string,
    period: "monthly" | "yearly" = "monthly"
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      if (!currentUser || !currentUser.email) {
        throw new Error("Utilisateur non connecté");
      }

      setIsLoading(true);
      setError(null);

      const priceId = getStripePriceId(planId, period);
      if (!priceId) {
        throw new Error(`Prix non trouvé pour le plan ${planId} (${period})`);
      }

      // Configurer le PaymentService pour utiliser Stripe
      PaymentService.setPreferredProvider("stripe");

      const result = await PaymentService.purchaseSubscription(
        priceId,
        currentUser.uid,
        currentUser.email
      );

      if (result.success) {
        logger.info("✅ Session de checkout créée avec succès");
        
        // Optionnel : démarrer la synchronisation
        setTimeout(() => {
          syncSubscription().catch(error => {
            logger.warn("Erreur lors de la synchronisation post-checkout:", error);
          });
        }, 5000);

        return {
          success: true,
          url: result.checkoutUrl,
        };
      } else {
        throw new Error(result.error || "Erreur lors de la création du checkout");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur checkout";
      setError(errorMessage);
      logger.error("❌ Erreur lors de la création du checkout:", error);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, syncSubscription]);

  /**
   * Ouvre le portail client Stripe
   */
  const openCustomerPortal = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      let customerToUse = customer;

      // Créer ou récupérer le client si nécessaire
      if (!customerToUse) {
        customerToUse = await getOrCreateCustomer();
        if (!customerToUse) {
          throw new Error("Impossible de créer le client Stripe");
        }
      }

      const portalSession = await StripeService.createCustomerPortalSession(customerToUse.id);
      
      if (!portalSession) {
        throw new Error("Impossible de créer la session du portail");
      }

      // Ouvrir l'URL (gestion différente selon la plateforme)
      if (typeof window !== "undefined") {
        window.open(portalSession.url, "_blank");
      }

      logger.info("✅ Portail client ouvert");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur portail";
      setError(errorMessage);
      logger.error("❌ Erreur lors de l'ouverture du portail:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customer, getOrCreateCustomer]);

  /**
   * Charge les prix d'un produit
   */
  const loadProductPrices = useCallback(async (productId: string): Promise<StripePrice[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const prices = await StripeService.getProductPrices(productId);
      setAvailablePrices(prices);
      
      logger.info(`✅ ${prices.length} prix chargés pour le produit ${productId}`);
      return prices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur chargement prix";
      setError(errorMessage);
      logger.error("❌ Erreur lors du chargement des prix:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtient le price ID pour un plan et une période
   */
  const getPriceForPlan = useCallback((
    planId: string,
    period: "monthly" | "yearly" = "monthly"
  ): string => {
    return getStripePriceId(planId, period);
  }, []);

  /**
   * Vérifie si Stripe est configuré
   */
  const isStripeConfigured = useCallback((): boolean => {
    return StripeService.isConfigured();
  }, []);

  // Initialisation automatique
  useEffect(() => {
    if (!isInitialized && isStripeConfigured()) {
      initializeStripe();
    }
  }, [isInitialized, isStripeConfigured, initializeStripe]);

  // Charger le client automatiquement si l'utilisateur est connecté
  useEffect(() => {
    if (currentUser && !customer && isInitialized) {
      getOrCreateCustomer();
    }
  }, [currentUser, customer, isInitialized, getOrCreateCustomer]);

  return {
    // État
    isLoading,
    isInitialized,
    customer,
    availablePrices,
    error,

    // Actions
    initializeStripe,
    createCheckout,
    openCustomerPortal,
    getOrCreateCustomer,
    loadProductPrices,

    // Utilitaires
    getPriceForPlan,
    isStripeConfigured,
  };
};

/**
 * Hook pour obtenir les informations de tarification d'un plan
 */
export const useStripePricing = (planId: string) => {
  const { loadProductPrices, availablePrices, isLoading } = useStripe();
  const [planPrices, setPlanPrices] = useState<StripePrice[]>([]);

  useEffect(() => {
    const productConfig = STRIPE_CONFIG.products[planId as keyof typeof STRIPE_CONFIG.products];
    
    if (productConfig) {
      loadProductPrices(productConfig.productId).then(prices => {
        setPlanPrices(prices);
      });
    }
  }, [planId, loadProductPrices]);

  const monthlyPrice = planPrices.find(p => p.recurring?.interval === "month");
  const yearlyPrice = planPrices.find(p => p.recurring?.interval === "year");

  return {
    isLoading,
    monthlyPrice,
    yearlyPrice,
    allPrices: planPrices,
  };
};
