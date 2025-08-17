import { createLogger } from "../../utils/optimizedLogger";
import ReactNativeBiometrics from "react-native-biometrics";

const logger = createLogger("AuthService");

export class AuthService {
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const rn = new ReactNativeBiometrics();
      const { available } = await rn.isSensorAvailable();
      return !!available;
    } catch (error) {
      logger.error("Erreur vérification biométrie:", error);
      return false;
    }
  }

  static async authenticateUser(
    reason: string = "Accéder aux clés API"
  ): Promise<boolean> {
    try {
      const rn = new ReactNativeBiometrics();
      const { available } = await rn.isSensorAvailable();
      if (!available) return false;
      const { success } = await rn.simplePrompt({ promptMessage: reason });
      return !!success;
    } catch (error) {
      logger.error("Erreur authentification:", error);
      return false;
    }
  }

  static async getSupportedAuthTypes(): Promise<string[]> {
    try {
      const rn = new ReactNativeBiometrics();
      const { available, biometryType } = await rn.isSensorAvailable();
      if (!available) return [];
      if (biometryType === "FaceID") return ["FaceID"];
      if (biometryType === "TouchID") return ["TouchID"];
      return ["Fingerprint"];
    } catch (error) {
      logger.error("Erreur récupération types auth:", error);
      return [];
    }
  }

  static async isFaceIdAvailable(): Promise<boolean> {
    try {
      const types = await this.getSupportedAuthTypes();
      return types.includes("FaceID");
    } catch (error) {
      logger.error("Erreur vérification Face ID:", error);
      return false;
    }
  }

  static async isFingerprintAvailable(): Promise<boolean> {
    try {
      const types = await this.getSupportedAuthTypes();
      return types.includes("TouchID") || types.includes("Fingerprint");
    } catch (error) {
      logger.error("Erreur vérification empreinte:", error);
      return false;
    }
  }
}
