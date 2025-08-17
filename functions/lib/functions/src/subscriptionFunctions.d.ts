import * as admin from "firebase-admin";
/**
 * Fonction pour obtenir une clé API managée de manière sécurisée
 */
export declare const getManagedAPIKey: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    apiKey: string;
}>, unknown>;
export declare const rotateManagedAPIKey: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * Fonction pour sauvegarder un abonnement après un paiement réussi
 */
export declare const saveSubscription: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * Fonction pour récupérer un abonnement
 */
export declare const getSubscription: import("firebase-functions/v2/https").CallableFunction<any, Promise<admin.firestore.DocumentData | null | undefined>, unknown>;
/**
 * Fonction pour annuler un abonnement
 */
export declare const cancelSubscription: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * Fonction pour tracker l'usage des API
 */
export declare const trackAPIUsage: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
/**
 * Fonction de webhook pour RevenueCat (webhooks sécurisés)
 */
export declare const revenueCatWebhook: import("firebase-functions/v2/https").HttpsFunction;
