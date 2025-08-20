import BackButton from "@/components/common/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('HelpHeader');

export const HelpHeader: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Debug: afficher les données utilisateur
  logger.debug("HelpHeader - user data:", {
    user,
    isGuest: user?.isGuest,
    name: user?.name,
    displayName: user?.displayName,
    email: user?.email,
  });

  // Déterminer le nom à afficher
  const getUserName = () => {
    if (!user || user.isGuest) return null;

    // Priorité : displayName > name > partie avant @ de l'email
    if (user.displayName) return user.displayName;
    if (user.name) return user.name;
    if (user.email) {
      // Extraire la partie avant @ de l'email
      return user.email.split("@")[0];
    }
    return t("profile.user", "Utilisateur");
  };

  const userName = getUserName();

  return (
    <View>
      <BackButton right={4} left={undefined} />
      <Animated.View
        entering={FadeInDown.duration(800)}
        style={tw`px-4 pt-4 pb-6`}
      >
        <Text
          style={[
            tw`text-3xl font-bold mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          {user?.isGuest
            ? t("help.title.guest", "Bienvenue ! 👋")
            : t("help.title.user", "Bonjour {{name}} ! 👋", { name: userName })}
        </Text>
        <Text
          style={[tw`text-base`, { color: currentTheme.colors.textSecondary }]}
        >
          {t(
            "help.subtitle",
            "Découvrez tout ce que vous pouvez faire avec Nyth"
          )}
        </Text>
      </Animated.View>
    </View>
  );
};
