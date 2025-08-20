import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { FontFamily, getFontStyle } from "../utils/fontUtils";

import { createOptimizedLogger } from '../utils/optimizedLogger';
const logger = createOptimizedLogger('FontContext');

// Interface pour les polices par catégorie
interface FontCategories {
  ui: FontFamily; // Police pour l'interface (boutons, menus)
  content: FontFamily; // Police pour le contenu (textes longs)
  heading: FontFamily; // Police pour les titres
  code: FontFamily; // Police pour le code/monospace
}

// Interface du contexte de police
interface FontContextType {
  // Polices actuelles
  fonts: FontCategories;

  // Setters pour chaque catégorie
  setUIFont: (font: FontFamily) => void;
  setContentFont: (font: FontFamily) => void;
  setHeadingFont: (font: FontFamily) => void;
  setCodeFont: (font: FontFamily) => void;

  // Setter global
  setAllFonts: (font: FontFamily) => void;

  // Getters de style
  getUIFontStyle: () => { fontFamily: string };
  getContentFontStyle: () => { fontFamily: string };
  getHeadingFontStyle: () => { fontFamily: string };
  getCodeFontStyle: () => { fontFamily: string };

  // Utilitaires
  resetToDefaults: () => void;

  // Compatibilité avec l'ancien système
  currentFont: FontFamily;
  setFont: (font: FontFamily) => void;
  getFontFamily: () => { fontFamily: string };
  toggleFont: () => void;
  nextFont: () => void;
  fontDisplayName: string;
}

// Valeurs par défaut
const defaultFonts: FontCategories = {
  ui: "system",
  content: "system",
  heading: "system",
  code: "monospace",
};

// Valeur par défaut du contexte
const defaultFontContext: FontContextType = {
  fonts: defaultFonts,
  setUIFont: () => {},
  setContentFont: () => {},
  setHeadingFont: () => {},
  setCodeFont: () => {},
  setAllFonts: () => {},
  getUIFontStyle: () => ({ fontFamily: "System" }),
  getContentFontStyle: () => ({ fontFamily: "System" }),
  getHeadingFontStyle: () => ({ fontFamily: "System" }),
  getCodeFontStyle: () => ({ fontFamily: "monospace" }),
  resetToDefaults: () => {},
  // Compatibilité
  currentFont: "system",
  setFont: () => {},
  getFontFamily: () => ({ fontFamily: "System" }),
  toggleFont: () => {},
  nextFont: () => {},
  fontDisplayName: "System",
};

// Clés pour le stockage des préférences
const FONT_PREFERENCE_KEYS = {
  UI: "font_preference_ui",
  CONTENT: "font_preference_content",
  HEADING: "font_preference_heading",
  CODE: "font_preference_code",
  LEGACY: "font_preference", // Pour la compatibilité
};

// Liste ordonnée des polices disponibles pour la rotation
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

// Création du contexte
export const FontContext = createContext<FontContextType>(defaultFontContext);

// Hook personnalisé pour utiliser le contexte
export const useFont = () => useContext(FontContext);

