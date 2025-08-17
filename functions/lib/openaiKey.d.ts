/**
 * Cloud Function pour récupérer la clé OpenAI par défaut
 * Sécurisée par authentification Firebase
 */
export declare const getOpenAIKey: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    apiKey: string;
    provider: string;
    timestamp: string;
}>, unknown>;
