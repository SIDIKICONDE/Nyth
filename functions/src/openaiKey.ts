import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";

// Initialiser Firebase Admin si pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function pour récupérer la clé OpenAI par défaut
 * Désactivée pour raisons de sécurité (ne pas exposer des clés aux clients)
 */
export const getOpenAIKey = onCall(async (_request) => {
  throw new HttpsError(
    "unavailable",
    "Service indisponible: les clés API ne sont plus renvoyées au client"
  );
});
