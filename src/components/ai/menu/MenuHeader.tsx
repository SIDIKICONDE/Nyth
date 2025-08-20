import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as React from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../../contexts/AuthContext";
import { useUserProfile } from "../../../contexts/UserProfileContext";
import { getUserLabelLastName } from "@/utils/nameUtils";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { RootStackParamList } from "../../../types";
import { Label, UIText } from "../../ui/Typography";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('MenuHeader');

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface MenuHeaderProps {
  onNewConversation: () => void | Promise<void>;
  onClose: () => void;
  onOpenChatSettings?: () => void;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({
  onNewConversation,
  onClose,
  onOpenChatSettings,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isCreating, setIsCreating] = React.useState(false);

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(" ");
      return names
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <View style={tw`px-5 mb-4`}>
      {/* Section Profil */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          {/* Avatar et infos utilisateur */}
          <TouchableOpacity
            style={tw`flex-row items-center flex-1`}
            onPress={() => {
              onClose();
              navigation.navigate("Profile");
            }}
            activeOpacity={0.7}
          >
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={[
                  tw`w-12 h-12 rounded-full`,
                  {
                    borderWidth: 2,
                    borderColor: currentTheme.colors.border,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  tw`w-12 h-12 rounded-full items-center justify-center`,
                  {
                    backgroundColor: currentTheme.colors.accent + "20",
                    borderWidth: 2,
                    borderColor: currentTheme.colors.accent + "40",
                  },
                ]}
              >
                <UIText
                  size="base"
                  weight="bold"
                  color={currentTheme.colors.accent}
                >
                  {getUserInitials()}
                </UIText>
              </View>
            )}

            <View style={tw`ml-3 flex-1`}>
              <UIText
                size="base"
                weight="semibold"
                color={currentTheme.colors.text}
                numberOfLines={1}
              >
                {getUserLabelLastName(profile, user, (key, def) =>
                  def !== undefined ? t(key, { defaultValue: def }) : t(key)
                )}
              </UIText>
              <UIText
                size="xs"
                color={currentTheme.colors.textSecondary}
                numberOfLines={1}
              >
                {user?.email || t("common.guest")}
              </UIText>
            </View>
          </TouchableOpacity>

          {/* Bouton accueil */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              navigation.navigate("Home");
            }}
            style={[
              tw`ml-3 p-2.5 rounded-full`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="home-variant"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Boutons d'accès rapide */}
        <View style={tw`flex-row gap-2 mb-4`}>
          {/* Bouton Paramètres de chat (maintenant incluant les polices) */}
          <TouchableOpacity
            onPress={() => {
              logger.debug("Bouton Réglages cliqué");
              onOpenChatSettings?.();
            }}
            style={[
              tw`flex-1 flex-row items-center justify-center py-3 px-3 rounded-xl`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                borderWidth: 1,
                borderColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            ]}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color={currentTheme.colors.accent}
            />
            <UIText
              size="xs"
              weight="semibold"
              color={currentTheme.colors.accent}
              style={tw`ml-2`}
            >
              Réglages du Chat
            </UIText>
          </TouchableOpacity>
        </View>

        {/* Ligne de séparation élégante */}
        <View
          style={[
            tw`h-px mx-2`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        />
      </View>

      {/* Titre de la section */}
      <Label
        size="xs"
        weight="semibold"
        color={currentTheme.colors.textSecondary}
        style={[
          tw`uppercase mb-3 px-1`,
          {
            letterSpacing: 1.2,
          },
        ]}
      >
        {t("menu.conversations")}
      </Label>

      {/* Bouton Nouvelle conversation style Apple */}
      <TouchableOpacity
        onPress={async () => {
          if (isCreating) return;

          try {
            setIsCreating(true);
            await onNewConversation();
            onClose();
          } catch (error) {
            logger.error(
              "Erreur lors de la création d'une nouvelle conversation:",
              error
            );
          } finally {
            setIsCreating(false);
          }
        }}
        disabled={isCreating}
        style={[
          tw`flex-row items-center justify-center py-3 px-4 rounded-2xl`,
          {
            backgroundColor: isCreating
              ? currentTheme.colors.surface
              : currentTheme.colors.accent,
            opacity: isCreating ? 0.7 : 1,
          },
        ]}
        activeOpacity={isCreating ? 1 : 0.8}
      >
        {isCreating ? (
          <ActivityIndicator
            size="small"
            color={currentTheme.isDark ? "#FFFFFF" : currentTheme.colors.text}
            style={tw`mr-2`}
          />
        ) : (
          <View
            style={[
              tw`w-6 h-6 rounded-full items-center justify-center mr-2`,
              {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          </View>
        )}
        <UIText
          size="sm"
          weight="semibold"
          color={isCreating ? currentTheme.colors.text : "#FFFFFF"}
        >
          {isCreating
            ? t("menu.creating", "Création...")
            : t("menu.newConversation", "Nouvelle conversation")}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};

export default MenuHeader;
