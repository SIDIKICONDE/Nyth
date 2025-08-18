import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import tw from "twrnc";
import { CollapsibleSection } from "../../components/common";
import BackButton from "../../components/common/BackButton";
import { useTheme } from "../../contexts/ThemeContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useProfilePreferencesSync } from "../../hooks/useProfilePreferencesSync";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";
import AdminButton from "./components/AdminButton";
import ProfileAchievements from "./components/ProfileAchievements";
import ProfileActions from "./components/ProfileActions";
import ProfileAnalytics from "./components/ProfileAnalytics";
import ProfileHeader from "./components/ProfileHeader";
import ProfileSections from "./components/ProfileSections";
import ProfileStats from "./components/ProfileStats";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { profile, isLoading, refreshProfile } = useUserProfile();
  const {
    preferences,
    updateDesign,
    updateDisplayPreference,
    isLoading: isLoadingPrefs,
  } = useProfilePreferencesSync();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate("EditProfile" as any);
  };

  const handleToggleAnalytics = () => {
    updateDisplayPreference("showAnalytics", !preferences.showAnalytics);
  };

  const handleToggleAchievements = () => {
    updateDisplayPreference("showAchievements", !preferences.showAchievements);
  };

  if ((isLoading || isLoadingPrefs) && !isRefreshing) {
    return (
      <View
        style={[
          tw`flex-1 items-center justify-center`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <BackButton />

      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingBottom: 96,
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.colors.primary]}
            tintColor={currentTheme.colors.primary}
          />
        }
      >
        {profile && (
          <>
            {/* En-tête du profil */}
            <ProfileHeader profile={profile} onEditPress={handleEditProfile} />

            {/* Bouton d'administration (si admin) */}
            <AdminButton />

            {/* Statistiques */}
            <ProfileStats stats={profile.stats} />

            {/* Analytics avec bouton collapse */}
            <CollapsibleSection
              title={t("profile.analytics.showAnalytics")}
              icon="chart-bar"
              iconColor={currentTheme.colors.primary}
              isOpen={preferences.showAnalytics}
              onToggle={handleToggleAnalytics}
            >
              <ProfileAnalytics />
            </CollapsibleSection>

            {/* Badges et Réalisations avec bouton collapse */}
            <CollapsibleSection
              title={t("profile.achievements.showAchievements")}
              icon="trophy-award"
              iconColor={currentTheme.colors.secondary}
              isOpen={preferences.showAchievements}
              onToggle={handleToggleAchievements}
            >
              <ProfileAchievements />
            </CollapsibleSection>

            {/* Sections du profil */}
            <ProfileSections profile={profile} />

            {/* Actions */}
            <ProfileActions />
          </>
        )}
      </ScrollView>
    </View>
  );
}
