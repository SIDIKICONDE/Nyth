import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslatedTheme } from "../../hooks/useTranslatedThemes";
import { useTranslation } from "../../hooks/useTranslation";
import { RecordingSettings, RootStackParamList } from "../../types";
import { InstantSwitch } from "../common/InstantSwitch";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('DisplaySection');

type NavigationProp = StackNavigationProp<RootStackParamList, "Settings">;

interface DisplaySectionProps {
  settings: RecordingSettings;
  onUpdateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  scriptId?: string;
}

export default function DisplaySection({
  settings,
  onUpdateSetting,
  scriptId,
}: DisplaySectionProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const translatedTheme = useTranslatedTheme(currentTheme.id);
  // Variables de sélection d'affichage supprimées

  // Utiliser le nom traduit si disponible, sinon le nom original
  const displayThemeName = translatedTheme
    ? translatedTheme.name
    : currentTheme.name;
  const navigation = useNavigation<NavigationProp>();

  const navigateToThemeScreen = () => {
    navigation.navigate("Theme");
  };

  // Fonction supprimée car TeleprompterSettings n'existe plus
  // const navigateToTeleprompterSettings = () => {
  //   navigation.navigate('TeleprompterSettings', {
  //     scriptId: scriptId,
  //     returnScreen: 'Settings'
  //   });
  // };

  // Fonctions de sélection d'affichage supprimées

  return (
    <>
      <SectionHeader title={t("settings.display.title", "Affichage")} />
      <Card>
        <SettingRow
          icon="palette"
          iconColor="#ffffff"
          iconBgColor={currentTheme.colors.primary}
          title={t("settings.display.themes.title", "Thèmes")}
          rightElement={
            <TouchableOpacity
              onPress={navigateToThemeScreen}
              style={tw`flex-row items-center`}
            >
              <Text style={[tw`mr-2`, { color: currentTheme.colors.primary }]}>
                {displayThemeName}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentTheme.colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        {/* Bouton Téléprompter supprimé car TeleprompterSettings n'existe plus
        <SettingRow
          icon="text"
          iconColor="#ffffff"
          iconBgColor="#6366f1"
          title={t('settings.display.teleprompter.title', 'Téléprompter')}
          subtitle="Apparence pour basic"
          rightElement={
            <TouchableOpacity
              onPress={navigateToTeleprompterSettings}
              style={tw`flex-row items-center`}
            >
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={currentTheme.colors.textSecondary} 
              />
            </TouchableOpacity>
          }
        />
        */}

        {/* Section de sélection d'affichage supprimée */}

        <SettingRow
          icon="flip-horizontal"
          iconColor="#ffffff"
          iconBgColor={currentTheme.colors.accent}
          title={t("settings.display.mirrorMode.title", "Mode miroir")}
          rightElement={
            <InstantSwitch
              value={Boolean(settings.isMirrored)}
              onValueChange={(value) => {
                logger.debug("🪞 DisplaySection - Mode miroir toggle:", {
                  ancienneValeur: settings.isMirrored,
                  nouvelleValeur: value,
                  settings: settings,
                });
                onUpdateSetting("isMirrored", value);
              }}
              trackColor={{
                false: currentTheme.colors.border,
                true: currentTheme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          }
        />

        <SettingRow
          icon="text"
          iconColor="#ffffff"
          iconBgColor="#6b7280"
          title={t("settings.display.textShadow.title", "Ombre du texte")}
          subtitle={t(
            "settings.display.textShadow.subtitle",
            "Ajoute une ombre pour améliorer la lisibilité"
          )}
          rightElement={
            <InstantSwitch
              value={Boolean(settings.textShadow)}
              onValueChange={(value) => onUpdateSetting("textShadow", value)}
              trackColor={{
                false: currentTheme.colors.border,
                true: currentTheme.colors.primary,
              }}
              thumbColor="#ffffff"
            />
          }
        />
      </Card>
    </>
  );
}
