import { getApp } from "@react-native-firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFirestore,
  collection as fsCollection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../utils/optimizedLogger";
import { CryptoService } from "../cryptoService";
import { embeddingService } from "../embedding/EmbeddingService";
import { identifyPreferenceSubject } from "../../components/chat/message-handler/context/memory/utils";

const logger = createLogger("MemoryManager");

// Types selon fonctionnement_memoire.md
export interface MemoryEntry {
  id: string; // Identifiant unique
  title: string; // Titre court résumant l'information
  content: string; // Contenu détaillé (limité à un paragraphe)
  category: "preference" | "rule" | "context" | "correction" | "fact";
  importance: "high" | "medium" | "low";
  timestamp: string;
  userId: string;
  citationRequired: boolean; // Si cette mémoire doit être citée quand utilisée
  tags?: string[]; // Tags pour recherche sémantique
  relatedMemories?: string[]; // IDs des mémoires liées
  subject?: string; // Sujet détecté pour consolidation (ex: "script_length")
  embedding?: number[]; // Vecteur d'embed (ex: 384/768)
}

export interface MemoryCollection {
  userId: string;
  entries: MemoryEntry[];
  lastUpdated: string;
  version: string; // Pour migrations futures
}

export interface MemoryConflict {
  conflictingMemoryId: string;
  reason: string;
  confidence: number; // 0-1, confiance dans la détection
  suggestedAction: "update" | "delete" | "merge";
}

const MEMORY_COLLECTION_ROOT = "user_memories";
const MEMORY_ENTRIES_SUBCOLLECTION = "entries";
const MEMORY_VERSION = "1.1.0";
const MAX_CONTENT_LENGTH = 500;

