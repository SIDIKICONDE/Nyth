import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { HeadingText } from "../../../../components/ui/Typography";
import { ProfileAvatarProps } from "./types";
import { responsiveSpacing, responsiveFontSize } from "../../../../utils/responsive";

const AvatarEditButton: React.FC<{
  backgroundColor: string;
  iconColor: string;
}> = ({ backgroundColor, iconColor }) => {
  const buttonSize = responsiveSpacing(36);
  const iconSize = responsiveFontSize(18);
  
  return (
    <View
      style={[
        tw`absolute bottom-0 right-0 rounded-full items-center justify-center border-2`,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: backgroundColor,
          borderColor: "rgba(255,255,255,0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        },
      ]}
    >
      <MaterialCommunityIcons name="camera-plus" size={iconSize} color={iconColor} />
    </View>
  );
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  profile,
  displayName,
  onImagePicker,
  currentTheme,
}) => {
  const avatarSize = responsiveSpacing(96);
  const marginTop = responsiveSpacing(32);
  const borderWidth = responsiveSpacing(4);
  
  return (
    <View style={[tw`flex-1 items-center justify-center`, { marginTop }]}>
      <TouchableOpacity
        onPress={onImagePicker}
        style={[
          tw`rounded-full relative`,
          {
            width: avatarSize,
            height: avatarSize,
            borderWidth,
            borderColor: "rgba(255,255,255,0.3)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 10,
            backgroundColor: currentTheme.colors.background,
          },
        ]}
        activeOpacity={0.7}
      >
      {profile.photoURL ? (
        (() => {
          const buildUri = (u: string, updatedAt?: string) => {
            const sep = u.includes("?") ? "&" : "?";
            const ts = updatedAt
              ? Date.parse(updatedAt) || Date.now()
              : Date.now();
            return `${u}${sep}ts=${ts}`;
          };
          const uriWithCacheKey = buildUri(profile.photoURL, profile.updatedAt);
          return (
            <Image
              key={uriWithCacheKey}
              source={{ uri: uriWithCacheKey }}
              style={tw`w-full h-full rounded-full`}
            />
          );
        })()
      ) : (
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"]}
          style={tw`w-full h-full rounded-full items-center justify-center`}
        >
          <HeadingText
            size="2xl"
            weight="bold"
            style={{ color: currentTheme.colors.primary }}
          >
            {getInitials(displayName)}
          </HeadingText>
        </LinearGradient>
      )}

      <AvatarEditButton
        backgroundColor={currentTheme.colors.background}
        iconColor={currentTheme.colors.primary}
      />
          </TouchableOpacity>
    </View>
  );
};
