import Stripe from "stripe";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";

// Secrets Firebase pour Stripe
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Configuration Stripe
let stripe: Stripe | null = null;

const initializeStripe = () => {
  if (!stripe) {
    const secretKey = stripeSecretKey.value();
    if (!secretKey) {
      throw new Error("Clé secrète Stripe manquante");
    }
    
    stripe = new Stripe(secretKey, {
      apiVersion: "2025-07-30.basil",
      typescript: true,
    });
  }
  return stripe;
};

/**
 * Crée une session de checkout Stripe
 */
export const createStripeCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const {
        price_id,
        user_id,
        user_email,
        success_url,
        cancel_url,
        metadata = {},
      } = request.data;

      // Validation des paramètres
      if (!price_id || !user_id || !user_email) {
        throw new HttpsError("invalid-argument", "Paramètres manquants");
      }

      // Créer ou récupérer le client Stripe
      let customer: Stripe.Customer;
      const existingCustomers = await stripe.customers.list({
        email: user_email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        logger.info(`Client existant trouvé: ${customer.id}`);
      } else {
        customer = await stripe.customers.create({
          email: user_email,
          metadata: {
            user_id,
            source: "firebase_function",
          },
        });
        logger.info(`Nouveau client créé: ${customer.id}`);
      }

      // Créer la session de checkout
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [
          {
            price: price_id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: {
          user_id,
          ...metadata,
        },
        subscription_data: {
          metadata: {
            user_id,
            ...metadata,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        customer_update: {
          address: "auto",
          name: "auto",
        },
      });

      logger.info(`Session de checkout créée: ${session.id}`);

      return {
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      };
    } catch (error) {
      logger.error("Erreur lors de la création de la session:", error);
      throw new HttpsError("internal", "Erreur lors de la création de la session");
    }
  }
);

/**
 * Récupère un abonnement Stripe
 */
export const getStripeSubscription = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { subscriptionId } = request.data;

      if (!subscriptionId) {
        throw new HttpsError("invalid-argument", "ID d'abonnement manquant");
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération de l'abonnement:", error);
      throw new HttpsError("internal", "Erreur lors de la récupération");
    }
  }
);

/**
 * Annule un abonnement Stripe
 */
export const cancelStripeSubscription = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { subscriptionId } = request.data;

      if (!subscriptionId) {
        throw new HttpsError("invalid-argument", "ID d'abonnement manquant");
      }

      // Annuler l'abonnement à la fin de la période de facturation
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      logger.info(`Abonnement marqué pour annulation: ${subscriptionId}`);

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      logger.error("Erreur lors de l'annulation de l'abonnement:", error);
      throw new HttpsError("internal", "Erreur lors de l'annulation");
    }
  }
);

/**
 * Crée ou récupère un client Stripe
 */
export const createOrGetStripeCustomer = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { userId, email, name, metadata = {} } = request.data;

      if (!userId || !email) {
        throw new HttpsError("invalid-argument", "Paramètres manquants");
      }

      // Chercher un client existant
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        
        // Mettre à jour les métadonnées si nécessaire
        if (customer.metadata.user_id !== userId) {
          await stripe.customers.update(customer.id, {
            metadata: {
              ...customer.metadata,
              user_id: userId,
              ...metadata,
            },
          });
        }

        return {
          success: true,
          data: customer,
        };
      }

      // Créer un nouveau client
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          user_id: userId,
          ...metadata,
        },
      });

      logger.info(`Nouveau client Stripe créé: ${customer.id}`);

      return {
        success: true,
        data: customer,
      };
    } catch (error) {
      logger.error("Erreur lors de la création/récupération du client:", error);
      throw new HttpsError("internal", "Erreur lors de la gestion du client");
    }
  }
);

/**
 * Crée un portail client Stripe
 */
