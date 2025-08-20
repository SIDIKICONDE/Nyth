import React from "react";
import { View, Pressable } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { UIText } from "../ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useGlobalPreferencesContext } from "../../contexts/GlobalPreferencesContext";
import { useTranslation } from "../../hooks/useTranslation";
import Animated, { FadeInDown } from "react-native-reanimated";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('HomePageSection');

type HomePage = "default" | "planning" | "ai-chat";

interface HomePageOption {
  id: HomePage;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export default function HomePageSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { preferences, updatePreference } = useGlobalPreferencesContext();

  const currentHomePage = (preferences?.homePage as HomePage) || "default";

  const homePageOptions: HomePageOption[] = [
    {
      id: "default",
      label: t("settings.homePage.default", "Accueil par défaut"),
      description: t(
        "settings.homePage.defaultDesc",
        "Page d'accueil classique avec toutes les fonctionnalités"
      ),
      icon: "home",
      color: "#10b981",
    },
    {
      id: "planning",
      label: t("settings.homePage.planning", "Planning"),
      description: t(
        "settings.homePage.planningDesc",
        "Accédez directement à votre planning et vos tâches"
      ),
      icon: "calendar-check",
      color: "#f59e0b",
    },
    {
      id: "ai-chat",
      label: t("settings.homePage.aiChat", "AI Discussion"),
      description: t(
        "settings.homePage.aiChatDesc",
        "Commencez directement avec l'assistant IA"
      ),
      icon: "robot-happy",
      color: "#8b5cf6",
    },
  ];

  const handleHomePageChange = async (homePage: HomePage) => {
    try {
      await updatePreference("homePage", homePage);
    } catch (error) {
      logger.error(
        "Erreur lors de la mise à jour de la page d'accueil:",
        error
      );
    }
  };

  return (
    <View style={tw`mb-4`}>
      {/* En-tête de la section */}
      <View style={tw`flex-row items-center mb-3`}>
        <MaterialCommunityIcons
          name="home-variant"
          size={20}
          color={currentTheme.colors.primary}
          style={tw`mr-2`}
        />
        <UIText size="lg" weight="semibold" color={currentTheme.colors.text}>
          {t("settings.homePage.title", "Page d'accueil")}
        </UIText>
      </View>

      {/* Options de page d'accueil */}
      <View style={tw`gap-3`}>
        {homePageOptions.map((option, index) => (
          <Animated.View
            key={option.id}
            entering={FadeInDown.delay(index * 50).duration(400)}
          >
            <Pressable
              onPress={() => handleHomePageChange(option.id)}
              style={({ pressed }) => [
                tw`p-4 rounded-xl flex-row items-center`,
                {
                  backgroundColor:
                    currentHomePage === option.id
                      ? currentTheme.colors.primary + "15"
                      : pressed
                      ? currentTheme.colors.surface + "80"
                      : currentTheme.colors.surface + "50",
                  borderWidth: currentHomePage === option.id ? 2 : 1,
                  borderColor:
                    currentHomePage === option.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.border,
                },
              ]}
            >
              {/* Icône */}
              <View
                style={[
                  tw`p-3 rounded-full mr-4`,
                  {
                    backgroundColor:
                      currentHomePage === option.id
                        ? option.color + "20"
                        : currentTheme.colors.surface,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={24}
                  color={
                    currentHomePage === option.id
                      ? option.color
                      : currentTheme.colors.textSecondary
                  }
                />
              </View>

              {/* Contenu */}
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                  <UIText
                    size="sm"
                    weight={currentHomePage === option.id ? "bold" : "medium"}
                    color={
                      currentHomePage === option.id
                        ? currentTheme.colors.primary
                        : currentTheme.colors.text
                    }
                  >
                    {option.label}
                  </UIText>

                  {/* Indicateur de sélection */}
                  {currentHomePage === option.id && (
                    <View
                      style={[
                        tw`w-5 h-5 rounded-full items-center justify-center`,
                        { backgroundColor: currentTheme.colors.primary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={currentTheme.colors.background}
                      />
                    </View>
                  )}
                </View>

                <UIText
                  size="xs"
                  color={currentTheme.colors.textSecondary}
                  style={tw`pr-6`}
                >
                  {option.description}
                </UIText>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Note informative */}
      <View
        style={[
          tw`mt-4 p-3 rounded-lg flex-row`,
          { backgroundColor: currentTheme.colors.primary + "10" },
        ]}
      >
        <MaterialCommunityIcons
          name="information"
          size={16}
          color={currentTheme.colors.primary}
          style={tw`mr-2 mt-0.5`}
        />
        <UIText
          size="xs"
          color={currentTheme.colors.textSecondary}
          style={tw`flex-1`}
        >
          {t(
            "settings.homePage.note",
            "Cette préférence sera appliquée lors de votre prochaine connexion à l'application."
          )}
        </UIText>
      </View>
    </View>
  );
}
