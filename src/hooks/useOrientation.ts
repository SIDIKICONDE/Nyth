import { useState, useEffect } from 'react';
import { Dimensions, PixelRatio } from 'react-native';

export interface OrientationInfo {
  isLandscape: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isSmallPhone: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  deviceType: 'phone' | 'tablet' | 'large-tablet';
  pixelRatio: number;
  fontScale: number;
}

export const useOrientation = (): OrientationInfo => {
  const [orientation, setOrientation] = useState<OrientationInfo>(() => {
    const { width, height, fontScale } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const isLandscape = width > height;
    
    // Calcul de la taille physique en pouces (approximatif)
    const smallerDimension = Math.min(width, height);
    const largerDimension = Math.max(width, height);
    
    // Amélioration de la détection des tablettes
    // Critères multiples pour une meilleure détection
    const isTablet = (
      (// Ratio tablette
      smallerDimension >= 600 || // Seuil Android standard pour tablettes
      (smallerDimension >= 500 && largerDimension >= 800) || (width * height) / (pixelRatio * pixelRatio) > 1000000) // Surface d'écran physique
    );
    
    const isLargeTablet = smallerDimension >= 800; // iPad Pro, grandes tablettes Android
    const isSmallPhone = smallerDimension < 360; // Petits téléphones
    
    let deviceType: 'phone' | 'tablet' | 'large-tablet' = 'phone';
    if (isLargeTablet) {
      deviceType = 'large-tablet';
    } else if (isTablet) {
      deviceType = 'tablet';
    }
    
    return {
      isLandscape,
      isTablet,
      isLargeTablet,
      isSmallPhone,
      width,
      height,
      orientation: isLandscape ? 'landscape' : 'portrait',
      deviceType,
      pixelRatio,
      fontScale: fontScale || 1,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height, fontScale } = window;
      const pixelRatio = PixelRatio.get();
      const isLandscape = width > height;
      
      const smallerDimension = Math.min(width, height);
      const largerDimension = Math.max(width, height);
      
      const isTablet = (
        smallerDimension >= 600 ||
        (smallerDimension >= 500 && largerDimension >= 800) ||
        (width * height) / (pixelRatio * pixelRatio) > 1000000
      );
      
      const isLargeTablet = smallerDimension >= 800;
      const isSmallPhone = smallerDimension < 360;
      
      let deviceType: 'phone' | 'tablet' | 'large-tablet' = 'phone';
      if (isLargeTablet) {
        deviceType = 'large-tablet';
      } else if (isTablet) {
        deviceType = 'tablet';
      }
      
      setOrientation({
        isLandscape,
        isTablet,
        isLargeTablet,
        isSmallPhone,
        width,
        height,
        orientation: isLandscape ? 'landscape' : 'portrait',
        deviceType,
        pixelRatio,
        fontScale: fontScale || 1,
      });
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
}; 