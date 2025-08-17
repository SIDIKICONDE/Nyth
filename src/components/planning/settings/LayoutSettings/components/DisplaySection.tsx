import React from "react";
import { View } from "react-native";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { HeadingText, UIText } from "../../../../ui/Typography";
import { styles } from "../styles";
import { SectionProps, ToggleSetting } from "../types";
import { ToggleControl } from "./ToggleControl";

interface DisplaySectionProps extends SectionProps {
  preferences: any;
  updateDisplayPreferences: (display: Partial<any>) => void;
}

export const DisplaySection: React.FC<DisplaySectionProps> = ({
  themeColors,
  preferences,
  updateDisplayPreferences,
}) => {
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();

  const toggleSettings: ToggleSetting[] = [
    {
      key: "showShadows",
      label: t(
        "planning.settings.layout.display.showShadows",
        "Ombres des cartes"
      ),
      description: t(
        "planning.settings.layout.display.showShadowsDesc",
        "Ajouter des ombres pour un effet de profondeur"
      ),
      icon: "sunny-outline",
      enabled: preferences.display.showShadows,
    },
    {
      key: "animationsEnabled",
      label: t("planning.settings.layout.display.animations", "Animations"),
      description: t(
        "planning.settings.layout.display.animationsDesc",
        "Activer les transitions fluides et animations"
      ),
      icon: "play-outline",
      enabled: preferences.display.animationsEnabled,
    },
    {
      key: "denseLayout",
      label: t("planning.settings.layout.display.denseLayout", "Layout dense"),
      description: t(
        "planning.settings.layout.display.denseLayoutDesc",
        "Réduire l'espacement pour plus de contenu"
      ),
      icon: "grid-outline",
      enabled: preferences.display.denseLayout,
    },
  ];

  const handleToggle = (key: string, value: boolean) => {
    updateDisplayPreferences({ [key]: value });
  };

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <HeadingText
        size="lg"
        weight="semibold"
        style={[heading, styles.sectionTitle, { color: themeColors.text }]}
      >
        👁️ {t("planning.settings.layout.displayTitle", "Affichage")}
      </HeadingText>

      <UIText
        size="sm"
        weight="medium"
        style={[
          ui,
          styles.sectionDescription,
          { color: themeColors.textSecondary },
        ]}
      >
        {t(
          "planning.settings.layout.displayDescription",
          "Options visuelles et comportement"
        )}
      </UIText>

      {toggleSettings.map((setting) => (
        <ToggleControl
          key={setting.key}
          setting={setting}
          onToggle={handleToggle}
          themeColors={themeColors}
        />
      ))}
    </View>
  );
};
