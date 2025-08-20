import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  memoryManager,
  MemoryEntry,
  MemoryCollection,
} from "../services/memory/MemoryManager";
import {
  citationManager,
  CitationContext,
} from "../services/memory/CitationManager";
import {
  migrationService,
  MigrationStatus,
} from "../services/memory/MigrationService";
import { MEMORY_CITATIONS_ENABLED, isMemoryCitationsEnabled } from "../config/memoryConfig";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("useUnifiedMemory");

export interface UnifiedMemoryState {
  memories: MemoryEntry[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  migrationStatus: MigrationStatus | null;
  stats: {
    totalEntries: number;
    byCategory: Record<string, number>;
    byImportance: Record<string, number>;
    lastUpdated: string;
  } | null;
}

export interface UnifiedMemoryActions {
  // Gestion mémoire de base
  addMemory: (
    memory: Omit<MemoryEntry, "id" | "timestamp" | "userId">
  ) => Promise<string>;
  updateMemory: (
    memoryId: string,
    updates: Partial<
      Pick<
        MemoryEntry,
        "title" | "content" | "category" | "importance" | "tags"
      >
    >
  ) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  searchMemories: (query: {
    category?: MemoryEntry["category"];
    tags?: string[];
    contentKeywords?: string[];
    importance?: MemoryEntry["importance"];
  }) => Promise<MemoryEntry[]>;
  // Recherche sémantique
  semanticSearch: (
    queryText: string,
    options?: { topK?: number; minScore?: number; category?: MemoryEntry["category"]; importance?: MemoryEntry["importance"] }
  ) => Promise<MemoryEntry[]>;

  // Citations automatiques
  processTextWithCitations: (
    text: string,
    contextHint?: string
  ) => Promise<CitationContext>;
  validateCitations: (
    text: string
  ) => Promise<{
    isValid: boolean;
    missingCitations: string[];
    warnings: string[];
  }>;
  convertCitationsToReadable: (text: string) => Promise<string>;
  getCitationUsageReport: () => Promise<
    | {
        totalUsages: number;
        mostUsedMemories: Array<{ memoryId: string; title: string; usageCount: number }>;
        recentUsages: any[];
        citationStats: {
          totalCitationsRequired: number;
          totalCitationsMade: number;
          complianceRate: number;
        };
      }
    | null
  >;

  // Migration
  runMigration: () => Promise<MigrationStatus>;
  rollbackMigration: () => Promise<void>;
  getMigrationReport: () => Promise<any>;

  // Helpers pour compatibilité avec anciens hooks
  getUserPreference: (key: string) => MemoryEntry | null;
  setUserPreference: (
    key: string,
    value: any,
    importance?: MemoryEntry["importance"]
  ) => Promise<string>;
  getUserStats: () => {
    totalRecordingTime: number;
    totalRecordingsCreated: number;
  } | null;
  updateUserStats: (stats: {
    totalRecordingTime?: number;
    totalRecordingsCreated?: number;
  }) => Promise<void>;

