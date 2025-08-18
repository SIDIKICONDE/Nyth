import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useHomeData } from "../../../components/home/useHomeData";
import { H3, HeadingText, UIText } from "../../../components/ui/Typography";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { useContrastOptimization } from "../../../hooks/useContrastOptimization";
import { useUserStats } from "../../../hooks/useUserStats";
import { UserStats } from "../../../types/user";
import { responsiveSpacing, responsiveFontSize, isTablet } from "../../../utils/responsive";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('ProfileStats');

interface ProfileStatsProps {
  stats?: UserStats;
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const { scripts, getFavoriteScripts } = useScripts();
  const { recordings } = useHomeData();
  const { cumulativeStats, isLoaded } = useUserStats();
  const navigation = useNavigation();

  const formatDuration = (seconds: number) => {
    if (seconds === 0) {
      return "0m";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Calculer les statistiques réelles
  const favoriteScripts = getFavoriteScripts();
  const totalScripts = scripts.length;
  const totalFavorites = favoriteScripts.length;
  const totalRecordings = recordings.length;

  // Utiliser les statistiques cumulatives pour le temps total
  logger.debug("📊 ProfileStats - Statistiques cumulatives chargées:", isLoaded);
  logger.debug(
    "📊 ProfileStats - Temps total cumulé:",
    cumulativeStats.totalRecordingTime
  );
  logger.debug(
    "📊 ProfileStats - Total enregistrements créés:",
    cumulativeStats.totalRecordingsCreated
  );
  logger.debug("📊 ProfileStats - Scripts locaux:", totalScripts);
  logger.debug("📊 ProfileStats - Favoris locaux:", totalFavorites);
  logger.debug("📊 ProfileStats - Enregistrements locaux:", totalRecordings);
  logger.debug("📊 ProfileStats - Stats props:", stats);

  // Le temps total vient maintenant des statistiques cumulatives
  const totalRecordingTime = isLoaded ? cumulativeStats.totalRecordingTime : 0;

  logger.debug("⏰ Temps total affiché (secondes):", totalRecordingTime);
  logger.debug("⏰ Temps total formaté:", formatDuration(totalRecordingTime));

  const handleFavoritesPress = () => {
    navigation.navigate("Home" as never);
  };

  const handleRecordingsPress = () => {
    navigation.navigate("Home" as never);
  };

  const statItems = [
    {
      icon: "script-text-outline",
      label: t("profile.stats.scripts"),
      value: totalScripts,
      gradientColors: currentTheme.isDark
        ? (["#8b5cf6", "#a855f7"] as const)
        : (["#667eea", "#764ba2"] as const),
      shadowColor: currentTheme.isDark ? "#8b5cf6" : "#667eea",
    },
    {
      icon: "heart-outline",
      label: t("profile.stats.favorites"),
      value: totalFavorites,
      gradientColors: currentTheme.isDark
        ? (["#ec4899", "#f43f5e"] as const)
        : (["#f093fb", "#f5576c"] as const),
      shadowColor: currentTheme.isDark ? "#ec4899" : "#f093fb",
      onPress: totalFavorites > 0 ? handleFavoritesPress : undefined,
    },
    {
      icon: "video-outline",
      label: t("profile.stats.recordings"),
      value: isLoaded
        ? cumulativeStats.totalRecordingsCreated
        : totalRecordings,
      gradientColors: currentTheme.isDark
        ? (["#06b6d4", "#0891b2"] as const)
        : (["#4facfe", "#00f2fe"] as const),
      shadowColor: currentTheme.isDark ? "#06b6d4" : "#4facfe",
      onPress: totalRecordings > 0 ? handleRecordingsPress : undefined,
    },
    {
      icon: "clock-outline",
      label: t("profile.stats.totalTime"),
      value: formatDuration(totalRecordingTime),
      gradientColors: currentTheme.isDark
        ? (["#10b981", "#059669"] as const)
        : (["#43e97b", "#38f9d7"] as const),
      shadowColor: currentTheme.isDark ? "#10b981" : "#43e97b",
    },
  ];

  const isTabletDevice = isTablet();
  const containerPadding = responsiveSpacing(16);
  const sectionPadding = responsiveSpacing(24);
  const marginBottom = responsiveSpacing(24);
  const itemSpacing = responsiveSpacing(8);
  
  return (
    <View style={{ paddingHorizontal: containerPadding, paddingVertical: sectionPadding }}>
      <View style={[tw`flex-row items-center`, { marginBottom }]}>
        <H3 style={{ color: currentTheme.colors.text, fontSize: responsiveFontSize(20) }}>
          📊 {t("profile.stats.title")}
        </H3>
        <View
          style={[
            tw`flex-1 h-0.5`,
            { 
              backgroundColor: currentTheme.colors.border,
              marginLeft: responsiveSpacing(16),
            },
          ]}
        />
      </View>

      <View style={[
        tw`flex-row flex-wrap`,
        isTabletDevice ? tw`justify-around` : tw`justify-between`
      ]}>
        {statItems.map((item, index) => {
          return item.onPress && typeof item.onPress === "function" ? (
            <TouchableOpacity
              key={index}
              style={[
                {
                  width: isTabletDevice ? "30%" : "49%",
                  marginBottom: itemSpacing,
                },
              ]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...item.gradientColors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  tw`rounded-lg`,
                  {
                    padding: responsiveSpacing(8),
                    shadowColor: item.shadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              >
                {/* Overlay pour la lisibilité */}
                <View
                  style={[
                    tw`absolute inset-0 rounded-lg`,
                    {
                      backgroundColor: currentTheme.isDark
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                />

                <View style={tw`relative z-10 flex-row items-center`}>
                  {/* Icône */}
                  <View
                    style={[
                      tw`w-8 h-8 rounded-lg items-center justify-center mr-5`,
                      { backgroundColor: "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={18}
                      color="white"
                    />
                  </View>

                  {/* Contenu texte */}
                  <View style={tw`flex-1`}>
                    {/* Valeur */}
                    <HeadingText
                      size="xl"
                      weight="bold"
                      style={[
                        tw`mb-0.5`,
                        {
                          color: "white",
                          textShadowColor: "rgba(0,0,0,0.3)",
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {item.value}
                    </HeadingText>

                    {/* Label */}
                    <UIText
                      size="xs"
                      weight="medium"
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    >
                      {item.label}
                    </UIText>
                  </View>

                  {/* Indicateur cliquable */}
                  {item.onPress !== undefined &&
                    typeof item.value === "number" &&
                    item.value > 0 && (
                      <View
                        style={[
                          tw`w-5 h-5 rounded-full items-center justify-center`,
                          { backgroundColor: "rgba(255,255,255,0.2)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={12}
                          color="white"
                        />
                      </View>
                    )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View
              key={index}
              style={[
                tw`mb-2`,
                {
                  width: "49%",
                },
              ]}
            >
              <LinearGradient
                colors={[...item.gradientColors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  tw`p-2 rounded-lg`,
                  {
                    shadowColor: item.shadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              >
                {/* Overlay pour la lisibilité */}
                <View
                  style={[
                    tw`absolute inset-0 rounded-lg`,
                    {
                      backgroundColor: currentTheme.isDark
                        ? "rgba(0,0,0,0.2)"
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                />

                <View style={tw`relative z-10 flex-row items-center`}>
                  {/* Icône */}
                  <View
                    style={[
                      tw`w-8 h-8 rounded-lg items-center justify-center mr-5`,
                      { backgroundColor: "rgba(255,255,255,0.2)" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={18}
                      color="white"
                    />
                  </View>

                  {/* Contenu texte */}
                  <View style={tw`flex-1`}>
                    {/* Valeur */}
                    <HeadingText
                      size="xl"
                      weight="bold"
                      style={[
                        tw`mb-0.5`,
                        {
                          color: "white",
                          textShadowColor: "rgba(0,0,0,0.3)",
                          textShadowOffset: { width: 1, height: 1 },
                          textShadowRadius: 2,
                        },
                      ]}
                    >
                      {item.value}
                    </HeadingText>

                    {/* Label */}
                    <UIText
                      size="xs"
                      weight="medium"
                      style={{ color: "rgba(255,255,255,0.9)" }}
                    >
                      {item.label}
                    </UIText>
                  </View>

                  {/* Pas d'indicateur cliquable pour les éléments non cliquables */}
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    </View>
  );
}