/**
 * MemoryManager - Service central de gestion mémoire unifié
 * Implémente les spécifications de fonctionnement_memoire.md
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryCache: Map<string, MemoryCollection> = new Map();
  private operationQueues: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
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
      // S'assurer que les erreurs ne cassent pas la chaîne
      logger.error(
        `Erreur dans l'opération en file d'attente pour ${userId}`,
        error
      );
      // On rejette pour que l'appelant d'origine puisse gérer l'erreur
      throw error;
    });

    this.operationQueues.set(userId, currentOperation);
    return currentOperation;
  }

  /**
   * Génère un ID unique pour une nouvelle mémoire
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Charge la collection mémoire d'un utilisateur
   */
  async loadUserMemory(userId: string): Promise<MemoryCollection> {
    try {
      // Vérifier le cache d'abord
      if (this.memoryCache.has(userId)) {
        return this.memoryCache.get(userId)!;
      }

      const db = getFirestore(getApp());
      const userDocRef = doc(fsCollection(db, MEMORY_COLLECTION_ROOT), userId);
      const entriesRef = fsCollection(userDocRef, MEMORY_ENTRIES_SUBCOLLECTION);
      const entriesQueryRef = query(entriesRef, orderBy("timestamp", "desc"));
      const entriesSnap = await getDocs(entriesQueryRef);

      const entries: MemoryEntry[] = entriesSnap.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = d.data() as Omit<MemoryEntry, "id" | "userId"> & {
            userId?: string;
          };
          return {
            id: d.id,
            title: data.title,
            content: data.content,
            category: data.category,
            importance: data.importance,
            timestamp: data.timestamp,
            userId: userId,
            citationRequired: data.citationRequired,
            tags: data.tags,
            relatedMemories: data.relatedMemories,
            subject: (data as any).subject,
            embedding: (data as any).embedding,
          };
        }
      );

      const summarySnap = await getDoc(userDocRef);
      const summaryData = summarySnap.exists()
        ? (summarySnap.data() as { lastUpdated?: string; version?: string })
        : {};

      const collectionData: MemoryCollection = {
        userId,
        entries,
        lastUpdated: summaryData.lastUpdated || new Date().toISOString(),
        version: summaryData.version || MEMORY_VERSION,
      };

      if (collectionData.entries.length === 0) {
        const legacyKey = `@unified_memory_${userId}`;
        const stored = await AsyncStorage.getItem(legacyKey);
        if (stored) {
          let raw = stored;
          if (stored.startsWith("v2:")) {
            raw = await CryptoService.decrypt(stored, userId);
          }
          try {
            const legacy: MemoryCollection = JSON.parse(raw);
            const db2 = getFirestore(getApp());
            const userRef2 = doc(
              fsCollection(db2, MEMORY_COLLECTION_ROOT),
              userId
            );
            for (const legacyEntry of legacy.entries) {
              const entryRef2 = doc(
                fsCollection(userRef2, MEMORY_ENTRIES_SUBCOLLECTION),
                legacyEntry.id
              );
              await setDoc(entryRef2, {
                title: legacyEntry.title,
                content: legacyEntry.content,
                category: legacyEntry.category,
                importance: legacyEntry.importance,
                timestamp: legacyEntry.timestamp,
                userId: legacyEntry.userId,
                citationRequired: legacyEntry.citationRequired,
                tags: legacyEntry.tags || [],
                relatedMemories: legacyEntry.relatedMemories || [],
                subject: (legacyEntry as any).subject || null,
                embedding: (legacyEntry as any).embedding || null,
              });
            }
            await AsyncStorage.removeItem(legacyKey);
            const reloaded = await this.loadUserMemory(userId);
            this.memoryCache.set(userId, reloaded);
            return reloaded;
          } catch {}
        }
      }

      this.memoryCache.set(userId, collectionData);
      logger.info(
        `📚 Mémoire chargée pour utilisateur ${userId}: ${entries.length} entrées`
      );
      return collectionData;
    } catch (error) {
      logger.error("❌ Erreur chargement mémoire:", error);
      throw new Error(`Échec du chargement de la mémoire: ${error}`);
    }
  }

  /**
   * Sauvegarde la collection mémoire d'un utilisateur
   */
  private async saveUserMemory(
    userId: string,
    collection: MemoryCollection
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const userDocRef = doc(fsCollection(db, MEMORY_COLLECTION_ROOT), userId);
      const payload = {
        userId,
        lastUpdated: new Date().toISOString(),
        version: collection.version || MEMORY_VERSION,
      };
      await setDoc(userDocRef, payload, { merge: true });

      this.memoryCache.set(userId, {
        ...collection,
        lastUpdated: payload.lastUpdated,
      });

      logger.info(
        `💾 Mémoire sauvegardée pour ${userId}: ${collection.entries.length} entrées`
      );
    } catch (error) {
      logger.error("❌ Erreur sauvegarde mémoire:", error);
      throw new Error(`Échec de la sauvegarde: ${error}`);
    }
  }

  /**
   * Ajoute une nouvelle entrée mémoire avec détection de conflits
   */
  async addMemory(
    userId: string,
    memory: Omit<MemoryEntry, "id" | "timestamp" | "userId">
  ): Promise<string> {
    return this.enqueueOperation(userId, async () => {
      try {
        // Validation contenu
        if (memory.content.length > MAX_CONTENT_LENGTH) {
          throw new Error(
            `Contenu trop long (max ${MAX_CONTENT_LENGTH} caractères)`
          );
        }

        // Détecter les informations sensibles (selon fonctionnement_memoire.md)
        if (this.containsSensitiveInfo(memory.content)) {
          logger.warn("🚫 Tentative d'ajout d'information sensible bloquée");
          throw new Error("Informations sensibles non autorisées en mémoire");
        }

        const collection = await this.loadUserMemory(userId);

        // Détecter les conflits AVANT d'ajouter
        const conflicts = await this.detectConflicts(userId, memory);
        if (conflicts.length > 0) {
          logger.info(
            `⚠️ ${conflicts.length} conflit(s) détecté(s), résolution automatique...`
          );
          await this.resolveConflicts(userId, conflicts);
        }

        // Calcul sujet (pour préférences notamment)
        const subject =
          memory.category === "preference"
            ? identifyPreferenceSubject(memory.content)
            : undefined;

        // Calcul embedding (best-effort)
        const embedding = await embeddingService.embedText(
          `${memory.title}\n${memory.content}`
        );

        // Créer nouvelle entrée
        const newEntry: MemoryEntry = {
          ...memory,
          id: this.generateMemoryId(),
          timestamp: new Date().toISOString(),
          userId,
          subject,
          embedding: embedding || undefined,
        };

        const db = getFirestore(getApp());
        const userDocRef = doc(
          fsCollection(db, MEMORY_COLLECTION_ROOT),
          userId
        );
        const entryRef = doc(
          fsCollection(userDocRef, MEMORY_ENTRIES_SUBCOLLECTION),
          newEntry.id
        );
        await setDoc(entryRef, {
          title: newEntry.title,
          content: newEntry.content,
          category: newEntry.category,
          importance: newEntry.importance,
          timestamp: newEntry.timestamp,
          userId: newEntry.userId,
          citationRequired: newEntry.citationRequired,
          tags: newEntry.tags || [],
          relatedMemories: newEntry.relatedMemories || [],
          subject: newEntry.subject || null,
          embedding: newEntry.embedding || null,
        });

        collection.entries.unshift(newEntry);
        await this.saveUserMemory(userId, collection);

        logger.info(`✅ Nouvelle mémoire ajoutée: "${memory.title}"`);
        return newEntry.id;
      } catch (error) {
        logger.error("❌ Erreur ajout mémoire:", error);
        throw error;
      }
    });
  }

  /**
   * Met à jour une mémoire existante (pour corrections utilisateur)
   */
  async updateMemory(
    userId: string,
    memoryId: string,
    updates: Partial<
      Pick<
        MemoryEntry,
        "title" | "content" | "category" | "importance" | "tags"
      >
    >
  ): Promise<void> {
    return this.enqueueOperation(userId, async () => {
      try {
        const collection = await this.loadUserMemory(userId);
        const memoryIndex = collection.entries.findIndex(
          (entry) => entry.id === memoryId
        );

        if (memoryIndex === -1) {
          throw new Error(`Mémoire ${memoryId} non trouvée`);
        }

        // Validation si contenu modifié
        if (updates.content && updates.content.length > MAX_CONTENT_LENGTH) {
          throw new Error(
            `Contenu trop long (max ${MAX_CONTENT_LENGTH} caractères)`
          );
        }

        if (updates.content && this.containsSensitiveInfo(updates.content)) {
          throw new Error("Informations sensibles non autorisées");
        }

        // Appliquer les mises à jour
        const currentMemory = collection.entries[memoryIndex];

        // Recalcul subject si préférence et content modifié
        const newSubject =
          (updates.category || currentMemory.category) === "preference" &&
          (updates.content || updates.title)
            ? identifyPreferenceSubject(
                updates.content || currentMemory.content || ""
              )
            : currentMemory.subject;

        // Recalcul embedding si title/content modifiés
        let newEmbedding = currentMemory.embedding;
        if (updates.title || updates.content) {
          const emb = await embeddingService.embedText(
            `${updates.title ?? currentMemory.title}\n${
              updates.content ?? currentMemory.content
            }`
          );
          if (emb) newEmbedding = emb;
        }

        collection.entries[memoryIndex] = {
          ...currentMemory,
          ...updates,
          subject: newSubject,
          embedding: newEmbedding,
          timestamp: new Date().toISOString(), // Mise à jour timestamp
        };

        const db = getFirestore(getApp());
        const userDocRef = doc(
          fsCollection(db, MEMORY_COLLECTION_ROOT),
          userId
        );
        const entryRef = doc(
          fsCollection(userDocRef, MEMORY_ENTRIES_SUBCOLLECTION),
          memoryId
        );

        const updatedDoc: {
          title?: string;
          content?: string;
          category?: MemoryEntry["category"];
          importance?: MemoryEntry["importance"];
          timestamp: string;
          tags?: string[];
          subject?: string | null;
          embedding?: number[] | null;
        } = {
          timestamp: new Date().toISOString(),
        };
        if (updates.title !== undefined) updatedDoc.title = updates.title;
        if (updates.content !== undefined) updatedDoc.content = updates.content;
        if (updates.category !== undefined)
          updatedDoc.category = updates.category;
        if (updates.importance !== undefined)
          updatedDoc.importance = updates.importance;
        if (updates.tags !== undefined) updatedDoc.tags = updates.tags;
        updatedDoc.subject = newSubject ?? null;
        updatedDoc.embedding = newEmbedding ?? null;

        await updateDoc(entryRef, updatedDoc);

        await this.saveUserMemory(userId, collection);
        logger.info(`🔄 Mémoire ${memoryId} mise à jour`);
      } catch (error) {
        logger.error("❌ Erreur mise à jour mémoire:", error);
        throw error;
      }
    });
  }

  /**
   * Supprime une mémoire (pour résolution de conflits)
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    return this.enqueueOperation(userId, async () => {
      try {
        const collection = await this.loadUserMemory(userId);
        const initialLength = collection.entries.length;

        collection.entries = collection.entries.filter(
          (entry) => entry.id !== memoryId
        );

        if (collection.entries.length === initialLength) {
          throw new Error(`Mémoire ${memoryId} non trouvée`);
        }

        const db = getFirestore(getApp());
        const userDocRef = doc(
          fsCollection(db, MEMORY_COLLECTION_ROOT),
          userId
        );
        const entryRef = doc(
          fsCollection(userDocRef, MEMORY_ENTRIES_SUBCOLLECTION),
          memoryId
        );
        await deleteDoc(entryRef);

        await this.saveUserMemory(userId, collection);
        logger.info(`🗑️ Mémoire ${memoryId} supprimée`);
      } catch (error) {
        logger.error("❌ Erreur suppression mémoire:", error);
        throw error;
      }
    });
  }

  /**
   * Recherche mémoires par catégorie, tags ou contenu
   */
  async searchMemories(
    userId: string,
    query: {
      category?: MemoryEntry["category"];
      tags?: string[];
      contentKeywords?: string[];
      importance?: MemoryEntry["importance"];
    }
  ): Promise<MemoryEntry[]> {
    try {
      const collection = await this.loadUserMemory(userId);

      return collection.entries.filter((entry) => {
        if (query.category && entry.category !== query.category) return false;
        if (query.importance && entry.importance !== query.importance)
          return false;

        if (query.tags && query.tags.length > 0) {
          const hasTag = query.tags.some((tag) =>
            entry.tags?.some((entryTag) =>
              entryTag.toLowerCase().includes(tag.toLowerCase())
            )
          );
          if (!hasTag) return false;
        }

        if (query.contentKeywords && query.contentKeywords.length > 0) {
          const hasKeyword = query.contentKeywords.some(
            (keyword) =>
              entry.content.toLowerCase().includes(keyword.toLowerCase()) ||
              entry.title.toLowerCase().includes(keyword.toLowerCase())
          );
          if (!hasKeyword) return false;
        }

        return true;
      });
    } catch (error) {
      logger.error("❌ Erreur recherche mémoires:", error);
      return [];
    }
  }

  /**
   * Recherche sémantique locale par similarité cosinus (client-side)
   */
  async semanticSearch(
    userId: string,
    queryText: string,
    options?: {
      topK?: number;
      minScore?: number;
      category?: MemoryEntry["category"];
      importance?: MemoryEntry["importance"];
    }
  ): Promise<MemoryEntry[]> {
    const topK = options?.topK ?? 10;
    const minScore = options?.minScore ?? 0.3;
    const collection = await this.loadUserMemory(userId);

    const q = (await embeddingService.embedText(queryText)) || [];
    if (q.length === 0) {
      // Fallback: return keyword search results
      return this.searchMemories(userId, {
        contentKeywords: queryText.split(/\s+/).filter(Boolean),
        category: options?.category,
        importance: options?.importance,
      });
    }

    const candidates = collection.entries.filter((e) => {
      if (options?.category && e.category !== options.category) return false;
      if (options?.importance && e.importance !== options.importance)
        return false;
      return Array.isArray(e.embedding) && e.embedding.length > 0;
    });

    const scored = candidates
      .map((e) => ({
        entry: e,
        score: embeddingService.cosineSimilarity(
          q as number[],
          e.embedding as number[]
        ),
      }))
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.entry);

    return scored;
  }

  /**
   * Détecte les conflits avec mémoires existantes
   */
  private async detectConflicts(
    userId: string,
    newMemory: Omit<MemoryEntry, "id" | "timestamp" | "userId">
  ): Promise<MemoryConflict[]> {
    const collection = await this.loadUserMemory(userId);
    const conflicts: MemoryConflict[] = [];

    for (const existing of collection.entries) {
      // Vérifier conflits par catégorie et similarité
      if (existing.category === newMemory.category) {
        // Cas particulier des préférences: fusion par sujet
        if (existing.category === "preference") {
          const s1 =
            existing.subject || identifyPreferenceSubject(existing.content);
          const s2 = identifyPreferenceSubject(newMemory.content);
          if (s1 === s2) {
            conflicts.push({
              conflictingMemoryId: existing.id,
              reason: `Même sujet de préférence détecté: ${s1}`,
              confidence: 0.95,
              suggestedAction: "merge",
            });
            continue;
          }
        }

        const similarity = this.calculateSimilarity(
          existing.content,
          newMemory.content
        );

        if (similarity > 0.8) {
          // Très similaire - probablement un doublon
          conflicts.push({
            conflictingMemoryId: existing.id,
            reason: "Contenu très similaire détecté",
            confidence: similarity,
            suggestedAction: "merge",
          });
        } else if (
          this.detectContradiction(existing.content, newMemory.content)
        ) {
          // Contradiction détectée
          conflicts.push({
            conflictingMemoryId: existing.id,
            reason: "Contradiction détectée avec mémoire existante",
            confidence: 0.9,
            suggestedAction: "update",
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Résout automatiquement les conflits détectés
   */
  private async resolveConflicts(
    userId: string,
    conflicts: MemoryConflict[]
  ): Promise<void> {
    for (const conflict of conflicts) {
      switch (conflict.suggestedAction) {
        case "delete":
          await this.deleteMemory(userId, conflict.conflictingMemoryId);
          logger.info(
            `🔧 Conflit résolu: mémoire ${conflict.conflictingMemoryId} supprimée`
          );
          break;

        case "update":
          // La nouvelle mémoire remplacera l'ancienne
          await this.deleteMemory(userId, conflict.conflictingMemoryId);
          logger.info(
            `🔧 Conflit résolu: mémoire ${conflict.conflictingMemoryId} remplacée`
          );
          break;

        case "merge":
          // Pour l'instant, supprimer l'ancienne (merge complexe à implémenter)
          await this.deleteMemory(userId, conflict.conflictingMemoryId);
          logger.info(
            `🔧 Conflit résolu: mémoire ${conflict.conflictingMemoryId} fusionnée`
          );
          break;
      }
    }
  }

  /**
   * Calcule la similarité entre deux textes (simple)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(" ");
    const words2 = text2.toLowerCase().split(" ");

    const intersection = words1.filter((word) => words2.includes(word));
    const union = Array.from(new Set([...words1, ...words2]));

    return intersection.length / union.length;
  }

  /**
   * Détecte les contradictions simples
   */
  private detectContradiction(existing: string, newContent: string): boolean {
    // Logique simple de détection de contradictions
    const negationWords = ["ne pas", "non", "jamais", "aucun", "pas"];
    const existingLower = existing.toLowerCase();
    const newLower = newContent.toLowerCase();

    // Si l'un contient une négation et l'autre non sur un sujet similaire
    const hasNegationExisting = negationWords.some((neg) =>
      existingLower.includes(neg)
    );
    const hasNegationNew = negationWords.some((neg) => newLower.includes(neg));

    return (
      hasNegationExisting !== hasNegationNew &&
      this.calculateSimilarity(existing, newContent) > 0.5
    );
  }

  /**
   * Détecte les informations sensibles (selon fonctionnement_memoire.md)
   */
  private containsSensitiveInfo(content: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Numéros de carte
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b\d{10,}\b/, // Numéros de téléphone
      /mot de passe|password|mdp/i, // Références aux mots de passe
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Noms complets potentiels
    ];

    return sensitivePatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Efface toute la mémoire d'un utilisateur
   */
  async clearUserMemory(userId: string): Promise<void> {
    return this.enqueueOperation(userId, async () => {
      try {
        const db = getFirestore(getApp());
        const userDocRef = doc(
          fsCollection(db, MEMORY_COLLECTION_ROOT),
          userId
        );
        const entriesRef = fsCollection(
          userDocRef,
          MEMORY_ENTRIES_SUBCOLLECTION
        );
        const snap = await getDocs(entriesRef);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
        await setDoc(
          userDocRef,
          { lastUpdated: new Date().toISOString(), version: MEMORY_VERSION },
          { merge: true }
        );
        this.memoryCache.delete(userId);

        logger.info(`🗑️ Mémoire utilisateur ${userId} effacée complètement`);
      } catch (error) {
        logger.error("❌ Erreur effacement mémoire:", error);
        throw error;
      }
    });
  }

  /**
   * Obtient les statistiques mémoire pour un utilisateur
   */
  async getMemoryStats(userId: string): Promise<{
    totalEntries: number;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    lastUpdated: string;
  }> {
    try {
      const collection = await this.loadUserMemory(userId);

      const byCategory: Record<string, number> = {};
      const byImportance: Record<string, number> = {};

      collection.entries.forEach((entry) => {
        byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
        byImportance[entry.importance] =
          (byImportance[entry.importance] || 0) + 1;
      });

      return {
        totalEntries: collection.entries.length,
        byCategory,
        byImportance,
        lastUpdated: collection.lastUpdated,
      };
    } catch (error) {
      logger.error("❌ Erreur statistiques mémoire:", error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const memoryManager = MemoryManager.getInstance();
