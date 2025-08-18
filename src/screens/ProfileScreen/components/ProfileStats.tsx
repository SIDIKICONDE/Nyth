import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useHomeData } from "../../../components/home/useHomeData";
import { H3, HeadingText, UIText } from "../../../components/ui/Typography";
import { useScripts } from "../../../contexts/ScriptsContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
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
      onPress: undefined,
    },
    {
      icon: "heart-outline",
      label: t("profile.stats.favorites"),
      value: totalFavorites,
      onPress: totalFavorites > 0 ? handleFavoritesPress : undefined,
    },
    {
      icon: "video-outline",
      label: t("profile.stats.recordings"),
      value: isLoaded
        ? cumulativeStats.totalRecordingsCreated
        : totalRecordings,
      onPress: totalRecordings > 0 ? handleRecordingsPress : undefined,
    },
    {
      icon: "clock-outline",
      label: t("profile.stats.totalTime"),
      value: formatDuration(totalRecordingTime),
      onPress: undefined,
    },
  ];

  const isTabletDevice = isTablet();
  const containerPadding = responsiveSpacing(16);
  const sectionPadding = responsiveSpacing(24);
  const marginBottom = responsiveSpacing(24);
  
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
          const StatContent = () => (
            <View style={tw`flex-row items-center`}>
              {/* Icône */}
              <View
                style={[
                  tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                  { backgroundColor: currentTheme.colors.primary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={16}
                  color={currentTheme.colors.primary}
                />
              </View>

              {/* Contenu texte */}
              <View style={tw`flex-1`}>
                {/* Valeur */}
                <HeadingText
                  size="lg"
                  weight="bold"
                  style={{ color: currentTheme.colors.text }}
                >
                  {item.value}
                </HeadingText>

                {/* Label */}
                <UIText
                  size="xs"
                  weight="medium"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {item.label}
                </UIText>
              </View>
            </View>
          );

          return item.onPress ? (
            <TouchableOpacity
              key={index}
              style={[
                tw`p-3 rounded-xl mb-2`,
                {
                  width: isTabletDevice ? "30%" : "48%",
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
              onPress={item.onPress}
              activeOpacity={0.6}
            >
              <StatContent />
            </TouchableOpacity>
          ) : (
            <View
              key={index}
              style={[
                tw`p-3 rounded-xl mb-2`,
                {
                  width: isTabletDevice ? "30%" : "48%",
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
              <StatContent />
            </View>
          );
        })}
      </View>
    </View>
  );
}