  // Utilitaires
  refreshMemory: () => Promise<void>;
  clearAllMemory: () => Promise<void>;
  exportMemory: () => Promise<string>;
  importMemory: (data: string) => Promise<void>;
}

/**
 * Hook unifié pour la gestion centralisée de la mémoire
 * Remplace useAIMemory, useGlobalPreferences, useUserStats, etc.
 */
export const useUnifiedMemory = (): UnifiedMemoryState &
  UnifiedMemoryActions => {
  const { user } = useAuth();
  const [state, setState] = useState<UnifiedMemoryState>({
    memories: [],
    isLoading: true,
    isInitialized: false,
    error: null,
    migrationStatus: null,
    stats: null,
  });

  // Initialisation et chargement
  const initializeMemory = useCallback(async () => {
    if (!user?.uid) {
      setState((prev) => ({ ...prev, isLoading: false, isInitialized: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Vérifier statut migration
      const migrationStatus = await migrationService.getMigrationStatus(
        user.uid
      );

      // Si pas de migration, lancer automatiquement
      if (!migrationStatus) {
        logger.info("🚀 Lancement migration automatique...");
        const newMigrationStatus = await migrationService.migrateAllSystems(
          user.uid
        );
        setState((prev) => ({ ...prev, migrationStatus: newMigrationStatus }));
      } else {
        setState((prev) => ({ ...prev, migrationStatus }));
      }

      // Charger mémoire
      const collection = await memoryManager.loadUserMemory(user.uid);
      const stats = await memoryManager.getMemoryStats(user.uid);

      setState((prev) => ({
        ...prev,
        memories: collection.entries,
        stats,
        isLoading: false,
        isInitialized: true,
      }));

      logger.info(
        `✅ Mémoire initialisée: ${collection.entries.length} entrées`
      );
    } catch (error) {
      logger.error("❌ Erreur initialisation mémoire:", error);
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
        isInitialized: false,
      }));
    }
  }, [user?.uid]);

  // Initialisation au montage
  useEffect(() => {
    initializeMemory();
  }, [initializeMemory]);

  // Actions de gestion mémoire
  const addMemory = useCallback(
    async (memory: Omit<MemoryEntry, "id" | "timestamp" | "userId">) => {
      if (!user?.uid) throw new Error("Utilisateur non connecté");

      try {
        const memoryId = await memoryManager.addMemory(user.uid, memory);

        // Rafraîchir état
        const collection = await memoryManager.loadUserMemory(user.uid);
        const stats = await memoryManager.getMemoryStats(user.uid);

        setState((prev) => ({
          ...prev,
          memories: collection.entries,
          stats,
        }));

        return memoryId;
      } catch (error) {
        logger.error("❌ Erreur ajout mémoire:", error);
        throw error;
      }
    },
    [user?.uid]
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      updates: Partial<
        Pick<
          MemoryEntry,
          "title" | "content" | "category" | "importance" | "tags"
        >
      >
    ) => {
      if (!user?.uid) throw new Error("Utilisateur non connecté");

      try {
        await memoryManager.updateMemory(user.uid, memoryId, updates);

        // Rafraîchir état
        const collection = await memoryManager.loadUserMemory(user.uid);
        setState((prev) => ({
          ...prev,
          memories: collection.entries,
        }));
      } catch (error) {
        logger.error("❌ Erreur mise à jour mémoire:", error);
        throw error;
      }
    },
    [user?.uid]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      if (!user?.uid) throw new Error("Utilisateur non connecté");

      try {
        await memoryManager.deleteMemory(user.uid, memoryId);

        // Rafraîchir état
        const collection = await memoryManager.loadUserMemory(user.uid);
        const stats = await memoryManager.getMemoryStats(user.uid);

        setState((prev) => ({
          ...prev,
          memories: collection.entries,
          stats,
        }));
      } catch (error) {
        logger.error("❌ Erreur suppression mémoire:", error);
        throw error;
      }
    },
    [user?.uid]
  );

  const searchMemories = useCallback(
    async (query: {
      category?: MemoryEntry["category"];
      tags?: string[];
      contentKeywords?: string[];
      importance?: MemoryEntry["importance"];
    }) => {
      if (!user?.uid) return [];

      try {
        return await memoryManager.searchMemories(user.uid, query);
      } catch (error) {
        logger.error("❌ Erreur recherche mémoires:", error);
        return [];
      }
    },
    [user?.uid]
  );

  const semanticSearch = useCallback(
    async (
      queryText: string,
      options?: { topK?: number; minScore?: number; category?: MemoryEntry["category"]; importance?: MemoryEntry["importance"] }
    ) => {
      if (!user?.uid) return [];
      try {
        return await memoryManager.semanticSearch(user.uid, queryText, options);
      } catch (error) {
        logger.error("❌ Erreur recherche sémantique:", error);
        return [];
      }
    },
    [user?.uid]
  );

  // Actions de citation
  const processTextWithCitations = useCallback(
    async (text: string, contextHint?: string) => {
      if (!user?.uid)
        return { citedMemories: [], citationText: text, originalText: text };

      try {
        return await citationManager.processTextWithCitations(
          user.uid,
          text,
          contextHint
        );
      } catch (error) {
        logger.error("❌ Erreur traitement citations:", error);
        return { citedMemories: [], citationText: text, originalText: text };
      }
    },
    [user?.uid]
  );

  const validateCitations = useCallback(
    async (text: string) => {
      if (!user?.uid)
        return { isValid: true, missingCitations: [], warnings: [] };

      try {
        return await citationManager.validateCitations(user.uid, text);
      } catch (error) {
        logger.error("❌ Erreur validation citations:", error);
        return {
          isValid: false,
          missingCitations: [],
          warnings: ["Erreur validation"],
        };
      }
    },
    [user?.uid]
  );

  const convertCitationsToReadable = useCallback(
    async (text: string) => {
      if (!user?.uid) return text;

      try {
        const dynamic = await isMemoryCitationsEnabled();
        if (!MEMORY_CITATIONS_ENABLED && !dynamic) {
          return text.replace(/\[\[memory:[a-zA-Z0-9_]+\]\]/g, "");
        }
        return await citationManager.convertCitationsToReadable(user.uid, text);
      } catch (error) {
        logger.error("❌ Erreur conversion citations:", error);
        return text;
      }
    },
    [user?.uid]
  );

  const getCitationUsageReport = useCallback(async () => {
    if (!user?.uid) return null;
    try {
      return await citationManager.generateUsageReport(user.uid);
    } catch (error) {
      logger.error("❌ Erreur rapport citations:", error);
      return null;
    }
  }, [user?.uid]);

  // Actions de migration
  const runMigration = useCallback(async () => {
    if (!user?.uid) throw new Error("Utilisateur non connecté");

    try {
      const status = await migrationService.migrateAllSystems(user.uid);
      setState((prev) => ({ ...prev, migrationStatus: status }));

      // Rafraîchir mémoire après migration
      await initializeMemory();

      return status;
    } catch (error) {
      logger.error("❌ Erreur migration:", error);
      throw error;
    }
  }, [user?.uid, initializeMemory]);

  const rollbackMigration = useCallback(async () => {
    if (!user?.uid) throw new Error("Utilisateur non connecté");

    try {
      await migrationService.rollbackMigration(user.uid);
      setState((prev) => ({ ...prev, migrationStatus: null }));

      // Rafraîchir état
      await initializeMemory();
    } catch (error) {
      logger.error("❌ Erreur rollback:", error);
      throw error;
    }
  }, [user?.uid, initializeMemory]);

  const getMigrationReport = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      return await migrationService.generateMigrationReport(user.uid);
    } catch (error) {
      logger.error("❌ Erreur rapport migration:", error);
      return null;
    }
  }, [user?.uid]);

  // Helpers de compatibilité
  const getUserPreference = useCallback(
    (key: string): MemoryEntry | null => {
      return (
        state.memories.find(
          (memory) =>
            memory.category === "preference" &&
            (memory.title.toLowerCase().includes(key.toLowerCase()) ||
              memory.tags?.includes(key.toLowerCase()))
        ) || null
      );
    },
    [state.memories]
  );

  const setUserPreference = useCallback(
    async (
      key: string,
      value: any,
      importance: MemoryEntry["importance"] = "medium"
    ) => {
      const title = `Préférence: ${key}`;
      const content =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      // Vérifier si préférence existe déjà
      const existing = getUserPreference(key);

      if (existing) {
        await updateMemory(existing.id, { content });
        return existing.id;
      }

      const citationsDyn = await isMemoryCitationsEnabled();
      const id = await addMemory({
        title,
        content,
        category: "preference",
        importance,
        citationRequired: MEMORY_CITATIONS_ENABLED || citationsDyn,
        tags: [key.toLowerCase(), "preference", "user-setting"],
      });
      return id;
    },
    [getUserPreference, addMemory, updateMemory]
  );

  // Stats utilisateur (compat)
  const [userStats, setUserStats] = useState<
    | { totalRecordingTime: number; totalRecordingsCreated: number }
    | null
  >(null);

  const getUserStats = useCallback(() => userStats, [userStats]);

  const updateUserStats = useCallback(
    async (stats: {
      totalRecordingTime?: number;
      totalRecordingsCreated?: number;
    }) => {
      if (!user?.uid) throw new Error("Utilisateur non connecté");

      const title = "Statistiques Utilisateur";
      const existing = state.memories.find(
        (m) => m.title === title && m.category === "context"
      );

      const newContent = `Temps total enregistrement: ${
        stats.totalRecordingTime ?? userStats?.totalRecordingTime ?? 0
      }s, Enregistrements créés: ${
        stats.totalRecordingsCreated ?? userStats?.totalRecordingsCreated ?? 0
      }`;

      if (existing) {
        await updateMemory(existing.id, { content: newContent });
      } else {
        await addMemory({
          title,
          content: newContent,
          category: "context",
          importance: "medium",
          citationRequired: false,
          tags: ["stats", "recording", "user-data"],
        });
      }

      setUserStats({
        totalRecordingTime:
          stats.totalRecordingTime ?? userStats?.totalRecordingTime ?? 0,
        totalRecordingsCreated:
          stats.totalRecordingsCreated ?? userStats?.totalRecordingsCreated ?? 0,
      });
    },
    [user?.uid, state.memories, userStats, addMemory, updateMemory]
  );

  // Utilitaires
  const refreshMemory = useCallback(async () => {
    if (!user?.uid) return;
    const collection = await memoryManager.loadUserMemory(user.uid);
    const stats = await memoryManager.getMemoryStats(user.uid);
    setState((prev) => ({ ...prev, memories: collection.entries, stats }));
  }, [user?.uid]);

  const clearAllMemory = useCallback(async () => {
    if (!user?.uid) return;
    await memoryManager.clearUserMemory(user.uid);
    await refreshMemory();
  }, [user?.uid, refreshMemory]);

  const exportMemory = useCallback(async () => {
    return JSON.stringify(state.memories, null, 2);
  }, [state.memories]);

  const importMemory = useCallback(async (data: string) => {
    if (!user?.uid) return;
    try {
      const parsed: Omit<MemoryEntry, "id" | "timestamp" | "userId">[] =
        JSON.parse(data);
      for (const m of parsed) {
        await memoryManager.addMemory(user.uid, m);
      }
      await refreshMemory();
    } catch (error) {
      logger.error("❌ Erreur import mémoire:", error);
      throw error;
    }
  }, [user?.uid, refreshMemory]);

  return {
    ...state,
    addMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
    semanticSearch,
    processTextWithCitations,
    validateCitations,
    convertCitationsToReadable,
    getCitationUsageReport,
    runMigration,
    rollbackMigration,
    getMigrationReport,
    getUserPreference,
    setUserPreference,
    getUserStats,
    updateUserStats,
    refreshMemory,
    clearAllMemory,
    exportMemory,
    importMemory,
  };
};
