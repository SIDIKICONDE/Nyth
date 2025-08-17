import { AIProvider } from "../types/api";
import { OpenAIProvider } from "./OpenAIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { ClaudeProvider } from "./ClaudeProvider";
import { MistralProvider } from "./MistralProvider";
import { CohereProvider } from "./CohereProvider";
// Nouveaux providers premium
import { PerplexityProvider } from "./PerplexityProvider";
import { TogetherProvider } from "./TogetherProvider";
import { GroqProvider } from "./GroqProvider";
import { FireworksProvider } from "./FireworksProvider";
// Nouveaux providers
import { AzureOpenAIProvider } from "./extra/AzureOpenAIProvider";
import { OpenRouterProvider } from "./extra/OpenRouterProvider";
import { DeepInfraProvider } from "./extra/DeepInfraProvider";
import { XAIProvider } from "./extra/XAIProvider";
import { DeepSeekProvider } from "./extra/DeepSeekProvider";

export class ProviderRegistry {
  private static providers = new Map<string, AIProvider>();

  private static registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  static getProvider(name: string): AIProvider | null {
    return this.providers.get(name.toLowerCase()) || null;
  }

  static getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  static getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static isProviderSupported(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Ajoute dynamiquement un nouveau fournisseur
   */
  static addProvider(provider: AIProvider): void {
    this.registerProvider(provider);
  }

  /**
   * Supprime un fournisseur
   */
  static removeProvider(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }

  /**
   * Obtenir le nombre total de providers enregistrés
   */
  static getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Afficher la liste de tous les providers
   */
  static listProviders(): void {
    this.getSupportedProviders().forEach((provider, index) => {});
  }
}

// Initialiser tous les fournisseurs
ProviderRegistry["registerProvider"](new OpenAIProvider());
ProviderRegistry["registerProvider"](new GeminiProvider());
ProviderRegistry["registerProvider"](new MistralProvider());
ProviderRegistry["registerProvider"](new CohereProvider());
ProviderRegistry["registerProvider"](new ClaudeProvider());
ProviderRegistry["registerProvider"](new PerplexityProvider());
ProviderRegistry["registerProvider"](new TogetherProvider());
ProviderRegistry["registerProvider"](new GroqProvider());
ProviderRegistry["registerProvider"](new FireworksProvider());
ProviderRegistry["registerProvider"](new AzureOpenAIProvider());
ProviderRegistry["registerProvider"](new OpenRouterProvider());
ProviderRegistry["registerProvider"](new DeepInfraProvider());
ProviderRegistry["registerProvider"](new XAIProvider());
ProviderRegistry["registerProvider"](new DeepSeekProvider());
