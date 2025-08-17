import React from "react";
import { Switch, TouchableOpacity, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RecordingSettings } from "../../types";
import { CustomSlider } from "../ui/CustomSlider";
import { UIText } from "../ui/Typography";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";

interface TextAppearanceSectionProps {
  settings: RecordingSettings;
  isExpanded: boolean;
  isSettingsLoaded: boolean;
  localScrollSpeed: number;
  onToggle: () => void;
  onUpdateSetting: <K extends keyof RecordingSettings>(
    key: K,
    value: RecordingSettings[K]
  ) => void;
  onLocalScrollSpeedChange: (value: number) => void;
  onDebouncedScrollSpeedUpdate: (value: number) => void;
}

export default function TextAppearanceSection({
  settings,
  isExpanded,
  isSettingsLoaded,
  localScrollSpeed,
  onToggle,
  onUpdateSetting,
  onLocalScrollSpeedChange,
  onDebouncedScrollSpeedUpdate,
}: TextAppearanceSectionProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const textAlignmentButtons = [
    {
      value: "left",
      label: t("settings.textAppearance.alignment.left", "Gauche"),
    },
    {
      value: "center",
      label: t("settings.textAppearance.alignment.center", "Centre"),
    },
    {
      value: "right",
      label: t("settings.textAppearance.alignment.right", "Droite"),
    },
  ];

  const textColors = [
    "#ffffff",
    "#e5e5e5",
    "#ffdd00",
    "#00ff00",
    "#00ffff",
    "#ff66ff",
  ];

  return (
    <>
      <SectionHeader title={t("settings.textAppearance.title", "Apparence")} />
      <Card>
        <SettingRow
          icon="format-text"
          iconColor="#ffffff"
          iconBgColor={currentTheme.colors.primary}
          title={t(
            "settings.textAppearance.textAppearance.title",
            "Apparence du texte"
          )}
          subtitle={t(
            "settings.textAppearance.textAppearance.subtitle",
            "Taille, couleur, alignement"
          )}
          onPress={onToggle}
        />

        {isExpanded && (
          <View
            style={[
              tw`px-4 pb-3`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            {/* Vitesse de défilement simplifiée */}
            <View style={tw`mb-3`}>
              <UIText
                size="xs"
                weight="semibold"
                style={[tw`mb-2`, { color: currentTheme.colors.text }]}
              >
                {t(
                  "settings.textAppearance.scrollSpeed.title",
                  "Vitesse de défilement"
                )}
                : {Math.round(localScrollSpeed)}%
              </UIText>
              <CustomSlider
                value={localScrollSpeed}
                onValueChange={(value) => {
                  onLocalScrollSpeedChange(value);
                  onDebouncedScrollSpeedUpdate(value);
                }}
                minimumValue={10}
                maximumValue={100}
              />
            </View>

            {/* Taille du texte */}
            <View style={tw`mb-3`}>
              <UIText
                size="xs"
                weight="semibold"
                style={[tw`mb-2`, { color: currentTheme.colors.text }]}
              >
                {t("settings.textAppearance.fontSize.title", "Taille du texte")}
                : {settings.fontSize}px
              </UIText>
              <CustomSlider
                value={settings.fontSize}
                onValueChange={(value) =>
                  onUpdateSetting("fontSize", Math.round(value))
                }
                minimumValue={16}
                maximumValue={48}
              />
            </View>

            {/* Alignement du texte */}
            <View style={tw`mb-3`}>
              <UIText
                size="xs"
                weight="semibold"
                style={[tw`mb-2`, { color: currentTheme.colors.text }]}
              >
                {t(
                  "settings.textAppearance.alignment.title",
                  "Alignement du texte"
                )}
              </UIText>
              <SegmentedButtons
                value={settings.textAlignment || "left"}
                onValueChange={(value) =>
                  onUpdateSetting("textAlignment", value as any)
                }
                buttons={textAlignmentButtons}
              />
            </View>

            {/* Couleur du texte */}
            <View style={tw`mb-3`}>
              <UIText
                size="xs"
                weight="semibold"
                style={[tw`mb-2`, { color: currentTheme.colors.text }]}
              >
                {t(
                  "settings.textAppearance.textColor.title",
                  "Couleur du texte"
                )}
              </UIText>
              <View style={tw`flex-row flex-wrap`}>
                {textColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => onUpdateSetting("textColor", color)}
                    style={[
                      tw`w-10 h-10 rounded-full m-1`,
                      {
                        backgroundColor: color,
                        borderWidth: settings.textColor === color ? 3 : 1,
                        borderColor:
                          settings.textColor === color
                            ? currentTheme.colors.primary
                            : "rgba(255,255,255,0.2)",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Ombre du texte */}
            <View style={tw`flex-row items-center justify-between mb-2`}>
              <UIText
                size="xs"
                weight="semibold"
                style={[{ color: currentTheme.colors.text }]}
              >
                {t(
                  "settings.textAppearance.textShadow.title",
                  "Ombre du texte"
                )}
              </UIText>
              <Switch
                value={settings.textShadow}
                onValueChange={(value) => onUpdateSetting("textShadow", value)}
                trackColor={{
                  false: currentTheme.colors.border,
                  true: currentTheme.colors.primary,
                }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        )}
      </Card>
    </>
  );
}
