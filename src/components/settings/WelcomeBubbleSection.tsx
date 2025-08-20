import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { useWelcomeBubblePreferences } from "../../hooks/useWelcomeBubblePreferences";
import { InstantSwitch } from "../common/InstantSwitch";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";

export default function WelcomeBubbleSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    settings,
    isLoaded,
    updateFrequency,
    updateHeaderWelcome,
    resetSettings,
    getFrequencyLabel,
    getFrequencyDescription,
  } = useWelcomeBubblePreferences();

  const [showDetails, setShowDetails] = useState(false);

  if (!isLoaded) {
    return null;
  }

  const isEnabled = settings.frequency !== "never";

  const handleToggleEnabled = async (enabled: boolean) => {
    if (enabled) {
      // Activer avec la fréquence par défaut
      await updateFrequency("daily");
    } else {
      // Désactiver
      await updateFrequency("never");
    }
  };

  const handleFrequencyPress = () => {
    setShowDetails(!showDetails);
  };

  const handleFrequencySelect = async (frequency: string) => {
    await updateFrequency(frequency as any);
    setShowDetails(false);
  };

  const handleReset = () => {
    Alert.alert(
      t("settings.welcomeBubble.reset.title", "Réinitialiser"),
      t(
        "settings.welcomeBubble.reset.message",
        "Voulez-vous réinitialiser les paramètres des messages de bienvenue ?"
      ),
      [
        {
          text: t("common.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("common.reset", "Réinitialiser"),
          style: "destructive",
          onPress: resetSettings,
        },
      ]
    );
  };

  const frequencyOptions = [
    { value: "daily", label: getFrequencyLabel("daily") },
    { value: "session", label: getFrequencyLabel("session") },
    { value: "twice_daily", label: getFrequencyLabel("twice_daily") },
    { value: "once", label: getFrequencyLabel("once") },
    { value: "hourly", label: getFrequencyLabel("hourly") },
  ];

  return (
    <Card>
      <SectionHeader
        title={t("settings.welcomeBubble.title", "Messages de bienvenue")}
      />

      {/* Toggle principal */}
      <SettingRow
        icon="message-text"
        iconColor={
          isEnabled
            ? currentTheme.colors.primary
            : currentTheme.colors.textSecondary
        }
        iconBgColor={
          isEnabled
            ? currentTheme.colors.primary + "20"
            : currentTheme.colors.surface
        }
        title={t(
          "settings.welcomeBubble.enabled.title",
          "Activer les messages"
        )}
        subtitle={
          isEnabled
            ? t(
                "settings.welcomeBubble.enabled.description",
                "Messages personnalisés activés"
              )
            : t(
                "settings.welcomeBubble.disabled.description",
                "Aucun message ne s'affichera"
              )
        }
        rightElement={
          <InstantSwitch
            value={isEnabled}
            onValueChange={handleToggleEnabled}
            trackColor={{
              false: currentTheme.colors.border,
              true: currentTheme.colors.primary,
            }}
            thumbColor="#ffffff"
          />
        }
      />

      {/* Configuration de la fréquence */}
      {isEnabled && (
        <>
          {/* Option pour le message de bienvenue dans le header */}
          <SettingRow
            icon="card-text-outline"
            iconColor={
              settings.showHeaderWelcome
                ? currentTheme.colors.accent
                : currentTheme.colors.textSecondary
            }
            iconBgColor={
              settings.showHeaderWelcome
                ? currentTheme.colors.accent + "20"
                : currentTheme.colors.surface
            }
            title={t(
              "settings.welcomeBubble.header.title",
              "Message dans le header"
            )}
            subtitle={
              settings.showHeaderWelcome
                ? t(
                    "settings.welcomeBubble.header.enabled",
                    'Message "Bienvenue" visible'
                  )
                : t(
                    "settings.welcomeBubble.header.disabled",
                    "Seulement le nom d'utilisateur"
                  )
            }
            rightElement={
              <InstantSwitch
                value={settings.showHeaderWelcome}
                onValueChange={updateHeaderWelcome}
                trackColor={{
                  false: currentTheme.colors.border,
                  true: currentTheme.colors.accent,
                }}
                thumbColor="#ffffff"
              />
            }
          />

          <SettingRow
            icon="clock-outline"
            iconColor={currentTheme.colors.accent}
            iconBgColor={currentTheme.colors.accent + "20"}
            title={t("settings.welcomeBubble.frequency.title", "Fréquence")}
            subtitle={getFrequencyLabel(settings.frequency)}
            rightElement={
              <MaterialCommunityIcons
                name={showDetails ? "chevron-up" : "chevron-down"}
                size={24}
                color={currentTheme.colors.textSecondary}
              />
            }
            onPress={handleFrequencyPress}
          />

          {/* Options de fréquence détaillées */}
          {showDetails && (
            <View style={tw`mt-2 ml-4`}>
              {frequencyOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    tw`flex-row items-center justify-between py-3 px-4 rounded-lg mb-1`,
                    {
                      backgroundColor:
                        settings.frequency === option.value
                          ? currentTheme.colors.primary + "10"
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleFrequencySelect(option.value)}
                >
                  <View style={tw`flex-1`}>
                    <Text
                      style={[
                        tw`font-medium`,
                        {
                          color:
                            settings.frequency === option.value
                              ? currentTheme.colors.primary
                              : currentTheme.colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        tw`text-sm mt-1`,
                        { color: currentTheme.colors.textSecondary },
                      ]}
                    >
                      {getFrequencyDescription(option.value as any)}
                    </Text>
                  </View>
                  {settings.frequency === option.value && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={currentTheme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Statistiques compactes */}
          <View style={tw`mt-3 px-3`}>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {t(
                "settings.welcomeBubble.stats.showCount",
                "Messages affichés : {{count}}",
                { count: settings.showCount }
              )}
            </Text>
          </View>

          {/* Bouton de réinitialisation */}
          <TouchableOpacity
            style={[
              tw`mt-4 p-3 rounded-lg flex-row items-center justify-center`,
              { backgroundColor: currentTheme.colors.error + "15" },
            ]}
            onPress={handleReset}
          >
            <MaterialCommunityIcons
              name="restore"
              size={20}
              color={currentTheme.colors.error}
              style={tw`mr-2`}
            />
            <Text
              style={[tw`font-medium`, { color: currentTheme.colors.error }]}
            >
              {t(
                "settings.welcomeBubble.reset.button",
                "Réinitialiser les paramètres"
              )}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </Card>
  );
}
