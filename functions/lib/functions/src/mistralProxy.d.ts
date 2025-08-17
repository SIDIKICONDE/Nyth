import * as functions from "firebase-functions";
/**
 * Cloud Function proxy pour sécuriser l'accès à l'API Mistral.
 * Version hybride compatible avec la gestion des secrets.
 */
export declare const mistralProxy: functions.https.HttpsFunction;
