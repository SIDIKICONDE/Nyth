import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Modal, ScrollView, View } from "react-native";
import { TextInput } from "react-native-paper";
import tw from "twrnc";
import { useTranslation } from "../../hooks/useTranslation";
import { CustomButton } from "../common";
import { UIText } from "../ui/Typography";
import ColorPresets from "./ColorPresets";
import {
  ColorCustomization,
  ModalHeader,
  ThemeCreationModalProps,
  ThemePreview,
  ViewMode,
} from "./theme-creation";

const ThemeCreationModal: React.FC<ThemeCreationModalProps> = ({
  visible,
  currentTheme,
  newThemeName,
  customColors,
  onClose,
  onCreateTheme,
  onThemeNameChange,
  onColorChange,
  onToggleDarkMode,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const isDarkMode =
    customColors.background.startsWith("#0") ||
    customColors.background.startsWith("#1");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[
          tw`flex-1 pt-6`,
          { backgroundColor: currentTheme.colors.background },
        ]}
      >
        {/* Header du modal */}
        <ModalHeader
          currentTheme={currentTheme}
          onClose={onClose}
          onCreateTheme={onCreateTheme}
        />

        <ScrollView
          style={tw`flex-1 px-4 py-2`}
          contentContainerStyle={tw`pb-6`}
          showsVerticalScrollIndicator={false}
        >
          {/* Aperçu du thème */}
          <ThemePreview colors={customColors} currentTheme={currentTheme} />

          {/* Nom du thème */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row items-center mb-2`}>
              <MaterialCommunityIcons
                name="tag"
                size={20}
                color={currentTheme.colors.primary}
                style={tw`mr-2`}
              />
              <UIText
                size="base"
                weight="semibold"
                style={[{ color: currentTheme.colors.text }]}
              >
                {t("theme.creation.themeName", "Nom du Thème")}
              </UIText>
            </View>
            <TextInput
              value={newThemeName}
              onChangeText={onThemeNameChange}
              placeholder={t(
                "theme.creation.themeNamePlaceholder",
                "Mon thème personnalisé"
              )}
              style={[
                tw`py-2.5 px-3 rounded-xl border text-base`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                },
              ]}
              placeholderTextColor={currentTheme.colors.textMuted}
              textColor={currentTheme.colors.text}
              theme={{
                colors: {
                  text: currentTheme.colors.text,
                  placeholder: currentTheme.colors.textMuted,
                  primary: currentTheme.colors.primary,
                  background: currentTheme.colors.surface,
                },
              }}
            />
          </View>

          {/* Mode clair/sombre */}
          <View
            style={[
              tw`p-4 mb-4 rounded-xl border`,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              },
            ]}
          >
            <View style={tw`flex-row items-center mb-3`}>
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={20}
                color={currentTheme.colors.primary}
                style={tw`mr-2`}
              />
              <UIText
                size="base"
                weight="semibold"
                style={[{ color: currentTheme.colors.text }]}
              >
                {t("theme.creation.mode", "Mode")}
              </UIText>
            </View>

            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <CustomButton
                  title={t("theme.creation.light", "Clair")}
                  variant={!isDarkMode ? "primary" : "outline"}
                  size="sm"
                  icon="white-balance-sunny"
                  style={tw`w-full`}
                  onPress={() => onToggleDarkMode(false)}
                />
              </View>
              <View style={tw`flex-1`}>
                <CustomButton
                  title={t("theme.creation.dark", "Sombre")}
                  variant={isDarkMode ? "primary" : "outline"}
                  size="sm"
                  icon="weather-night"
                  style={tw`w-full`}
                  onPress={() => onToggleDarkMode(true)}
                />
              </View>
            </View>
          </View>

          {/* Presets de couleurs */}
          <View style={tw`mb-4`}>
            <View style={tw`flex-row items-center mb-3`}>
              <MaterialCommunityIcons
                name="palette-swatch"
                size={20}
                color={currentTheme.colors.primary}
                style={tw`mr-2`}
              />
              <UIText
                size="base"
                weight="semibold"
                style={[{ color: currentTheme.colors.text }]}
              >
                {t("theme.creation.colorPresets", "Palettes Prédéfinies")}
              </UIText>
            </View>
            <ColorPresets
              currentColors={customColors}
              onColorChange={onColorChange}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Couleurs personnalisées */}
          <ColorCustomization
            currentTheme={currentTheme}
            customColors={customColors}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onColorChange={onColorChange}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ThemeCreationModal;
