import { useMemo } from 'react';
import { useOrientation } from './useOrientation';

export interface AdaptiveDimensions {
  // Espacement
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Tailles de police
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  
  // Hauteurs des composants
  componentHeight: {
    button: number;
    input: number;
    header: number;
    touchTarget: number;
  };
  
  // Rayons de bordure
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  
  // Dimensions spécifiques à l'appareil
  device: {
    isTablet: boolean;
    isLargeTablet: boolean;
    isSmallPhone: boolean;
    columns: number;
    containerPadding: number;
  };
}

export const useAdaptiveDimensions = (): AdaptiveDimensions => {
  const orientation = useOrientation();
  
  return useMemo(() => {
    const { isTablet, isLargeTablet, isSmallPhone, fontScale } = orientation;
    
    // Multiplicateur de base selon le type d'appareil
    let sizeMultiplier = 1;
    if (isLargeTablet) {
      sizeMultiplier = 1.4;
    } else if (isTablet) {
      sizeMultiplier = 1.2;
    } else if (isSmallPhone) {
      sizeMultiplier = 0.9;
    }
    
    // Espacement adaptatif
    const spacing = {
      xs: Math.round(4 * sizeMultiplier),
      sm: Math.round(8 * sizeMultiplier),
      md: Math.round(16 * sizeMultiplier),
      lg: Math.round(24 * sizeMultiplier),
      xl: Math.round(32 * sizeMultiplier),
    };
    
    // Tailles de police adaptatives
    const fontSize = {
      xs: Math.round(10 * sizeMultiplier * fontScale),
      sm: Math.round(12 * sizeMultiplier * fontScale),
      md: Math.round(14 * sizeMultiplier * fontScale),
      lg: Math.round(16 * sizeMultiplier * fontScale),
      xl: Math.round(20 * sizeMultiplier * fontScale),
      xxl: Math.round(24 * sizeMultiplier * fontScale),
    };
    
    // Hauteurs des composants
    const componentHeight = {
      button: Math.round(48 * sizeMultiplier),
      input: Math.round(56 * sizeMultiplier),
      header: Math.round(56 * sizeMultiplier),
      touchTarget: Math.round(44 * sizeMultiplier),
    };
    
    // Rayons de bordure
    const borderRadius = {
      sm: Math.round(4 * sizeMultiplier),
      md: Math.round(8 * sizeMultiplier),
      lg: Math.round(12 * sizeMultiplier),
      xl: Math.round(16 * sizeMultiplier),
    };
    
    // Calcul du nombre de colonnes
    let columns = 1;
    if (isLargeTablet) {
      columns = orientation.isLandscape ? 4 : 3;
    } else if (isTablet) {
      columns = orientation.isLandscape ? 3 : 2;
    } else if (orientation.isLandscape && orientation.width > 700) {
      columns = 2;
    }
    
    // Padding du conteneur
    let containerPadding = spacing.md;
    if (isLargeTablet) {
      containerPadding = spacing.xl;
    } else if (isTablet) {
      containerPadding = spacing.lg;
    } else if (isSmallPhone) {
      containerPadding = spacing.sm;
    }
    
    return {
      spacing,
      fontSize,
      componentHeight,
      borderRadius,
      device: {
        isTablet,
        isLargeTablet,
        isSmallPhone,
        columns,
        containerPadding,
      },
    };
  }, [orientation]);
}; 