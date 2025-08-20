import {
  waitForFileAvailability,
  isFileAvailable,
  getFileDetails,
  DEFAULT_FILE_OPTIONS
} from "../fileAvailabilityChecker";

// Mock de react-native-fs
jest.mock("react-native-fs", () => ({
  exists: jest.fn(),
  stat: jest.fn(),
}));

const RNFS = require("react-native-fs");

describe("FileAvailabilityChecker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  describe("waitForFileAvailability", () => {
    it("should return true when file exists and is stable", async () => {
      // Mock fichier qui existe et a une taille stable
      RNFS.exists.mockResolvedValue(true);
      RNFS.stat.mockResolvedValue({
        isFile: () => true,
        size: 1024,
        mtime: new Date()
      });

      const result = await waitForFileAvailability("/test/video.mp4", {
        timeoutMs: 1000,
        checkIntervalMs: 50,
        requiredStableChecks: 2
      });

      expect(result).toBe(true);
      expect(RNFS.exists).toHaveBeenCalledWith("/test/video.mp4");
    }, 10000); // Augmenter le timeout Jest

    it("should return false when file doesn't exist within timeout", async () => {
      // Mock fichier qui n'existe pas
      RNFS.exists.mockResolvedValue(false);

      const result = await waitForFileAvailability("/test/video.mp4", {
        timeoutMs: 200,
        checkIntervalMs: 50
      });

      expect(result).toBe(false);
    }, 10000); // Augmenter le timeout Jest

    it("should return false when file size is below minimum", async () => {
      RNFS.exists.mockResolvedValue(true);
      RNFS.stat.mockResolvedValue({
        isFile: () => true,
        size: 100, // En dessous du minimum
        mtime: new Date()
      });

      const result = await waitForFileAvailability("/test/video.mp4", {
        timeoutMs: 200,
        checkIntervalMs: 50,
        minSizeBytes: 512
      });

      expect(result).toBe(false);
    }, 10000); // Augmenter le timeout Jest

    it("should wait for file size to stabilize", async () => {
      // Simulation d'un fichier dont la taille change puis se stabilise
      let callCount = 0;
      RNFS.exists.mockResolvedValue(true);
      RNFS.stat.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          isFile: () => true,
          size: callCount <= 2 ? 1000 + callCount * 100 : 1200, // Se stabilise à 1200
          mtime: new Date()
        });
      });

      const result = await waitForFileAvailability("/test/video.mp4", {
        timeoutMs: 1000,
        checkIntervalMs: 10,
        requiredStableChecks: 2
      });

      expect(result).toBe(true);
    }, 10000); // Augmenter le timeout Jest
  });

  describe("isFileAvailable", () => {
    it("should return true for available file", async () => {
      RNFS.exists.mockResolvedValue(true);
      RNFS.stat.mockResolvedValue({
        isFile: () => true,
        size: 1024
      });

      const result = await isFileAvailable("/test/video.mp4");
      expect(result).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      RNFS.exists.mockResolvedValue(false);

      const result = await isFileAvailable("/test/video.mp4");
      expect(result).toBe(false);
    });
  });

  describe("getFileDetails", () => {
    it("should return file details for existing file", async () => {
      const mockTime = new Date();
      RNFS.exists.mockResolvedValue(true);
      RNFS.stat.mockResolvedValue({
        isFile: () => true,
        size: 2048,
        mtime: mockTime
      });

      const details = await getFileDetails("/test/video.mp4");
      expect(details).toEqual({
        exists: true,
        size: 2048,
        isFile: true,
        modificationTime: mockTime.getTime()
      });
    });

    it("should handle file not found", async () => {
      RNFS.exists.mockResolvedValue(false);

      const details = await getFileDetails("/test/video.mp4");
      expect(details).toEqual({
        exists: false
      });
    });
  });

  describe("DEFAULT_FILE_OPTIONS", () => {
    it("should have predefined options for different file types", () => {
      expect(DEFAULT_FILE_OPTIONS.video).toBeDefined();
      expect(DEFAULT_FILE_OPTIONS.image).toBeDefined();
      expect(DEFAULT_FILE_OPTIONS.generic).toBeDefined();

      expect(DEFAULT_FILE_OPTIONS.video.timeoutMs).toBe(10000);
      expect(DEFAULT_FILE_OPTIONS.image.timeoutMs).toBe(3000);
      expect(DEFAULT_FILE_OPTIONS.video.minSizeBytes).toBe(1024);
    });
  });
});
