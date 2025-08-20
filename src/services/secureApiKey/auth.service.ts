import { createLogger } from "../../utils/optimizedLogger";
// Biométrie supprimée – stub d'authentification

const logger = createLogger("AuthService");

export class AuthService {
  static async authenticateUser(
    reason: string = "Accéder aux clés API"
  ): Promise<boolean> {
    void reason;
    return true;
  }

  static async getSupportedAuthTypes(): Promise<string[]> {
    return [];
  }
}
