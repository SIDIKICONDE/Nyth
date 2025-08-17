import { createLogger } from "../../utils/optimizedLogger";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query as buildQuery,
  where as queryWhere,
  orderBy as queryOrderBy,
  limit as queryLimit,
  serverTimestamp,
} from "@react-native-firebase/firestore";

const logger = createLogger("FirestoreService");

class FirestoreService {
  // Créer un document
  async createDocument(collectionName: string, documentId: string, data: any) {
    try {
      logger.info(`📝 Création document dans ${collectionName}:`, documentId);
      const db = getFirestore(getApp());
      await setDoc(doc(collection(db, collectionName), documentId), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logger.info("✅ Document créé avec succès");
      return documentId;
    } catch (error) {
      logger.error("❌ Erreur lors de la création du document:", error);
      throw error;
    }
  }

  // Lire un document
  async getDocument(collectionName: string, documentId: string) {
    try {
      logger.info(`📖 Lecture document ${collectionName}/${documentId}`);
      const db = getFirestore(getApp());
      const docSnap = await getDoc(
        doc(collection(db, collectionName), documentId)
      );

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data()! };
      } else {
        logger.warn("⚠️ Document non trouvé");
        return null;
      }
    } catch (error) {
      logger.error("❌ Erreur lors de la lecture du document:", error);
      throw error;
    }
  }

  // Mettre à jour un document
  async updateDocument(collectionName: string, documentId: string, data: any) {
    try {
      logger.info(`✏️ Mise à jour document ${collectionName}/${documentId}`);
      const db = getFirestore(getApp());
      await updateDoc(doc(collection(db, collectionName), documentId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      logger.info("✅ Document mis à jour avec succès");
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour du document:", error);
      throw error;
    }
  }

  // Supprimer un document
  async deleteDocument(collectionName: string, documentId: string) {
    try {
      logger.info(`🗑️ Suppression document ${collectionName}/${documentId}`);
      const db = getFirestore(getApp());
      await deleteDoc(doc(collection(db, collectionName), documentId));
      logger.info("✅ Document supprimé avec succès");
    } catch (error) {
      logger.error("❌ Erreur lors de la suppression du document:", error);
      throw error;
    }
  }

  // Requête de collection avec filtres
  async queryCollection(collectionName: string, filters: any[] = []) {
    try {
      logger.info(`🔍 Requête collection ${collectionName}`);
      const db = getFirestore(getApp());
      let q: any = collection(db, collectionName);

      // Appliquer les filtres
      filters.forEach((filter) => {
        if (filter.type === "where") {
          q = buildQuery(
            q,
            queryWhere(filter.field, filter.operator, filter.value)
          );
        } else if (filter.type === "orderBy") {
          q = buildQuery(
            q,
            queryOrderBy(filter.field, filter.direction || "asc")
          );
        } else if (filter.type === "limit") {
          q = buildQuery(q, queryLimit(filter.count));
        }
      });

      // getDocs accepte directement la requête composée
      const { getDocs } = await import("@react-native-firebase/firestore");
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      logger.info(`✅ ${documents.length} documents trouvés`);
      return documents;
    } catch (error) {
      logger.error("❌ Erreur lors de la requête:", error);
      throw error;
    }
  }

  // Méthodes utilitaires pour les contraintes de requête
  createConstraints = {
    where: (field: string, operator: any, value: any) => ({
      type: "where",
      field,
      operator,
      value,
    }),
    orderBy: (field: string, direction?: "asc" | "desc") => ({
      type: "orderBy",
      field,
      direction,
    }),
    limit: (count: number) => ({ type: "limit", count }),
  };

  // Convertir Timestamp en Date (pour compatibilité)
  timestampToDate(timestamp: any): Date {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
}

export default new FirestoreService();
