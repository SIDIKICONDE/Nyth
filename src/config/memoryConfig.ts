import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@memory_citations_enabled";

export const DEFAULT_MEMORY_CITATIONS_ENABLED = false;

export const MEMORY_CITATIONS_ENABLED: boolean = DEFAULT_MEMORY_CITATIONS_ENABLED;

export async function isMemoryCitationsEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored === null) return DEFAULT_MEMORY_CITATIONS_ENABLED;
    return stored === "true";
  } catch {
    return DEFAULT_MEMORY_CITATIONS_ENABLED;
  }
}

export async function setMemoryCitationsEnabled(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
}
