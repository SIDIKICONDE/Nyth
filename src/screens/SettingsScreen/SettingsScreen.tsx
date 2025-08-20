import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StatusBar, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import tw from "twrnc";
import BackButton from "../../components/common/BackButton";
import AccountModal from "../../components/settings/AccountModal";
import { UIText } from "../../components/ui/Typography";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";
import { LoadingState, SettingsSections } from "./components";
import { useScript, useSettings, useSettingsActions } from "./hooks";

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { profile } = useUserProfile();
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Hooks personnalisés
  const {
    settings,
    isSettingsLoaded,
    updateSetting,
    updateVideoSettings,
    saveSettingsToStorage,
    resetSettings,
    isSyncing,
  } = useSettings();

  const { script, scriptId } = useScript();

  const { isSaving, saveSettingsOnly, resetToDefaults } = useSettingsActions({
    settings,
    script,
    saveSettingsToStorage,
    resetSettings,
    updateSetting,
  });

  const handleAccountPress = () => {
    setShowAccountModal(true);
  };

  if (!isSettingsLoaded) {
    return <LoadingState />;
  }

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <StatusBar
        barStyle={currentTheme.isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.colors.background}
      />

      {/* Header moderne avec gradient */}
      <Animated.View
        entering={FadeInUp.duration(800)}
        style={[
          tw`relative z-10`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        <LinearGradient
          colors={[
            currentTheme.colors.primary + "15",
            currentTheme.colors.background + "00",
          ]}
          style={tw`absolute inset-0`}
        />

        <View style={tw`pt-12 pb-6 px-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <BackButton floating={false} />

            <View style={tw`flex-1 items-center`}>
              <UIText size="2xl" weight="bold" color={currentTheme.colors.text}>
                {t("settings.title", "Réglages")}
              </UIText>
            </View>

            {/* Bouton compte utilisateur */}
            <Pressable
              onPress={handleAccountPress}
              style={({ pressed }) => [
                tw`p-1 rounded-full`,
                {
                  backgroundColor: pressed
                    ? currentTheme.colors.primary + "20"
                    : "transparent",
                  shadowColor: currentTheme.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
            >
              {profile?.photoURL ? (
                (() => {
                  const buildUri = (u: string, updatedAt?: string) => {
                    const sep = u.includes("?") ? "&" : "?";
                    const ts = updatedAt
                      ? Date.parse(updatedAt) || Date.now()
                      : Date.now();
                    return `${u}${sep}ts=${ts}`;
                  };
                  const uriWithCacheKey = buildUri(
                    profile.photoURL,
                    profile.updatedAt
                  );
                  return (
                    <Image
                      key={uriWithCacheKey}
                      source={{ uri: uriWithCacheKey }}
                      style={[
                        tw`w-10 h-10 rounded-full`,
                        {
                          borderWidth: 2,
                          borderColor: currentTheme.colors.primary,
                        },
                      ]}
                    />
                  );
                })()
              ) : (
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center`,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      borderWidth: 2,
                      borderColor: currentTheme.colors.primary,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-circle"
                    size={24}
                    color={currentTheme.colors.primary}
                  />
                </View>
              )}
            </Pressable>
          </View>

          {/* Indicateur de synchronisation */}
          {isSyncing && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={tw`mt-3 flex-row items-center justify-center`}
            >
              <View
                style={[
                  tw`flex-row items-center px-3 py-2 rounded-full`,
                  { backgroundColor: currentTheme.colors.primary + "15" },
                ]}
              >
                <MaterialCommunityIcons
                  name="sync"
                  size={16}
                  color={currentTheme.colors.primary}
                  style={tw`mr-2`}
                />
                <UIText
                  size="sm"
                  weight="medium"
                  color={currentTheme.colors.primary}
                >
                  {t("settings.syncing", "Synchronisation...")}
                </UIText>
              </View>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* Contenu principal */}
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-24`}
      >
        <View style={tw`px-4`}>
          {/* Sections des réglages */}
          <Animated.View entering={FadeInDown.delay(100).duration(800)}>
            <SettingsSections
              settings={settings}
              onUpdateSetting={updateSetting}
              onVideoSettingsChange={updateVideoSettings}
              scriptId={scriptId}
            />
          </Animated.View>

          {/* Footer avec informations */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <View style={tw`items-center py-6`}>
              <UIText
                size="xs"
                style={tw`text-center`}
                color={currentTheme.colors.textSecondary}
              >
                {t("settings.footer", "Visions • Version 1.0")}
              </UIText>
              <UIText
                size="xs"
                style={tw`text-center mt-1`}
                color={currentTheme.colors.textSecondary}
              >
                {t(
                  "settings.footerSubtitle",
                  "Conçu avec ♥ pour les créateurs"
                )}
              </UIText>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Modal de compte */}
      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </View>
  );
}
