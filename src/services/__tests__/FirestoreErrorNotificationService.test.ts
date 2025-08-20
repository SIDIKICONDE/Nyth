import {
  FirestoreErrorNotificationService,
  FirestoreErrorType,
  FirestoreErrorNotification
} from "../FirestoreErrorNotificationService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Alert
jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn()
  },
  Platform: {
    OS: "ios"
  }
}));

const AsyncStorage = require("@react-native-async-storage/async-storage");
const { Alert } = require("react-native");

describe("FirestoreErrorNotificationService", () => {
  let notificationService: FirestoreErrorNotificationService;

  beforeEach(() => {
    notificationService = FirestoreErrorNotificationService.getInstance();
    // Reset mocks
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
  });

  describe("Basic functionality", () => {
    it("should be a singleton", () => {
      const instance1 = FirestoreErrorNotificationService.getInstance();
      const instance2 = FirestoreErrorNotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize properly", async () => {
      await notificationService.getActiveNotifications();
      expect(notificationService.isInitialized()).toBe(true);
    });
  });

  describe("Error notification", () => {
    it("should notify error and show alert", async () => {
      const testError = new Error("Test Firestore error");

      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        testError,
        { showAlert: true }
      );

      expect(Alert.alert).toHaveBeenCalled();
      const alertCall = Alert.alert.mock.calls[0];
      expect(alertCall[0]).toBe("Synchronisation partielle");
      expect(alertCall[1]).toContain("Test Firestore error");
    });

    it("should persist notification when requested", async () => {
      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error",
        { persistNotification: true }
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("should not show alert when disabled", async () => {
      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error",
        { showAlert: false }
      );

      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe("Notification management", () => {
    it("should dismiss notification", async () => {
      // Create a notification first
      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error"
      );

      const activeNotifications = await notificationService.getActiveNotifications();
      expect(activeNotifications.length).toBe(1);

      const notificationId = activeNotifications[0].id;
      await notificationService.dismissNotification(notificationId);

      const updatedNotifications = await notificationService.getActiveNotifications();
      expect(updatedNotifications.length).toBe(0);
    });

    it("should clear all notifications", async () => {
      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error 1"
      );
      await notificationService.notifyError(
        FirestoreErrorType.SYNC_FAILED,
        "Test error 2"
      );

      let activeNotifications = await notificationService.getActiveNotifications();
      expect(activeNotifications.length).toBe(2);

      await notificationService.clearAllNotifications();

      activeNotifications = await notificationService.getActiveNotifications();
      expect(activeNotifications.length).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith("firestore_error_notifications");
    });
  });

  describe("Default messages", () => {
    it("should provide default title for each error type", () => {
      const instance = notificationService as any;

      expect(instance.getDefaultTitle(FirestoreErrorType.METADATA_SAVE_FAILED)).toBe("Synchronisation partielle");
      expect(instance.getDefaultTitle(FirestoreErrorType.SYNC_FAILED)).toBe("Erreur de synchronisation");
      expect(instance.getDefaultTitle(FirestoreErrorType.BACKUP_FAILED)).toBe("Sauvegarde cloud échouée");
      expect(instance.getDefaultTitle(FirestoreErrorType.CONNECTION_ISSUE)).toBe("Problème de connexion");
    });

    it("should provide default message for each error type", () => {
      const instance = notificationService as any;

      const metadataMessage = instance.getDefaultMessage(FirestoreErrorType.METADATA_SAVE_FAILED, "Test error");
      expect(metadataMessage).toContain("Test error");
      expect(metadataMessage).toContain("synchronisées");

      const syncMessage = instance.getDefaultMessage(FirestoreErrorType.SYNC_FAILED, "Sync error");
      expect(syncMessage).toContain("Sync error");
      expect(syncMessage).toContain("synchronisées automatiquement");
    });
  });

  describe("Notification summary", () => {
    it("should show notification summary", async () => {
      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Error 1"
      );
      await notificationService.notifyError(
        FirestoreErrorType.SYNC_FAILED,
        "Error 2"
      );

      await notificationService.showNotificationSummary();

      expect(Alert.alert).toHaveBeenCalled();
      const alertCall = Alert.alert.mock.calls[0];
      expect(alertCall[0]).toContain("2 problèmes");
      expect(alertCall[1]).toContain("enregistrements n'ont pas pu être synchronisés");
    });
  });

  describe("Utility methods", () => {
    it("should check if there are active notifications", async () => {
      expect(await notificationService.hasActiveNotifications()).toBe(false);

      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error"
      );

      expect(await notificationService.hasActiveNotifications()).toBe(true);
    });

    it("should return notification count", async () => {
      expect(await notificationService.getNotificationCount()).toBe(0);

      await notificationService.notifyError(
        FirestoreErrorType.METADATA_SAVE_FAILED,
        "Test error"
      );

      expect(await notificationService.getNotificationCount()).toBe(1);
    });
  });
});
