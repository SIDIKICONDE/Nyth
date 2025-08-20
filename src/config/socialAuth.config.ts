

import { Platform } from "react-native";
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  APPLE_SERVICE_ID,
  FIREBASE_AUTH_DOMAIN,
} from "@env";

// Vérification que les variables d'environnement sont définies
if (__DEV__) {
  if (!GOOGLE_WEB_CLIENT_ID) {
    console.warn("⚠️ GOOGLE_WEB_CLIENT_ID n'est pas défini dans .env");
  }
  if (!GOOGLE_IOS_CLIENT_ID) {
    console.warn("⚠️ GOOGLE_IOS_CLIENT_ID n'est pas défini dans .env");
  }
  // if (!APPLE_SERVICE_ID && Platform.OS === "ios") {
  //   console.warn("⚠️ APPLE_SERVICE_ID n'est pas défini dans .env");
  // }
}

/**
 * Configuration Google Sign-In
 * Utilise les variables d'environnement pour la sécurité
 */
export const googleSignInConfig = {
  // Web Client ID requis pour l'authentification Firebase
  webClientId: GOOGLE_WEB_CLIENT_ID || "",

  // iOS Client ID (optionnel mais recommandé)
  iosClientId: GOOGLE_IOS_CLIENT_ID || "",

  // Android Client ID (sera utilisé automatiquement sur Android)
  androidClientId: GOOGLE_ANDROID_CLIENT_ID || "",

  // Configuration additionnelle
  offlineAccess: false,
  hostedDomain: "", // Laisser vide pour accepter tous les domaines
  forceCodeForRefreshToken: false,
  accountName: "", // Android uniquement

  // Scopes additionnels (optionnel)
  scopes: ["profile", "email"],
};

/**
 * Configuration Apple Sign-In
 * Utilise les variables d'environnement pour la sécurité
 */
export const appleSignInConfig = {
  // Service ID pour l'authentification Apple
  serviceId: APPLE_SERVICE_ID || "",

  // Options de requête
  requestedScopes: ["email", "fullName"],

  // Configuration pour Android (Apple Sign-In sur Android nécessite une configuration web)
  androidConfig: {
    clientId: APPLE_SERVICE_ID || "",
    redirectUrl: `https://${
      FIREBASE_AUTH_DOMAIN || "nyth-2025.firebaseapp.com"
    }/__/auth/handler`,
  },
};

/**
 * Configuration Firebase pour les authentifications sociales
 */
export const firebaseSocialConfig = {
  // Activation des méthodes d'authentification
  enabledProviders: {
    google: true,
    apple: Platform.OS === "ios", // Apple Sign-In uniquement sur iOS par défaut
    facebook: false, // À activer si nécessaire
    twitter: false, // À activer si nécessaire
  },

  // Configuration de la persistance
  persistence: {
    enabled: true,
    storage: "@firebase_auth_session",
  },

  // Configuration de la vérification d'email
  emailVerification: {
    required: true,
    autoSend: true,
    redirectUrl: `https://${
      FIREBASE_AUTH_DOMAIN || "nyth-2025.firebaseapp.com"
    }`,
  },
};

/**
 * Messages d'erreur personnalisés pour les authentifications sociales
 */
export const socialAuthErrors = {
  // Erreurs Google Sign-In
  GOOGLE_SIGNIN_CANCELLED: "La connexion Google a été annulée",
  GOOGLE_SIGNIN_IN_PROGRESS: "Une connexion Google est déjà en cours",
  GOOGLE_SIGNIN_PLAY_SERVICES_NOT_AVAILABLE:
    "Les services Google Play ne sont pas disponibles",
  GOOGLE_SIGNIN_NETWORK_ERROR: "Erreur de réseau lors de la connexion Google",

  // Erreurs Apple Sign-In
  APPLE_SIGNIN_CANCELLED: "La connexion Apple a été annulée",
  APPLE_SIGNIN_FAILED: "La connexion Apple a échoué",
  APPLE_SIGNIN_NOT_AVAILABLE:
    "La connexion Apple n'est pas disponible sur cet appareil",
  APPLE_SIGNIN_INVALID_RESPONSE: "Réponse invalide d'Apple Sign-In",

  // Erreurs générales
  SOCIAL_AUTH_NETWORK_ERROR: "Erreur de connexion réseau",
  SOCIAL_AUTH_INVALID_CREDENTIAL: "Identifiants invalides",
  SOCIAL_AUTH_ACCOUNT_EXISTS: "Un compte existe déjà avec cette adresse email",
  SOCIAL_AUTH_DISABLED: "Cette méthode de connexion est désactivée",
};

/**
 * Vérifie si la configuration est valide
 * Retourne false si des clés essentielles sont manquantes
 */
export const isConfigValid = (): boolean => {
  const hasGoogleConfig = !!(GOOGLE_WEB_CLIENT_ID && GOOGLE_IOS_CLIENT_ID);
  const hasAppleConfig = Platform.OS === "ios" ? !!APPLE_SERVICE_ID : true;

  if (!hasGoogleConfig && __DEV__) {
    console.error(
      "❌ Configuration Google Sign-In invalide. Vérifiez votre fichier .env"
    );
  }

  if (!hasAppleConfig && __DEV__) {
    console.error(
      "❌ Configuration Apple Sign-In invalide. Vérifiez votre fichier .env"
    );
  }

  return hasGoogleConfig && hasAppleConfig;
};

/**
 * Fonction helper pour obtenir la configuration appropriée
 * Vérifie automatiquement la validité de la configuration
 */
export const getSocialAuthConfig = () => {
  const isValid = isConfigValid();

  if (!isValid && __DEV__) {
    console.warn("⚠️ Configuration des authentifications sociales incomplète.");
    console.warn(
      "Assurez-vous que toutes les variables sont définies dans .env"
    );
    console.warn(
      "Variables requises: GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, APPLE_SERVICE_ID"
    );
  }

  return {
    google: googleSignInConfig,
    apple: appleSignInConfig,
    firebase: firebaseSocialConfig,
    errors: socialAuthErrors,
    isValid,
  };
};

// Export par défaut pour faciliter l'import
export default {
  googleSignInConfig,
  appleSignInConfig,
  firebaseSocialConfig,
  socialAuthErrors,
  getSocialAuthConfig,
  isConfigValid,
};
