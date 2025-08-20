import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../contexts/FontContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { CodeText, ContentText, HeadingText, UIText } from "../ui/Typography";

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('FontPreview');

interface FontPreviewProps {
  showCategories?: boolean;
  compact?: boolean;
}

export const FontPreview: React.FC<FontPreviewProps> = ({
  showCategories = true,
  compact = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { fonts } = useFont();

  const previewTexts = {
    ui: t("fonts.preview.sample.ui", "Interface • Boutons • Menus"),
    content: t(
      "fonts.preview.sample.text",
      "Voici un exemple de texte de contenu avec cette police."
    ),
    heading: t("fonts.preview.sample.heading", "Titre Principal"),
    code: t("fonts.preview.sample.code", 'logger.debug("Hello World");'),
  };

  return (
    <View
      style={[
        tw`p-4 rounded-xl`,
        {
          backgroundColor: currentTheme.isDark
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ]}
    >
      <UIText
        size="sm"
        weight="600"
        color={currentTheme.colors.textSecondary}
        style={tw`mb-3`}
      >
        {t("fonts.preview.title", "Aperçu en temps réel")}
      </UIText>

      {showCategories ? (
        <View>
          {/* Titre */}
          <View style={[tw`mb-2`, { marginBottom: 12 }]}>
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`mb-1`}
            >
              {t("fonts.categories.heading", "Titres")} (
              {t(`fonts.${fonts.heading}`, fonts.heading)})
            </UIText>
            <HeadingText size={compact ? "lg" : "xl"}>
              {previewTexts.heading}
            </HeadingText>
          </View>

          {/* Contenu */}
          <View style={[tw`mb-2`, { marginBottom: 12 }]}>
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`mb-1`}
            >
              {t("fonts.categories.content", "Contenu")} (
              {t(`fonts.${fonts.content}`, fonts.content)})
            </UIText>
            <ContentText
              size={compact ? "sm" : "base"}
              color={currentTheme.colors.text}
            >
              {previewTexts.content}
            </ContentText>
          </View>

          {/* Interface */}
          <View style={[tw`mb-2`, { marginBottom: 12 }]}>
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`mb-1`}
            >
              {t("fonts.categories.ui", "Interface")} (
              {t(`fonts.${fonts.ui}`, fonts.ui)})
            </UIText>
            <UIText
              size={compact ? "sm" : "base"}
              color={currentTheme.colors.text}
            >
              {previewTexts.ui}
            </UIText>
          </View>

          {/* Code */}
          <View>
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={tw`mb-1`}
            >
              {t("fonts.categories.code", "Code")} (
              {t(`fonts.${fonts.code}`, fonts.code)})
            </UIText>
            <View
              style={[
                tw`p-2 rounded`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                },
              ]}
            >
              <CodeText
                size={compact ? "xs" : "sm"}
                color={currentTheme.colors.textSecondary}
              >
                {previewTexts.code}
              </CodeText>
            </View>
          </View>
        </View>
      ) : (
        // Aperçu simplifié
        <View>
          <ContentText
            size="base"
            style={tw`mb-2`}
            color={currentTheme.colors.text}
          >
            {previewTexts.content}
          </ContentText>
          <UIText size="sm" color={currentTheme.colors.textSecondary}>
            {previewTexts.ui}
          </UIText>
        </View>
      )}

      {/* Information */}
      <View
        style={[
          tw`mt-4 pt-3 border-t border-opacity-20`,
          { borderColor: currentTheme.colors.textSecondary },
        ]}
      >
        <UIText size="xs" color={currentTheme.colors.textSecondary}>
          {t(
            "fonts.preview.info",
            "Les changements sont appliqués immédiatement"
          )}
        </UIText>
      </View>
    </View>
  );
};

export default FontPreview;
