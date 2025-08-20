import { UIText } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, View } from "react-native";
import tw from "twrnc";

interface UserIconProps {
  size?: number;
  showExpandedMenu?: boolean;
}

export const UserIcon: React.FC<UserIconProps> = ({
  size = 24,
  showExpandedMenu = false,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentTheme } = useTheme();

  const photoURL = profile?.photoURL || user?.photoURL;
  const displayName =
    profile?.displayName ||
    user?.displayName ||
    (user as { name?: string })?.name;

  // Si l'utilisateur a une photo
  if (user && !user.isGuest && photoURL) {
    return (
      <View
        style={[
          tw`rounded-full overflow-hidden`,
          {
            width: size,
            height: size,
          },
        ]}
      >
        <Image
          source={{ uri: photoURL }}
          style={[tw`w-full h-full`]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Si l'utilisateur est connecté mais sans photo
  if (user && !user.isGuest && !photoURL) {
    return (
      <View
        style={[
          tw`rounded-full items-center justify-center`,
          {
            width: size,
            height: size,
            backgroundColor: currentTheme.colors.primary,
          },
        ]}
      >
        <UIText
          weight="bold"
          style={[tw`text-white`, { fontSize: size * 0.4 }]}
        >
          {displayName
            ? displayName.charAt(0).toUpperCase()
            : user.email?.charAt(0).toUpperCase() || "U"}
        </UIText>
      </View>
    );
  }

  // Utilisateur invité ou non connecté
  return (
    <MaterialCommunityIcons
      name={
        showExpandedMenu
          ? "close"
          : user?.isGuest
          ? "account-plus"
          : "account-outline"
      }
      size={size}
      color={user?.isGuest ? "#10B981" : currentTheme.colors.primary}
    />
  );
};
