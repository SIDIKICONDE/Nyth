import * as functions from "firebase-functions";
/**
 * Cloud Function pour recalculer les analytics d'un utilisateur.
 * Cette fonction est sécurisée et s'exécute avec des privilèges d'administrateur.
 */
export declare const recalculateAnalytics: functions.https.CallableFunction<{
    userId: string;
}, Promise<{
    success: boolean;
    message: string;
}>, unknown>;
