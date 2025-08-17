import { Platform, Alert } from "react-native";
import { createLogger } from "../../utils/optimizedLogger";
import { BiometricAuthOptions } from "./types";

// Importer react-native-biometrics
import ReactNativeBiometrics from "react-native-biometrics";

const logger = createLogger("BiometricAuth");

// Types pour les méthodes d'authentification biométrique
export enum BiometricType {
  FINGERPRINT = "Fingerprint",
  FACE_ID = "FaceID",
  TOUCH_ID = "TouchID",
  IRIS = "Iris",
}

export const checkBiometricSupport = async (): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  hasFaceID: boolean;
  hasFingerprint: boolean;
  hasTouchID: boolean;
}> => {
  try {
    logger.info("🔍 Vérification du support biométrique natif...");
    const rnBiometrics = new ReactNativeBiometrics();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    const hasHardware = available;
    const isEnrolled = available; // Assumé si available
    let hasFaceID = false;
    let hasFingerprint = false;
    let hasTouchID = false;
    const supportedTypes: BiometricType[] = [];

    if (available) {
      if (biometryType === "FaceID") {
        hasFaceID = true;
        supportedTypes.push(BiometricType.FACE_ID);
      } else if (biometryType === "TouchID") {
        hasTouchID = true;
        supportedTypes.push(BiometricType.TOUCH_ID);
      } else if (biometryType === "Biometrics") {
        hasFingerprint = true;
        supportedTypes.push(BiometricType.FINGERPRINT);
      }
    }

    logger.info("🔍 Diagnostic biométrie natif:", {
      platform: Platform.OS,
      hasHardware,
      isEnrolled,
      supportedTypes,
      hasFaceID,
      hasFingerprint,
      hasTouchID,
    });

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      hasFaceID,
      hasFingerprint,
      hasTouchID,
    };
  } catch (error) {
    logger.error("Erreur vérification biométrie:", error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      hasFaceID: false,
      hasFingerprint: false,
      hasTouchID: false,
    };
  }
};

export const performAuthentication = async (
  options: BiometricAuthOptions
): Promise<boolean> => {
  try {
    const rnBiometrics = new ReactNativeBiometrics();
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage:
        options.promptMessage || "Authentifiez-vous pour continuer",
    });
    return success;
  } catch (error) {
    logger.error("💥 Erreur authentification:", error);
    return false;
  }
};
