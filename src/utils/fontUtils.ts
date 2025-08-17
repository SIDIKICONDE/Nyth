import { Platform } from "react-native";

/**
 * Utilitaires pour les polices de caractères
 */

// Types de polices disponibles dans l'application
export type FontFamily =
  | "system" // Police système par défaut
  | "monospace" // Police monospace
  | "serif" // Police avec empattements
  | "condensed" // Police condensée
  | "rounded" // Police arrondie
  | "elegant" // Police élégante
  | "modern" // Police moderne
  | "handwriting" // Police manuscrite
  | "display" // Police d'affichage
  | "tech"; // Police technique/futuriste

/**
 * Obtient la police système par défaut en fonction de la plateforme
 */
export const getSystemFont = (): string => {
  if (Platform.OS === "ios") {
    return "San Francisco"; // Police iOS par défaut
  } else if (Platform.OS === "android") {
    return "Roboto"; // Police Android par défaut
  }
  return "System"; // Police de secours
};

/**
 * Obtient la police monospace système en fonction de la plateforme
 */
export const getMonospaceFont = (): string => {
  if (Platform.OS === "ios") {
    return "Menlo"; // Police monospace iOS
  } else if (Platform.OS === "android") {
    return "monospace"; // Police monospace Android
  }
  return "monospace"; // Police de secours
};

/**
 * Obtient la police serif en fonction de la plateforme
 */
export const getSerifFont = (): string => {
  if (Platform.OS === "ios") {
    return "Times New Roman"; // Police serif iOS
  } else if (Platform.OS === "android") {
    return "serif"; // Police serif Android
  }
  return "serif"; // Police de secours
};

/**
 * Obtient la police condensée en fonction de la plateforme
 */
export const getCondensedFont = (): string => {
  if (Platform.OS === "ios") {
    return "SF Compact Display"; // Police condensée iOS
  } else if (Platform.OS === "android") {
    return "sans-serif-condensed"; // Police condensée Android
  }
  return "sans-serif-condensed"; // Police de secours
};

/**
 * Obtient la police arrondie en fonction de la plateforme
 */
export const getRoundedFont = (): string => {
  if (Platform.OS === "ios") {
    return "SF Pro Rounded"; // Police arrondie iOS
  } else if (Platform.OS === "android") {
    return "sans-serif-medium"; // Police arrondie Android (approx)
  }
  return "sans-serif"; // Police de secours
};

/**
 * Obtient la police élégante en fonction de la plateforme
 */
export const getElegantFont = (): string => {
  if (Platform.OS === "ios") {
    return "Optima"; // Police élégante iOS
  } else if (Platform.OS === "android") {
    return "sans-serif-light"; // Police élégante Android
  }
  return "sans-serif-light"; // Police de secours
};

/**
 * Obtient la police moderne en fonction de la plateforme
 */
export const getModernFont = (): string => {
  if (Platform.OS === "ios") {
    return "Avenir Next"; // Police moderne iOS
  } else if (Platform.OS === "android") {
    return "sans-serif-medium"; // Police moderne Android
  }
  return "sans-serif-medium"; // Police de secours
};

/**
 * Obtient la police manuscrite en fonction de la plateforme
 */
export const getHandwritingFont = (): string => {
  if (Platform.OS === "ios") {
    return "Marker Felt"; // Police manuscrite iOS
  } else if (Platform.OS === "android") {
    return "casual"; // Police manuscrite Android
  }
  return "cursive"; // Police de secours
};

/**
 * Obtient la police d'affichage en fonction de la plateforme
 */
export const getDisplayFont = (): string => {
  if (Platform.OS === "ios") {
    return "Futura"; // Police d'affichage iOS
  } else if (Platform.OS === "android") {
    return "sans-serif-black"; // Police d'affichage Android
  }
  return "sans-serif"; // Police de secours
};

/**
 * Obtient la police technique/futuriste en fonction de la plateforme
 */
export const getTechFont = (): string => {
  if (Platform.OS === "ios") {
    return "Courier New"; // Police technique iOS
  } else if (Platform.OS === "android") {
    return "monospace"; // Police technique Android
  }
  return "monospace"; // Police de secours
};

/**
 * Construit un objet de style de police en fonction du type
 */
export const getFontStyle = (
  fontType: FontFamily = "system"
): { fontFamily: string } => {
  switch (fontType) {
    case "monospace":
      return { fontFamily: getMonospaceFont() };
    case "serif":
      return { fontFamily: getSerifFont() };
    case "condensed":
      return { fontFamily: getCondensedFont() };
    case "rounded":
      return { fontFamily: getRoundedFont() };
    case "elegant":
      return { fontFamily: getElegantFont() };
    case "modern":
      return { fontFamily: getModernFont() };
    case "handwriting":
      return { fontFamily: getHandwritingFont() };
    case "display":
      return { fontFamily: getDisplayFont() };
    case "tech":
      return { fontFamily: getTechFont() };
    case "system":
    default:
      return { fontFamily: getSystemFont() };
  }
};

/**
 * Options de police pour différents éléments de l'interface
 */
export const FontOptions = {
  // Police pour le texte des messages
  message: {
    system: getFontStyle("system"),
    monospace: getFontStyle("monospace"),
    serif: getFontStyle("serif"),
    condensed: getFontStyle("condensed"),
    rounded: getFontStyle("rounded"),
    elegant: getFontStyle("elegant"),
    modern: getFontStyle("modern"),
    handwriting: getFontStyle("handwriting"),
    display: getFontStyle("display"),
    tech: getFontStyle("tech"),
  },

  // Police pour les titres
  heading: {
    system: getFontStyle("system"),
    monospace: getFontStyle("monospace"),
    serif: getFontStyle("serif"),
    condensed: getFontStyle("condensed"),
    rounded: getFontStyle("rounded"),
    elegant: getFontStyle("elegant"),
    modern: getFontStyle("modern"),
    handwriting: getFontStyle("handwriting"),
    display: getFontStyle("display"),
    tech: getFontStyle("tech"),
  },

  // Police pour les boutons et autres éléments d'interface
  ui: {
    system: getFontStyle("system"),
    rounded: getFontStyle("rounded"),
    modern: getFontStyle("modern"),
    elegant: getFontStyle("elegant"),
  },
};

/**
 * Retourne un nom lisible pour chaque type de police
 */
export const getFontDisplayName = (fontType: FontFamily): string => {
  switch (fontType) {
    case "monospace":
      return "Monospace";
    case "serif":
      return "Serif";
    case "condensed":
      return "Condensé";
    case "rounded":
      return "Arrondi";
    case "elegant":
      return "Élégant";
    case "modern":
      return "Moderne";
    case "handwriting":
      return "Manuscrit";
    case "display":
      return "Affichage";
    case "tech":
      return "Tech";
    case "system":
    default:
      return "Système";
  }
};
