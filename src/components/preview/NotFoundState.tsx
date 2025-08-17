import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { UIText } from "../ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

export const NotFoundState: React.FC = () => {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        tw`flex-1 justify-center items-center px-6`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Icône d'erreur */}
      <View
        style={[
          tw`w-24 h-24 rounded-full justify-center items-center mb-6`,
          { backgroundColor: `${currentTheme.colors.error}20` },
        ]}
      >
        <MaterialCommunityIcons
          name="video-off-outline"
          size={48}
          color={currentTheme.colors.error}
        />
      </View>

      {/* Titre */}
      <UIText
        size="xl"
        weight="bold"
        color={currentTheme.colors.text}
        align="center"
        style={tw`mb-4`}
      >
        {t("preview.notFound.title", "Enregistrement introuvable")}
      </UIText>

      {/* Message détaillé */}
      <UIText
        size="base"
        color={currentTheme.colors.textSecondary}
        align="center"
        style={tw`mb-6 leading-6`}
      >
        {t(
          "preview.notFound.message",
          "L'enregistrement demandé n'a pas pu être trouvé. Il se peut qu'il ait été supprimé ou que la sauvegarde ait échoué."
        )}
      </UIText>

      {/* Suggestions */}
      <View style={tw`mb-8`}>
        <UIText
          size="sm"
          weight="semibold"
          color={currentTheme.colors.text}
          style={tw`mb-3`}
        >
          {t("preview.notFound.suggestions", "Suggestions :")}
        </UIText>

        <UIText
          size="sm"
          color={currentTheme.colors.textSecondary}
          style={tw`mb-2`}
        >
          •{" "}
          {t(
            "preview.notFound.suggestion1",
            "Vérifiez dans votre bibliothèque vidéo"
          )}
        </UIText>

        <UIText
          size="sm"
          color={currentTheme.colors.textSecondary}
          style={tw`mb-2`}
        >
          •{" "}
          {t(
            "preview.notFound.suggestion2",
            "Réessayez l'enregistrement si nécessaire"
          )}
        </UIText>

        <UIText size="sm" color={currentTheme.colors.textSecondary}>
          •{" "}
          {t(
            "preview.notFound.suggestion3",
            "Vérifiez l'espace de stockage disponible"
          )}
        </UIText>
      </View>

      {/* Boutons d'action */}
      <View style={tw`w-full gap-3`}>
        <TouchableOpacity
          style={[
            tw`py-4 px-6 rounded-xl flex-row items-center justify-center`,
            { backgroundColor: currentTheme.colors.primary },
          ]}
          onPress={() => navigation.navigate("Home" as never)}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={20}
            color={currentTheme.colors.background}
            style={tw`mr-2`}
          />
          <UIText
            size="base"
            weight="semibold"
            color={currentTheme.colors.background}
          >
            {t("preview.notFound.goHome", "Retour à l'accueil")}
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw`py-4 px-6 rounded-xl flex-row items-center justify-center border`,
            {
              borderColor: currentTheme.colors.border,
              backgroundColor: "transparent",
            },
          ]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color={currentTheme.colors.text}
            style={tw`mr-2`}
          />
          <UIText
            size="base"
            weight="semibold"
            color={currentTheme.colors.text}
          >
            {t("preview.notFound.goBack", "Retour")}
          </UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
