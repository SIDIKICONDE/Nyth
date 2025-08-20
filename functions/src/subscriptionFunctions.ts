import * as admin from "firebase-admin";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import crypto from "crypto";
import { UserSubscription } from "../../src/types/subscription";
import { assertSuperAdmin, serverLogAdminAccess } from "./utils/adminAuth";
import { createLogger } from "../../src/utils/optimizedLogger";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const logger = createLogger("SubscriptionFunctions");

interface DBSubscription {
  planId?: string;
  status?: string;
  endDate?: string;
}

interface ServerSubscription {
  planId: string;
  status: "active" | "cancelled" | "expired" | "trialing" | "trial";
  startDate: string;
  endDate?: string;
  usage: {
    daily: number;
    monthly: number;
    total: number;
    lastReset: string;
  };
  paymentMethod: {
    type: "apple" | "google" | "card" | "paypal";
    last4?: string;
  };
}

// Configuration des clés API managées (À SÉCURISER avec des variables d'environnement)
const MANAGED_API_KEYS = {
  gemini: process.env.GEMINI_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  mistral: process.env.MISTRAL_API_KEY,
  claude: process.env.CLAUDE_API_KEY,
};

// Configuration des accès par plan
const PLAN_API_ACCESS = {
  free: ["gemini"],
  starter: ["gemini", "mistral"],
  pro: ["gemini", "mistral", "openai", "claude"],
  enterprise: ["all"],
};

/**
 * Fonction pour obtenir une clé API managée de manière sécurisée
 */
