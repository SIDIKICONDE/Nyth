import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { CustomHeader } from "../components/common";
import { CustomAlert } from "../components/ui/CustomAlert";
import {
  ContentText,
  H3,
  Label,
  Paragraph,
  UIText,
} from "../components/ui/Typography";
import { useFont } from "../contexts/FontContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "../hooks/useTranslation";
import { FontFamily, getFontDisplayName } from "../utils/fontUtils";

// Liste des polices disponibles
const AVAILABLE_FONTS: FontFamily[] = [
  "system",
  "serif",
  "monospace",
  "condensed",
  "rounded",
  "elegant",
  "modern",
  "handwriting",
  "display",
  "tech",
];

// Icônes pour chaque police
const FONT_ICONS: Record<FontFamily, string> = {
  system: "cellphone-text",
  serif: "format-text-variant",
  monospace: "code-tags",
  condensed: "format-text-wrapping-wrap",
  rounded: "format-text-rotation-angle-up",
  elegant: "diamond-stone",
  modern: "lightning-bolt",
  handwriting: "pencil",
  display: "format-title",
  tech: "robot",
};

// Composant d'aide pour le texte secondaire
const HelpText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme } = useTheme();
  return (
    <UIText
      size={12}
      color={currentTheme.colors.textSecondary}
      style={tw`mt-1`}
    >
      {children}
    </UIText>
  );
};

