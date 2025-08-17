import { createLogger } from "../../utils/optimizedLogger";
import { memoryManager, MemoryEntry } from "./MemoryManager";
import { MEMORY_CITATIONS_ENABLED, isMemoryCitationsEnabled } from "../../config/memoryConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CryptoService } from "../cryptoService";

const logger = createLogger("CitationManager");

const CITATION_HISTORY_KEY = "@citation_history";

export interface CitationContext {
  citedMemories: string[]; // IDs des mémoires citées
  citationText: string; // Texte avec citations intégrées
  originalText: string; // Texte original sans citations
}

export interface MemoryUsage {
  memoryId: string;
  memoryTitle: string;
  usageContext: string; // Contexte où la mémoire a été utilisée
  citationRequired: boolean;
  timestamp: string;
}

/**
 * CitationManager - Gestion automatique des citations mémoire
 * Implémente les obligations de citation selon fonctionnement_memoire.md
 */
export class CitationManager {
  private static instance: CitationManager;
  private usageHistory: Map<string, MemoryUsage[]> = new Map();
  private operationQueues: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): CitationManager {
    if (!CitationManager.instance) {
      CitationManager.instance = new CitationManager();
    }
    return CitationManager.instance;
  }

  /**
   * Met en file d'attente une opération pour un utilisateur afin d'éviter les race conditions
   */
  private async enqueueOperation<T>(
    userId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const lastOperation = this.operationQueues.get(userId) || Promise.resolve();

    const currentOperation = lastOperation.then(operation).catch((error) => {
      logger.error(
        `Erreur dans l'opération en file d'attente pour ${userId}`,
        error
      );
      throw error;
    });

    this.operationQueues.set(userId, currentOperation);
    return currentOperation;
  }

  /**
   * Charge l'historique d'utilisation depuis le stockage
   */
  private async loadUsageHistory(userId: string): Promise<MemoryUsage[]> {
    try {
      if (this.usageHistory.has(userId)) {
        return this.usageHistory.get(userId)!;
      }

      const storageKey = `${CITATION_HISTORY_KEY}_${userId}`;
      const stored = await AsyncStorage.getItem(storageKey);

      if (stored) {
        const raw = await CryptoService.decrypt(stored, userId);
        const history: MemoryUsage[] = JSON.parse(raw);
        this.usageHistory.set(userId, history);
        logger.info(
          `📖 Historique d'utilisation chargé pour ${userId}: ${history.length} entrées`
        );
        return history;
      }

      return [];
    } catch (error) {
      logger.error("❌ Erreur chargement historique d'utilisation:", error);
      // Retourner un tableau vide en cas d'erreur pour ne pas bloquer l'app
      return [];
    }
  }

  /**
   * Sauvegarde l'historique d'utilisation dans le stockage
   */
  private async saveUsageHistory(
    userId: string,
    history: MemoryUsage[]
  ): Promise<void> {
    try {
      const storageKey = `${CITATION_HISTORY_KEY}_${userId}`;
      const encrypted = await CryptoService.encrypt(
        JSON.stringify(history),
        userId
      );
      await AsyncStorage.setItem(storageKey, encrypted);
      this.usageHistory.set(userId, history);
    } catch (error) {
      logger.error("❌ Erreur sauvegarde historique d'utilisation:", error);
      throw error; // Projeter l'erreur pour que l'opération en file d'attente la gère
    }
  }

  /**
   * Analyse un texte et détecte automatiquement l'utilisation de mémoires
   * Retourne le texte avec citations automatiquement ajoutées
   */
  async processTextWithCitations(
    userId: string,
    text: string,
    contextHint?: string
  ): Promise<CitationContext> {
    const dynamicFlag = await isMemoryCitationsEnabled();
    if (!MEMORY_CITATIONS_ENABLED && !dynamicFlag) {
      return {
        citedMemories: [],
        citationText: text,
        originalText: text,
      };
    }
    try {
      const userMemories = await memoryManager.loadUserMemory(userId);
      const citedMemories: string[] = [];
      let processedText = text;

      // Rechercher automatiquement les mémoires utilisées
      for (const memory of userMemories.entries) {
        const isUsed = this.detectMemoryUsage(text, memory);

        if (isUsed && memory.citationRequired) {
          // Ajouter citation automatiquement
          const citationTag = `[[memory:${memory.id}]]`;

          // Éviter les doublons de citations
          if (!processedText.includes(citationTag)) {
            processedText = this.insertCitation(
              processedText,
              memory,
              citationTag
            );
            citedMemories.push(memory.id);

            // Enregistrer l'utilisation
            await this.recordMemoryUsage(
              userId,
              memory.id,
              contextHint || "Réponse automatique"
            );

            logger.info(
              `📎 Citation automatique ajoutée pour: "${memory.title}"`
            );
          }
        }
      }

      return {
        citedMemories,
        citationText: processedText,
        originalText: text,
      };
    } catch (error) {
      logger.error("❌ Erreur traitement citations:", error);
      return {
        citedMemories: [],
        citationText: text,
        originalText: text,
      };
    }
  }

  /**
   * Détecte si une mémoire est utilisée dans un texte
   */
  private detectMemoryUsage(text: string, memory: MemoryEntry): boolean {
    const textLower = text.toLowerCase();
    const memoryContent = memory.content.toLowerCase();
    const memoryTitle = memory.title.toLowerCase();

    // Détecter par mots-clés importants de la mémoire
    const memoryKeywords = this.extractKeywords(memory.content);
    const titleKeywords = this.extractKeywords(memory.title);

    // Vérifier si le texte contient des éléments clés de la mémoire
    const keywordMatches = [...memoryKeywords, ...titleKeywords].filter(
      (keyword) => textLower.includes(keyword.toLowerCase())
    );

    // Détecter par catégories spécifiques
    const categoryMatches = this.detectCategoryUsage(text, memory);

    return keywordMatches.length >= 2 || categoryMatches;
  }

  /**
   * Extrait les mots-clés importants d'un texte
   */
  private extractKeywords(text: string): string[] {
    // Mots vides à ignorer
    const stopWords = [
      "le",
      "la",
      "les",
      "un",
      "une",
      "des",
      "de",
      "du",
      "et",
      "ou",
      "mais",
      "donc",
      "car",
      "ni",
      "or",
    ];

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5); // Garder les 5 premiers mots importants
  }

  /**
   * Détecte l'utilisation selon la catégorie de mémoire
   */
  private detectCategoryUsage(text: string, memory: MemoryEntry): boolean {
    const textLower = text.toLowerCase();

    switch (memory.category) {
      case "preference":
        return (
          textLower.includes("préfère") ||
          textLower.includes("souhaite") ||
          textLower.includes("option")
        );

      case "rule":
        return (
          textLower.includes("règle") ||
          textLower.includes("interdit") ||
          textLower.includes("obligatoire")
        );

      case "correction":
        return (
          textLower.includes("correction") ||
          textLower.includes("erreur") ||
          textLower.includes("rectification")
        );

      case "context":
        return (
          textLower.includes("projet") ||
          textLower.includes("contexte") ||
          textLower.includes("travail")
        );

      default:
        return false;
    }
  }

  /**
   * Insère intelligemment la citation dans le texte
   */
  private insertCitation(
    text: string,
    memory: MemoryEntry,
    citationTag: string
  ): string {
    // Identifier le meilleur endroit pour insérer la citation
    const sentences = text.split(/[.!?]+/);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();

      if (this.detectMemoryUsage(sentence, memory)) {
        // Insérer la citation à la fin de cette phrase
        sentences[i] = sentence + " " + citationTag;
        return sentences.join(". ").replace(/\.\s*\./g, ".");
      }
    }

    // Si pas de position spécifique trouvée, ajouter à la fin
    return text + " " + citationTag;
  }

  /**
   * Enregistre l'utilisation d'une mémoire pour suivi
   */
  private async recordMemoryUsage(
    userId: string,
    memoryId: string,
    context: string
  ): Promise<void> {
    return this.enqueueOperation(userId, async () => {
      try {
        const userMemories = await memoryManager.loadUserMemory(userId);
        const memory = userMemories.entries.find(
          (entry) => entry.id === memoryId
        );

        if (!memory) return;

        const usage: MemoryUsage = {
          memoryId,
          memoryTitle: memory.title,
          usageContext: context,
          citationRequired: memory.citationRequired,
          timestamp: new Date().toISOString(),
        };

        const userHistory = await this.loadUsageHistory(userId);
        userHistory.unshift(usage);

        if (userHistory.length > 100) {
          userHistory.splice(100);
        }

        await this.saveUsageHistory(userId, userHistory);

        logger.info(`📊 Utilisation mémoire enregistrée: ${memory.title}`);
      } catch (error) {
        logger.error("❌ Erreur enregistrement utilisation:", error);
      }
    });
  }

  /**
   * Valide qu'un texte contient toutes les citations requises
   */
  async validateCitations(
    userId: string,
    text: string
  ): Promise<{
    isValid: boolean;
    missingCitations: string[];
    warnings: string[];
  }> {
    const dynamicFlag = await isMemoryCitationsEnabled();
    if (!MEMORY_CITATIONS_ENABLED && !dynamicFlag) {
      return { isValid: true, missingCitations: [], warnings: [] };
    }
    try {
      const userMemories = await memoryManager.loadUserMemory(userId);
      const missingCitations: string[] = [];
      const warnings: string[] = [];

      for (const memory of userMemories.entries) {
        if (memory.citationRequired && this.detectMemoryUsage(text, memory)) {
          const citationTag = `[[memory:${memory.id}]]`;

          if (!text.includes(citationTag)) {
            missingCitations.push(memory.title);
            warnings.push(`Citation manquante pour: "${memory.title}"`);
          }
        }
      }

      const isValid = missingCitations.length === 0;

      if (!isValid) {
        logger.warn(`⚠️ ${missingCitations.length} citation(s) manquante(s)`);
      }

      return {
        isValid,
        missingCitations,
        warnings,
      };
    } catch (error) {
      logger.error("❌ Erreur validation citations:", error);
      return {
        isValid: false,
        missingCitations: [],
        warnings: ["Erreur lors de la validation"],
      };
    }
  }

  /**
   * Extrait les IDs des mémoires citées dans un texte
   */
  extractCitedMemoryIds(text: string): string[] {
    const citationRegex = /\[\[memory:([a-zA-Z0-9_]+)\]\]/g;
    const matches = [];
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return [...new Set(matches)]; // Éviter les doublons
  }

  /**
   * Génère un rapport d'utilisation des mémoires
   */
  async generateUsageReport(userId: string): Promise<{
    totalUsages: number;
    mostUsedMemories: Array<{
      memoryId: string;
      title: string;
      usageCount: number;
    }>;
    recentUsages: MemoryUsage[];
    citationStats: {
      totalCitationsRequired: number;
      totalCitationsMade: number;
      complianceRate: number;
    };
  }> {
    try {
      const userHistory = await this.loadUsageHistory(userId);
      const userMemories = await memoryManager.loadUserMemory(userId);

      // Compter les utilisations par mémoire
      const usageCounts = new Map<string, number>();
      userHistory.forEach((usage) => {
        usageCounts.set(
          usage.memoryId,
          (usageCounts.get(usage.memoryId) || 0) + 1
        );
      });

      // Trier par utilisation
      const mostUsedMemories = Array.from(usageCounts.entries())
        .map(([memoryId, count]) => {
          const memory = userMemories.entries.find((m) => m.id === memoryId);
          return {
            memoryId,
            title: memory?.title || "Mémoire supprimée",
            usageCount: count,
          };
        })
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10);

      // Statistiques de citations
      const citationRequired = userHistory.filter(
        (u) => u.citationRequired
      ).length;
      const citationsMade = userHistory.length; // Toutes les utilisations enregistrées ont une citation
      const complianceRate =
        citationRequired > 0 ? (citationsMade / citationRequired) * 100 : 100;

      return {
        totalUsages: userHistory.length,
        mostUsedMemories,
        recentUsages: userHistory.slice(0, 20),
        citationStats: {
          totalCitationsRequired: citationRequired,
          totalCitationsMade: citationsMade,
          complianceRate: Math.round(complianceRate),
        },
      };
    } catch (error) {
      logger.error("❌ Erreur génération rapport:", error);
      throw error;
    }
  }

  /**
   * Nettoie l'historique d'utilisation d'un utilisateur
   */
  clearUsageHistory(userId: string): void {
    this.enqueueOperation(userId, async () => {
      this.usageHistory.delete(userId);
      const storageKey = `${CITATION_HISTORY_KEY}_${userId}`;
      await AsyncStorage.removeItem(storageKey);
      logger.info(`🗑️ Historique d'utilisation effacé pour ${userId}`);
    });
  }

  /**
   * Convertit les citations dans un texte en format lisible
   */
  async convertCitationsToReadable(
    userId: string,
    text: string
  ): Promise<string> {
    const dynamicFlag = await isMemoryCitationsEnabled();
    if (!MEMORY_CITATIONS_ENABLED && !dynamicFlag) {
      return text.replace(/\[\[memory:[a-zA-Z0-9_]+\]\]/g, "");
    }
    try {
      const citedIds = this.extractCitedMemoryIds(text);
      if (citedIds.length === 0) {
        return text; // Aucune citation à convertir
      }

      let readableText = text;
      const userMemories = await memoryManager.loadUserMemory(userId); // Charger une seule fois

      for (const memoryId of citedIds) {
        const memory = userMemories.entries.find((m) => m.id === memoryId);

        if (memory) {
          const citationTag = `[[memory:${memoryId}]]`;
          const readableCitation = `[Source: ${memory.title}]`;
          readableText = readableText.replace(
            new RegExp(citationTag, "g"),
            readableCitation
          );
        }
      }

      return readableText;
    } catch (error) {
      logger.error("❌ Erreur conversion citations:", error);
      return text;
    }
  }
}

// Export de l'instance singleton
export const citationManager = CitationManager.getInstance();
