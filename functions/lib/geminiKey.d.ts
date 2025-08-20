/**
 * Cloud Function pour récupérer la clé Gemini par défaut
 * Sécurisée par authentification Firebase + LIMITES D'USAGE
 */
export declare const getGeminiKey: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    apiKey: string;
    provider: string;
    timestamp: string;
    usage: {
        remainingToday: number;
        remainingThisHour: number;
        limits: {
            requestsPerDay: number;
            requestsPerHour: number;
        };
    };
}>, unknown>;
