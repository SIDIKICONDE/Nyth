import AsyncStorage from "@react-native-async-storage/async-storage";
import { createLogger } from "./optimizedLogger";
import { SERVER_CONFIG } from "../config/serverConfig";
import { Platform } from "react-native";
import { encode as base64Encode } from "base-64";
import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";

const logger = createLogger("SecurityUtils");

// Vérifie si la connexion réseau est sécurisée
export const checkNetworkSecurity = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a activé le mode de sécurité renforcée
    const enhancedSecurity =
      (await AsyncStorage.getItem("enhanced_security_mode")) === "true";
    if (enhancedSecurity) {
      logger.warn(
        "Mode sécurité renforcée activé - vérifications réseau strictes"
      );
      // En mode sécurité renforcée, on peut être plus restrictif
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Erreur lors de la vérification de la sécurité réseau", error);
    return true; // Par défaut, on autorise
  }
};

// Générer un token d'authentification simple pour le client
export const generateAuthToken = async (): Promise<string | null> => {
  try {
    // Priorité: Firebase ID Token si l'utilisateur est connecté
    const currentUser = getAuth(getApp()).currentUser;
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken();
        if (idToken) return idToken;
      } catch (e) {
        logger.warn(
          "Impossible de récupérer le Firebase ID token, fallback local"
        );
      }
    }

    // Fallback local (non sensible, juste pour corrélation)
    let deviceId = await AsyncStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      await AsyncStorage.setItem("device_id", deviceId);
    }

    const timestamp = Date.now();
    const rawToken = `${deviceId}:${timestamp}:local`;
    return base64Encode(rawToken);
  } catch (error) {
    logger.error(
      "Erreur lors de la génération du token d'authentification",
      error
    );
    return null;
  }
};

// Vérifier si les communications avec le serveur doivent être protégées (proxifiées)
export const shouldProtectCommunications = async (): Promise<boolean> => {
  try {
    // Vérifier si l'utilisateur a explicitement désactivé la protection
    const bypassProtection =
      (await AsyncStorage.getItem("bypass_api_protection")) === "true";
    if (bypassProtection) {
      logger.warn("Protection API désactivée par l'utilisateur");
      return false;
    }

    // En mode développement, utiliser la configuration du serveur
    if (__DEV__) {
      return !SERVER_CONFIG.BYPASS_PROXY;
    }

    // En production, toujours protéger les communications sauf si explicitement désactivé
    return true;
  } catch (error) {
    logger.error("Erreur lors de la vérification du mode de protection", error);
    return true; // Par défaut, on protège
  }
};

// Obtenir les en-têtes HTTP sécurisés pour les requêtes
export const getSecureHeaders = async (): Promise<Record<string, string>> => {
  const authToken = await generateAuthToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken || ""}`,
    "X-Auth-Token": authToken || "invalid",
    "X-App-Version": "1.0.0",
    "X-Device-Type": "mobile",
    "x-api-key": SERVER_CONFIG.CLIENT_API_KEY || "",
  };
};
