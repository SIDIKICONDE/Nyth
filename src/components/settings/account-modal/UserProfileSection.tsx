import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useUserProfile } from "../../../contexts/UserProfileContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { UIText } from "../../ui/Typography";
import { UserAvatar } from "./UserAvatar";
import { UserProfileSectionProps } from "./types";

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  onClose,
  navigation,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleProfileNavigation = () => {
    onClose();
    navigation.navigate("ProfileScreen" as any);
  };

  return (
    <View style={tw`px-6 pb-8`}>
      <TouchableOpacity
        onPress={handleProfileNavigation}
        style={[
          tw`flex-row items-center mb-4 p-3 rounded-xl`,
          { backgroundColor: currentTheme.colors.background },
        ]}
        activeOpacity={0.7}
      >
        <View style={tw`mr-3`}>
          <UserAvatar photoURL={profile?.photoURL} />
        </View>

        <View style={tw`flex-1`}>
          <UIText size={16} weight="semibold" color={currentTheme.colors.text}>
            {profile?.displayName || currentUser?.name || t("auth.user.guest")}
          </UIText>
          <UIText size="xs" color={currentTheme.colors.textSecondary}>
            {profile?.email ||
              currentUser?.email ||
              t("settings.account.guestMode")}
          </UIText>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        style={[
          tw`flex-row items-center justify-center py-3 rounded-xl`,
          { backgroundColor: currentTheme.colors.background },
        ]}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="logout"
          size={20}
          color={currentTheme.colors.error}
          style={tw`mr-2`}
        />
        <UIText weight="medium" color={currentTheme.colors.error}>
          {t("settings.signOut.signOut")}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};
