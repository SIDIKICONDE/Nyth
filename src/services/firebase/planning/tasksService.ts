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
  getDoc,
  onSnapshot,
  Timestamp,
} from "@react-native-firebase/firestore";
import { Task, Subtask } from "../../../types/planning";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

class TasksService {
  private readonly COLLECTION = "tasks";

  /**
   * Nettoie les données pour supprimer les champs `undefined` qui ne sont pas supportés par Firestore.
   */
  private _cleanData(data: Record<string, any>): Record<string, any> {
    const cleanedData: Record<string, any> = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        cleanedData[key] = data[key];
      }
    }
    return cleanedData;
  }

  /**
   * Convertit les objets Date en Timestamp Firebase
   */
  private _convertDatesToTimestamps(
    data: Record<string, any>
  ): Record<string, any> {
    const convertedData = { ...data };

    // Convertir les dates en Timestamps Firebase
    if (convertedData.dueDate && convertedData.dueDate instanceof Date) {
      convertedData.dueDate = Timestamp.fromDate(convertedData.dueDate);
    }
    if (convertedData.startDate && convertedData.startDate instanceof Date) {
      convertedData.startDate = Timestamp.fromDate(convertedData.startDate);
    }

    return convertedData;
  }

  /**
   * Convertit les Timestamps Firebase en objets Date
   */
  private _convertTimestampsToDates(data: any): any {
    if (!data) return null;

    const convertedData = { ...data };

    // Convertir les Timestamps en Dates
    if (convertedData.dueDate && convertedData.dueDate.toDate) {
      convertedData.dueDate = convertedData.dueDate.toDate();
    }
    if (convertedData.startDate && convertedData.startDate.toDate) {
      convertedData.startDate = convertedData.startDate.toDate();
    }
    if (convertedData.createdAt && convertedData.createdAt.toDate) {
      convertedData.createdAt = convertedData.createdAt.toDate();
    }
    if (convertedData.updatedAt && convertedData.updatedAt.toDate) {
      convertedData.updatedAt = convertedData.updatedAt.toDate();
    }
    if (convertedData.completedAt && convertedData.completedAt.toDate) {
      convertedData.completedAt = convertedData.completedAt.toDate();
    }

    return convertedData;
  }

  /**
   * Créer une nouvelle tâche
   */
  async createTask(
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const db = getFirestore(getApp());
      const now = Timestamp.now();
      const cleanedData = this._cleanData(taskData);
      const taskWithTimestamps = this._convertDatesToTimestamps(cleanedData);

      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...taskWithTimestamps,
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer toutes les tâches d'un utilisateur
   */
  async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = this._convertTimestampsToDates(doc.data());
          return {
            id: doc.id,
            ...data,
          } as Task;
        }
      );

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les tâches par projet
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, this.COLLECTION),
        where("projectId", "==", projectId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = this._convertTimestampsToDates(doc.data());
          return {
            id: doc.id,
            ...data,
          } as Task;
        }
      );

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les tâches en retard
   */
  async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore(getApp());
      const now = new Date();
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        where("status", "!=", "completed"),
        where("dueDate", "<", now),
        orderBy("status"),
        orderBy("dueDate")
      );
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = this._convertTimestampsToDates(doc.data());
          return {
            id: doc.id,
            ...data,
          } as Task;
        }
      );

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);

      const cleanedUpdates = this._cleanData(updates);
      const updatesWithTimestamps =
        this._convertDatesToTimestamps(cleanedUpdates);

      await updateDoc(taskRef, {
        ...updatesWithTimestamps,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: Task["status"]
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);

      const base: {
        status: Task["status"];
        updatedAt: FirebaseFirestoreTypes.Timestamp;
      } = {
        status,
        updatedAt: Timestamp.now(),
      };

      const payload =
        status === "completed"
          ? {
              ...base,
              completedAt: Timestamp.now() as FirebaseFirestoreTypes.Timestamp,
            }
          : base;

      await updateDoc(taskRef, payload);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer une tâche
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await deleteDoc(doc(collection(db, this.COLLECTION), taskId));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les tâches par statut
   */
  async getTasksByStatus(
    userId: string,
    status: Task["status"]
  ): Promise<Task[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const tasks = snapshot.docs.map(
        (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = this._convertTimestampsToDates(docSnap.data());
          return {
            id: docSnap.id,
            ...data,
          } as Task;
        }
      );

      return tasks;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer une tâche par ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const db = getFirestore(getApp());
      const snap = await getDoc(doc(collection(db, this.COLLECTION), taskId));

      if (!snap.exists()) {
        return null;
      }

      const data = this._convertTimestampsToDates(snap.data());
      return {
        id: snap.id,
        ...data,
      } as Task;
    } catch (error) {
      throw error;
    }
  }

  async getTasksWithSubtasks(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = this._convertTimestampsToDates(docSnap.data());
          return {
            id: docSnap.id,
            ...data,
          } as Task;
        }
      );
    } catch (error) {
      throw error;
    }
  }

  async addSubtask(
    taskId: string,
    newSubtask: Pick<
      Subtask,
      "title" | "description" | "status" | "priority" | "order"
    >
  ): Promise<string> {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);
      const snap = await getDoc(taskRef);
      if (!snap.exists()) {
        throw new Error("Task not found");
      }
      const current = (snap.data() as Record<string, unknown>).subtasks as
        | Subtask[]
        | undefined;
      const subtaskId = `subtask-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const toAdd: Subtask = {
        id: subtaskId,
        taskId,
        title: newSubtask.title,
        description: newSubtask.description,
        status: newSubtask.status,
        priority: newSubtask.priority,
        order: newSubtask.order,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const updatedSubtasks = [...(current ?? []), toAdd];
      await updateDoc(taskRef, {
        subtasks: updatedSubtasks,
        updatedAt: Timestamp.now(),
      });
      return subtaskId;
    } catch (error) {
      throw error;
    }
  }

  async updateSubtask(
    taskId: string,
    subtaskId: string,
    updates: Partial<
      Pick<
        Subtask,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "order"
        | "estimatedHours"
        | "completedAt"
      >
    >
  ): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);
      const snap = await getDoc(taskRef);
      if (!snap.exists()) {
        throw new Error("Task not found");
      }
      const data = snap.data() as Record<string, unknown>;
      const current = (data.subtasks as Subtask[] | undefined) ?? [];
      const next = current.map((s) =>
        s.id === subtaskId
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      );
      await updateDoc(taskRef, {
        subtasks: next,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);
      const snap = await getDoc(taskRef);
      if (!snap.exists()) {
        throw new Error("Task not found");
      }
      const data = snap.data() as Record<string, unknown>;
      const current = (data.subtasks as Subtask[] | undefined) ?? [];
      const next = current.filter((s) => s.id !== subtaskId);
      await updateDoc(taskRef, {
        subtasks: next,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Écouter les changements d'une tâche spécifique
   */
  subscribeToTask(
    taskId: string,
    callback: (task: Task | null) => void
  ): () => void {
    try {
      const db = getFirestore(getApp());
      const taskRef = doc(collection(db, this.COLLECTION), taskId);

      return onSnapshot(
        taskRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = this._convertTimestampsToDates(snapshot.data());
            const task = {
              id: snapshot.id,
              ...data,
            } as Task;
            callback(task);
          } else {
            callback(null);
          }
        },
        (error) => {
          callback(null);
        }
      );
    } catch (error) {
      return () => {};
    }
  }

  /**
   * Écouter les tâches d'un utilisateur
   */
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    try {
      const db = getFirestore(getApp());
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.map(
            (docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
              const data = this._convertTimestampsToDates(docSnap.data());
              return {
                id: docSnap.id,
                ...data,
              } as Task;
            }
          );
          callback(tasks);
        },
        (error) => {
          callback([]);
        }
      );
    } catch (error) {
      return () => {};
    }
  }
}

export const tasksService = new TasksService();
export { TasksService };
