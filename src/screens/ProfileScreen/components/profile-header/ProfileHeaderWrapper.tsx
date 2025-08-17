import React from "react";
import { View } from "react-native";
import { ProfileHeaderProps } from "./types";
import { GradientHeader } from "./GradientHeader";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileContent } from "./ProfileContent";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { useProfileImageManager } from "./useProfileImageManager";

// Composant classique (seul design disponible)
const ClassicProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onEditPress,
  onBackPress,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { handleImagePicker } = useProfileImageManager(profile);
  const displayName =
    profile.displayName ||
    profile.email?.split("@")[0] ||
    t("profile.anonymous", "Anonyme");

  return (
    <View>
      <GradientHeader currentTheme={currentTheme} onBackPress={onBackPress}>
        <ProfileAvatar
          profile={profile}
          displayName={displayName}
          onImagePicker={handleImagePicker}
          currentTheme={currentTheme}
        />
      </GradientHeader>

      <ProfileContent
        profile={profile}
        displayName={displayName}
        currentTheme={currentTheme}
        t={t}
      />
    </View>
  );
};

export const ProfileHeaderWrapper: React.FC<ProfileHeaderProps> = (props) => {
  return <ClassicProfileHeader {...props} />;
};
