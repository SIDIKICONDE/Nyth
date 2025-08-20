import * as React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useFont } from "../../contexts/FontContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { FontFamily } from "../../utils/fontUtils";
import { ContentText, Label, UIText } from "../ui/Typography";

interface FontOptionsMenuProps {
  onClose: () => void;
  category?: "ui" | "content" | "heading" | "code";
}

const FontOptionsMenu: React.FC<FontOptionsMenuProps> = ({
  onClose,
  category = "content",
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    fonts,
    setUIFont,
    setContentFont,
    setHeadingFont,
    setCodeFont,
    setAllFonts,
  } = useFont();

  // Obtenir la police actuelle selon la catégorie
  const getCurrentFont = (): FontFamily => {
    switch (category) {
      case "ui":
        return fonts.ui;
      case "content":
        return fonts.content;
      case "heading":
        return fonts.heading;
      case "code":
        return fonts.code;
      default:
        return fonts.content;
    }
  };

  // Setter selon la catégorie
  const setFont = async (font: FontFamily) => {
    switch (category) {
      case "ui":
        await setUIFont(font);
        break;
      case "content":
        await setContentFont(font);
        break;
      case "heading":
        await setHeadingFont(font);
        break;
      case "code":
        await setCodeFont(font);
        break;
      default:
        await setContentFont(font);
        break;
    }
  };

  const currentFont = getCurrentFont();

  // Liste de toutes les polices disponibles avec leurs icônes
  const fontOptions: {
    type: FontFamily;
    icon: string;
    name: string;
    description: string;
  }[] = [
    {
      type: "system",
      icon: "format-font",
      name: t("fonts.system", "Système"),
      description: t(
        "fonts.descriptions.system",
        "Police par défaut du système"
      ),
    },
    {
      type: "monospace",
      icon: "code-tags",
      name: t("fonts.monospace", "Monospace"),
      description: t(
        "fonts.descriptions.monospace",
        "Idéale pour le code et les données"
      ),
    },
    {
      type: "serif",
      icon: "format-letter-case",
      name: t("fonts.serif", "Serif"),
      description: t("fonts.descriptions.serif", "Classique avec empattements"),
    },
    {
      type: "condensed",
      icon: "format-text",
      name: t("fonts.condensed", "Condensée"),
      description: t("fonts.descriptions.condensed", "Compacte et moderne"),
    },
    {
      type: "rounded",
      icon: "format-text-variant",
      name: t("fonts.rounded", "Arrondie"),
      description: t("fonts.descriptions.rounded", "Douce et amicale"),
    },
    {
      type: "elegant",
      icon: "diamond-stone",
      name: t("fonts.elegant", "Élégante"),
      description: t("fonts.descriptions.elegant", "Raffinée et sophistiquée"),
    },
    {
      type: "modern",
      icon: "lightning-bolt",
      name: t("fonts.modern", "Moderne"),
      description: t("fonts.descriptions.modern", "Contemporaine et épurée"),
    },
    {
      type: "handwriting",
      icon: "pencil",
      name: t("fonts.handwriting", "Manuscrite"),
      description: t(
        "fonts.descriptions.handwriting",
        "Style écriture à la main"
      ),
    },
    {
      type: "display",
      icon: "format-title",
      name: t("fonts.display", "Affichage"),
      description: t("fonts.descriptions.display", "Impact visuel fort"),
    },
    {
      type: "tech",
      icon: "robot",
      name: t("fonts.tech", "Technique"),
      description: t("fonts.descriptions.tech", "Futuriste et technique"),
    },
  ];

  return (
    <View>
      {/* En-tête avec catégorie */}
      <View
        style={[
          tw`mb-4 p-3 rounded-xl bg-opacity-10`,
          { backgroundColor: currentTheme.colors.primary + "10" },
        ]}
      >
        <Label size="sm" weight="600" color={currentTheme.colors.primary}>
          {t(`fonts.categories.${category}`, category.toUpperCase())}
        </Label>
        <UIText size="xs" color={currentTheme.colors.primary} style={tw`mt-1`}>
          {t(
            `fonts.categories.${category}Desc`,
            "Configuration de police pour cette catégorie"
          )}
        </UIText>
      </View>

      {/* Liste des polices */}
      <View style={tw`mb-3`}>
        {fontOptions.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={[
              tw`flex-row items-center py-3 px-3 rounded-lg mb-2`,
              {
                backgroundColor:
                  currentFont === option.type
                    ? currentTheme.colors.primary + "15"
                    : currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.02)",
                borderWidth: currentFont === option.type ? 1 : 0,
                borderColor: currentTheme.colors.primary + "30",
              },
            ]}
            onPress={() => {
              setFont(option.type);
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                {
                  backgroundColor:
                    currentFont === option.type
                      ? currentTheme.colors.primary + "20"
                      : currentTheme.isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={16}
                color={
                  currentFont === option.type
                    ? currentTheme.colors.primary
                    : currentTheme.colors.textSecondary
                }
              />
            </View>

            <View style={tw`flex-1`}>
              <UIText
                size="sm"
                weight={currentFont === option.type ? "600" : "400"}
                color={
                  currentFont === option.type
                    ? currentTheme.colors.primary
                    : currentTheme.colors.text
                }
                style={[
                  {
                    fontFamily:
                      option.type === "system"
                        ? undefined
                        : getPreviewFontFamily(option.type),
                  },
                ]}
              >
                {option.name}
              </UIText>
              <UIText
                size="xs"
                color={currentTheme.colors.textSecondary}
                style={[tw`mt-0.5`, { opacity: 0.8 }]}
              >
                {option.description}
              </UIText>
            </View>

            {currentFont === option.type && (
              <View
                style={[
                  tw`w-5 h-5 rounded-full items-center justify-center`,
                  { backgroundColor: currentTheme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={12}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Aperçu compact */}
      <View
        style={[
          tw`p-3 rounded-xl`,
          {
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
          },
        ]}
      >
        <Label
          size="xs"
          weight="600"
          color={currentTheme.colors.textSecondary}
          style={tw`mb-2`}
        >
          {t("fonts.preview.title", "Aperçu")} :{" "}
          {t(`fonts.${currentFont}`, currentFont)}
        </Label>

        <ContentText
          size="sm"
          style={[
            tw`mb-2`,
            {
              fontFamily:
                currentFont === "system"
                  ? undefined
                  : getPreviewFontFamily(currentFont),
            },
          ]}
          color={currentTheme.colors.text}
        >
          {t(
            "fonts.preview.sample.text",
            "Cette police sera utilisée dans les conversations."
          )}
        </ContentText>

        <ContentText
          size="base"
          style={[
            {
              fontFamily:
                currentFont === "system"
                  ? undefined
                  : getPreviewFontFamily(currentFont),
            },
          ]}
          color={currentTheme.colors.text}
        >
          {t(
            "fonts.preview.sample.greeting",
            "Bonjour ! Comment allez-vous aujourd'hui ? 🌟"
          )}
        </ContentText>

        {/* Option pour appliquer à toutes les catégories */}
        <View
          style={[
            tw`mt-3 pt-3 border-t border-opacity-20`,
            { borderColor: currentTheme.colors.textSecondary },
          ]}
        >
          <TouchableOpacity
            style={[
              tw`flex-row items-center justify-center py-2 px-3 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary + "10" },
            ]}
            onPress={async () => {
              await setAllFonts(currentFont);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="format-font"
              size={16}
              color={currentTheme.colors.primary}
              style={tw`mr-2`}
            />
            <UIText size="sm" weight="600" color={currentTheme.colors.primary}>
              {t("fonts.applyToAll", "Appliquer partout")}
            </UIText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Fonction pour obtenir le nom de la police pour l'aperçu
const getPreviewFontFamily = (fontType: FontFamily): string => {
  switch (fontType) {
    case "monospace":
      return Platform.OS === "ios" ? "Menlo" : "monospace";
    case "serif":
      return Platform.OS === "ios" ? "Times New Roman" : "serif";
    case "condensed":
      return Platform.OS === "ios"
        ? "SF Compact Display"
        : "sans-serif-condensed";
    case "rounded":
      return Platform.OS === "ios" ? "SF Pro Rounded" : "sans-serif-medium";
    case "elegant":
      return Platform.OS === "ios" ? "Optima" : "sans-serif-light";
    case "modern":
      return Platform.OS === "ios" ? "Avenir Next" : "sans-serif-medium";
    case "handwriting":
      return Platform.OS === "ios" ? "Marker Felt" : "casual";
    case "display":
      return Platform.OS === "ios" ? "Futura" : "sans-serif-black";
    case "tech":
      return Platform.OS === "ios" ? "Courier New" : "monospace";
    default:
      return Platform.OS === "ios" ? "San Francisco" : "Roboto";
  }
};

export default FontOptionsMenu;
