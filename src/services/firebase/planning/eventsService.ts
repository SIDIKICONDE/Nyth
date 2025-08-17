import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from "@react-native-firebase/firestore";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { PlanningEvent, EventFilter } from "../../../types/planning";
import { createLogger } from "../../../utils/optimizedLogger";

const logger = createLogger("EventsService");

const isFirestoreTimestamp = (value: unknown): boolean => {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return (
      typeof v["toDate"] === "function" && typeof v["toMillis"] === "function"
    );
  }
  return false;
};

const removeUndefinedDeep = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input
      .map((value) => removeUndefinedDeep(value))
      .filter((value) => value !== undefined) as unknown as T;
  }
  if (input !== null && typeof input === "object") {
    if (input instanceof Timestamp) {
      return input as unknown as T;
    }
    if (isFirestoreTimestamp(input)) {
      return input as unknown as T;
    }
    const result: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      const sanitized = removeUndefinedDeep(value as unknown);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result as unknown as T;
  }
  return input as unknown as T;
};

class EventsService {
  /**
   * Créer un nouvel événement
   */
  async createEvent(event: Omit<PlanningEvent, "id">): Promise<string> {
    try {
      const db = getFirestore(getApp());

      const normalized = {
        ...event,
        status: (event as PlanningEvent).status ?? "planned",
        priority: (event as PlanningEvent).priority ?? "medium",
        reminders: Array.isArray((event as PlanningEvent).reminders)
          ? (event as PlanningEvent).reminders
          : [],
        tags: Array.isArray((event as PlanningEvent).tags)
          ? (event as PlanningEvent).tags
          : [],
      } as Omit<PlanningEvent, "id">;

      const firestoreEvent = removeUndefinedDeep({
        ...normalized,
        startDate: Timestamp.fromDate(new Date(event.startDate)),
        endDate: Timestamp.fromDate(new Date(event.endDate)),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const docRef = await addDoc(
        collection(db, "planningEvents"),
        firestoreEvent
      );
      logger.info("✅ Événement créé:", docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error("❌ Erreur création événement:", error);
      throw error;
    }
  }

  /**
   * Récupérer les événements d'un utilisateur
   */
  async getUserEvents(
    userId: string,
    filter?: EventFilter
  ): Promise<PlanningEvent[]> {
    try {
      const db = getFirestore(getApp());
      const base = query(
        collection(db, "planningEvents"),
        where("userId", "==", userId)
      );

      // IMPORTANT: Firestore n'autorise les inégalités (<, <=, >, >=) que sur UN seul champ.
      // Pour éviter l'index composite manquant et respecter la contrainte,
      // on filtre uniquement sur "startDate" côté Firestore et on affine côté JS si besoin.
      let q = base;
      const hasStart = Boolean(filter?.startDate);
      const hasEnd = Boolean(filter?.endDate);

      if (hasStart || hasEnd) {
        if (hasStart) {
          q = query(q, where("startDate", ">=", filter!.startDate!));
        }
        if (hasEnd) {
          // borne supérieure sur le même champ
          q = query(q, where("startDate", "<=", filter!.endDate!));
        }
        // Optimiser le scan et satisfaire les index existants
        q = query(q, orderBy("startDate", "asc"));
      }

      const snapshot = await getDocs(q);
      let events: PlanningEvent[] = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            startDate: data.startDate?.toDate?.() || new Date(data.startDate),
            endDate: data.endDate?.toDate?.() || new Date(data.endDate),
          } as PlanningEvent;
        }
      );

      // Affiner côté client si une véritable contrainte sur endDate est demandée
      if (hasEnd) {
        const end = new Date(filter!.endDate!);
        events = events.filter((e) => new Date(e.startDate) <= end);
      }

      logger.info("✅ Événements récupérés:", events.length);
      return events;
    } catch (error) {
      logger.error("❌ Erreur récupération événements:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour un événement
   */
  async updateEvent(
    eventId: string,
    updates: Partial<PlanningEvent>
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());

      const firestoreUpdates: {
        [key: string]:
          | FirebaseFirestoreTypes.FieldValue
          | Partial<unknown>
          | undefined;
      } = removeUndefinedDeep({
        ...updates,
        updatedAt: Timestamp.now(),
      });

      if (updates.startDate) {
        firestoreUpdates.startDate = Timestamp.fromDate(
          new Date(updates.startDate)
        );
      }

      if (updates.endDate) {
        firestoreUpdates.endDate = Timestamp.fromDate(
          new Date(updates.endDate)
        );
      }

      await updateDoc(
        doc(collection(db, "planningEvents"), eventId),
        firestoreUpdates
      );
      logger.info("✅ Événement mis à jour:", eventId);
    } catch (error) {
      logger.error("❌ Erreur mise à jour événement:", error);
      throw error;
    }
  }

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await deleteDoc(doc(collection(db, "planningEvents"), eventId));
      logger.info("✅ Événement supprimé:", eventId);
    } catch (error) {
      logger.error("❌ Erreur suppression événement:", error);
      throw error;
    }
  }

  /**
   * Écouter les changements d'événements
   */
  onEventsChange(
    userId: string,
    callback: (events: PlanningEvent[]) => void
  ): () => void {
    const db = getFirestore(getApp());
    const q = query(
      collection(db, "planningEvents"),
      where("userId", "==", userId)
    );
    return onSnapshot(q, (snapshot) => {
      const events: PlanningEvent[] = [];
      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate?.() || new Date(data.startDate),
          endDate: data.endDate?.toDate?.() || new Date(data.endDate),
        } as PlanningEvent);
      });
      callback(events);
    });
  }
}

export default new EventsService();
