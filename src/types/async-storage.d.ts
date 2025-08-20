declare module "@react-native-async-storage/async-storage" {
  export interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiRemove(keys: readonly string[]): Promise<void>;
    multiSet(keyValuePairs: readonly [string, string][]): Promise<void>;
    clear(): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}
