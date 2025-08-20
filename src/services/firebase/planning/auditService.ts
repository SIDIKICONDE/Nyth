import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("PlanningAuditService");

export type PlanningAuditAction =
  | "event_create"
  | "event_update"
  | "event_delete"
  | "goal_create"
  | "goal_update"
  | "goal_delete"
  | "export_ics";

export interface PlanningAuditLog {
  userId: string;
  action: PlanningAuditAction;
  resourceId?: string;
  resourceType?: "event" | "goal" | "project";
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class PlanningAuditService {
  async log(entry: Omit<PlanningAuditLog, "createdAt">): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await addDoc(collection(db, "planningAuditLogs"), {
        ...entry,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      logger.error("Audit log error", error);
    }
  }
}

export const planningAuditService = new PlanningAuditService();
