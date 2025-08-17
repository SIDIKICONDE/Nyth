import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import tw from "twrnc";
import { UserProfileUpdate } from "../../../types/user";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { useContrastOptimization } from "../../../hooks/useContrastOptimization";
import { InputField } from "./InputField";

interface PersonalSectionProps {
  formData: UserProfileUpdate;
  onUpdateFormData: (data: Partial<UserProfileUpdate>) => void;
}

export const PersonalSection: React.FC<PersonalSectionProps> = ({
  formData,
  onUpdateFormData,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();

  return (
    <View style={tw`flex-1`}>
      {/* En-tête de section avec gradient */}
      <LinearGradient
        colors={
          currentTheme.isDark
            ? ["#8b5cf6", "#a855f7"] // Dégradé violet pour thèmes sombres
            : [currentTheme.colors.primary, `${currentTheme.colors.primary}DD`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`p-6 rounded-3xl mb-6`,
          {
            shadowColor: currentTheme.isDark
              ? "#8b5cf6"
              : currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          },
        ]}
      >
        <View style={tw`flex-row items-center`}>
          <View
            style={[
              tw`p-3 rounded-2xl mr-4`,
              { backgroundColor: "rgba(255, 255, 255, 0.2)" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={28}
              color="#FFFFFF"
            />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-2xl font-bold text-white`}>
              {t("profile.editProfile.sections.personal")}
            </Text>
            <Text style={tw`text-sm mt-1 text-white opacity-90`}>
              Informations personnelles et contact
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Champs du formulaire avec nouveau style */}
      <View
        style={[
          tw`rounded-3xl overflow-hidden`,
          {
            backgroundColor: currentTheme.colors.surface,
          },
        ]}
      >
        {/* Effet de bordure gradient */}
        <LinearGradient
          colors={[
            `${currentTheme.colors.primary}20`,
            `${currentTheme.colors.primary}05`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-0.5`}
        >
          <View
            style={[
              tw`p-6 rounded-3xl`,
              {
                backgroundColor: currentTheme.colors.surface,
              },
            ]}
          >
            <InputField
              label={t("profile.editProfile.fields.displayName")}
              value={formData.displayName || ""}
              onChangeText={(text) => onUpdateFormData({ displayName: text })}
              placeholder={
                t("profile.editProfile.placeholders.displayName") ||
                "Nom d'affichage"
              }
              icon="account-star"
            />

            <View style={tw`flex-row -mx-2`}>
              <InputField
                label={t("profile.editProfile.fields.firstName")}
                value={formData.firstName || ""}
                onChangeText={(text) => onUpdateFormData({ firstName: text })}
                placeholder={
                  t("profile.editProfile.placeholders.firstName") || "Prénom"
                }
                icon="account"
                style={tw`flex-1 mx-2`}
              />
              <InputField
                label={t("profile.editProfile.fields.lastName")}
                value={formData.lastName || ""}
                onChangeText={(text) => onUpdateFormData({ lastName: text })}
                placeholder={
                  t("profile.editProfile.placeholders.lastName") || "Nom"
                }
                icon="account-outline"
                style={tw`flex-1 mx-2`}
              />
            </View>

            <InputField
              label={t("profile.editProfile.fields.bio")}
              value={formData.bio || ""}
              onChangeText={(text) => onUpdateFormData({ bio: text })}
              placeholder={t("profile.editProfile.placeholders.bio") || "Bio"}
              icon="text-box"
              multiline={true}
              maxLength={90}
            />

            <InputField
              label={t("profile.editProfile.fields.phoneNumber")}
              value={formData.phoneNumber || ""}
              onChangeText={(text) => onUpdateFormData({ phoneNumber: text })}
              placeholder={
                t("profile.editProfile.placeholders.phoneNumber") || "Téléphone"
              }
              icon="phone"
              keyboardType="phone-pad"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};
