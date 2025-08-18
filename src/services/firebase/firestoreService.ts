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
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

const logger = createLogger("FirestoreService");

type WhereFilter = {
  type: "where";
  field: string;
  operator: FirebaseFirestoreTypes.WhereFilterOp;
  value: unknown;
};

type OrderByFilter = {
  type: "orderBy";
  field: string;
  direction?: "asc" | "desc";
};

type LimitFilter = {
  type: "limit";
  count: number;
};

type QueryFilter = WhereFilter | OrderByFilter | LimitFilter;

class FirestoreService {
  // Créer un document
  async createDocument<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    documentId: string,
    data: T
  ): Promise<string> {
    try {
      logger.info(`📝 Création document dans ${collectionName}:`, documentId);
      const db = getFirestore(getApp());
      await setDoc(
        doc(collection(db, collectionName), documentId),
        {
          ...(data as FirebaseFirestoreTypes.DocumentData),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      logger.info("✅ Document créé avec succès");
      return documentId;
    } catch (error) {
      logger.error("❌ Erreur lors de la création du document:", error);
      throw error;
    }
  }

  // Lire un document
  async getDocument<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    documentId: string
  ): Promise<(T & { id: string }) | null> {
    try {
      logger.info(`📖 Lecture document ${collectionName}/${documentId}`);
      const db = getFirestore(getApp());
      const docSnap = await getDoc(
        doc(collection(db, collectionName), documentId)
      );

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          return { id: docSnap.id, ...(data as T) };
        }
        logger.warn("⚠️ Document sans données");
        return null;
      }
      logger.warn("⚠️ Document non trouvé");
      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la lecture du document:", error);
      throw error;
    }
  }

  // Mettre à jour un document
  async updateDocument<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    documentId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      logger.info(`✏️ Mise à jour document ${collectionName}/${documentId}`);
      const db = getFirestore(getApp());
      await updateDoc(
        doc(collection(db, collectionName), documentId),
        {
          ...(data as FirebaseFirestoreTypes.DocumentData),
          updatedAt: serverTimestamp(),
        }
      );
      logger.info("✅ Document mis à jour avec succès");
    } catch (error) {
      logger.error("❌ Erreur lors de la mise à jour du document:", error);
      throw error;
    }
  }

  // Supprimer un document
  async deleteDocument(collectionName: string, documentId: string): Promise<void> {
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
  async queryCollection<T extends FirebaseFirestoreTypes.DocumentData>(
    collectionName: string,
    filters: ReadonlyArray<QueryFilter> = []
  ): Promise<Array<T & { id: string }>> {
    try {
      logger.info(`🔍 Requête collection ${collectionName}`);
      const db = getFirestore(getApp());
      let q: FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData> = buildQuery(
        collection(db, collectionName)
      );

      // Appliquer les filtres
      filters.forEach((filter) => {
        switch (filter.type) {
          case "where":
            q = buildQuery(
              q,
              queryWhere(filter.field, filter.operator, filter.value as FirebaseFirestoreTypes.WhereFilterOp)
            );
            break;
          case "orderBy":
            q = buildQuery(
              q,
              queryOrderBy(filter.field, filter.direction ?? "asc")
            );
            break;
          case "limit":
            q = buildQuery(q, queryLimit(filter.count));
            break;
        }
      });

      // getDocs accepte directement la requête composée
      const { getDocs } = await import("@react-native-firebase/firestore");
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as T),
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
    where: (
      field: string,
      operator: FirebaseFirestoreTypes.WhereFilterOp,
      value: unknown
    ): WhereFilter => ({ type: "where", field, operator, value }),
    orderBy: (
      field: string,
      direction?: "asc" | "desc"
    ): OrderByFilter => ({ type: "orderBy", field, direction }),
    limit: (count: number): LimitFilter => ({ type: "limit", count }),
  } as const;

  // Convertir Timestamp en Date (pour compatibilité)
  timestampToDate(
    timestamp:
      | FirebaseFirestoreTypes.Timestamp
      | number
      | string
      | Date
  ): Date {
    const ts = timestamp as FirebaseFirestoreTypes.Timestamp & {
      toDate?: () => Date;
    };
    if (ts && typeof ts.toDate === "function") {
      return ts.toDate();
    }
    return new Date(timestamp as number | string | Date);
  }
}

export default new FirestoreService();
