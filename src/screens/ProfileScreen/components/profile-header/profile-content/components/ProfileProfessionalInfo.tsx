import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { UIText } from "../../../../../../components/ui/Typography";

interface ProfileProfessionalInfoProps {
  profession?: string;
  company?: string;
  currentTheme: any;
}

export const ProfileProfessionalInfo: React.FC<
  ProfileProfessionalInfoProps
> = ({ profession, company, currentTheme }) => {
  if (!profession && !company) return null;

  return (
    <View style={tw`mx-4 mb-3`}>
      {/* Informations professionnelles en ligne */}
      <View style={tw`flex-row flex-wrap justify-center gap-2`}>
        {profession && (
          <View
            style={[
              tw`flex-row items-center px-3 py-2 rounded-full`,
              {
                backgroundColor: currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: currentTheme.colors.primary + "30",
              },
            ]}
          >
            <View
              style={[
                tw`w-6 h-6 rounded-full items-center justify-center mr-2`,
                { backgroundColor: currentTheme.colors.primary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="briefcase-variant"
                size={12}
                color={currentTheme.colors.primary}
              />
            </View>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {profession}
            </UIText>
          </View>
        )}

        {company && (
          <View
            style={[
              tw`flex-row items-center px-3 py-2 rounded-full`,
              {
                backgroundColor: currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: currentTheme.colors.secondary + "30",
              },
            ]}
          >
            <View
              style={[
                tw`w-6 h-6 rounded-full items-center justify-center mr-2`,
                { backgroundColor: currentTheme.colors.secondary + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={12}
                color={currentTheme.colors.secondary}
              />
            </View>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {company}
            </UIText>
          </View>
        )}
      </View>
    </View>
  );
};
