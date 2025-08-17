import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import {
  Caption,
  HeadingText,
} from "../../../../../../components/ui/Typography";

interface ProfileBasicInfoProps {
  displayName: string;
  email?: string | null;
  currentTheme: any;
}

export const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  displayName,
  email,
  currentTheme,
}) => {
  return (
    <View style={tw`w-full`}>
      {/* Nom avec ligne décorative intégrée */}
      <View style={tw`items-center mb-2`}>
        <HeadingText
          size="2xl"
          weight="bold"
          align="center"
          style={{ color: currentTheme.colors.text }}
        >
          {displayName}
        </HeadingText>

        {/* Ligne décorative plus fine */}
        <LinearGradient
          colors={[
            "transparent",
            currentTheme.colors.primary + "40",
            currentTheme.colors.secondary + "40",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`h-0.5 w-16 mt-1`}
        />
      </View>

      {/* Email compact */}
      {email && (
        <View style={tw`flex-row items-center justify-center mb-3`}>
          <MaterialCommunityIcons
            name="email-outline"
            size={12}
            color={currentTheme.colors.textSecondary}
          />
          <Caption
            style={[tw`ml-1.5`, { color: currentTheme.colors.textSecondary }]}
          >
            {email}
          </Caption>
        </View>
      )}
    </View>
  );
};