export const getManagedAPIKey = onCall(async (request) => {
  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const { provider } = request.data as { provider: string };
  const userId = request.auth.uid;

  try {
    await assertSuperAdmin(userId);
    await serverLogAdminAccess(userId, "getManagedAPIKey", true, { provider });
    // Vérifier l'abonnement de l'utilisateur
    const subscriptionDoc = await db
      .collection("subscriptions")
      .doc(userId)
      .get();

    if (!subscriptionDoc.exists) {
      throw new HttpsError("not-found", "Aucun abonnement trouvé");
    }

    const subscription = subscriptionDoc.data() as DBSubscription;

    // Vérifier que l'abonnement est actif
    if (subscription.status !== "active") {
      throw new HttpsError("permission-denied", "Abonnement inactif");
    }

    // Vérifier que le plan a accès à cette API
    const allowedAPIs =
      PLAN_API_ACCESS[subscription.planId as keyof typeof PLAN_API_ACCESS] ||
      [];

    if (!allowedAPIs.includes("all") && !allowedAPIs.includes(provider)) {
      throw new HttpsError(
        "permission-denied",
        `Le plan ${subscription.planId} n'a pas accès à ${provider}`
      );
    }

    // Restrictions IP / Origine
    const raw = (
      request as unknown as {
        rawRequest?: {
          headers?: Record<string, string | string[]>;
          ip?: string;
        };
      }
    ).rawRequest;
    const originHeader = raw?.headers?.origin as string | undefined;
    const forwardedFor = (
      raw?.headers?.["x-forwarded-for"] as string | undefined
    )
      ?.split(",")[0]
      ?.trim();
    const requestIp = forwardedFor || raw?.ip;

    const providerDoc = await db
      .collection("managed_api_keys")
      .doc(provider)
      .get();
    if (providerDoc.exists) {
      const data = providerDoc.data() as {
        keys: Array<{
          key: string;
          version: string;
          active: boolean;
          expiresAt?: admin.firestore.Timestamp;
          allowOrigins?: string[];
          allowIps?: string[];
          lastUsedAt?: admin.firestore.Timestamp;
          usageCount?: number;
        }>;
      };

      const nowMs = Date.now();
      const candidates = (data.keys || []).filter(
        (k) => k.active && (!k.expiresAt || k.expiresAt.toMillis() > nowMs)
      );

      if (candidates.length > 0) {
        const originAllowed = (list?: string[]) =>
          !list ||
          list.length === 0 ||
          (originHeader ? list.includes(originHeader) : true);
        const ipAllowed = (list?: string[]) =>
          !list ||
          list.length === 0 ||
          (requestIp ? list.includes(requestIp) : true);

        const filtered = candidates.filter(
          (k) => originAllowed(k.allowOrigins) && ipAllowed(k.allowIps)
        );
        if (filtered.length === 0) {
          throw new HttpsError(
            "permission-denied",
            "Origine ou IP non autorisée pour cette API"
          );
        }

        const selected = filtered.sort(
          (a, b) => (a.usageCount || 0) - (b.usageCount || 0)
        )[0];

        await db
          .collection("managed_api_keys")
          .doc(provider)
          .update({
            keys: data.keys.map((k) =>
              k.version === selected.version
                ? {
                    ...k,
                    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
                    usageCount: (k.usageCount || 0) + 1,
                  }
                : k
            ),
          });

        const apiKey = selected.key;
        await db.collection("api_usage_logs").add({
          userId,
          provider,
          planId: subscription.planId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { apiKey };
      }
    }

    const apiKey = MANAGED_API_KEYS[provider as keyof typeof MANAGED_API_KEYS];

    if (!apiKey) {
      throw new HttpsError(
        "unavailable",
        `API ${provider} temporairement indisponible`
      );
    }

    // Logger l'utilisation pour analytics
    await db.collection("api_usage_logs").add({
      userId,
      provider,
      planId: subscription.planId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { apiKey };
  } catch (error) {
    await serverLogAdminAccess(userId, "getManagedAPIKey", false, {
      provider,
      error: (error as Error).message,
    });
    console.error("Error getting managed API key:", error);
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Erreur interne du serveur");
  }
});

export const rotateManagedAPIKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const data = request.data as {
    provider: string;
    newKey: string;
    version: string;
    allowOrigins?: string[];
    allowIps?: string[];
    activate?: boolean;
    deactivatePrevious?: boolean;
    expiresAt?: string;
  };

  if (!data?.provider || !data?.newKey || !data?.version) {
    throw new HttpsError("invalid-argument", "Paramètres invalides");
  }

  const docRef = db.collection("managed_api_keys").doc(data.provider);
  const snap = await docRef.get();
  const expiresAtTs = data.expiresAt
    ? admin.firestore.Timestamp.fromDate(new Date(data.expiresAt))
    : undefined;
  const newEntry = {
    key: data.newKey,
    version: data.version,
    active: data.activate !== false,
    allowOrigins: data.allowOrigins || [],
    allowIps: data.allowIps || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAtTs,
    usageCount: 0,
  } as const;

  if (snap.exists) {
    const current = snap.data() as { keys?: Array<Record<string, unknown>> };
    const keys = Array.isArray(current.keys) ? current.keys : [];
    const updated =
      data.deactivatePrevious === true
        ? keys.map((k) => ({ ...k, active: false }))
        : keys;
    await docRef.set({ keys: [...updated, newEntry] }, { merge: true });
  } else {
    await docRef.set({ keys: [newEntry] }, { merge: true });
  }

  return { success: true };
});

/**
 * Fonction pour sauvegarder un abonnement après un paiement réussi
 */
export const saveSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const { userId, subscription } = request.data;
  const requesterId = request.auth.uid;

  // Vérifier que l'utilisateur ne peut sauvegarder que son propre abonnement
  if (userId !== requesterId) {
    throw new HttpsError(
      "permission-denied",
      "Vous ne pouvez modifier que votre propre abonnement"
    );
  }

  try {
    // Valider les données d'abonnement
    if (!subscription || !subscription.planId || !subscription.status) {
      throw new HttpsError(
        "invalid-argument",
        "Données d'abonnement invalides"
      );
    }

    // Enrichir avec des métadonnées serveur
    const subscriptionData = {
      ...subscription,
      userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      serverValidated: true,
    };

    // Sauvegarder dans Firestore
    await db
      .collection("subscriptions")
      .doc(userId)
      .set(subscriptionData, { merge: true });

    // Initialiser les stats d'usage si nouveau plan payant
    if (subscription.planId !== "free") {
      await db
        .collection("usage_stats")
        .doc(userId)
        .set(
          {
            generations: {
              today: 0,
              thisMonth: 0,
              total: 0,
            },
            limits: {},
            resetDate: new Date().toISOString(),
            planId: subscription.planId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    }

    // Logger l'événement pour analytics
    await db.collection("subscription_events").add({
      userId,
      type: "subscription_created",
      planId: subscription.planId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    logger.info("✅ Abonnement sauvegardé pour:", userId);
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Erreur lors de la sauvegarde de l'abonnement"
    );
  }
});

/**
 * Webhook pour valider les événements RevenueCat
 * Endpoint: /revenuecat-webhook
 */
export const revenuecatWebhook = onRequest(async (req, res) => {
  try {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier la signature RevenueCat (sécurité)
    const signature = req.headers['x-revenuecat-signature'] as string;
    if (!signature) {
      logger.warn('⚠️ Webhook RevenueCat sans signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Vérifier la signature (implémenter la logique selon la doc RevenueCat)
    const isValidSignature = await validateRevenueCatSignature(req.body, signature);
    if (!isValidSignature) {
      logger.error('❌ Signature RevenueCat invalide');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info('📡 Webhook RevenueCat reçu:', event.type);

    // Traiter différents types d'événements
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        await handleSubscriptionActivated(event);
        break;

      case 'CANCELLATION':
        await handleSubscriptionCancelled(event);
        break;

      case 'EXPIRATION':
        await handleSubscriptionExpired(event);
        break;

      case 'BILLING_ISSUE':
        await handleBillingIssue(event);
        break;

      default:
        logger.info('ℹ️ Événement RevenueCat non traité:', event.type);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('❌ Erreur traitement webhook RevenueCat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Valider la signature RevenueCat
 */
async function validateRevenueCatSignature(body: any, signature: string): Promise<boolean> {
  try {
    // Implémenter la validation de signature selon la documentation RevenueCat
    // Pour l'instant, on retourne true (à sécuriser en production)
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('⚠️ REVENUECAT_WEBHOOK_SECRET non configuré');
      return false;
    }

    // Créer le hash attendu
    const payload = JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    logger.error('❌ Erreur validation signature:', error);
    return false;
  }
}

/**
 * Gérer l'activation d'un abonnement
 */
async function handleSubscriptionActivated(event: any): Promise<void> {
  const { app_user_id, product_id, period_type, expiration_at_ms } = event;

  if (!app_user_id) {
    logger.warn('⚠️ Webhook sans app_user_id');
    return;
  }

  try {
    // Mapper le product_id au plan
    const planMapping: Record<string, string> = {
      'com.nyth.starter.monthly': 'starter',
      'com.nyth.starter.yearly': 'starter',
      'com.nyth.pro.monthly': 'pro',
      'com.nyth.pro.yearly': 'pro',
      'com.nyth.enterprise.monthly': 'enterprise',
      'com.nyth.enterprise.yearly': 'enterprise',
    };

    const planId = planMapping[product_id] || 'free';
    const isYearly = period_type === 'annual';
    const endDate = expiration_at_ms ? new Date(expiration_at_ms).toISOString() : undefined;

    // Mettre à jour l'abonnement
    const subscriptionData = {
      planId,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate,
      paymentMethod: { type: 'apple', last4: '****' }, // À adapter selon la plateforme
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      serverValidated: true,
      revenueCatId: event.original_transaction_id,
    };

    await db
      .collection('subscriptions')
      .doc(app_user_id)
      .set(subscriptionData, { merge: true });

    // Logger l'événement
    await db.collection('subscription_events').add({
      userId: app_user_id,
      type: 'subscription_activated',
      planId,
      isYearly,
      source: 'revenuecat_webhook',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('✅ Abonnement activé via webhook:', app_user_id, planId);

  } catch (error) {
    logger.error('❌ Erreur activation abonnement:', error);
    throw error;
  }
}

/**
 * Gérer l'annulation d'un abonnement
 */
async function handleSubscriptionCancelled(event: any): Promise<void> {
  const { app_user_id } = event;

  if (!app_user_id) return;

  try {
    await db.collection('subscriptions').doc(app_user_id).update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger l'événement
    await db.collection('subscription_events').add({
      userId: app_user_id,
      type: 'subscription_cancelled',
      source: 'revenuecat_webhook',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('✅ Abonnement annulé via webhook:', app_user_id);

  } catch (error) {
    logger.error('❌ Erreur annulation abonnement:', error);
    throw error;
  }
}

/**
 * Gérer l'expiration d'un abonnement
 */
async function handleSubscriptionExpired(event: any): Promise<void> {
  const { app_user_id } = event;

  if (!app_user_id) return;

  try {
    await db.collection('subscriptions').doc(app_user_id).update({
      status: 'expired',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger l'événement
    await db.collection('subscription_events').add({
      userId: app_user_id,
      type: 'subscription_expired',
      source: 'revenuecat_webhook',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('✅ Abonnement expiré via webhook:', app_user_id);

  } catch (error) {
    logger.error('❌ Erreur expiration abonnement:', error);
    throw error;
  }
}

/**
 * Gérer les problèmes de facturation
 */
async function handleBillingIssue(event: any): Promise<void> {
  const { app_user_id } = event;

  if (!app_user_id) return;

  try {
    // Logger l'événement pour investigation
    await db.collection('billing_issues').add({
      userId: app_user_id,
      issueType: 'billing_issue',
      eventData: event,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    });

    logger.warn('⚠️ Problème de facturation détecté:', app_user_id);

  } catch (error) {
    logger.error('❌ Erreur traitement problème facturation:', error);
    throw error;
  }
}

/**
 * Fonction pour récupérer un abonnement
 */
export const getSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const { userId } = request.data;
  const requesterId = request.auth.uid;

  // Vérifier que l'utilisateur ne peut accéder qu'à son propre abonnement
  if (userId !== requesterId) {
    throw new HttpsError(
      "permission-denied",
      "Vous ne pouvez accéder qu'à votre propre abonnement"
    );
  }

  try {
    const subscriptionDoc = await db
      .collection("subscriptions")
      .doc(userId)
      .get();

    if (!subscriptionDoc.exists) {
      return null;
    }

    const subscription = subscriptionDoc.data();

    // Vérifier si l'abonnement a expiré
    if (subscription?.endDate && new Date(subscription.endDate) < new Date()) {
      // Marquer comme expiré
      await db.collection("subscriptions").doc(userId).update({
        status: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      subscription.status = "expired";
    }

    return subscription;
  } catch (error) {
    throw new HttpsError(
      "internal",
      "Erreur lors de la récupération de l'abonnement"
    );
  }
});

/**
 * Fonction pour annuler un abonnement
 */
export const cancelSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const { userId } = request.data;
  const requesterId = request.auth.uid;

  if (userId !== requesterId) {
    throw new HttpsError(
      "permission-denied",
      "Vous ne pouvez annuler que votre propre abonnement"
    );
  }

  try {
    // Récupérer l'abonnement actuel
    const subscriptionDoc = await db
      .collection("subscriptions")
      .doc(userId)
      .get();

    if (!subscriptionDoc.exists) {
      throw new HttpsError("not-found", "Aucun abonnement trouvé");
    }

    const subscription = subscriptionDoc.data() as DBSubscription;

    // Mettre à jour le statut d'abonnement
    const updatedSubscription = {
      ...subscription,
      status: "cancelled" as const,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      endDate: subscription.endDate || new Date().toISOString(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection("subscriptions")
      .doc(userId)
      .set(updatedSubscription, { merge: true });

    // Logger l'événement
    await db.collection("subscription_events").add({
      userId,
      type: "subscription_cancelled",
      planId: subscription.planId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Erreur lors de l'annulation de l'abonnement"
    );
  }
});

/**
 * Fonction pour tracker l'usage des API
 */
export const trackAPIUsage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié"
    );
  }

  const { userId, provider, tokens, timestamp } = request.data;
  const requesterId = request.auth.uid;

  if (userId !== requesterId) {
    throw new HttpsError(
      "permission-denied",
      "Vous ne pouvez tracker que votre propre usage"
    );
  }

  try {
    // Enregistrer dans les logs d'usage
    await db.collection("api_usage_logs").add({
      userId,
      provider,
      tokens,
      timestamp: timestamp
        ? new Date(timestamp)
        : admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mettre à jour les stats d'usage
    const usageStatsRef = db.collection("usage_stats").doc(userId);
    const usageDoc = await usageStatsRef.get();

    if (usageDoc.exists) {
      const currentStats = usageDoc.data();
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Réinitialiser si nouveau jour/mois
      const shouldResetDaily =
        currentStats?.lastUpdate?.split("T")[0] !== today;
      const shouldResetMonthly =
        currentStats?.lastUpdate?.substring(0, 7) !== thisMonth;

      await usageStatsRef.update({
        "generations.today": shouldResetDaily
          ? 1
          : admin.firestore.FieldValue.increment(1),
        "generations.thisMonth": shouldResetMonthly
          ? 1
          : admin.firestore.FieldValue.increment(1),
        "generations.total": admin.firestore.FieldValue.increment(1),
        lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    throw new HttpsError("internal", "Erreur lors du tracking de l'usage");
  }
});

/**
 * Fonction de webhook pour RevenueCat (webhooks sécurisés)
 */
export const revenueCatWebhook = onRequest(async (req, res) => {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET || "";
  const sigHeader = (req.headers["x-revenuecat-signature"] as string) || "";
  const authHeader = (req.headers.authorization as string) || "";

  const rawBody =
    typeof req.rawBody !== "undefined"
      ? req.rawBody
      : Buffer.from(JSON.stringify(req.body));

  const validViaHmac = (() => {
    if (!secret || !sigHeader) return false;
    try {
      const mac = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("base64");
      const a = Buffer.from(mac);
      const b = Buffer.from(sigHeader);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  })();

  const validViaBearer = (() => {
    if (!secret || !authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.slice("Bearer ".length).trim();
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  })();

  if (!validViaHmac && !validViaBearer) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const event = (req.body as { event?: { type?: string } }).event as
      | { type?: string }
      | undefined;

    if (!event?.type) {
      res.status(400).send("Bad Request");
      return;
    }

    switch (event.type) {
      case "INITIAL_PURCHASE":
        await handleSubscriptionActivated(req.body);
        await logSubscriptionEvent(req.body, "initial_purchase");
        break;
      case "RENEWAL":
        await handleSubscriptionActivated(req.body);
        await logSubscriptionEvent(req.body, "renewal");
        break;
      case "PRODUCT_CHANGE":
        await handleSubscriptionActivated(req.body);
        await logSubscriptionEvent(req.body, "product_change");
        break;
      case "TRIAL_STARTED":
        await handleSubscriptionActivated(req.body);
        await logSubscriptionEvent(req.body, "trial_started");
        break;
      case "CANCELLATION":
        if (
          (req.body as { event?: { cancel_at_period_end?: boolean } }).event
            ?.cancel_at_period_end
        ) {
          await logSubscriptionEvent(req.body, "cancel_at_period_end");
        } else {
          await handleSubscriptionDeactivated(req.body);
          await logSubscriptionEvent(req.body, "cancellation");
        }
        break;
      case "BILLING_ISSUE":
        await logSubscriptionEvent(req.body, "billing_issue");
        break;
      default:
        break;
    }

    res.status(200).send("Webhook received");
    return;
  } catch {
    res.status(500).send("Internal Server Error");
    return;
  }
});

// Fonctions helper pour les webhooks
async function handleSubscriptionActivated(payload: unknown) {
  const evt = (
    payload as {
      event: {
        app_user_id: string;
        product_id: string;
        expiration_at_ms?: number;
        store?: string;
      };
    }
  ).event;
  const userId = evt.app_user_id;
  const productId = evt.product_id;
  const expirationDate =
    typeof evt.expiration_at_ms === "number"
      ? new Date(evt.expiration_at_ms)
      : undefined;
  const planId = productId.replace("_monthly", "").replace("_yearly", "");

  const subscription: ServerSubscription = {
    planId,
    status: "active",
    startDate: new Date().toISOString(),
    endDate: expirationDate ? expirationDate.toISOString() : undefined,
    usage: {
      daily: 0,
      monthly: 0,
      total: 0,
      lastReset: new Date().toISOString(),
    },
    paymentMethod: { type: evt.store === "app_store" ? "apple" : "google" },
  };

  await db
    .collection("subscriptions")
    .doc(userId)
    .set(
      {
        ...subscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        serverValidated: true,
      },
      { merge: true }
    );
}

async function handleSubscriptionDeactivated(payload: unknown) {
  const evt = (payload as { event: { app_user_id: string } }).event;
  const userId = evt.app_user_id;
  await db.collection("subscriptions").doc(userId).set(
    {
      status: "cancelled",
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function logSubscriptionEvent(payload: unknown, type: string) {
  const evt = (
    payload as { event: { app_user_id: string; product_id?: string } }
  ).event;
  await db.collection("subscription_events").add({
    userId: evt.app_user_id,
    type,
    planId: evt.product_id
      ? evt.product_id.replace("_monthly", "").replace("_yearly", "")
      : undefined,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// async function handleSubscriptionReactivated(event: any) {
//   logger.info(`Reactivating subscription for: ${event.app_user_id}`);
//   await updateSubscriptionStatus(event.app_user_id, "active");
// }
