import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { Caption } from "../../../../../../components/ui/Typography";

interface ProfileHintProps {
  hasPhoto: boolean;
  currentTheme: any;
  t: (key: string, defaultValue: string) => string;
}

export const ProfileHint: React.FC<ProfileHintProps> = ({
  hasPhoto,
  currentTheme,
  t,
}) => {
  if (hasPhoto) return null;

  return (
    <View style={tw`mx-4 mt-2 mb-4`}>
      <Caption
        style={{ 
          color: currentTheme.colors.textSecondary,
          textAlign: "center"
        }}
      >
        <MaterialCommunityIcons
          name="camera-plus-outline"
          size={12}
          color={currentTheme.colors.textSecondary}
        />{" "}
        {t(
          "profile.imageSelector.hint",
          "Touchez l'avatar pour ajouter une photo"
        )}
      </Caption>
    </View>
  );
};
