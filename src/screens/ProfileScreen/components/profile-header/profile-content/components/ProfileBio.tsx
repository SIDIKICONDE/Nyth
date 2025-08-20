import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { ContentText } from "../../../../../../components/ui/Typography";

interface ProfileBioProps {
  bio?: string;
  currentTheme: any;
}

export const ProfileBio: React.FC<ProfileBioProps> = ({
  bio,
  currentTheme,
}) => {
  if (!bio) return null;

  return (
    <View
      style={[
        tw`mx-4 mb-3 p-3 rounded-xl relative overflow-hidden`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderWidth: 1,
          borderColor: currentTheme.colors.border + "50",
        },
      ]}
    >
      {/* Icône de citation plus petite */}
      <MaterialCommunityIcons
        name="format-quote-open"
        size={14}
        color={currentTheme.colors.accent + "40"}
        style={tw`absolute top-1 left-2`}
      />

      {/* Texte de la bio compact */}
      <ContentText
        size="sm"
        align="center"
        style={[
          tw`italic px-4`,
          {
            color: currentTheme.colors.text,
            lineHeight: 20,
          },
        ]}
      >
        {bio}
      </ContentText>
    </View>
  );
};
