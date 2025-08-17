import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";

export const NotSupportedView: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeIn} style={tw`p-4`}>
      <View
        style={[
          tw`p-6 rounded-2xl items-center`,
          { backgroundColor: `${currentTheme.colors.surface}10` },
        ]}
      >
        <View
          style={[
            tw`p-3 rounded-full mb-3`,
            { backgroundColor: `${currentTheme.colors.textSecondary}10` },
          ]}
        >
          <MaterialCommunityIcons
            name="fingerprint-off"
            size={32}
            color={currentTheme.colors.textSecondary}
          />
        </View>
        <UIText
          weight="medium"
          style={[tw`text-center`, { color: currentTheme.colors.text }]}
        >
          {t("biometric.notSupported", "Non supporté")}
        </UIText>
        <UIText
          size="sm"
          style={[
            tw`text-center mt-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t(
            "biometric.notSupportedDesc",
            "Votre appareil ne supporte pas l'authentification biométrique"
          )}
        </UIText>
      </View>
    </Animated.View>
  );
};
