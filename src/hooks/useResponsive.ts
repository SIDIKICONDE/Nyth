import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  responsiveFontSize,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isLandscape,
  getCurrentBreakpoint,
  wp,
  hp,
} from '../utils/responsive';

interface ResponsiveHookReturn {
  // Dimensions
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  
  // Scaling functions
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  moderateVerticalScale: (size: number, factor?: number) => number;
  fontSize: (size: number) => number;
  
  // Device type
  isTablet: boolean;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  isLandscape: boolean;
  
  // Breakpoint
  breakpoint: string;
  
  // Percentage functions
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
}

export const useResponsive = (): ResponsiveHookReturn => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return {
    // Dimensions
    width: dimensions.width,
    height: dimensions.height,
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    
    // Scaling functions
    scale,
    verticalScale,
    moderateScale,
    moderateVerticalScale,
    fontSize: responsiveFontSize,
    
    // Device type
    isTablet: isTablet(),
    isSmallDevice: isSmallDevice(),
    isLargeDevice: isLargeDevice(),
    isLandscape: dimensions.width > dimensions.height,
    
    // Breakpoint
    breakpoint: getCurrentBreakpoint(),
    
    // Percentage functions
    wp,
    hp,
  };
};

// Hook for responsive styles
export const useResponsiveStyles = <T extends Record<string, any>>(
  stylesFn: (props: ResponsiveHookReturn) => T
): T => {
  const responsive = useResponsive();
  return stylesFn(responsive);
};
