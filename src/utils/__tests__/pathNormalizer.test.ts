import { Platform } from "react-native";
import {
  normalizeFilePath,
  toLocalPath,
  toFileUri,
  isValidFileUri,
  getFileName,
  getDirectoryPath
} from "../pathNormalizer";

// Mock de react-native-fs
jest.mock("react-native-fs", () => ({
  exists: jest.fn()
}));

describe("PathNormalizer", () => {
  beforeEach(() => {
    // Mock Android par défaut
    Platform.OS = "android";
  });

  describe("normalizeFilePath", () => {
    it("should handle basic path normalization", async () => {
      const result = await normalizeFilePath("/storage/emulated/0/DCIM/video.mp4");
      expect(result).toBe("/storage/emulated/0/DCIM/video.mp4");
    });

    it("should add file:// prefix on iOS", async () => {
      Platform.OS = "ios";
      const result = await normalizeFilePath("/var/mobile/Containers/video.mp4");
      expect(result).toBe("file:///var/mobile/Containers/video.mp4");
    });

    it("should decode URI components", async () => {
      const result = await normalizeFilePath("/path/video%20with%20spaces.mp4");
      expect(result).toBe("/path/video with spaces.mp4");
    });

    it("should force file:// prefix when requested", async () => {
      const result = await normalizeFilePath("/path/video.mp4", {
        forceFilePrefix: true
      });
      expect(result).toBe("file:///path/video.mp4");
    });
  });

  describe("toLocalPath", () => {
    it("should remove file:// prefix", () => {
      expect(toLocalPath("file:///path/video.mp4")).toBe("/path/video.mp4");
      expect(toLocalPath("/path/video.mp4")).toBe("/path/video.mp4");
    });
  });

  describe("toFileUri", () => {
    it("should add file:// prefix", () => {
      expect(toFileUri("/path/video.mp4")).toBe("file:///path/video.mp4");
      expect(toFileUri("file:///path/video.mp4")).toBe("file:///path/video.mp4");
    });
  });

  describe("isValidFileUri", () => {
    it("should validate file URIs", () => {
      expect(isValidFileUri("file:///path/video.mp4")).toBe(true);
      expect(isValidFileUri("/path/video.mp4")).toBe(true);
      expect(isValidFileUri("http://example.com/video.mp4")).toBe(false);
    });
  });

  describe("getFileName", () => {
    it("should extract filename", () => {
      expect(getFileName("file:///path/video.mp4")).toBe("video.mp4");
      expect(getFileName("/path/video.mp4")).toBe("video.mp4");
      expect(getFileName("video.mp4")).toBe("video.mp4");
    });
  });

  describe("getDirectoryPath", () => {
    it("should extract directory path", () => {
      expect(getDirectoryPath("file:///path/video.mp4")).toBe("/path");
      expect(getDirectoryPath("/path/video.mp4")).toBe("/path");
      expect(getDirectoryPath("video.mp4")).toBe("");
    });
  });
});
