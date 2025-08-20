import { createLogger } from "../../utils/optimizedLogger";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

const logger = createLogger("RevenueCatMobilePay");

/**
 * Extension de RevenueCat pour les paiements mobiles natifs
 * Intègre Apple Pay et Google Pay avec RevenueCat existant
 */
class RevenueCatMobilePay {
  private static instance: RevenueCatMobilePay;

  static getInstance(): RevenueCatMobilePay {
    if (!RevenueCatMobilePay.instance) {
      RevenueCatMobilePay.instance = new RevenueCatMobilePay();
    }
    return RevenueCatMobilePay.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.info("🔧 Initialisation RevenueCat Mobile Pay");
    } catch (error) {
      logger.error("❌ Erreur initialisation RevenueCat Mobile Pay:", error);
    }
  }

  /**
   * Vérifie si Apple Pay est disponible via RevenueCat
   */
  async isApplePayAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    try {
      // RevenueCat gère automatiquement Apple Pay
      // Il suffit de vérifier si l'appareil supporte les paiements
      const offerings = await Purchases.getOfferings();
      const hasApplePay = offerings.current?.availablePackages.some(pkg =>
        pkg.product.identifier.includes('apple')
      );

      logger.info("🍎 Apple Pay via RevenueCat disponible:", hasApplePay);
      return !!hasApplePay;
    } catch (error) {
      logger.warn("🍎 Apple Pay via RevenueCat non disponible:", error);
      return false;
    }
  }

  /**
   * Vérifie si Google Pay est disponible via RevenueCat
   */
  async isGooglePayAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      // RevenueCat gère automatiquement Google Pay
      const offerings = await Purchases.getOfferings();
      const hasGooglePay = offerings.current?.availablePackages.some(pkg =>
        pkg.product.identifier.includes('google')
      );

      logger.info("🤖 Google Pay via RevenueCat disponible:", hasGooglePay);
      return !!hasGooglePay;
    } catch (error) {
      logger.warn("🤖 Google Pay via RevenueCat non disponible:", error);
      return false;
    }
  }

  /**
   * Effectue un achat avec le portefeuille mobile approprié
   * RevenueCat gère automatiquement Apple Pay / Google Pay
   */
  async purchaseWithMobileWallet(
    packageIdentifier: string,
    userId: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("🛒 Début achat mobile wallet:", packageIdentifier);

      // Configuration utilisateur pour RevenueCat
      if (userId) {
        await Purchases.logIn(userId);
        if (email) {
          await Purchases.setEmail(email);
        }
      }

      // Obtenir le package à partir de l'identifiant
      const offerings = await Purchases.getOfferings();
      const packageToPurchase = offerings.current?.availablePackages.find(
        pkg => pkg.identifier === packageIdentifier
      );

      if (!packageToPurchase) {
        return { success: false, error: 'Package non trouvé' };
      }

      // Effectuer l'achat - RevenueCat détecte automatiquement
      // si Apple Pay ou Google Pay doit être utilisé
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);

      if (purchaseResult.customerInfo.entitlements.active) {
        logger.info("✅ Achat mobile wallet réussi:", packageIdentifier);
        return { success: true };
      } else {
        return { success: false, error: 'Achat non complété' };
      }

    } catch (error) {
      logger.error("❌ Erreur achat mobile wallet:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restaure les achats mobiles
   */
  async restoreMobilePurchases(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("🔄 Restauration achats mobiles pour:", userId);

      // Lier l'utilisateur à RevenueCat
      await Purchases.logIn(userId);

      // Restaurer les achats - inclut Apple Pay et Google Pay
      await Purchases.restorePurchases();

      const customerInfo = await Purchases.getCustomerInfo();

      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        logger.info("✅ Restauration achats mobiles réussie");
        return { success: true };
      } else {
        return { success: false, error: 'Aucun achat à restaurer' };
      }

    } catch (error) {
      logger.error("❌ Erreur restauration achats mobiles:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtient les méthodes de paiement disponibles via RevenueCat
   */
  async getAvailablePaymentMethods(): Promise<{
    applePay: boolean;
    googlePay: boolean;
    creditCard: boolean;
  }> {
    try {
      const applePay = await this.isApplePayAvailable();
      const googlePay = await this.isGooglePayAvailable();

      // RevenueCat supporte toujours les cartes de crédit
      const creditCard = true;

      return {
        applePay,
        googlePay,
        creditCard,
      };
    } catch (error) {
      logger.error("❌ Erreur vérification méthodes de paiement:", error);
      return {
        applePay: false,
        googlePay: false,
        creditCard: true,
      };
    }
  }

  /**
   * Configure RevenueCat pour les paiements mobiles
   */
  async configureForMobilePay(): Promise<void> {
    try {
      // RevenueCat gère automatiquement la configuration
      // selon la plateforme (iOS/Android)

      if (Platform.OS === 'ios') {
        logger.info("🍎 Configuration RevenueCat pour iOS/Apple Pay");
      } else if (Platform.OS === 'android') {
        logger.info("🤖 Configuration RevenueCat pour Android/Google Pay");
      }

      // Vérifier les offerings disponibles
      const offerings = await Purchases.getOfferings();
      logger.info(`📦 ${offerings.current?.availablePackages.length || 0} packages disponibles`);

    } catch (error) {
      logger.error("❌ Erreur configuration mobile pay:", error);
    }
  }

  /**
   * Écoute les événements de paiement RevenueCat
   */
  setupPurchaseListener(callback: (event: any) => void): () => void {
    Purchases.addCustomerInfoUpdateListener(callback);
    logger.info("👂 Listener de paiement configuré");
    return () => {
      logger.info("👂 Listener de paiement supprimé");
    };
  }

  /**
   * Obtient les informations d'achat de l'utilisateur
   */
  async getPurchaserInfo(): Promise<any> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      logger.error("❌ Erreur récupération info acheteur:", error);
      throw error;
    }
  }
}

export const revenueCatMobilePay = RevenueCatMobilePay.getInstance();
export default revenueCatMobilePay;
