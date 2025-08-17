import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { View, Platform } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface SecurityHeaderProps {
  apiKeysCount: number;
  biometricAvailable: boolean;
}

export const SecurityHeader: React.FC<SecurityHeaderProps> = ({
  apiKeysCount,
  biometricAvailable,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: currentTheme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    android: {
      elevation: 3,
    },
  });

  const gradientColors = Platform.select({
    ios: [
      `${currentTheme.colors.primary}20`,
      `${currentTheme.colors.primary}05`,
    ],
    android: [
      currentTheme.isDark
        ? `${currentTheme.colors.primary}25`
        : `${currentTheme.colors.primary}15`,
      currentTheme.isDark
        ? `${currentTheme.colors.primary}10`
        : `${currentTheme.colors.primary}05`,
    ],
  }) || [
    `${currentTheme.colors.primary}20`,
    `${currentTheme.colors.primary}05`,
  ];

  return (
    <View
      style={[
        tw`mb-3 rounded-xl overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderWidth: Platform.OS === "android" ? 0.5 : 0,
          borderColor:
            Platform.OS === "android"
              ? currentTheme.colors.border
              : "transparent",
        },
        shadowStyle,
      ]}
    >
      <LinearGradient colors={gradientColors} style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`p-2 rounded-full`,
                { backgroundColor: `${currentTheme.colors.primary}30` },
              ]}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={28}
                color={currentTheme.colors.primary}
              />
            </View>
            <View style={tw`ml-3`}>
              <UIText size="lg" weight="bold" color={currentTheme.colors.text}>
                {t("security.title", "Sécurité")}
              </UIText>
              <UIText size="xs" color={currentTheme.colors.textSecondary}>
                {apiKeysCount} {t("security.keys.count", "clés protégées")}
              </UIText>
            </View>
          </View>

          {/* Indicateur biométrique */}
          <View
            style={[
              tw`px-3 py-1.5 rounded-full flex-row items-center`,
              {
                backgroundColor: biometricAvailable ? "#10b98120" : "#ef444420",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={biometricAvailable ? "fingerprint" : "fingerprint-off"}
              size={16}
              color={biometricAvailable ? "#10b981" : "#ef4444"}
            />
            <UIText
              size="xs"
              weight="medium"
              color={biometricAvailable ? "#10b981" : "#ef4444"}
              style={tw`ml-1`}
            >
              {biometricAvailable ? "Actif" : "Inactif"}
            </UIText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};
