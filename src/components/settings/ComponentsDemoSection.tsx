import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { UIText } from "../ui/Typography";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

type NavigationProp = {
  navigate: (route: string, params?: any) => void;
};

/**
 * 🎨 Section des démonstrations de composants
 *
 * Permet d'accéder aux différentes démonstrations de composants
 * depuis l'écran des paramètres.
 */
export const ComponentsDemoSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const navigateToProfessionalBlockDemo = () => {
    navigation.navigate("CartesaniDemo");
  };

  const navigateToCameraTest = () => {
    navigation.navigate("CameraTest");
  };

  return (
    <View>
      {/* En-tête de section */}
      <View style={tw`mb-4`}>
        <UIText size="base" weight="semibold" color={currentTheme.colors.text}>
          {t("settings.demos.title", "Démonstrations de Composants")}
        </UIText>
        <UIText
          size="sm"
          color={currentTheme.colors.textSecondary}
          style={tw`mt-1`}
        >
          {t(
            "settings.demos.description",
            "Explorez les composants disponibles dans l'application"
          )}
        </UIText>
      </View>

      {/* Liste des démonstrations */}
      <View style={tw`gap-3`}>
        {/* Professional Block Demo */}
        <TouchableOpacity
          onPress={navigateToProfessionalBlockDemo}
          style={[
            tw`flex-row items-center justify-between p-4 rounded-xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border + "30",
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: currentTheme.colors.accent + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="view-carousel"
                size={20}
                color={currentTheme.colors.accent}
              />
            </View>

            <View style={tw`flex-1`}>
              <UIText
                size="base"
                weight="medium"
                color={currentTheme.colors.text}
              >
                {t("settings.demos.carousel.title", "Carousel Stack")}
              </UIText>
              <UIText
                size="sm"
                color={currentTheme.colors.textSecondary}
                style={tw`mt-1`}
              >
                {t(
                  "settings.demos.carousel.description",
                  "Démonstration du composant carousel"
                )}
              </UIText>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Camera Test */}
        <TouchableOpacity
          onPress={navigateToCameraTest}
          style={[
            tw`flex-row items-center justify-between p-4 rounded-xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border + "30",
            },
          ]}
          activeOpacity={0.7}
        >
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={[
                tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
                { backgroundColor: currentTheme.colors.warning + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="camera"
                size={20}
                color={currentTheme.colors.warning}
              />
            </View>

            <View style={tw`flex-1`}>
              <UIText
                size="base"
                weight="medium"
                color={currentTheme.colors.text}
              >
                {t("settings.demos.camera.title", "Test Caméra")}
              </UIText>
              <UIText
                size="sm"
                color={currentTheme.colors.textSecondary}
                style={tw`mt-1`}
              >
                {t(
                  "settings.demos.camera.description",
                  "Test des fonctionnalités caméra"
                )}
              </UIText>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
