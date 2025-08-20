import { Dimensions } from "react-native";
import { useOrientation } from "../../../hooks/useOrientation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Fonction pour calculer les dimensions adaptatives des cahiers
export const getBookDimensions = (
  orientation?: ReturnType<typeof useOrientation>
) => {
  if (!orientation) {
    // Valeurs par défaut si orientation n'est pas disponible
    return {
      BOOK_WIDTH: SCREEN_WIDTH * 0.28,
      BOOK_HEIGHT: SCREEN_WIDTH * 0.28 * 1.3, // Ratio cahier (plus carré)
      ITEMS_PER_ROW: 3,
    };
  }

  const { isTablet, isLargeTablet, isLandscape, width } = orientation;

  let itemsPerRow = 3;
  let widthRatio = 0.28;

  if (isLargeTablet) {
    // Grandes tablettes
    itemsPerRow = isLandscape ? 5 : 4;
    widthRatio = isLandscape ? 0.18 : 0.22;
  } else if (isTablet) {
    // Tablettes standard
    itemsPerRow = isLandscape ? 4 : 3;
    widthRatio = isLandscape ? 0.22 : 0.28;
  } else {
    // Smartphones
    itemsPerRow = isLandscape ? 4 : 3;
    widthRatio = isLandscape ? 0.22 : 0.28;
  }

  const bookWidth = width * widthRatio;
  const bookHeight = bookWidth * 1.3; // Ratio cahier/carnet (plus carré que 1.5)

  return {
    BOOK_WIDTH: bookWidth,
    BOOK_HEIGHT: bookHeight,
    ITEMS_PER_ROW: itemsPerRow,
  };
};

// Valeurs par défaut pour la compatibilité
export const BOOK_WIDTH = SCREEN_WIDTH * 0.28;
export const BOOK_HEIGHT = BOOK_WIDTH * 1.3; // Ratio cahier
export const ITEMS_PER_ROW = 3;
