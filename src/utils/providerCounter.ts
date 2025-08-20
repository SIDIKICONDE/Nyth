import { ProviderRegistry } from "../services/subscription/providers/ProviderRegistry";
import { ManagedAPIService } from "../services/subscription";
import { AIProvider } from "../services/subscription/types/api";

/**
 * Utilitaire pour compter et analyser les fournisseurs AI
 */
export class ProviderCounter {
  /**
   * Compter tous les fournisseurs disponibles
   */
  static getTotalProviderCount(): number {
    return ProviderRegistry.getProviderCount();
  }

  /**
   * Obtenir la liste complète des fournisseurs
   */
  static getAllProviders(): AIProvider[] {
    return ProviderRegistry.getAllProviders();
  }

  /**
   * Obtenir les fournisseurs par catégorie
   */
  static getProvidersByCategory(): {
    classic: AIProvider[];
    premium: AIProvider[];
    total: number;
  } {
    const allProviders = this.getAllProviders();
    const classic = allProviders.filter((p) => p.category === "classic");
    const premium = allProviders.filter((p) => p.category === "premium");

    return {
      classic,
      premium,
      total: allProviders.length,
    };
  }

  /**
   * Afficher un résumé complet
   */
  static async displayProviderSummary(): Promise<void> {
    const categories = this.getProvidersByCategory();

    categories.classic.forEach((provider, index) => {});

    categories.premium.forEach((provider, index) => {});

    const hasOwnKeys = await ManagedAPIService.hasOwnKeys();

    if (hasOwnKeys) {} else {}
  }

  /**
   * Vérifier le statut détaillé de chaque fournisseur
   */
  static async getDetailedProviderStatus(): Promise<
    Record<
      string,
      {
        hasPersonalKey: boolean;
        canUseManaged: boolean;
        status: "personal" | "managed" | "unavailable";
      }
    >
  > {
    const providers = this.getAllProviders();
    const status: Record<string, any> = {};

    for (const provider of providers) {
      try {
        const personalKey = await ManagedAPIService.getAPIKey(
          provider.name.toLowerCase(),
          "free",
          true
        );
        const managedKey = await ManagedAPIService.getAPIKey(
          provider.name.toLowerCase(),
          "free",
          false
        );

        const hasPersonalKey = !!personalKey;
        const canUseManaged = !!managedKey;

        let providerStatus: "personal" | "managed" | "unavailable";
        if (hasPersonalKey) {
          providerStatus = "personal";
        } else if (canUseManaged) {
          providerStatus = "managed";
        } else {
          providerStatus = "unavailable";
        }

        status[provider.name.toUpperCase()] = {
          hasPersonalKey,
          canUseManaged,
          status: providerStatus,
        };
      } catch (error) {
        status[provider.name.toUpperCase()] = {
          hasPersonalKey: false,
          canUseManaged: false,
          status: "unavailable",
        };
      }
    }

    return status;
  }

  /**
   * Compter les fournisseurs disponibles
   */
  static async countAvailableProviders(): Promise<{
    withPersonalKeys: number;
    withManagedAccess: number;
    total: number;
    unavailable: number;
  }> {
    const status = await this.getDetailedProviderStatus();

    let withPersonalKeys = 0;
    let withManagedAccess = 0;
    let unavailable = 0;

    Object.values(status).forEach((providerStatus) => {
      if (providerStatus.hasPersonalKey) {
        withPersonalKeys++;
      } else if (providerStatus.canUseManaged) {
        withManagedAccess++;
      } else {
        unavailable++;
      }
    });

    return {
      withPersonalKeys,
      withManagedAccess,
      total: withPersonalKeys + withManagedAccess,
      unavailable,
    };
  }

  /**
   * Résumé rapide
   */
  static async quickSummary(): Promise<string> {
    const total = this.getTotalProviderCount();
    const available = await this.countAvailableProviders();

    return `🎯 ${total} fournisseurs configurés | ${available.total} disponibles (${available.withPersonalKeys} perso + ${available.withManagedAccess} managés)`;
  }
}
