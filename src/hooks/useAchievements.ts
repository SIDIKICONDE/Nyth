import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useHomeData } from "../components/home/useHomeData";
import { useAchievementNotifications } from "../contexts/AchievementContext";
import { useAuth } from "../contexts/AuthContext";
import { useScripts } from "../contexts/ScriptsContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { achievementsService } from "../services/firebase/achievementsService";
import {
  Achievement,
  UserLevel,
  calculateLevel,
  getTranslatedAchievements,
} from "../types/achievements";
import { useTranslation } from "./useTranslation";
import { useUserStats } from "./useUserStats";

const ACHIEVEMENTS_KEY = "user_achievements";
const XP_KEY = "user_xp";

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    requiredXP: 50,
    title: "Débutant",
  });
  const [newUnlocks, setNewUnlocks] = useState<Achievement[]>([]);

  const { scripts } = useScripts();
  const { recordings } = useHomeData();
  const { cumulativeStats } = useUserStats();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Toujours appeler le hook (règle des hooks)
  const notificationContext = useAchievementNotifications();

  // Obtenir les achievements traduits
  const translatedAchievements = getTranslatedAchievements(t);

  // Sauvegarder les achievements
  const saveAchievements = useCallback(
    async (updatedAchievements: Achievement[], xp: number) => {
      try {
        await AsyncStorage.setItem(
          ACHIEVEMENTS_KEY,
          JSON.stringify(updatedAchievements)
        );
        await AsyncStorage.setItem(XP_KEY, xp.toString());
      } catch (error) {}
    },
    []
  );

  // Charger les achievements sauvegardés
  const loadAchievements = useCallback(async () => {
    try {
      // Si l'utilisateur est connecté, synchroniser avec Firebase
      if (user && !user.isGuest) {
        // Réinitialiser depuis Firebase pour éviter les désynchronisations
        const firebaseData = await achievementsService.resetFromFirebase(
          user.uid
        );

        // Créer la liste complète des achievements avec l'état Firebase
        const mergedAchievements = translatedAchievements.map((achievement) => {
          const firebaseAch = firebaseData.achievements.find(
            (fa) => fa.achievementId === achievement.id
          );
          if (firebaseAch) {
            return {
              ...achievement,
              isUnlocked: true,
              unlockedAt: new Date(firebaseAch.unlockedAt),
            };
          }
          return {
            ...achievement,
            isUnlocked: false,
          };
        });

        setAchievements(mergedAchievements);
        setTotalXP(firebaseData.totalXP);
        setUserLevel(calculateLevel(firebaseData.totalXP, t));

        // Sauvegarder localement pour le mode hors ligne
        await saveAchievements(mergedAchievements, firebaseData.totalXP);
      } else {
        // Mode local/invité - charger depuis AsyncStorage
        const savedAchievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
        const savedXP = await AsyncStorage.getItem(XP_KEY);

        let localAchievements: Achievement[] = translatedAchievements;

        if (savedAchievements) {
          const parsedAchievements = JSON.parse(savedAchievements);
          // Fusionner les données sauvegardées avec les traductions actuelles
          localAchievements = translatedAchievements.map((translated) => {
            const saved = parsedAchievements.find(
              (saved: Achievement) => saved.id === translated.id
            );
            return saved ? { ...translated, ...saved } : translated;
          });
        }

        setAchievements(localAchievements);

        if (savedXP) {
          const xp = parseInt(savedXP, 10);
          setTotalXP(xp);
          setUserLevel(calculateLevel(xp, t));
        }
      }
    } catch (error) {
      // En cas d'erreur, charger les achievements par défaut
      setAchievements(translatedAchievements);
    }
  }, [user, saveAchievements, translatedAchievements, t]);

  // Vérifier et débloquer les achievements
  const checkAchievements = useCallback(async () => {
    const updatedAchievements = [...achievements];
    const newlyUnlocked: Achievement[] = [];
    let xpGained = 0;

    updatedAchievements.forEach((achievement) => {
      if (!achievement.isUnlocked) {
        let currentValue = 0;
        let shouldUnlock = false;

        switch (achievement.id) {
          // Scripts
          case "first_script":
          case "script_creator_10":
          case "script_master_50":
            currentValue = scripts.length;
            shouldUnlock = currentValue >= achievement.requiredValue;

            break;

          // Enregistrements
          case "first_recording":
          case "recording_streak_5":
          case "recording_pro_25":
            currentValue = recordings.length;
            shouldUnlock = currentValue >= achievement.requiredValue;

            break;

          // Temps d'enregistrement
          case "time_1hour":
          case "time_10hours":
          case "time_100hours":
            currentValue = cumulativeStats.totalRecordingTime;
            shouldUnlock = currentValue >= achievement.requiredValue;
            break;

          // Profil complet
          case "profile_complete":
            if (profile) {
              const isComplete = !!(
                profile.displayName &&
                profile.bio &&
                profile.profession &&
                profile.photoURL
              );
              currentValue = isComplete ? 1 : 0;
              shouldUnlock = isComplete;
            }
            break;
        }

        achievement.currentValue = currentValue;

        if (shouldUnlock) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          newlyUnlocked.push(achievement);

          // Calculer les XP selon la rareté
          switch (achievement.rarity) {
            case "common":
              xpGained += 50;
              break;
            case "rare":
              xpGained += 100;
              break;
            case "epic":
              xpGained += 200;
              break;
            case "legendary":
              xpGained += 500;
              break;
          }
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      const newTotalXP = totalXP + xpGained;
      setAchievements(updatedAchievements);
      setTotalXP(newTotalXP);
      setUserLevel(calculateLevel(newTotalXP, t));
      setNewUnlocks(newlyUnlocked);
      await saveAchievements(updatedAchievements, newTotalXP);

      // Synchroniser avec Firebase si l'utilisateur est connecté
      if (user && !user.isGuest) {
        for (const achievement of newlyUnlocked) {
          const xpReward =
            achievement.rarity === "common"
              ? 50
              : achievement.rarity === "rare"
              ? 100
              : achievement.rarity === "epic"
              ? 200
              : 500;

          try {
            await achievementsService.unlockAchievement(
              user.uid,
              achievement.id,
              xpReward
            );
          } catch (error) {}
        }
      }

      // Envoyer les notifications si le contexte est disponible et fonctionnel
      if (
        notificationContext &&
        typeof notificationContext.addToQueue === "function"
      ) {
        notificationContext.addToQueue(newlyUnlocked);
      }
    }
  }, [
    achievements,
    scripts,
    recordings,
    cumulativeStats,
    profile,
    totalXP,
    saveAchievements,
    user,
    notificationContext,
  ]);

  // Effacer les nouvelles notifications
  const clearNewUnlocks = useCallback(() => {
    setNewUnlocks([]);
  }, []);

  // Calculer les statistiques
  const getAchievementStats = useCallback(() => {
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.isUnlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return {
      total,
      unlocked,
      percentage,
      byCategory: {
        scripts: achievements.filter(
          (a) => a.category === "scripts" && a.isUnlocked
        ).length,
        recordings: achievements.filter(
          (a) => a.category === "recordings" && a.isUnlocked
        ).length,
        engagement: achievements.filter(
          (a) => a.category === "engagement" && a.isUnlocked
        ).length,
        special: achievements.filter(
          (a) => a.category === "special" && a.isUnlocked
        ).length,
      },
    };
  }, [achievements]);

  // Forcer la synchronisation avec Firebase
  const forceSyncWithFirebase = useCallback(async () => {
    if (user && !user.isGuest) {
      try {
        // Vider le cache local
        achievementsService.clearCache();

        // Recharger depuis Firebase
        await loadAchievements();
      } catch (error) {}
    }
  }, [user, loadAchievements]);

  // Charger au démarrage
  useEffect(() => {
    loadAchievements();
  }, [user?.uid]); // Seulement quand l'utilisateur change

  // Vérifier les achievements quand les données changent
  useEffect(() => {
    if (achievements.length > 0) {
      checkAchievements();
    }
  }, [
    checkAchievements, // Inclure la fonction dans les dépendances
    achievements.length,
    scripts.length,
    recordings.length,
    cumulativeStats.totalRecordingTime,
    profile?.displayName,
    profile?.bio,
    profile?.profession,
    profile?.photoURL,
  ]);

  return {
    achievements,
    totalXP,
    userLevel,
    newUnlocks,
    clearNewUnlocks,
    getAchievementStats,
    checkAchievements,
    forceSyncWithFirebase,
  };
};
