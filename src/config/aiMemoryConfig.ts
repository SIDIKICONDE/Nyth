/**
 * Configuration globale pour la mémoire IA
 */

export interface AIMemoryConfig {
  enabled: boolean;
  analysisMode: "ai-decision" | "regex" | "mistral" | "batch"; // Ajout du mode batch
  maxEntries: number;
  autoCleanup: boolean;
}

const AI_MEMORY_CONFIG_KEY = "@ai_memory_config";

/**
 * Configuration par défaut
 */
export const DEFAULT_AI_MEMORY_CONFIG: AIMemoryConfig = {
  enabled: true, // Mémoire activée par défaut
  analysisMode: "ai-decision", // Par défaut: décision IA (Regex désactivé)
  maxEntries: 50,
  autoCleanup: true,
};

/**
 * Charge la configuration de la mémoire IA
 */
export const loadAIMemoryConfig = async (): Promise<AIMemoryConfig> => {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const stored = await AsyncStorage.getItem(AI_MEMORY_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_AI_MEMORY_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {}
  return DEFAULT_AI_MEMORY_CONFIG;
};

/**
 * Sauvegarde la configuration de la mémoire IA
 */
export const saveAIMemoryConfig = async (
  config: Partial<AIMemoryConfig>
): Promise<void> => {
  try {
    const AsyncStorage = (
      await import("@react-native-async-storage/async-storage")
    ).default;
    const current = await loadAIMemoryConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(AI_MEMORY_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {}
};

/**
 * Active ou désactive la mémoire IA
 */
export const toggleAIMemory = async (enabled: boolean): Promise<void> => {
  await saveAIMemoryConfig({ enabled });
};

/**
 * Vérifie si la mémoire IA est activée
 */
export const isAIMemoryEnabled = async (): Promise<boolean> => {
  const config = await loadAIMemoryConfig();
  return config.enabled;
};

/**
 * Obtient le mode d'analyse actuel
 */
export const getAnalysisMode = async (): Promise<
  "ai-decision" | "regex" | "mistral" | "batch"
> => {
  const config = await loadAIMemoryConfig();
  return config.analysisMode || "batch";
};

/**
 * Change le mode d'analyse
 */
export const setAnalysisMode = async (
  mode: "ai-decision" | "regex" | "mistral" | "batch"
): Promise<boolean> => {
  try {
    const config = await loadAIMemoryConfig();
    config.analysisMode = mode;
    await saveAIMemoryConfig(config);
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  loadAIMemoryConfig,
  saveAIMemoryConfig,
  toggleAIMemory,
  isAIMemoryEnabled,
  getAnalysisMode,
  setAnalysisMode,
  DEFAULT_AI_MEMORY_CONFIG,
};
