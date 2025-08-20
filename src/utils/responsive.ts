import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints pour la responsivité
export const BREAKPOINTS = {
  xs: 320,    // Très petits téléphones
  sm: 375,    // Téléphones standard (iPhone SE, etc.)
  md: 414,    // Grands téléphones (iPhone Plus, Pro Max)
  lg: 768,    // Tablettes portrait / petites tablettes
  xl: 1024,   // Tablettes landscape / grandes tablettes
  xxl: 1366,  // Très grandes tablettes / petits laptops
} as const;

// Détection du type d'appareil
export const isTablet = () => {
  const minDimension = Math.min(screenWidth, screenHeight);
  const maxDimension = Math.max(screenWidth, screenHeight);
  const diagonalInches = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight) / 160;
  
  return (
    minDimension >= 768 ||
    maxDimension >= 1024 ||
    diagonalInches >= 7
  );
};

// Helper pour obtenir la largeur actuelle de l'écran
export const getScreenWidth = () => screenWidth;
export const getScreenHeight = () => screenHeight;

// Helper pour vérifier si on est au-dessus d'un breakpoint
export const isBreakpoint = (breakpoint: keyof typeof BREAKPOINTS) => {
  return screenWidth >= BREAKPOINTS[breakpoint];
};

// Fonction pour adapter les valeurs selon la taille de l'écran
export const responsive = (
  phone: number,
  tablet?: number,
  largeTablet?: number
): number => {
  if (largeTablet && isBreakpoint('xl')) {
    return largeTablet;
  }
  if (tablet && (isTablet() || isBreakpoint('lg'))) {
    return tablet;
  }
  return phone;
};

// Fonction pour adapter les valeurs selon des breakpoints spécifiques
export const responsiveBreakpoints = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  default: T;
}): T => {
  if (values.xxl && isBreakpoint('xxl')) return values.xxl;
  if (values.xl && isBreakpoint('xl')) return values.xl;
  if (values.lg && isBreakpoint('lg')) return values.lg;
  if (values.md && isBreakpoint('md')) return values.md;
  if (values.sm && isBreakpoint('sm')) return values.sm;
  if (values.xs && isBreakpoint('xs')) return values.xs;
  return values.default;
};

// Fonction pour adapter les tailles de police
export const responsiveFontSize = (baseSize: number): number => {
  return responsiveBreakpoints({
    xs: baseSize * 0.9,
    sm: baseSize,
    md: baseSize * 1.05,
    lg: baseSize * 1.15,
    xl: baseSize * 1.25,
    default: baseSize,
  });
};

// Fonction pour adapter les espacements (padding, margin)
export const responsiveSpacing = (baseSpacing: number): number => {
  return responsiveBreakpoints({
    xs: baseSpacing * 0.8,
    sm: baseSpacing,
    md: baseSpacing * 1.1,
    lg: baseSpacing * 1.3,
    xl: baseSpacing * 1.5,
    default: baseSpacing,
  });
};

// Hook pour écouter les changements d'orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = React.useState(
    screenWidth > screenHeight ? 'landscape' : 'portrait'
  );

  React.useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  return orientation;
};

// Fonction pour calculer la largeur maximale d'un conteneur
export const getMaxContainerWidth = (): number => {
  return responsiveBreakpoints({
    xs: screenWidth - 32,  // 16px de padding de chaque côté
    sm: screenWidth - 48,  // 24px de padding
    md: screenWidth - 64,  // 32px de padding
    lg: Math.min(600, screenWidth - 80),  // Max 600px avec 40px de padding
    xl: Math.min(800, screenWidth - 120), // Max 800px avec 60px de padding
    xxl: Math.min(1000, screenWidth - 160), // Max 1000px avec 80px de padding
    default: screenWidth - 48,
  });
};

// Fonction pour adapter les hauteurs de composants
export const responsiveHeight = (baseHeight: number): number => {
  return responsiveBreakpoints({
    xs: baseHeight * 0.9,
    sm: baseHeight,
    md: baseHeight * 1.05,
    lg: baseHeight * 1.15,
    xl: baseHeight * 1.25,
    default: baseHeight,
  });
};

// Import React manquant
import React from 'react';

// Constantes de dimensions pour les composants
export const dimensions = {
  buttonHeight: {
    small: 36,
    medium: 48,
    large: 56,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    round: 20,
    xlarge: 24,
  },
  padding: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },
  margin: {
    small: 8,
    medium: 16,
    large: 24,
  },
} as const;

// Fonction pour calculer le padding des safe areas
export const getSafeAreaPadding = (insets: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}) => ({
  paddingTop: insets.top,
  paddingBottom: insets.bottom,
  paddingLeft: insets.left,
  paddingRight: insets.right,
});

// Fonctions de scaling pour la responsivité
export const scale = (size: number): number => {
  return size * (screenWidth / 375); // Base sur iPhone 6/7/8
};

export const verticalScale = (size: number): number => {
  return size * (screenHeight / 667); // Base sur iPhone 6/7/8
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export const moderateVerticalScale = (size: number, factor = 0.5): number => {
  return size + (verticalScale(size) - size) * factor;
};

// Fonctions de dimensionnement
export const wp = (percentage: number): number => {
  return (screenWidth * percentage) / 100;
};

export const hp = (percentage: number): number => {
  return (screenHeight * percentage) / 100;
};

// Détection du type d'appareil
export const isSmallDevice = (): boolean => {
  return screenWidth < 375;
};

export const isLargeDevice = (): boolean => {
  return screenWidth >= 768;
};

export const isLandscape = (): boolean => {
  return screenWidth > screenHeight;
};

export const getCurrentBreakpoint = (): keyof typeof BREAKPOINTS => {
  if (screenWidth >= BREAKPOINTS.xxl) return 'xxl';
  if (screenWidth >= BREAKPOINTS.xl) return 'xl';
  if (screenWidth >= BREAKPOINTS.lg) return 'lg';
  if (screenWidth >= BREAKPOINTS.md) return 'md';
  if (screenWidth >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Fonction pour calculer le ratio d'aspect
export const aspectRatio = (width: number, height: number): number => {
  return width / height;
};