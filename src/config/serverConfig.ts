/**
 * Configuration du serveur backend - Frontend
 * Se contente de lire les variables d'environnement
 */
import { Platform } from "react-native";
// ⬇️ Importer les variables directement depuis @env (Babel)
import { SERVER_URL, CLIENT_API_KEY, BYPASS_PROXY } from "@env";

export const SERVER_CONFIG = {
  // URL du serveur backend
  BASE_URL:
    SERVER_URL && SERVER_URL.length > 0
      ? SERVER_URL
      : __DEV__
      ? "http://localhost:3000"
      : "https://api.nyth.app",

  // Clé API client
  CLIENT_API_KEY: CLIENT_API_KEY ?? "",

  // Endpoints API
  ENDPOINTS: {
    AUTH: {
      SESSION: "/api/auth/session",
      REFRESH: "/api/auth/refresh",
      LOGOUT: "/api/auth/logout",
    },
    AI: {
      CHAT: "/api/ai/chat",
      GENERATE: "/api/ai/generate",
      IMPROVE: "/api/ai/improve",
    },
    KEYS: {
      MANAGED: "/api/keys/managed",
      VALIDATE: "/api/keys/validate",
    },
    SUBSCRIPTION: {
      STATUS: "/api/subscription/status",
      UPGRADE: "/api/subscription/upgrade",
      CANCEL: "/api/subscription/cancel",
    },
    ANALYTICS: {
      TRACK: "/api/analytics/track",
      USAGE: "/api/analytics/usage",
    },
  },

  // Sécurité
  SECURITY: {
    HEADERS: {
      "X-App-Version": "2.0.0",
      "X-Platform": Platform.OS,
      "X-Device-ID": "", // À générer par device
    },
  },

  // Cache
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000,
    API_KEYS_TTL: 60 * 60 * 1000,
    USER_DATA_TTL: 10 * 60 * 1000,
  },

  // Contrôle d'utilisation du proxy backend
  BYPASS_PROXY: (BYPASS_PROXY ?? "").toLowerCase() === "true",
};

// Validation dev
if (__DEV__) {
  if (!SERVER_CONFIG.CLIENT_API_KEY) {
    console.warn("⚠️ CLIENT_API_KEY non configurée - Ajoutez-la à .env");
  }
  if (SERVER_CONFIG.BASE_URL === "http://localhost:3000") {
    console.info("🔧 Mode développement - Serveur local configuré");
  }
}

export type ServerEndpoints = typeof SERVER_CONFIG.ENDPOINTS;
export type SecurityConfig = typeof SERVER_CONFIG.SECURITY;
export type CacheConfig = typeof SERVER_CONFIG.CACHE;

export default SERVER_CONFIG;
