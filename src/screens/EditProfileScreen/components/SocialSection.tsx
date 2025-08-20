import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useCallback } from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { getSocialFields } from "../constants";
import type { SocialField as SocialFieldType } from "../types";
import { SocialField } from "./SocialField";

interface SocialSectionProps {
  socialUsernames: Record<string, string>;
  onUpdateSocialUsername: (field: string, value: string) => void;
}

export const SocialSection: React.FC<SocialSectionProps> = ({
  socialUsernames,
  onUpdateSocialUsername,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const socialFields = getSocialFields(t);

  const handleSocialChange = useCallback(
    (fieldName: string) => (value: string) => {
    onUpdateSocialUsername(fieldName, value);
    },
    [onUpdateSocialUsername]
  );

  return (
    <View style={tw`flex-1`}>
      {/* En-tête de section avec gradient */}
      <LinearGradient
        colors={["#8B5CF6", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`p-6 rounded-3xl mb-6`,
          {
            shadowColor: "#8B5CF6",
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
              name="share-variant" 
              size={28} 
              color="#FFFFFF" 
            />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-2xl font-bold text-white`}>
              {t("profile.sections.social", "Réseaux sociaux")}
            </Text>
            <Text style={tw`text-sm mt-1 text-white opacity-90`}>
              {t(
                "profile.editProfile.social.subtitle",
                "Connectez vos profils sociaux"
              )}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Liste des réseaux sociaux */}
      <View style={tw`flex-1`}>
        {socialFields.map((field: SocialFieldType) => (
          <SocialField 
            key={field.name} 
            field={field}
            value={socialUsernames[field.name] || ""}
            onChangeText={handleSocialChange(field.name)}
          />
        ))}
      </View>
    </View>
  );
}; 
