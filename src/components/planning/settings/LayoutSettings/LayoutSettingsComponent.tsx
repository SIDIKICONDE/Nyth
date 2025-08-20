import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { ContentText, H2, UIText } from "../../../../components/ui/Typography";
import { useLayoutPreferences } from "../../../../contexts/LayoutPreferencesContext";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import {
  ColumnsSection,
  DisplaySection,
  MarginsSection,
  NavigationTabs,
  PresetsSection,
} from "./components";
import { styles } from "./styles";
import { LayoutSettingsProps } from "./types";
import { getNavigationSections, getPresets } from "./utils";

export const LayoutSettingsComponent: React.FC<LayoutSettingsProps> = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    preferences,
    updateCardMargins,
    updateColumnSpacing,
    updateCardSizing,
    updateDisplayPreferences,
    applyPreset,
    resetToDefaults,
  } = useLayoutPreferences();

  const [activeSection, setActiveSection] = useState<string>("presets");
  const [selectedPreset, setSelectedPreset] = useState<string>("comfortable");
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  const navigationSections = getNavigationSections(t);
  const presets = getPresets(t);

  const handlePresetSelect = async (presetId: string) => {
    setIsApplyingPreset(true);
    setSelectedPreset(presetId);

    // Feedback immédiat
    setTimeout(() => {
      applyPreset(presetId as any);
      setIsApplyingPreset(false);
    }, 100);
  };

  const renderSection = () => {
    const themeColors = currentTheme.colors;

    switch (activeSection) {
      case "presets":
        return (
          <PresetsSection
            themeColors={themeColors}
            onPresetSelect={handlePresetSelect}
            presets={presets}
            selectedPreset={selectedPreset}
            isApplyingPreset={isApplyingPreset}
          />
        );
      case "margins":
        return (
          <MarginsSection
            themeColors={themeColors}
            preferences={preferences}
            updateCardMargins={updateCardMargins}
          />
        );
      case "columns":
        return (
          <ColumnsSection
            themeColors={themeColors}
            preferences={preferences}
            updateCardSizing={updateCardSizing}
            updateColumnSpacing={updateColumnSpacing}
          />
        );
      case "display":
        return (
          <DisplaySection
            themeColors={themeColors}
            preferences={preferences}
            updateDisplayPreferences={updateDisplayPreferences}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {null}

      {/* Navigation */}
      <View style={styles.navigation}>
        <NavigationTabs
          sections={navigationSections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          themeColors={currentTheme.colors}
        />
      </View>

      {/* Contenu */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSection()}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.resetButton,
            { backgroundColor: currentTheme.colors.surface },
          ]}
          onPress={resetToDefaults}
          activeOpacity={0.7}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={currentTheme.colors.textSecondary}
          />
          <UIText
            size={14}
            style={[
              styles.actionText,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {t("planning.settings.layout.reset", "Réinitialiser")}
          </UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
