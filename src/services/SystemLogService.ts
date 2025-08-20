import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";

export type LogLevel = "info" | "warning" | "error" | "critical";
export type LogCategory =
  | "auth"
  | "admin"
  | "user"
  | "system"
  | "security"
  | "performance"
  | "support";

interface LogEntry {
  timestamp: any;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
}

class SystemLogService {
  private readonly COLLECTION_NAME = "system_logs";

  async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const user = getAuth().currentUser;
      const logEntry: LogEntry = {
        timestamp: serverTimestamp(),
        level,
        category,
        message,
        userId: user?.uid,
        userEmail: user?.email || undefined,
        metadata,
      };

      const db = getFirestore(getApp());
      await addDoc(collection(db, this.COLLECTION_NAME), logEntry);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du log:", error);
    }
  }

  info(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.log("info", category, message, metadata);
  }

  warning(
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.log("warning", category, message, metadata);
  }

  error(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log("error", category, message, {
      ...metadata,
      error: error?.message,
      stackTrace: error?.stack,
    });
  }

  critical(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.log("critical", category, message, {
      ...metadata,
      error: error?.message,
      stackTrace: error?.stack,
    });
  }
}

export const systemLog = new SystemLogService();
export default SystemLogService;
