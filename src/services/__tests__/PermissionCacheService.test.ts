import { PermissionCacheService, PermissionType, PermissionStatus } from "../PermissionCacheService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("PermissionCacheService", () => {
  let permissionCache: PermissionCacheService;

  beforeEach(() => {
    permissionCache = PermissionCacheService.getInstance();
    // Reset cache for each test
    permissionCache.clearCache();
  });

  describe("Basic functionality", () => {
    it("should be a singleton", () => {
      const instance1 = PermissionCacheService.getInstance();
      const instance2 = PermissionCacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize properly", () => {
      expect(permissionCache.isInitialized()).toBe(true);
    });
  });

  describe("Permission caching", () => {
    it("should cache and retrieve permission status", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true);

      const isGranted = await permissionCache.isPermissionGranted(PermissionType.CAMERA);
      expect(isGranted).toBe(true);
    });

    it("should handle denied permissions", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, false);

      const isGranted = await permissionCache.isPermissionGranted(PermissionType.CAMERA);
      expect(isGranted).toBe(false);
    });

    it("should handle limited permissions", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true, true);

      const isGranted = await permissionCache.isPermissionGranted(PermissionType.CAMERA);
      expect(isGranted).toBe(true);
    });
  });

  describe("Cache management", () => {
    it("should invalidate specific permission cache", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true);
      expect(await permissionCache.isPermissionGranted(PermissionType.CAMERA)).toBe(true);

      await permissionCache.invalidatePermissionCache(PermissionType.CAMERA);
      const status = await permissionCache.getCachedPermissionStatus(PermissionType.CAMERA);
      expect(status).toBe(null);
    });

    it("should clear all cache", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true);
      await permissionCache.updatePermissionCache(PermissionType.MICROPHONE, true);

      expect(await permissionCache.isPermissionGranted(PermissionType.CAMERA)).toBe(true);
      expect(await permissionCache.isPermissionGranted(PermissionType.MICROPHONE)).toBe(true);

      await permissionCache.clearCache();

      expect(await permissionCache.isPermissionGranted(PermissionType.CAMERA)).toBe(false);
      expect(await permissionCache.isPermissionGranted(PermissionType.MICROPHONE)).toBe(false);
    });
  });

  describe("Cache statistics", () => {
    it("should provide cache statistics", async () => {
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true);
      await permissionCache.updatePermissionCache(PermissionType.MICROPHONE, false);

      const stats = permissionCache.getCacheStats();
      expect(stats.total).toBe(2);
      expect(stats.granted).toBe(1);
      expect(stats.denied).toBe(1);
    });
  });

  describe("Cache expiration", () => {
    it("should handle expired cache entries", async () => {
      // Set a very short expiration time for testing
      await permissionCache.updatePermissionCache(PermissionType.CAMERA, true);

      // Manually set expiration to past time
      const key = `${PermissionType.CAMERA}_android`;
      const cache = (permissionCache as any).cache;
      if (cache[key]) {
        cache[key].expiresAt = Date.now() - 1000; // Expired 1 second ago
      }

      const isGranted = await permissionCache.isPermissionGranted(PermissionType.CAMERA);
      expect(isGranted).toBe(false);
    });
  });
});
