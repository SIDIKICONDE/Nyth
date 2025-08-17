import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { CustomTheme } from "../../types/theme";
import { createLogger } from "../../utils/optimizedLogger";

interface FirestoreCustomTheme {
  id: string;
  name: string;
  isDark?: boolean;
  backgroundColor: string;
  textColor: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  highlightColor?: string;
  surfaceColor?: string;
  cardColor?: string;
  textSecondaryColor?: string;
  textMutedColor?: string;
  borderColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  gradient?: string[];
}

const logger = createLogger("CustomThemesService");

class CustomThemesService {
  private static instance: CustomThemesService;
  private readonly COLLECTION_NAME = "customThemes";

  private constructor() {}

  static getInstance(): CustomThemesService {
    if (!CustomThemesService.instance) {
      CustomThemesService.instance = new CustomThemesService();
    }
    return CustomThemesService.instance;
  }

  async saveTheme(userId: string, theme: CustomTheme): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await setDoc(
        doc(collection(db, this.COLLECTION_NAME), `${userId}_${theme.id}`),
        {
          ...theme,
          userId,
          updatedAt: new Date().toISOString(),
        }
      );

      logger.info(`✅ Thème ${theme.name} synchronisé avec Firestore`);
    } catch (error) {
      logger.error("❌ Erreur lors de la sauvegarde du thème:", error);
      throw error;
    }
  }

  async getThemes(userId: string): Promise<CustomTheme[]> {
    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(
          collection(db, this.COLLECTION_NAME),
          where("userId", "==", userId)
        )
      );
      const themes: CustomTheme[] = [];

      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data();
        themes.push({
          id: data.id,
          name: data.name,
          isDark: data.isDark || false,
          colors: {
            background: data.backgroundColor || "",
            text: data.textColor || "",
            primary: data.primaryColor || data.textColor || "",
            secondary: data.secondaryColor || data.textColor || "",
            accent: data.accentColor || data.highlightColor || "",
            surface: data.surfaceColor || data.backgroundColor || "",
            card: data.cardColor || data.backgroundColor || "",
            textSecondary: data.textSecondaryColor || data.textColor || "",
            textMuted: data.textMutedColor || data.textColor || "",
            border: data.borderColor || data.textColor || "",
            success: data.successColor || "#28a745",
            warning: data.warningColor || "#ffc107",
            error: data.errorColor || "#dc3545",
            gradient: data.gradient || [
              data.backgroundColor || "",
              data.highlightColor || "",
            ],
          },
        });
      });

      logger.info(`✅ ${themes.length} thèmes récupérés depuis Firestore`);
      return themes;
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération des thèmes:", error);
      return [];
    }
  }

  async getTheme(userId: string, themeId: string): Promise<CustomTheme | null> {
    try {
      const db = getFirestore(getApp());
      const docSnap = await getDoc(
        doc(collection(db, this.COLLECTION_NAME), `${userId}_${themeId}`)
      );

      if (docSnap.exists()) {
        const data = docSnap.data() as FirestoreCustomTheme;
        if (!data) return null;

        return {
          id: data.id,
          name: data.name,
          isDark: data.isDark || false,
          colors: {
            background: data.backgroundColor || "",
            text: data.textColor || "",
            primary: data.primaryColor || data.textColor || "",
            secondary: data.secondaryColor || data.textColor || "",
            accent: data.accentColor || data.highlightColor || "",
            surface: data.surfaceColor || data.backgroundColor || "",
            card: data.cardColor || data.backgroundColor || "",
            textSecondary: data.textSecondaryColor || data.textColor || "",
            textMuted: data.textMutedColor || data.textColor || "",
            border: data.borderColor || data.textColor || "",
            success: data.successColor || "#28a745",
            warning: data.warningColor || "#ffc107",
            error: data.errorColor || "#dc3545",
            gradient: data.gradient || [
              data.backgroundColor || "",
              data.highlightColor || "",
            ],
          },
        };
      }

      return null;
    } catch (error) {
      logger.error("❌ Erreur lors de la récupération du thème:", error);
      return null;
    }
  }

  async deleteTheme(userId: string, themeId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      await deleteDoc(
        doc(collection(db, this.COLLECTION_NAME), `${userId}_${themeId}`)
      );

      logger.info(`✅ Thème ${themeId} supprimé de Firestore`);
    } catch (error) {
      logger.error("❌ Erreur lors de la suppression du thème:", error);
      throw error;
    }
  }

  async deleteAllUserThemes(userId: string): Promise<void> {
    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(
        query(
          collection(db, this.COLLECTION_NAME),
          where("userId", "==", userId)
        )
      );

      const deletePromises = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          deleteDoc(doc(collection(db, this.COLLECTION_NAME), d.id))
      );

      await Promise.all(deletePromises);
      logger.info(`✅ Tous les thèmes de l'utilisateur supprimés`);
    } catch (error) {
      logger.error("❌ Erreur lors de la suppression des thèmes:", error);
      throw error;
    }
  }
}

export default CustomThemesService.getInstance();
