import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import DeviceInfo from "react-native-device-info";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { systemLog } from "./SystemLogService";

export interface BannedDevice {
  id: string;
  deviceId: string;
  deviceFingerprint: string;
  userId?: string;
  userEmail?: string;
  reason: string;
  severity: "warning" | "temporary" | "permanent";
  bannedAt: Timestamp;
  bannedBy: string;
  bannedByEmail: string;
  expiresAt?: Timestamp;
  deviceInfo: {
    brand: string;
    model: string;
    systemName: string;
    systemVersion: string;
    uniqueId: string;
    androidId?: string;
    ipAddress?: string;
    macAddress?: string;
  };
  violationHistory: string[];
  notes?: string;
  appealStatus?: "none" | "pending" | "rejected" | "approved";
  appealMessage?: string;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  platform: string;
  lastSeen: Timestamp;
  firstSeen: Timestamp;
  trustScore: number;
  isVerified: boolean;
  deviceInfo: any;
}

class BanService {
  private db = getFirestore(getApp());
  private deviceId: string | null = null;
  private deviceFingerprint: string | null = null;

  /**
   * Initialise le service et récupère l'ID du device
   */
  async initialize(): Promise<void> {
    try {
      // Récupérer l'ID unique du device
      this.deviceId = await this.getDeviceId();
      this.deviceFingerprint = await this.generateDeviceFingerprint();

      // Vérifier si le device est banni au démarrage
      const isBanned = await this.isDeviceBanned();
      if (isBanned) {
        // Logger et potentiellement forcer la déconnexion
        systemLog.critical(
          "security",
          "Tentative d'accès depuis un device banni",
          undefined,
          {
            deviceId: this.deviceId,
            fingerprint: this.deviceFingerprint,
          }
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du BanService:", error);
    }
  }

  /**
   * Récupère l'ID unique du device
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = "";

      // Récupérer plusieurs identifiants pour créer un ID composite
      const uniqueId = await DeviceInfo.getUniqueId();

      if (Platform.OS === "android") {
        const androidId = await DeviceInfo.getAndroidId();
        deviceId = `${uniqueId}_${androidId}`;
      } else if (Platform.OS === "ios") {
        // Sur iOS, utiliser l'identifiant pour les vendeurs
        deviceId = uniqueId;
      }

      // Sauvegarder localement pour persistance
      await AsyncStorage.setItem("@device_id", deviceId);

      return deviceId;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'ID du device:", error);

      // Fallback : récupérer depuis le stockage local
      const storedId = await AsyncStorage.getItem("@device_id");
      if (storedId) return storedId;

      // Dernier recours : générer un ID aléatoire
      const randomId = `device_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await AsyncStorage.setItem("@device_id", randomId);
      return randomId;
    }
  }

  /**
   * Génère une empreinte unique du device
   */
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const components: string[] = [];

      // Collecter diverses informations du device
      components.push(await DeviceInfo.getBrand());
      components.push(await DeviceInfo.getModel());
      components.push(await DeviceInfo.getSystemName());
      components.push(await DeviceInfo.getSystemVersion());
      components.push(await DeviceInfo.getBuildNumber());
      components.push(await DeviceInfo.getBundleId());

      if (Platform.OS === "android") {
        components.push(await DeviceInfo.getAndroidId());
        components.push(await DeviceInfo.getApiLevel().toString());
      }

      // Créer un hash de toutes les composantes
      const fingerprint = components.join("_");
      return this.hashString(fingerprint);
    } catch (error) {
      console.error("Erreur lors de la génération du fingerprint:", error);
      return this.deviceId || "unknown";
    }
  }

