import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { memo } from "react";
import { Linking, Text, TextInput, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { SocialField as SocialFieldType } from "../types";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('SocialField');

interface SocialFieldProps {
  field: SocialFieldType;
  value: string;
  onChangeText: (text: string) => void;
}

const getSocialColor = (platform: string): string => {
  const colors = {
    twitter: "#1DA1F2",
    linkedin: "#0077B5",
    github: "#333333",
    youtube: "#FF0000",
    instagram: "#E4405F",
  };
  return colors[platform as keyof typeof colors] || "#000";
};

export const SocialField = memo<SocialFieldProps>(
  ({ field, value, onChangeText }) => {
  const { currentTheme } = useTheme();
    const { t } = useTranslation();
  const socialColor = getSocialColor(field.name);
  const hasValue = value?.length > 0;

  const handleOpenProfile = () => {
    if (hasValue) {
      const url = `${field.baseUrl}${value}`;
        Linking.openURL(url).catch((err) =>
          logger.error("Failed to open URL:", err)
        );
    }
  };

  return (
    <View style={tw`mb-4`}>
      <LinearGradient
          colors={
            hasValue
              ? [socialColor + "10", socialColor + "05"]
              : ["#00000005", "#00000002"]
          }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`rounded-3xl p-0.5`,
          {
              shadowColor: hasValue ? socialColor : "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: hasValue ? 0.2 : 0.1,
            shadowRadius: 12,
            elevation: 5,
            },
        ]}
      >
          <View
            style={[
          tw`rounded-3xl overflow-hidden`,
          { 
            backgroundColor: currentTheme.colors.surface,
              },
            ]}
          >
          {/* En-tête du réseau social avec effet glassmorphism */}
            <View
              style={[
            tw`p-4`,
            { 
                  backgroundColor: hasValue
                    ? socialColor + "08"
                    : currentTheme.colors.background + "50",
                },
              ]}
            >
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center flex-1`}>
                <LinearGradient
                    colors={[socialColor + "20", socialColor + "10"]}
                  style={tw`p-3 rounded-2xl mr-3`}
                >
                  <MaterialCommunityIcons 
                    name={field.icon}
                    size={24} 
                    color={socialColor}
                  />
                </LinearGradient>
                <View style={tw`flex-1`}>
                    <Text
                      style={[
                        tw`text-lg font-bold`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      {t(
                        `profile.editProfile.social.placeholders.${field.name}`,
                        field.placeholder
                      )}
                  </Text>
                  {hasValue && (
                      <Text
                        style={[tw`text-xs mt-0.5`, { color: socialColor }]}
                      >
                        {field.baseUrl}
                        {value}
                    </Text>
                  )}
                </View>
              </View>
              {hasValue && (
                  <View
                    style={[
                  tw`px-3 py-1.5 rounded-full`,
                      { backgroundColor: socialColor + "20" },
                    ]}
                  >
                    <Text
                      style={[tw`text-xs font-bold`, { color: socialColor }]}
                    >
                      {t("profile.editProfile.social.connected", "✓ Connecté")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Champ de saisie moderne */}
          <View style={tw`p-4 pt-0`}>
              <View
                style={[
              tw`flex-row items-center rounded-2xl overflow-hidden`,
                  { backgroundColor: currentTheme.colors.background },
                ]}
              >
                <View
                  style={[
                tw`px-4 py-3.5`,
                    { backgroundColor: socialColor + "10" },
                  ]}
                >
                  <Text
                    style={[tw`text-base font-bold`, { color: socialColor }]}
                  >
                  @
                </Text>
              </View>
              <TextInput
                  value={value || ""}
                onChangeText={(text) => {
                    const cleanText = text.replace(/[^a-zA-Z0-9._-]/g, "");
                  onChangeText(cleanText);
                }}
                style={[
                  tw`flex-1 px-4 py-3.5 text-base font-medium`,
                  { 
                    color: currentTheme.colors.text,
                    },
                ]}
                  placeholder={t(
                    "profile.editProfile.social.username",
                    "nom_utilisateur"
                  )}
                  placeholderTextColor={
                    currentTheme.colors.textSecondary + "80"
                  }
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {/* Bouton de prévisualisation amélioré */}
            {hasValue && (
              <TouchableOpacity 
                onPress={handleOpenProfile}
                activeOpacity={0.8}
              >
                <LinearGradient
                    colors={[socialColor, socialColor + "DD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tw`mt-3 p-3 rounded-2xl flex-row items-center justify-center`}
                >
                  <MaterialCommunityIcons 
                    name="open-in-new" 
                    size={18} 
                    color="#FFFFFF"
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-sm font-bold text-white`}>
                      {t(
                        "profile.editProfile.social.viewProfile",
                        "Voir le profil"
                      )}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
  }
);