export default function FontSettingsScreen() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    fonts,
    setUIFont,
    setContentFont,
    setHeadingFont,
    setCodeFont,
    setAllFonts,
    resetToDefaults,
  } = useFont();

  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [useUnifiedFont, setUseUnifiedFont] = useState(
    fonts.ui === fonts.content && fonts.content === fonts.heading
  );

  // Sélecteur de police pour une catégorie
  const FontSelector: React.FC<{
    category: "ui" | "content" | "heading" | "code";
    label: string;
    description: string;
    currentFont: FontFamily;
    onSelect: (font: FontFamily) => void;
    disabled?: boolean;
  }> = ({
    category,
    label,
    description,
    currentFont,
    onSelect,
    disabled = false,
  }) => (
    <View style={tw`mb-6 opacity-${disabled ? "50" : "100"}`}>
      <Label size={16} weight="600" color={currentTheme.colors.text}>
        {label}
      </Label>
      <HelpText>{description}</HelpText>

      <View style={tw`mt-3`}>
        {AVAILABLE_FONTS.map((font) => (
          <TouchableOpacity
            key={font}
            style={[
              tw`flex-row items-center p-4 mb-2 rounded-xl`,
              {
                backgroundColor:
                  currentFont === font
                    ? currentTheme.colors.primary + "20"
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                borderWidth: currentFont === font ? 2 : 1,
                borderColor:
                  currentFont === font
                    ? currentTheme.colors.primary
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
              },
            ]}
            onPress={() => !disabled && onSelect(font)}
            disabled={disabled}
          >
            <MaterialCommunityIcons
              name={FONT_ICONS[font]}
              size={24}
              color={
                currentFont === font
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text
              }
              style={tw`mr-3`}
            />

            <View style={tw`flex-1`}>
              <UIText
                size={16}
                weight={currentFont === font ? "600" : "400"}
                color={
                  currentFont === font
                    ? currentTheme.colors.primary
                    : currentTheme.colors.text
                }
              >
                {getFontDisplayName(font)}
              </UIText>

              {/* Aperçu de la police */}
              <ContentText
                size={14}
                style={[
                  tw`mt-1`,
                  { fontFamily: font === "system" ? undefined : font },
                ]}
                color={currentTheme.colors.textSecondary}
              >
                {t("fonts.preview.quick", "Aperçu : ABC abc 123")}
              </ContentText>
            </View>

            {currentFont === font && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={currentTheme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Gestion du mode unifié
  const handleUnifiedFontToggle = (value: boolean) => {
    setUseUnifiedFont(value);
    if (value) {
      // Appliquer la police UI à toutes les catégories
      setAllFonts(fonts.ui);
    }
  };

  // Gestion de la sélection de police unifiée
  const handleUnifiedFontSelect = async (font: FontFamily) => {
    setIsLoading(true);
    await setAllFonts(font);
    setIsLoading(false);
  };

  // Réinitialisation
  const handleReset = async () => {
    setIsLoading(true);
    await resetToDefaults();
    setUseUnifiedFont(true);
    setIsLoading(false);
    setShowAlert(true);
  };

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      <CustomHeader
        title={t("settings.fonts.title", "Polices")}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        actionButtons={[
          {
            icon: "restore",
            onPress: handleReset,
            iconComponent: isLoading ? (
              <ActivityIndicator
                size="small"
                color={currentTheme.colors.primary}
              />
            ) : (
              <MaterialCommunityIcons
                name="restore"
                size={24}
                color={currentTheme.colors.primary}
              />
            ),
          },
        ]}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 py-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Aperçu en temps réel */}
        <View
          style={[
            tw`p-4 mb-6 rounded-xl`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          <H3 style={{ color: currentTheme.colors.text }}>
            {t("fonts.preview.title", "Aperçu en temps réel")}
          </H3>
          <Paragraph style={{ color: currentTheme.colors.text }}>
            {t(
              "fonts.preview.content",
              "Voici comment le texte apparaît avec vos paramètres actuels. Les changements sont appliqués immédiatement."
            )}
          </Paragraph>
          <UIText size={14} style={tw`mt-2`} color={currentTheme.colors.text}>
            {t("fonts.preview.ui", "Texte d'interface (boutons, menus)")}
          </UIText>
        </View>

        {/* Mode unifié */}
        <View
          style={[
            tw`flex-row items-center justify-between p-4 mb-6 rounded-xl`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          <View style={tw`flex-1 mr-3`}>
            <UIText size={16} weight="600" color={currentTheme.colors.text}>
              {t("fonts.unified.title", "Police unifiée")}
            </UIText>
            <HelpText>
              {t(
                "fonts.unified.description",
                "Utiliser la même police pour toute l'application"
              )}
            </HelpText>
          </View>
          <Switch
            value={useUnifiedFont}
            onValueChange={handleUnifiedFontToggle}
            trackColor={{
              false: currentTheme.isDark ? "#333" : "#ccc",
              true: currentTheme.colors.primary + "80",
            }}
            thumbColor={
              useUnifiedFont ? currentTheme.colors.primary : "#f4f3f4"
            }
          />
        </View>

        {/* Sélection de police */}
        {useUnifiedFont ? (
          <FontSelector
            category="ui"
            label={t("fonts.unified.selector", "Police de l'application")}
            description={t(
              "fonts.unified.selectorDesc",
              "Cette police sera utilisée partout dans l'application"
            )}
            currentFont={fonts.ui}
            onSelect={handleUnifiedFontSelect}
          />
        ) : (
          <>
            <FontSelector
              category="ui"
              label={t("fonts.categories.ui", "Interface utilisateur")}
              description={t(
                "fonts.categories.uiDesc",
                "Boutons, menus, navigation"
              )}
              currentFont={fonts.ui}
              onSelect={setUIFont}
            />

            <FontSelector
              category="content"
              label={t("fonts.categories.content", "Contenu")}
              description={t(
                "fonts.categories.contentDesc",
                "Textes longs, descriptions, paragraphes"
              )}
              currentFont={fonts.content}
              onSelect={setContentFont}
            />

            <FontSelector
              category="heading"
              label={t("fonts.categories.heading", "Titres")}
              description={t(
                "fonts.categories.headingDesc",
                "Titres et en-têtes"
              )}
              currentFont={fonts.heading}
              onSelect={setHeadingFont}
            />

            <FontSelector
              category="code"
              label={t("fonts.categories.code", "Code")}
              description={t(
                "fonts.categories.codeDesc",
                "Code et texte technique"
              )}
              currentFont={fonts.code}
              onSelect={setCodeFont}
            />
          </>
        )}

        {/* Informations supplémentaires */}
        <View
          style={[
            tw`p-4 mt-6 rounded-xl`,
            {
              backgroundColor: currentTheme.colors.primary + "10",
            },
          ]}
        >
          <View style={tw`flex-row items-center mb-2`}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={currentTheme.colors.primary}
              style={tw`mr-2`}
            />
            <UIText size={14} weight="600" color={currentTheme.colors.primary}>
              {t("fonts.info.title", "Bon à savoir")}
            </UIText>
          </View>
          <UIText size={13} color={currentTheme.colors.primary}>
            {t(
              "fonts.info.content",
              "Les polices système offrent les meilleures performances et sont optimisées pour chaque plateforme."
            )}
          </UIText>
        </View>
      </ScrollView>

      {/* Alerte de confirmation */}
      <CustomAlert
        visible={showAlert}
        type="success"
        title={t("fonts.reset.success", "Réinitialisation réussie")}
        message={t(
          "fonts.reset.message",
          "Les polices ont été réinitialisées aux valeurs par défaut."
        )}
        onDismiss={() => setShowAlert(false)}
      />
    </View>
  );
}
