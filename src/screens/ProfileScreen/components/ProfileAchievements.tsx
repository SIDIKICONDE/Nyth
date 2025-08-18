import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { H4, HeadingText, UIText } from "../../../components/ui/Typography";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useAchievements } from "../../../hooks/useAchievements";
import { useTranslation } from "../../../hooks/useTranslation";
import { Achievement } from "../../../types/achievements";

export default function ProfileAchievements() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
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
              tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
              {
                backgroundColor: achievement.isUnlocked
                  ? getRarityColor(achievement.rarity) + "15"
                  : currentTheme.colors.border + "15",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={achievement.icon as any}
              size={20}
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
                size="sm"
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
                  size={14}
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
    <View style={tw`pb-6`}>
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

      {/* Header avec niveau et XP - Style simplifié */}
      <View
        style={[
          tw`p-4 rounded-xl mb-4`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
      >
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <UIText
              size="xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {t("profile.achievements.level", "NIVEAU")}
            </UIText>
            <HeadingText
              size="2xl"
              weight="bold"
              style={{ color: currentTheme.colors.primary }}
            >
              {userLevel.level}
            </HeadingText>
            <UIText
              size="sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {userLevel.title}
            </UIText>
          </View>

          <View style={tw`items-end`}>
            <UIText
              size="xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {t("profile.achievements.experience", "EXPÉRIENCE")}
            </UIText>
            <HeadingText
              size="xl"
              weight="bold"
              style={{ color: currentTheme.colors.secondary }}
            >
              {totalXP} XP
            </HeadingText>
            <View style={tw`flex-row items-center mt-1`}>
              <View
                style={[
                  tw`h-1 w-20 rounded-full overflow-hidden`,
                  { backgroundColor: currentTheme.colors.border },
                ]}
              >
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${
                        (userLevel.currentXP / userLevel.requiredXP) * 100
                      }%`,
                      backgroundColor: currentTheme.colors.primary,
                    },
                  ]}
                />
              </View>
              <UIText
                size="xs"
                style={[
                  tw`ml-2`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {userLevel.currentXP}/{userLevel.requiredXP}
              </UIText>
            </View>
          </View>
        </View>
      </View>

      {/* Statistiques des badges - Style simplifié */}
      <View
        style={[
          tw`p-3 rounded-xl mb-4 flex-row justify-around`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
      >
        <View style={tw`items-center`}>
          <HeadingText
            size="xl"
            weight="bold"
            color={currentTheme.colors.primary}
          >
            {stats.unlocked}
          </HeadingText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.achievements.unlocked", "Débloqués")}
          </UIText>
        </View>

        <View style={tw`items-center`}>
          <HeadingText
            size="xl"
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
            size="xl"
            weight="bold"
            color={currentTheme.colors.secondary}
          >
            {stats.percentage}%
          </HeadingText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {t("profile.achievements.progress", "Progression")}
          </UIText>
        </View>
      </View>

      <ScrollView
        style={tw`max-h-80`}
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
