import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Achievement, ACHIEVEMENTS } from "../../types/achievements";

export interface FirebaseAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  xpEarned: number;
  createdAt: any;
  updatedAt: any;
}

class AchievementsService {
  private achievementsCache: Map<string, FirebaseAchievement[]> = new Map();

  /**
   * Initialiser les achievements pour un utilisateur
   */
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      // Vérifier si l'utilisateur a déjà des achievements
      const userAchievements = await this.getUserAchievements(userId);

      if (userAchievements.length === 0) {
        // Créer un document de métadonnées pour l'utilisateur
        const { getFirestore, collection, doc } = await import(
          "@react-native-firebase/firestore"
        );
        const { getApp } = await import("@react-native-firebase/app");
        const metaRef = doc(
          collection(getFirestore(getApp()), "userAchievementsMeta"),
          userId
        );
        await metaRef.set({
          userId,
          totalUnlocked: 0,
          totalXP: 0,
          lastUnlockedAt: null,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {}
  }

  /**
   * Débloquer un achievement
   */
  async unlockAchievement(
    userId: string,
    achievementId: string,
    xpEarned: number
  ): Promise<void> {
    try {
      // Invalider le cache avant de vérifier pour éviter les conditions de course
      this.achievementsCache.delete(userId);

      // Vérifier si déjà débloqué
      const existingAchievements = await this.getUserAchievements(userId);
      const alreadyUnlocked = existingAchievements.some(
        (a) => a.achievementId === achievementId
      );

      if (alreadyUnlocked) {
        return;
      }

      // Créer le document achievement avec un ID déterministe pour éviter les doublons
      const {
        getFirestore: gF1,
        collection: c1,
        doc: d1,
      } = await import("@react-native-firebase/firestore");
      const { getApp: gA1 } = await import("@react-native-firebase/app");
      const achievementRef = d1(
        c1(gF1(gA1()), "achievements"),
        `${userId}_${achievementId}`
      );
      const achievementData: Omit<
        FirebaseAchievement,
        "createdAt" | "updatedAt"
      > = {
        userId,
        achievementId,
        unlockedAt: new Date().toISOString(),
        xpEarned,
      };

      await achievementRef.set({
        ...achievementData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Mettre à jour les métadonnées
      const { getFirestore, collection, doc, getDoc } = await import(
        "@react-native-firebase/firestore"
      );
      const { getApp } = await import("@react-native-firebase/app");
      const metaRef = doc(
        collection(getFirestore(getApp()), "userAchievementsMeta"),
        userId
      );
      const metaDoc = await getDoc(metaRef);

      if (metaDoc.exists()) {
        const currentData = metaDoc.data() as {
          totalUnlocked?: number;
          totalXP?: number;
        };
        await metaRef.update({
          totalUnlocked: (currentData?.totalUnlocked || 0) + 1,
          totalXP: (currentData?.totalXP || 0) + xpEarned,
          lastUnlockedAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Créer les métadonnées si elles n'existent pas
        await metaRef.set({
          userId,
          totalUnlocked: 1,
          totalXP: xpEarned,
          lastUnlockedAt: firestore.FieldValue.serverTimestamp(),
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      // Invalider le cache
      this.achievementsCache.delete(userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer tous les achievements d'un utilisateur
   */
  async getUserAchievements(userId: string): Promise<FirebaseAchievement[]> {
    try {
      // Vérifier le cache d'abord
      if (this.achievementsCache.has(userId)) {
        return this.achievementsCache.get(userId)!;
      }

      const {
        getFirestore: gF2,
        collection: c2,
        query: q2,
        where: w2,
        getDocs: gD2,
      } = await import("@react-native-firebase/firestore");
      const { getApp: gA2 } = await import("@react-native-firebase/app");
      const snapshot = await gD2(
        q2(c2(gF2(gA2()), "achievements"), w2("userId", "==", userId))
      );
      const achievements: FirebaseAchievement[] = [];

      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        achievements.push({
          ...(doc.data() as FirebaseAchievement),
        });
      });

      // Mettre en cache
      this.achievementsCache.set(userId, achievements);

      return achievements;
    } catch (error) {
      return [];
    }
  }

  /**
   * Synchroniser les achievements locaux avec Firebase
   */
  async syncLocalAchievements(
    userId: string,
    localAchievements: Achievement[]
  ): Promise<void> {
    try {
      const firebaseAchievements = await this.getUserAchievements(userId);
      const firebaseAchievementIds = new Set(
        firebaseAchievements.map((a) => a.achievementId)
      );

      // Trouver les achievements débloqués localement mais pas dans Firebase
      const unlockedLocally = localAchievements.filter(
        (a) => a.isUnlocked && !firebaseAchievementIds.has(a.id)
      );

      // Synchroniser chaque achievement manquant
      for (const achievement of unlockedLocally) {
        const xpReward = this.getXPReward(achievement.rarity);
        await this.unlockAchievement(userId, achievement.id, xpReward);
      }
    } catch (error) {}
  }

  /**
   * Calculer les XP selon la rareté
   */
  private getXPReward(rarity: string): number {
    switch (rarity) {
      case "common":
        return 50;
      case "rare":
        return 100;
      case "epic":
        return 200;
      case "legendary":
        return 500;
      default:
        return 50;
    }
  }

  /**
   * Fonction de débogage pour vérifier les achievements
   */
  async debugCheckAchievements(userId: string): Promise<void> {
    try {
      // Vérifier les métadonnées (modulaire)
      const { getFirestore, collection, doc, getDoc } = await import(
        "@react-native-firebase/firestore"
      );
      const { getApp } = await import("@react-native-firebase/app");
      const metaRef = doc(
        collection(getFirestore(getApp()), "userAchievementsMeta"),
        userId
      );
      const metaDoc = await getDoc(metaRef);

      if (metaDoc.exists()) {
        const metaData = metaDoc.data();
      } else {
        await this.initializeUserAchievements(userId);
      }

      // Vérifier les achievements
      const achievements = await this.getUserAchievements(userId);

      if (achievements.length > 0) {
        achievements.forEach((a) => {
          const achievement = ACHIEVEMENTS.find(
            (ach) => ach.id === a.achievementId
          );
        });
      }
    } catch (error) {}
  }

  /**
   * Nettoyer le cache
   */
  clearCache(): void {
    this.achievementsCache.clear();
  }

  /**
   * Nettoyer les doublons d'achievements
   */
  async cleanupDuplicateAchievements(userId: string): Promise<void> {
    try {
      // Vider le cache d'abord
      this.clearCache();

      const {
        getFirestore: gF2,
        collection: c2,
        query: q2,
        where: w2,
        getDocs: gD2,
      } = await import("@react-native-firebase/firestore");
      const { getApp: gA2 } = await import("@react-native-firebase/app");
      const snapshot = await gD2(
        q2(c2(gF2(gA2()), "achievements"), w2("userId", "==", userId))
      );
      const achievementsByType = new Map<
        string,
        Array<{ id: string; data: FirebaseAchievement }>
      >();

      // Grouper les achievements par type
      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = doc.data() as FirebaseAchievement;
        const existing = achievementsByType.get(data.achievementId) || [];
        existing.push({ id: doc.id, data });
        achievementsByType.set(data.achievementId, existing);
      });

      let duplicatesRemoved = 0;
      let totalXPRecalculated = 0;
      let totalUnlocked = 0;
      const keptAchievements: string[] = [];

      // Pour chaque type d'achievement
      for (const [achievementId, achievements] of achievementsByType) {
        if (achievements.length > 1) {
          // Trier par date de déblocage (garder le plus ancien)
          achievements.sort(
            (a, b) =>
              new Date(a.data.unlockedAt).getTime() -
              new Date(b.data.unlockedAt).getTime()
          );

          // Garder le premier, supprimer les autres
          const toKeep = achievements[0];
          totalXPRecalculated += toKeep.data.xpEarned;
          totalUnlocked++;
          keptAchievements.push(achievementId);

          for (let i = 1; i < achievements.length; i++) {
            const {
              getFirestore: gF3,
              collection: c3,
              doc: d3,
              deleteDoc,
            } = await import("@react-native-firebase/firestore");
            const { getApp: gA3 } = await import("@react-native-firebase/app");
            await deleteDoc(
              d3(c3(gF3(gA3()), "achievements"), achievements[i].id)
            );
            duplicatesRemoved++;
          }
        } else {
          // Pas de doublon, compter dans le total
          totalXPRecalculated += achievements[0].data.xpEarned;
          totalUnlocked++;
          keptAchievements.push(achievementId);
        }
      }

      // Mettre à jour les métadonnées avec les valeurs recalculées (modulaire)
      const {
        getFirestore,
        collection,
        doc,
        getDoc,
        setDoc,
        updateDoc,
        serverTimestamp,
      } = await import("@react-native-firebase/firestore");
      const { getApp } = await import("@react-native-firebase/app");
      const db = getFirestore(getApp());
      const metaRef = doc(collection(db, "userAchievementsMeta"), userId);
      const metaDoc = await getDoc(metaRef);

      if (metaDoc.exists()) {
        await updateDoc(metaRef, {
          totalUnlocked,
          totalXP: totalXPRecalculated,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(metaRef, {
          userId,
          totalUnlocked,
          totalXP: totalXPRecalculated,
          lastUnlockedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Invalider le cache
      this.clearCache();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les métadonnées d'achievements d'un utilisateur
   */
  async getUserAchievementsMeta(userId: string): Promise<any> {
    try {
      const {
        getFirestore: gF4,
        collection: c4,
        doc: d4,
        getDoc: gD4,
      } = await import("@react-native-firebase/firestore");
      const { getApp: gA4 } = await import("@react-native-firebase/app");
      const metaRef = d4(c4(gF4(gA4()), "userAchievementsMeta"), userId);
      const metaDoc = await gD4(metaRef);

      if (metaDoc.exists()) {
        return metaDoc.data();
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Réinitialiser les achievements depuis Firebase uniquement
   */
  async resetFromFirebase(userId: string): Promise<{
    achievements: FirebaseAchievement[];
    totalXP: number;
    totalUnlocked: number;
  }> {
    try {
      // Vider le cache
      this.clearCache();

      // Récupérer les achievements
      const achievements = await this.getUserAchievements(userId);

      // Récupérer les métadonnées
      const meta = await this.getUserAchievementsMeta(userId);

      const result = {
        achievements,
        totalXP: meta?.totalXP || 0,
        totalUnlocked: meta?.totalUnlocked || 0,
      };

      return result;
    } catch (error) {
      return { achievements: [], totalXP: 0, totalUnlocked: 0 };
    }
  }

  /**
   * Valider et nettoyer les achievements invalides
   * (par exemple, first_script débloqué alors qu'il n'y a pas de script)
   */
  async validateAndCleanAchievements(
    userId: string,
    actualStats: {
      scriptsCount?: number;
      recordingsCount?: number;
      totalRecordingTime?: number;
      profileComplete?: boolean;
    }
  ): Promise<void> {
    try {
      // Vider le cache
      this.clearCache();

      const achievements = await this.getUserAchievements(userId);
      let invalidAchievements = 0;
      let validAchievements = 0;
      let totalXPRecalculated = 0;

      for (const achievement of achievements) {
        let isValid = true;
        const achDef = ACHIEVEMENTS.find(
          (a) => a.id === achievement.achievementId
        );

        if (!achDef) {
          isValid = false;
        } else {
          // Valider selon le type d'achievement
          switch (achievement.achievementId) {
            case "first_script":
              isValid = (actualStats.scriptsCount || 0) >= 1;
              break;
            case "script_creator_10":
              isValid = (actualStats.scriptsCount || 0) >= 10;
              break;
            case "script_master_50":
              isValid = (actualStats.scriptsCount || 0) >= 50;
              break;
            case "first_recording":
              isValid = (actualStats.recordingsCount || 0) >= 1;
              break;
            case "recording_streak_5":
              isValid = (actualStats.recordingsCount || 0) >= 5;
              break;
            case "recording_pro_25":
              isValid = (actualStats.recordingsCount || 0) >= 25;
              break;
            case "profile_complete":
              isValid = actualStats.profileComplete || false;
              break;
            // Ajouter d'autres validations selon les besoins
          }
        }

        if (!isValid) {
          const {
            deleteDoc,
            getFirestore: gF6,
            collection: c6,
            doc: d6,
          } = await import("@react-native-firebase/firestore");
          const { getApp: gA6 } = await import("@react-native-firebase/app");
          await deleteDoc(
            d6(
              c6(gF6(gA6()), "achievements"),
              `${userId}_${achievement.achievementId}`
            )
          );
          invalidAchievements++;
        } else {
          validAchievements++;
          totalXPRecalculated += achievement.xpEarned;
        }
      }

      // Mettre à jour les métadonnées
      if (invalidAchievements > 0) {
        const {
          getFirestore: gF5,
          collection: c5,
          doc: d5,
          updateDoc: u5,
          serverTimestamp: s5,
        } = await import("@react-native-firebase/firestore");
        const { getApp: gA5 } = await import("@react-native-firebase/app");
        await u5(d5(c5(gF5(gA5()), "userAchievementsMeta"), userId), {
          totalUnlocked: validAchievements,
          totalXP: totalXPRecalculated,
          updatedAt: s5(),
        });
      }
    } catch (error) {
      throw error;
    }
  }
}

export const achievementsService = new AchievementsService();
