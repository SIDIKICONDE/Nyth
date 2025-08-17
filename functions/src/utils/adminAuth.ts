import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const assertSuperAdmin = async (uid: string): Promise<void> => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
  }

  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "super_admin") {
    await serverLogAdminAccess(uid, "assert_super_admin", false, {
      reason: !snap.exists ? "USER_NOT_FOUND" : `ROLE=${snap.data()?.role}`,
    });
    throw new HttpsError(
      "permission-denied",
      "Super Admin requis pour cette opération"
    );
  }
};

export const serverLogAdminAccess = async (
  uid: string,
  action: string,
  success: boolean,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    await db.collection("admin_access_logs").add({
      uid,
      action,
      success,
      details: details || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to log admin access:", e);
  }
};
