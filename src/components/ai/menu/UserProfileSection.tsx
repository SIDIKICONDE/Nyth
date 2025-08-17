import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useUserProfile } from "../../../contexts/UserProfileContext";
import { UIText } from "../../ui/Typography";
import { getUserLabelLastName } from "@/utils/nameUtils";

interface UserProfileSectionProps {
  onNewConversation: () => void;
  onClose: () => void;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  onNewConversation,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    const name = profile?.displayName || user?.displayName || user?.name || "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={tw`px-3 pt-3 pb-2`}>
      <View
        style={[
          tw`flex-row items-center p-2 rounded-lg`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
          },
        ]}
      >
        {/* Avatar */}
        <View style={tw`mr-2`}>
          {profile?.photoURL || user?.photoURL ? (
            <Image
              source={{ uri: profile?.photoURL || user?.photoURL || "" }}
              style={[
                tw`w-8 h-8 rounded-full`,
                {
                  borderWidth: 1.5,
                  borderColor: currentTheme.colors.accent + "40",
                },
              ]}
            />
          ) : (
            <View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center`,
                {
                  backgroundColor: currentTheme.colors.accent + "20",
                  borderWidth: 1.5,
                  borderColor: currentTheme.colors.accent + "40",
                },
              ]}
            >
              <UIText
                size="xs"
                weight="bold"
                color={currentTheme.colors.accent}
              >
                {getUserInitials()}
              </UIText>
            </View>
          )}
        </View>

        {/* Informations utilisateur */}
        <View style={tw`flex-1`}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.text}
            numberOfLines={1}
          >
            {getUserLabelLastName(profile, user)}
          </UIText>
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            numberOfLines={1}
          >
            {profile?.email || user?.email || "Mode invité"}
          </UIText>
        </View>

        {/* Bouton nouveau message */}
        <TouchableOpacity
          onPress={() => {
            onNewConversation();
            onClose();
          }}
          style={[
            tw`w-7 h-7 rounded-full items-center justify-center`,
            {
              backgroundColor: currentTheme.colors.accent + "20",
            },
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="message-plus-outline"
            size={16}
            color={currentTheme.colors.accent}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserProfileSection;