// Fournisseur du contexte
export const FontProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t, isReady } = useTranslation();

  // État pour les polices par catégorie
  const [fonts, setFonts] = useState<FontCategories>(defaultFonts);

  // État pour la compatibilité avec l'ancien système
  const [currentFont, setCurrentFont] = useState<FontFamily>("system");

  // Charger les préférences de police au démarrage
  useEffect(() => {
    const loadFontPreferences = async () => {
      try {
        // Charger les nouvelles préférences par catégorie
        const [uiFont, contentFont, headingFont, codeFont, legacyFont] =
          await Promise.all([
            AsyncStorage.getItem(FONT_PREFERENCE_KEYS.UI),
            AsyncStorage.getItem(FONT_PREFERENCE_KEYS.CONTENT),
            AsyncStorage.getItem(FONT_PREFERENCE_KEYS.HEADING),
            AsyncStorage.getItem(FONT_PREFERENCE_KEYS.CODE),
            AsyncStorage.getItem(FONT_PREFERENCE_KEYS.LEGACY),
          ]);

        const newFonts: FontCategories = {
          ui:
            uiFont && isValidFont(uiFont)
              ? (uiFont as FontFamily)
              : defaultFonts.ui,
          content:
            contentFont && isValidFont(contentFont)
              ? (contentFont as FontFamily)
              : defaultFonts.content,
          heading:
            headingFont && isValidFont(headingFont)
              ? (headingFont as FontFamily)
              : defaultFonts.heading,
          code:
            codeFont && isValidFont(codeFont)
              ? (codeFont as FontFamily)
              : defaultFonts.code,
        };

        setFonts(newFonts);

        // Compatibilité avec l'ancien système
        if (legacyFont && isValidFont(legacyFont)) {
          setCurrentFont(legacyFont as FontFamily);
        }
      } catch (error) {
        logger.error(
          t("fonts.errors.loadPreference", "Error loading font preferences:"),
          error
        );
      }
    };

    loadFontPreferences();
  }, []);

  // Vérifier si une police est valide
  const isValidFont = (font: string): font is FontFamily => {
    return AVAILABLE_FONTS.includes(font as FontFamily);
  };

  // Setters pour chaque catégorie
  const setUIFont = async (font: FontFamily) => {
    try {
      setFonts((prev) => ({ ...prev, ui: font }));
      await AsyncStorage.setItem(FONT_PREFERENCE_KEYS.UI, font);
    } catch (error) {
      logger.error(
        t("fonts.errors.savePreference", "Error saving UI font preference:"),
        error
      );
    }
  };

  const setContentFont = async (font: FontFamily) => {
    try {
      setFonts((prev) => ({ ...prev, content: font }));
      await AsyncStorage.setItem(FONT_PREFERENCE_KEYS.CONTENT, font);
    } catch (error) {
      logger.error(
        t(
          "fonts.errors.savePreference",
          "Error saving content font preference:"
        ),
        error
      );
    }
  };

  const setHeadingFont = async (font: FontFamily) => {
    try {
      setFonts((prev) => ({ ...prev, heading: font }));
      await AsyncStorage.setItem(FONT_PREFERENCE_KEYS.HEADING, font);
    } catch (error) {
      logger.error(
        t(
          "fonts.errors.savePreference",
          "Error saving heading font preference:"
        ),
        error
      );
    }
  };

  const setCodeFont = async (font: FontFamily) => {
    try {
      setFonts((prev) => ({ ...prev, code: font }));
      await AsyncStorage.setItem(FONT_PREFERENCE_KEYS.CODE, font);
    } catch (error) {
      logger.error(
        t("fonts.errors.savePreference", "Error saving code font preference:"),
        error
      );
    }
  };

  // Setter global pour toutes les catégories
  const setAllFonts = async (font: FontFamily) => {
    try {
      const newFonts: FontCategories = {
        ui: font,
        content: font,
        heading: font,
        code: font === "monospace" ? "monospace" : font, // Garder monospace pour le code
      };

      setFonts(newFonts);

      // Sauvegarder toutes les préférences
      await Promise.all([
        AsyncStorage.setItem(FONT_PREFERENCE_KEYS.UI, newFonts.ui),
        AsyncStorage.setItem(FONT_PREFERENCE_KEYS.CONTENT, newFonts.content),
        AsyncStorage.setItem(FONT_PREFERENCE_KEYS.HEADING, newFonts.heading),
        AsyncStorage.setItem(FONT_PREFERENCE_KEYS.CODE, newFonts.code),
      ]);
    } catch (error) {
      logger.error(
        t("fonts.errors.savePreference", "Error saving font preferences:"),
        error
      );
    }
  };

  // Getters de style pour chaque catégorie
  const getUIFontStyle = () => getFontStyle(fonts.ui);
  const getContentFontStyle = () => getFontStyle(fonts.content);
  const getHeadingFontStyle = () => getFontStyle(fonts.heading);
  const getCodeFontStyle = () => getFontStyle(fonts.code);

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = async () => {
    try {
      setFonts(defaultFonts);

      // Supprimer toutes les préférences sauvegardées
      await Promise.all(
        Object.values(FONT_PREFERENCE_KEYS).map((key) =>
          AsyncStorage.removeItem(key)
        )
      );
    } catch (error) {
      logger.error(
        t("fonts.errors.resetPreferences", "Error resetting font preferences:"),
        error
      );
    }
  };

  // --- Compatibilité avec l'ancien système ---

  // Fonction pour définir la police (compatibilité)
  const setFont = async (font: FontFamily) => {
    try {
      setCurrentFont(font);
      await AsyncStorage.setItem(FONT_PREFERENCE_KEYS.LEGACY, font);
      // Optionnel : mettre à jour aussi la police de contenu
      setContentFont(font);
    } catch (error) {
      logger.error(
        t("fonts.errors.savePreference", "Error saving font preference:"),
        error
      );
    }
  };

  // Fonction pour basculer entre police système et monospace (compatibilité)
  const toggleFont = () => {
    const newFont = currentFont === "system" ? "monospace" : "system";
    setFont(newFont);
  };

  // Fonction pour passer à la police suivante dans la liste
  const nextFont = () => {
    const currentIndex = AVAILABLE_FONTS.indexOf(currentFont);
    const nextIndex = (currentIndex + 1) % AVAILABLE_FONTS.length;
    setFont(AVAILABLE_FONTS[nextIndex]);
  };

  // Fonction pour obtenir le style de police (compatibilité)
  const getFontFamily = () => {
    return getFontStyle(currentFont);
  };

  // Obtenir le nom d'affichage de la police actuelle avec traduction
  const fontDisplayName = (() => {
    if (!isReady) {
      // Retourner une valeur par défaut ou une chaîne vide pendant le chargement
      return "System"; // Ou une autre valeur par défaut appropriée
    }
    switch (currentFont) {
      case "monospace":
        return t("fonts.monospace", "Monospace");
      case "serif":
        return t("fonts.serif", "Serif");
      case "condensed":
        return t("fonts.condensed", "Condensed");
      case "rounded":
        return t("fonts.rounded", "Rounded");
      case "system":
      default:
        return t("fonts.system", "System");
    }
  })();

  // Valeur du contexte
  const contextValue: FontContextType = {
    // Nouveau système
    fonts,
    setUIFont,
    setContentFont,
    setHeadingFont,
    setCodeFont,
    setAllFonts,
    getUIFontStyle,
    getContentFontStyle,
    getHeadingFontStyle,
    getCodeFontStyle,
    resetToDefaults,
    // Compatibilité
    currentFont,
    setFont,
    getFontFamily,
    toggleFont,
    nextFont,
    fontDisplayName,
  };

  return (
    <FontContext.Provider value={contextValue}>{children}</FontContext.Provider>
  );
};
