import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { H4, HeadingText, UIText } from "../../../components/ui/Typography";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAchievements } from "../../../hooks/useAchievements";
import { useTranslation } from "../../../hooks/useTranslation";
import { useContrastOptimization } from "../../../hooks/useContrastOptimization";
import { Achievement } from "../../../types/achievements";

export default function ProfileAchievements() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { achievements, userLevel, totalXP, getAchievementStats } =
    useAchievements();
  const { user } = useAuth();
  const stats = getAchievementStats();

  const getRarityColor = (rarity: string) => {
    // Utiliser des couleurs garanties visibles
    switch (rarity) {
      case "common":
        return currentTheme.isDark ? "#e2e8f0" : "#718096";
      case "rare":
        return currentTheme.isDark ? "#60a5fa" : "#3182CE";
      case "epic":
        return currentTheme.isDark ? "#a78bfa" : "#805AD5";
      case "legendary":
        return currentTheme.isDark ? "#fbbf24" : "#D69E2E";
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const renderAchievement = (achievement: Achievement) => {
    const progress = achievement.currentValue
      ? Math.min(
          (achievement.currentValue / achievement.requiredValue) * 100,
          100
        )
      : 0;

    return (
      <TouchableOpacity
        key={achievement.id}
        style={[
          tw`mb-3 p-3 rounded-xl`,
          {
            backgroundColor: achievement.isUnlocked
              ? currentTheme.colors.surface
              : currentTheme.colors.background,
            borderWidth: 1,
            borderColor: achievement.isUnlocked
              ? getRarityColor(achievement.rarity)
              : currentTheme.colors.border,
            opacity: achievement.isUnlocked ? 1 : 0.7,
          },
        ]}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center`}>
          {/* Icône du badge */}
          <View
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
              {
                backgroundColor: achievement.isUnlocked
                  ? getRarityColor(achievement.rarity) + "20"
                  : currentTheme.colors.border + "20",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={achievement.icon as any}
              size={24}
              color={
                achievement.isUnlocked
                  ? getRarityColor(achievement.rarity)
                  : currentTheme.colors.textSecondary
              }
            />
          </View>

          {/* Infos du badge */}
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center`}>
              <UIText
                size="base"
                weight="semibold"
                color={
                  achievement.isUnlocked
                    ? currentTheme.colors.text
                    : currentTheme.colors.textSecondary
                }
              >
                {achievement.name}
              </UIText>
              {achievement.isUnlocked && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={getRarityColor(achievement.rarity)}
                  style={tw`ml-2`}
                />
              )}
            </View>

            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`mt-0.5`}
            >
              {achievement.description}
            </UIText>

            {/* Barre de progression */}
            {!achievement.isUnlocked && (
              <View style={tw`mt-2`}>
                <View
                  style={[
                    tw`h-1 rounded-full overflow-hidden`,
                    { backgroundColor: currentTheme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      tw`h-full rounded-full`,
                      {
                        width: `${progress}%`,
                        backgroundColor: currentTheme.isDark
                          ? "#60a5fa"
                          : getRarityColor(achievement.rarity),
                      },
                    ]}
                  />
                </View>
                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  style={tw`mt-1`}
                >
                  {achievement.currentValue || 0} / {achievement.requiredValue}
                </UIText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={tw`pb-8`}>
      {/* Titre avec ligne */}
      <View style={tw`flex-row items-center mb-4`}>
        <H4 style={{ color: currentTheme.colors.text }}>
          🏆 {t("profile.achievements.title", "Badges et Réalisations")}
        </H4>
        <View
          style={[
            tw`flex-1 h-0.5 ml-4`,
            { backgroundColor: currentTheme.colors.border },
          ]}
        />
      </View>

      {/* Header avec niveau et XP */}
      <LinearGradient
        colors={
          currentTheme.isDark
            ? ["#8b5cf6", "#a855f7"] // Dégradé violet pour thèmes sombres
            : [currentTheme.colors.primary, currentTheme.colors.secondary]
        }
        style={tw`p-4 rounded-xl mb-4`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <UIText
              size="xs"
              style={[
                tw`opacity-90`,
                { color: currentTheme.isDark ? "#f8fafc" : "white" },
              ]}
            >
              {t("profile.achievements.level", "NIVEAU")}
            </UIText>
            <HeadingText
              size="2xl"
              weight="bold"
              style={{ color: currentTheme.isDark ? "#ffffff" : "white" }}
            >
              {userLevel.level}
            </HeadingText>
            <UIText
              size="sm"
              style={[
                tw`opacity-90`,
                { color: currentTheme.isDark ? "#e2e8f0" : "white" },
              ]}
            >
              {userLevel.title}
            </UIText>
          </View>

          <View style={tw`items-end`}>
            <UIText
              size="xs"
              style={[
                tw`opacity-90`,
                { color: currentTheme.isDark ? "#f8fafc" : "white" },
              ]}
            >
              {t("profile.achievements.experience", "EXPÉRIENCE")}
            </UIText>
            <HeadingText
              size="xl"
              weight="bold"
              style={{ color: currentTheme.isDark ? "#ffffff" : "white" }}
            >
              {totalXP} XP
            </HeadingText>
            <View style={tw`flex-row items-center mt-1`}>
              <View
                style={[
                  tw`h-1 w-20 rounded-full overflow-hidden`,
                  { backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              >
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${
                        (userLevel.currentXP / userLevel.requiredXP) * 100
                      }%`,
                      backgroundColor: "white",
                    },
                  ]}
                />
              </View>
              <UIText
                size="xs"
                style={[
                  tw`ml-2 opacity-90`,
                  { color: currentTheme.isDark ? "#e2e8f0" : "white" },
                ]}
              >
                {userLevel.currentXP}/{userLevel.requiredXP}
              </UIText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Statistiques des badges */}
      <View
        style={[
          tw`p-3 rounded-xl mb-4 flex-row justify-around`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <View style={tw`items-center`}>
          <HeadingText
            size="2xl"
            weight="bold"
            color={
              currentTheme.isDark ? "#60a5fa" : currentTheme.colors.primary
            }
          >
            {stats.unlocked}
          </HeadingText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.achievements.unlocked", "Débloqués")}
          </UIText>
        </View>

        <View style={tw`items-center`}>
          <HeadingText
            size="2xl"
            weight="bold"
            color={currentTheme.colors.text}
          >
            {stats.total}
          </HeadingText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.achievements.total", "Total")}
          </UIText>
        </View>

        <View style={tw`items-center`}>
          <HeadingText
            size="2xl"
            weight="bold"
            color={
              currentTheme.isDark ? "#fbbf24" : currentTheme.colors.secondary
            }
          >
            {stats.percentage}%
          </HeadingText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.achievements.progress", "Progression")}
          </UIText>
        </View>
      </View>

      <ScrollView
        style={tw`max-h-96`}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {achievements
          .sort((a, b) => {
            if (a.isUnlocked !== b.isUnlocked) {
              return a.isUnlocked ? -1 : 1;
            }
            return 0;
          })
          .map(renderAchievement)}
      </ScrollView>
    </View>
  );
}