  /**
   * Hash une chaîne pour créer une empreinte
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Enregistre le device de l'utilisateur actuel
   */
  async registerUserDevice(): Promise<void> {
    try {
      const user = getAuth().currentUser;
      if (!user || !this.deviceId) return;

      const deviceInfo = {
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemName: await DeviceInfo.getSystemName(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        uniqueId: await DeviceInfo.getUniqueId(),
        androidId:
          Platform.OS === "android"
            ? await DeviceInfo.getAndroidId()
            : undefined,
        ipAddress: await DeviceInfo.getIpAddress(),
        macAddress: await DeviceInfo.getMacAddress(),
      };

      const userDevice: Partial<UserDevice> = {
        userId: user.uid,
        deviceId: this.deviceId,
        deviceFingerprint: this.deviceFingerprint || "",
        deviceName: `${deviceInfo.brand} ${deviceInfo.model}`,
        platform: Platform.OS,
        lastSeen: Timestamp.now(),
        firstSeen: Timestamp.now(),
        trustScore: 100,
        isVerified: false,
        deviceInfo,
      };

      // Vérifier si le device existe déjà
      const deviceDoc = await getDoc(
        doc(this.db, "user_devices", `${user.uid}_${this.deviceId}`)
      );

      if (deviceDoc.exists()) {
        // Mettre à jour lastSeen
        await updateDoc(deviceDoc.ref, {
          lastSeen: Timestamp.now(),
        });
      } else {
        // Créer un nouveau document
        await setDoc(
          doc(this.db, "user_devices", `${user.uid}_${this.deviceId}`),
          userDevice
        );
      }

      // Enregistrer aussi dans le profil utilisateur
      await updateDoc(doc(this.db, "users", user.uid), {
        lastDeviceId: this.deviceId,
        lastDeviceFingerprint: this.deviceFingerprint,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du device:", error);
    }
  }

  /**
   * Vérifie si le device actuel est banni
   */
  async isDeviceBanned(): Promise<boolean> {
    try {
      if (!this.deviceId) return false;

      // Vérifier par device ID
      const banQuery = query(
        collection(this.db, "banned_devices"),
        where("deviceId", "==", this.deviceId),
        where("severity", "in", ["temporary", "permanent"])
      );

      const snapshot = await getDocs(banQuery);

      if (!snapshot.empty) {
        const ban = snapshot.docs[0].data() as BannedDevice;

        // Vérifier si le ban temporaire a expiré
        if (ban.severity === "temporary" && ban.expiresAt) {
          const now = new Date();
          const expiresAt = ban.expiresAt.toDate();

          if (now > expiresAt) {
            // Le ban a expiré, le supprimer
            await deleteDoc(snapshot.docs[0].ref);
            return false;
          }
        }

        return true;
      }

      // Vérifier aussi par fingerprint
      if (this.deviceFingerprint) {
        const fingerprintQuery = query(
          collection(this.db, "banned_devices"),
          where("deviceFingerprint", "==", this.deviceFingerprint),
          where("severity", "in", ["temporary", "permanent"])
        );

        const fingerprintSnapshot = await getDocs(fingerprintQuery);
        return !fingerprintSnapshot.empty;
      }

      return false;
    } catch (error) {
      console.error("Erreur lors de la vérification du ban:", error);
      return false;
    }
  }

  /**
   * Bannir un device
   */
  async banDevice(
    targetUserId: string,
    reason: string,
    severity: "warning" | "temporary" | "permanent",
    duration?: number, // en jours pour les bans temporaires
    notes?: string
  ): Promise<boolean> {
    try {
      const admin = getAuth().currentUser;
      if (!admin) throw new Error("Admin non authentifié");

      // Récupérer les informations du device de l'utilisateur cible
      const userDoc = await getDoc(doc(this.db, "users", targetUserId));
      if (!userDoc.exists) throw new Error("Utilisateur non trouvé");

      const userData = userDoc.data() as {
        lastDeviceId?: string;
        lastDeviceFingerprint?: string;
        email?: string;
        violationHistory?: string[];
      };
      const targetDeviceId = userData.lastDeviceId;
      const targetFingerprint = userData.lastDeviceFingerprint;

      if (!targetDeviceId) {
        throw new Error("Aucun device associé à cet utilisateur");
      }

      // Récupérer les infos du device
      const deviceQuery = query(
        collection(this.db, "user_devices"),
        where("userId", "==", targetUserId),
        where("deviceId", "==", targetDeviceId)
      );

      const deviceSnapshot = await getDocs(deviceQuery);
      const deviceData = deviceSnapshot.empty
        ? {}
        : deviceSnapshot.docs[0].data();

      // Créer l'entrée de bannissement
      const banData: Partial<BannedDevice> = {
        deviceId: targetDeviceId,
        deviceFingerprint: targetFingerprint || "",
        userId: targetUserId,
        userEmail: userData.email,
        reason,
        severity,
        bannedAt: Timestamp.now(),
        bannedBy: admin.uid,
        bannedByEmail: admin.email || "",
        deviceInfo: deviceData.deviceInfo || {},
        violationHistory: userData.violationHistory || [reason],
        notes,
        appealStatus: "none",
      };

      // Ajouter la date d'expiration pour les bans temporaires
      if (severity === "temporary" && duration) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
        banData.expiresAt = Timestamp.fromDate(expiresAt);
      }

      // Sauvegarder le ban
      await setDoc(
        doc(this.db, "banned_devices", `${targetDeviceId}_${Date.now()}`),
        banData
      );

      // Mettre à jour le statut de l'utilisateur
      await updateDoc(doc(this.db, "users", targetUserId), {
        isBanned: true,
        banSeverity: severity,
        banReason: reason,
        bannedAt: serverTimestamp(),
        violationHistory: [...(userData.violationHistory || []), reason],
      });

      // Logger l'action
      systemLog.info("admin", `Ban device - ${severity}`, {
        reason,
        severity,
        duration,
        deviceId: targetDeviceId,
      });

      return true;
    } catch (error) {
      console.error("Erreur lors du bannissement:", error);
      systemLog.error("admin", "Erreur lors du bannissement", error as Error);
      return false;
    }
  }

  /**
   * Débannir un device
   */
  async unbanDevice(deviceId: string): Promise<boolean> {
    try {
      const admin = getAuth().currentUser;
      if (!admin) throw new Error("Admin non authentifié");

      // Trouver et supprimer le ban
      const banQuery = query(
        collection(this.db, "banned_devices"),
        where("deviceId", "==", deviceId)
      );

      const snapshot = await getDocs(banQuery);

      for (const banDoc of snapshot.docs) {
        const banData = banDoc.data() as BannedDevice;

        // Supprimer le ban
        await deleteDoc(banDoc.ref);

        // Mettre à jour l'utilisateur si associé
        if (banData.userId) {
          await updateDoc(doc(this.db, "users", banData.userId), {
            isBanned: false,
            banSeverity: null,
            banReason: null,
            bannedAt: null,
          });
        }
      }

      // Logger l'action
      systemLog.info("admin", "Unban device", { deviceId });

      return true;
    } catch (error) {
      console.error("Erreur lors du débannissement:", error);
      return false;
    }
  }

  /**
   * Récupérer la liste des devices bannis
   */
  async getBannedDevices(): Promise<BannedDevice[]> {
    try {
      const banQuery = query(
        collection(this.db, "banned_devices"),
        orderBy("bannedAt", "desc")
      );

      const snapshot = await getDocs(banQuery);
      return snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as BannedDevice)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des bans:", error);
      return [];
    }
  }

  /**
   * Récupérer tous les devices d'un utilisateur
   */
  async getUserDevices(userId: string): Promise<UserDevice[]> {
    try {
      const deviceQuery = query(
        collection(this.db, "user_devices"),
        where("userId", "==", userId),
        orderBy("lastSeen", "desc")
      );

      const snapshot = await getDocs(deviceQuery);
      return snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as UserDevice)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des devices:", error);
      return [];
    }
  }

  /**
   * Faire appel d'un ban
   */
  async appealBan(message: string): Promise<boolean> {
    try {
      if (!this.deviceId) return false;

      const banQuery = query(
        collection(this.db, "banned_devices"),
        where("deviceId", "==", this.deviceId)
      );

      const snapshot = await getDocs(banQuery);

      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          appealStatus: "pending",
          appealMessage: message,
          appealDate: serverTimestamp(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erreur lors de l'appel:", error);
      return false;
    }
  }

  /**
   * Obtenir l'ID du device actuel
   */
  getCurrentDeviceId(): string | null {
    return this.deviceId;
  }

  /**
   * Obtenir le fingerprint du device actuel
   */
  getCurrentDeviceFingerprint(): string | null {
    return this.deviceFingerprint;
  }
}

// Export d'une instance unique
export const banService = new BanService();
export default BanService;
