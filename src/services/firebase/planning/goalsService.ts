import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../../utils/optimizedLogger";
import { Goal } from "./types";

const logger = createLogger("GoalsService");

export class GoalsService {
  /**
   * Créer un nouvel objectif
   */
  async createGoal(
    goalData: Omit<Goal, "id" | "createdAt" | "updatedAt" | "progress">
  ): Promise<string> {
    try {
      const db = getFirestore(getApp());
      const now = Timestamp.now();
      const goal: Omit<Goal, "id"> = {
        ...goalData,
        progress: 0,
        startDate: new Date(goalData.startDate),
        endDate: new Date(goalData.endDate),
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };

      const docRef = await addDoc(collection(db, "planningGoals"), {
        ...goal,
        startDate: Timestamp.fromDate(goal.startDate),
        endDate: Timestamp.fromDate(goal.endDate),
        createdAt: now,
        updatedAt: now,
      });

      logger.info("Objectif créé", { goalId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error("Erreur création objectif", error);
      throw error;
    }
  }

  /**
   * Récupérer tous les objectifs d'un utilisateur
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, "planningGoals"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      const goals = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: d.id,
          ...(d.data() as Omit<Goal, "id">),
          startDate:
            d.data().startDate?.toDate?.() || new Date(d.data().startDate),
          endDate: d.data().endDate?.toDate?.() || new Date(d.data().endDate),
        })
      ) as Goal[];

      // Trier côté client pour éviter un index composite requis
      goals.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      return goals;
    } catch (error) {
      logger.error("Erreur récupération objectifs", error);
      throw error;
    }
  }

  /**
   * Récupérer les objectifs actifs d'un utilisateur
   */
  async getActiveGoals(userId: string): Promise<Goal[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, "planningGoals"),
        where("userId", "==", userId),
        where("status", "==", "active")
      );
      const snapshot = await getDocs(q);

      const now = new Date();
      const goals = snapshot.docs
        .map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: d.id,
          ...(d.data() as Omit<Goal, "id">),
          startDate:
            d.data().startDate?.toDate?.() || new Date(d.data().startDate),
          endDate: d.data().endDate?.toDate?.() || new Date(d.data().endDate),
        }))
        .filter((g: { endDate: Date }) => new Date(g.endDate) >= now) as Goal[];

      // Tri optionnel par endDate croissant
      goals.sort(
        (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      );

      return goals;
    } catch (error) {
      logger.error("Erreur récupération objectifs actifs", error);
      throw error;
    }
  }

  /**
   * Récupérer un objectif par ID
   */
  async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      const db = getFirestore(getApp());
      const snap = await getDoc(doc(collection(db, "planningGoals"), goalId));

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data()! as Omit<Goal, "id">;
      return {
        id: snap.id,
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      } as Goal;
    } catch (error) {
      logger.error("Erreur récupération objectif", error);
      throw error;
    }
  }

  /**
   * Mettre à jour un objectif
   */
  async updateGoal(
    goalId: string,
    updates: Partial<Omit<Goal, "id" | "createdAt">>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Convertir les dates en Timestamp si présentes
      if (updates.startDate) {
        updateData.startDate = Timestamp.fromDate(new Date(updates.startDate));
      }
      if (updates.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
      }

      const db = getFirestore(getApp());
      await updateDoc(doc(collection(db, "planningGoals"), goalId), updateData);
      logger.info("Objectif mis à jour", { goalId });
    } catch (error) {
      logger.error("Erreur mise à jour objectif", error);
      throw error;
    }
  }

  /**
   * Mettre à jour le progrès d'un objectif
   */
  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    try {
      const validProgress = Math.max(0, Math.min(100, progress));
      const status = validProgress === 100 ? "completed" : "active";

      const db = getFirestore(getApp());
      await updateDoc(doc(collection(db, "planningGoals"), goalId), {
        progress: validProgress,
        status,
        updatedAt: Timestamp.now(),
        ...(validProgress === 100 && {
          completedAt: Timestamp.now(),
        }),
      });

      logger.info("Progrès objectif mis à jour", {
        goalId,
        progress: validProgress,
      });
    } catch (error) {
      logger.error("Erreur mise à jour progrès", error);
      throw error;
    }
  }

  /**
   * Archiver un objectif
   */
  async archiveGoal(goalId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(collection(db, "planningGoals"), goalId), {
        status: "archived",
        updatedAt: Timestamp.now(),
      });
      logger.info("Objectif archivé", { goalId });
    } catch (error) {
      logger.error("Erreur archivage objectif", error);
      throw error;
    }
  }

  /**
   * Supprimer définitivement un objectif
   */
  async deleteGoal(goalId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await deleteDoc(doc(collection(db, "planningGoals"), goalId));
      logger.info("Objectif supprimé", { goalId });
    } catch (error) {
      logger.error("Erreur suppression objectif", error);
      throw error;
    }
  }

  /**
   * Écouter les objectifs d'un utilisateur en temps réel
   */
  subscribeToUserGoals(
    userId: string,
    callback: (goals: Goal[]) => void
  ): () => void {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, "planningGoals"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const goals = snapshot.docs.map(
            (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
              id: doc.id,
              ...doc.data(),
              startDate:
                doc.data().startDate?.toDate?.() ||
                new Date(doc.data().startDate),
              endDate:
                doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
            })
          ) as Goal[];
          callback(goals);
        },
        (error) => {
          logger.error("Erreur écoute objectifs", error);
        }
      );

      return unsubscribe;
    } catch (error) {
      logger.error("Erreur configuration écoute objectifs", error);
      return () => {};
    }
  }

  /**
   * Récupérer les statistiques des objectifs d'un utilisateur
   */
  async getGoalStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    overdue: number;
    averageProgress: number;
  }> {
    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(collection(db, "planningGoals"), where("userId", "==", userId))
      );

      const goals = snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          ...doc.data(),
          endDate:
            doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
        })
      ) as Goal[];

      const now = new Date();
      const stats = {
        total: goals.length,
        active: goals.filter((g) => g.status === "active").length,
        completed: goals.filter((g) => g.status === "completed").length,
        overdue: goals.filter(
          (g) => g.status === "active" && new Date(g.endDate) < now
        ).length,
        averageProgress:
          goals.length > 0
            ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) /
              goals.length
            : 0,
      };

      return stats;
    } catch (error) {
      logger.error("Erreur calcul statistiques objectifs", error);
      throw error;
    }
  }
}

export const goalsService = new GoalsService();
