import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { createLogger } from "../../../utils/optimizedLogger";
import { Project } from "./types";

const logger = createLogger("ProjectsService");

export class ProjectsService {
  /**
   * Créer un nouveau projet
   */
  async createProject(
    projectData: Omit<
      Project,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "progress"
      | "tasks"
      | "events"
      | "goals"
    >
  ): Promise<string> {
    try {
      const now = new Date().toISOString();
      const project: Omit<Project, "id"> = {
        ...projectData,
        progress: 0,
        tasks: [],
        events: [],
        goals: [],
        startDate: new Date(projectData.startDate),
        endDate: new Date(projectData.endDate),
        createdAt: now,
        updatedAt: now,
      };

      const db = getFirestore(getApp());
      const docRef = await addDoc(collection(db, "projects"), {
        ...project,
        startDate: Timestamp.fromDate(project.startDate),
        endDate: Timestamp.fromDate(project.endDate),
      });

      logger.info("Projet créé", { projectId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error("Erreur création projet", error);
      throw error;
    }
  }

  /**
   * Récupérer tous les projets d'un utilisateur
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(
          collection(db, "projects"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        )
      );

      return snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
          startDate:
            doc.data().startDate?.toDate?.() || new Date(doc.data().startDate),
          endDate:
            doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
        })
      ) as Project[];
    } catch (error) {
      logger.error("Erreur récupération projets", error);
      throw error;
    }
  }

  /**
   * Récupérer les projets actifs d'un utilisateur
   */
  async getActiveProjects(userId: string): Promise<Project[]> {
    try {
      const now = new Date();
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(
          collection(db, "projects"),
          where("userId", "==", userId),
          where("status", "==", "active"),
          where("endDate", ">=", now),
          orderBy("endDate")
        )
      );

      return snapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
          startDate:
            doc.data().startDate?.toDate?.() || new Date(doc.data().startDate),
          endDate:
            doc.data().endDate?.toDate?.() || new Date(doc.data().endDate),
        })
      ) as Project[];
    } catch (error) {
      logger.error("Erreur récupération projets actifs", error);
      throw error;
    }
  }
}

export const projectsService = new ProjectsService();
