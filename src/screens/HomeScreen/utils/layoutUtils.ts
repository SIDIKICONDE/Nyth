import { OrientationInfo } from "../../../hooks/useOrientation";

/**
 * Calcule le nombre de colonnes selon l'orientation et le type d'appareil
 */
export function getNumColumns(orientation: OrientationInfo): number {
  const { isTablet, isLargeTablet, isLandscape, deviceType, width } =
    orientation;

  if (isLargeTablet) {
    // Grandes tablettes (iPad Pro, etc.)
    return isLandscape ? 4 : 3;
  }

  if (isTablet) {
    // Tablettes standard
    return isLandscape ? 3 : 2;
  }

  // Smartphones
  if (isLandscape && width > 700) {
    // Smartphones en mode paysage avec écran large
    return 2;
  }

  return 1; // Smartphone en mode portrait ou écran étroit
}

/**
 * Calcule la taille optimale des éléments selon l'appareil
 */
export function getItemSize(orientation: OrientationInfo): {
  width: number;
  height: number;
  spacing: number;
} {
  const { isTablet, isLargeTablet, width } = orientation;
  const numColumns = getNumColumns(orientation);

  // Espacement adaptatif
  let spacing = 8;
  if (isLargeTablet) {
    spacing = 16;
  } else if (isTablet) {
    spacing = 12;
  }

  // Calcul de la largeur des éléments
  const totalSpacing = spacing * (numColumns + 1);
  const availableWidth = width - totalSpacing;
  const itemWidth = availableWidth / numColumns;

  // Hauteur proportionnelle
  const itemHeight = itemWidth * 1.2; // Ratio 1:1.2

  return {
    width: itemWidth,
    height: itemHeight,
    spacing,
  };
}

/**
 * Calcule les marges et paddings adaptatifs
 */
export function getAdaptivePadding(orientation: OrientationInfo): {
  horizontal: number;
  vertical: number;
  containerPadding: number;
} {
  const { isTablet, isLargeTablet, isSmallPhone } = orientation;

  if (isLargeTablet) {
    return {
      horizontal: 32,
      vertical: 24,
      containerPadding: 24,
    };
  }

  if (isTablet) {
    return {
      horizontal: 24,
      vertical: 20,
      containerPadding: 20,
    };
  }

  if (isSmallPhone) {
    return {
      horizontal: 12,
      vertical: 12,
      containerPadding: 12,
    };
  }

  // Smartphone standard
  return {
    horizontal: 16,
    vertical: 16,
    containerPadding: 16,
  };
}

/**
 * Calcule la taille de police adaptative
 */
export function getAdaptiveFontSize(
  orientation: OrientationInfo,
  baseSize: number
): number {
  const { isTablet, isLargeTablet, fontScale } = orientation;

  let multiplier = 1;

  if (isLargeTablet) {
    multiplier = 1.3;
  } else if (isTablet) {
    multiplier = 1.15;
  }

  // Prendre en compte les préférences d'accessibilité de l'utilisateur
  return Math.round(baseSize * multiplier * fontScale);
}

/**
 * Génère le label pour le compteur d'éléments
 */
export function getItemsLabel(
  scriptsCount: number,
  recordingsCount: number,
  t: (key: string, options?: any) => string
): string {
  const itemsCount = scriptsCount + recordingsCount;
  return itemsCount > 1
    ? t("home.items", { count: itemsCount })
    : t("home.item", { count: itemsCount });
}

/**
 * Génère le sous-titre pour le header
 */
export function getHeaderSubtitle(
  selectionMode: boolean,
  selectedScripts: string[],
  selectedRecordings: string[],
  scriptsCount: number,
  recordingsCount: number,
  t: (key: string, options?: any) => string
): string {
  if (selectionMode) {
    return `${selectedScripts.length + selectedRecordings.length}`;
  }
  return getItemsLabel(scriptsCount, recordingsCount, t);
}
