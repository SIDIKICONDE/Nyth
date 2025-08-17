import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { db } from "../../../config/firebase";
import { Script } from "../../../types";
import { ScriptData } from "./types";

// Utilitaire pour retirer récursivement les valeurs undefined
const removeUndefinedDeep = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input
      .map((value) => removeUndefinedDeep(value))
      .filter((value) => value !== undefined) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      const sanitized = removeUndefinedDeep(value as unknown);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result as unknown as T;
  }
  return input;
};

export class ScriptsService {
  async saveScript(
    userId: string,
    script: Omit<Script, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const scriptData: Omit<ScriptData, "id"> = {
        userId,
        title: script.title,
        content: script.content,
        isFavorite: script.isFavorite || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const db = getFirestore(getApp());
      const docRef = doc(collection(db, "scripts"));
      await setDoc(docRef, scriptData);

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getScripts(userId: string): Promise<Script[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, "scripts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = doc.data();

          // Gérer les différents formats de date
          let createdAt: Date;
          let updatedAt: Date;

          // Si c'est un timestamp Firebase
          if (data.createdAt && typeof data.createdAt.toDate === "function") {
            createdAt = data.createdAt.toDate();
          }
          // Si c'est une chaîne ISO
          else if (data.createdAt && typeof data.createdAt === "string") {
            createdAt = new Date(data.createdAt);
          }
          // Sinon, utiliser la date actuelle
          else {
            createdAt = new Date();
          }

          // Même logique pour updatedAt
          if (data.updatedAt && typeof data.updatedAt.toDate === "function") {
            updatedAt = data.updatedAt.toDate();
          } else if (data.updatedAt && typeof data.updatedAt === "string") {
            updatedAt = new Date(data.updatedAt);
          } else {
            updatedAt = new Date();
          }

          return {
            id: doc.id,
            title: data.title || "",
            content: data.content || "",
            isFavorite: data.isFavorite || false,
            userId: data.userId,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          } as Script;
        }
      );
    } catch (error) {
      return [];
    }
  }

  async updateScript(scriptId: string, updates: Partial<Script>) {
    try {
      const db = getFirestore(getApp());
      const docRef = doc(collection(db, "scripts"), scriptId);
      const {
        id: _omitId,
        createdAt: _omitCreatedAt,
        updatedAt: _omitUpdatedAt,
        ...rest
      } = updates;
      const sanitized = removeUndefinedDeep(rest);
      await setDoc(
        docRef,
        { ...sanitized, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteScript(scriptId: string, userId?: string) {
    try {
      const db = getFirestore(getApp());
      const scriptRef = doc(collection(db, "scripts"), scriptId);

      // Utilisation d'une transaction pour une suppression robuste
      await runTransaction(getFirestore(getApp()), async (transaction) => {
        const scriptDoc = await transaction.get(scriptRef);

        if (!scriptDoc.exists) {
          throw new Error("Script introuvable");
        }

        const scriptData = scriptDoc.data();
        if (!scriptData) {
          throw new Error("Données du script introuvables");
        }

        // Vérification des permissions à l'intérieur de la transaction
        if (userId && scriptData.userId !== userId) {
          throw new Error(
            "Vous n'avez pas les permissions pour supprimer ce script"
          );
        }

        transaction.delete(scriptRef);
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === "permission-denied") {
        } else if (firebaseError.code === "not-found") {
        } else if (firebaseError.code === "unauthenticated") {
        }
      }

      throw error;
    }
  }
}