export const createStripeCustomerPortal = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { customerId, return_url } = request.data;

      if (!customerId) {
        throw new HttpsError("invalid-argument", "ID client manquant");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: return_url,
      });

      return {
        success: true,
        data: {
          url: session.url,
        },
      };
    } catch (error) {
      logger.error("Erreur lors de la création du portail client:", error);
      throw new HttpsError("internal", "Erreur lors de la création du portail");
    }
  }
);

/**
 * Récupère les prix d'un produit
 */
export const getStripeProductPrices = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    try {
      const stripe = initializeStripe();
      const { productId } = request.data;

      if (!productId) {
        throw new HttpsError("invalid-argument", "ID produit manquant");
      }

      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        expand: ["data.tiers"],
      });

      return {
        success: true,
        data: prices.data,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des prix:", error);
      throw new HttpsError("internal", "Erreur lors de la récupération des prix");
    }
  }
);

/**
 * Récupère les abonnements d'un client
 */
export const getCustomerStripeSubscriptions = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { customerId } = request.data;

      if (!customerId) {
        throw new HttpsError("invalid-argument", "ID client manquant");
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.items.data.price"],
      });

      return {
        success: true,
        data: subscriptions.data,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des abonnements:", error);
      throw new HttpsError("internal", "Erreur lors de la récupération");
    }
  }
);

/**
 * Met à jour les métadonnées d'un abonnement
 */
export const updateStripeSubscriptionMetadata = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    try {
      const stripe = initializeStripe();
      const { subscriptionId, metadata } = request.data;

      if (!subscriptionId || !metadata) {
        throw new HttpsError("invalid-argument", "Paramètres manquants");
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        metadata,
      });

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      logger.error("Erreur lors de la mise à jour des métadonnées:", error);
      throw new HttpsError("internal", "Erreur lors de la mise à jour");
    }
  }
);

/**
 * Traite les webhooks Stripe
 */
export const handleStripeWebhook = onCall(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (request) => {
    try {
      const stripe = initializeStripe();
      const { payload, signature } = request.data;

      if (!payload || !signature) {
        throw new HttpsError("invalid-argument", "Payload ou signature manquante");
      }

      const endpointSecret = stripeWebhookSecret.value();
      if (!endpointSecret) {
        throw new HttpsError("internal", "Secret webhook manquant");
      }

      // Vérifier la signature du webhook
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      } catch (err) {
        logger.error("Erreur de vérification de signature webhook:", err);
        throw new HttpsError("invalid-argument", "Signature invalide");
      }

      logger.info(`Webhook reçu: ${event.type}`);

      // Traiter l'événement selon son type
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(event);
          break;
        
        case "customer.subscription.created":
          await handleSubscriptionCreated(event);
          break;
        
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event);
          break;
        
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event);
          break;
        
        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(event);
          break;
        
        case "invoice.payment_failed":
          await handlePaymentFailed(event);
          break;
        
        default:
          logger.info(`Événement non géré: ${event.type}`);
      }

      return {
        success: true,
        message: `Événement ${event.type} traité`,
      };
    } catch (error) {
      logger.error("Erreur lors du traitement du webhook:", error);
      throw new HttpsError("internal", "Erreur lors du traitement");
    }
  }
);

// Gestionnaires d'événements Stripe
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  logger.info(`Checkout complété: ${session.id}`);
  
  // TODO: Mettre à jour l'abonnement dans Firebase
  // Déclencher les webhooks de notre système
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logger.info(`Abonnement créé: ${subscription.id}`);
  
  // TODO: Créer/mettre à jour l'abonnement dans Firebase
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logger.info(`Abonnement mis à jour: ${subscription.id}`);
  
  // TODO: Mettre à jour l'abonnement dans Firebase
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logger.info(`Abonnement supprimé: ${subscription.id}`);
  
  // TODO: Marquer l'abonnement comme annulé dans Firebase
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logger.info(`Paiement réussi: ${invoice.id}`);
  
  // TODO: Traiter le paiement réussi
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logger.info(`Paiement échoué: ${invoice.id}`);
  
  // TODO: Traiter l'échec de paiement
}
