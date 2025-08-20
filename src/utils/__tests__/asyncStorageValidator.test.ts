import { AsyncStorageValidator } from "../asyncStorageValidator";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");

describe("AsyncStorageValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateAndRepair", () => {
    it("should handle valid data", async () => {
      AsyncStorage.getAllKeys.mockResolvedValue(["valid_key"]);
      AsyncStorage.getItem.mockResolvedValue('{"test": "value"}');

      const result = await AsyncStorageValidator.validateAndRepair({
        keys: ["valid_key"]
      });

      expect(result.isValid).toBe(true);
      expect(result.stats.validKeys).toBe(1);
      expect(result.stats.invalidKeys).toBe(0);
    });

    it("should detect and repair corrupted JSON", async () => {
      AsyncStorage.getAllKeys.mockResolvedValue(["corrupted_key"]);
      AsyncStorage.getItem.mockResolvedValue('{"test": "value"'); // JSON malformé
      AsyncStorage.setItem.mockResolvedValue();

      const result = await AsyncStorageValidator.validateAndRepair({
        keys: ["corrupted_key"],
        autoRepair: true
      });

      expect(result.isValid).toBe(true);
      expect(result.stats.repairedKeys).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should remove corrupted keys when repair fails", async () => {
      AsyncStorage.getAllKeys.mockResolvedValue(["corrupted_key"]);
      AsyncStorage.getItem.mockResolvedValue('invalid json');
      AsyncStorage.removeItem.mockResolvedValue();

      const result = await AsyncStorageValidator.validateAndRepair({
        keys: ["corrupted_key"],
        autoRepair: false,
        removeCorrupted: true
      });

      expect(result.isValid).toBe(false);
      expect(result.stats.invalidKeys).toBe(1);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("corrupted_key");
    });

    it("should handle specific key types correctly", async () => {
      AsyncStorage.getAllKeys.mockResolvedValue(["firestore_error_notifications"]);
      AsyncStorage.getItem.mockResolvedValue('invalid json');
      AsyncStorage.setItem.mockResolvedValue();

      const result = await AsyncStorageValidator.validateAndRepair({
        keys: ["firestore_error_notifications"],
        autoRepair: true
      });

      // Devrait réparer avec un tableau vide
      expect(result.stats.repairedKeys).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "firestore_error_notifications",
        "[]"
      );
    });
  });

  describe("cleanCorruptedJson", () => {
    it("should clean corrupted JSON by adding missing braces", () => {
      const result = (AsyncStorageValidator as any).cleanCorruptedJson('{"test": "value"');
      expect(result).toBe('{"test": "value"}');
    });

    it("should clean corrupted JSON by removing trailing characters", () => {
      const result = (AsyncStorageValidator as any).cleanCorruptedJson('{"test": "value"}invalid');
      expect(result).toBe('{"test": "value"}');
    });

    it("should return null for unrepairable JSON", () => {
      const result = (AsyncStorageValidator as any).cleanCorruptedJson('completely invalid json');
      expect(result).toBe(null);
    });
  });

  describe("getStorageStats", () => {
    it("should return storage statistics", async () => {
      AsyncStorage.getAllKeys.mockResolvedValue(["key1", "key2"]);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === "key1") return Promise.resolve("small");
        if (key === "key2") return Promise.resolve("larger_value_here");
        return Promise.resolve(null);
      });

      const stats = await AsyncStorageValidator.getStorageStats();

      expect(stats.totalKeys).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.largestKeys).toHaveLength(2);
    });
  });

  describe("cleanupStorage", () => {
    it("should clean old entries", async () => {
      const oldTimestamp = Date.now() - (40 * 24 * 60 * 60 * 1000); // 40 jours
      AsyncStorage.getAllKeys.mockResolvedValue(["emergency_recording_old"]);
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        timestamp: oldTimestamp,
        data: "old"
      }));
      AsyncStorage.removeItem.mockResolvedValue();

      const result = await AsyncStorageValidator.cleanupStorage(30);

      expect(result.cleanedKeys).toContain("emergency_recording_old");
      expect(result.freedSpace).toBeGreaterThan(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });
});
