import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Alert, Share, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useAchievements } from "../../hooks/useAchievements";
import { useTranslation } from "../../hooks/useTranslation";
import { Achievement } from "../../types/achievements";
import { UIText } from "../ui/Typography";

import { createOptimizedLogger } from "../../utils/optimizedLogger";
const logger = createOptimizedLogger("ShareAchievement");

interface ShareAchievementProps {
  achievement?: Achievement;
}

export default function ShareAchievement({
  achievement,
}: ShareAchievementProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getAchievementStats, userLevel } = useAchievements();

  const stats = getAchievementStats();

  const shareAchievement = async () => {
    try {
      let message = "";

      if (achievement) {
        // Partager un achievement spécifique
        message = t(
          "achievements.share.specific",
          `🎉 J'ai débloqué le badge "${achievement.name}" dans Nyth!\n\n` +
            `📝 ${achievement.description}\n\n` +
            `🏆 Niveau ${userLevel.level} - ${userLevel.title}\n` +
            `✨ ${stats.unlocked}/${stats.total} badges débloqués (${stats.percentage}%)\n\n` +
            `#Naya #Achievement #Badge`
        );
      } else {
        // Partager le profil d'achievements général
        message = t(
          "achievements.share.profile",
          `🏆 Mon profil Nyth\n\n` +
            `📊 Niveau ${userLevel.level} - ${userLevel.title}\n` +
            `✨ ${stats.unlocked}/${stats.total} badges débloqués\n` +
            `📈 Progression: ${stats.percentage}%\n\n` +
            `Badges par catégorie:\n` +
            `📝 Scripts: ${stats.byCategory.scripts}\n` +
            `🎬 Enregistrements: ${stats.byCategory.recordings}\n` +
            `💪 Engagement: ${stats.byCategory.engagement}\n\n` +
            `#Naya #Achievements #Gaming`
        );
      }

      await Share.share({
        message,
        title: t("achievements.share.title", "Mes Achievements Nyth"),
      });
    } catch (error) {
      logger.error("Erreur lors du partage:", error);
      Alert.alert(
        t("achievements.share.error.title", "Erreur"),
        t(
          "achievements.share.error.message",
          "Impossible de partager pour le moment"
        )
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={shareAchievement}
      style={[
        tw`flex-row items-center px-4 py-2 rounded-full`,
        {
          backgroundColor: currentTheme.colors.primary,
          shadowColor: currentTheme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="share-variant" size={20} color="white" />
      <UIText size={16} weight="600" style={[tw`ml-2`, { color: "white" }]}>
        {t("achievements.share.button", "Partager")}
      </UIText>
    </TouchableOpacity>
  );
}
