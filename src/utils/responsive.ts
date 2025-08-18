import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Responsive scaling functions
export const scale = (size: number): number => {
  return (SCREEN_WIDTH / guidelineBaseWidth) * size;
};

export const verticalScale = (size: number): number => {
  return (SCREEN_HEIGHT / guidelineBaseHeight) * size;
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

export const moderateVerticalScale = (size: number, factor = 0.5): number => {
  return size + (verticalScale(size) - size) * factor;
};

// Font scaling
export const fontScale = (size: number): number => {
  const pixelRatio = PixelRatio.getFontScale();
  return size * pixelRatio;
};

// Responsive font sizes
export const responsiveFontSize = (size: number): number => {
  const newSize = moderateScale(size, 0.3);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Device type detection
export const isTablet = (): boolean => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (SCREEN_WIDTH >= 600 || SCREEN_HEIGHT >= 600) && aspectRatio < 1.6;
};

export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

export const isLargeDevice = (): boolean => {
  return SCREEN_WIDTH >= 414;
};

// Orientation detection
export const isLandscape = (): boolean => {
  const dim = Dimensions.get('window');
  return dim.width > dim.height;
};

// Responsive dimensions
export const dimensions = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  // Common responsive values
  padding: {
    small: moderateScale(8),
    medium: moderateScale(16),
    large: moderateScale(24),
    xlarge: moderateScale(32),
  },
  margin: {
    small: moderateScale(8),
    medium: moderateScale(16),
    large: moderateScale(24),
    xlarge: moderateScale(32),
  },
  borderRadius: {
    small: moderateScale(4),
    medium: moderateScale(8),
    large: moderateScale(12),
    xlarge: moderateScale(16),
    round: moderateScale(100),
  },
  iconSize: {
    small: moderateScale(16),
    medium: moderateScale(24),
    large: moderateScale(32),
    xlarge: moderateScale(48),
  },
  buttonHeight: {
    small: moderateVerticalScale(32),
    medium: moderateVerticalScale(40),
    large: moderateVerticalScale(48),
    xlarge: moderateVerticalScale(56),
  },
};

// Responsive breakpoints
export const breakpoints = {
  small: 375,
  medium: 414,
  large: 768,
  xlarge: 1024,
};

// Get current breakpoint
export const getCurrentBreakpoint = (): string => {
  if (SCREEN_WIDTH < breakpoints.small) return 'xsmall';
  if (SCREEN_WIDTH < breakpoints.medium) return 'small';
  if (SCREEN_WIDTH < breakpoints.large) return 'medium';
  if (SCREEN_WIDTH < breakpoints.xlarge) return 'large';
  return 'xlarge';
};

// Platform-specific adjustments
export const platformSelect = <T>(options: { ios: T; android: T; default?: T }): T => {
  return Platform.select({
    ios: options.ios,
    android: options.android,
    default: options.default || options.ios,
  }) as T;
};

// Safe area padding
export const getSafeAreaPadding = (insets: { top: number; bottom: number; left: number; right: number }) => {
  return {
    paddingTop: Platform.OS === 'ios' ? insets.top : moderateVerticalScale(20),
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};

// Percentage-based dimensions
export const wp = (percentage: number): number => {
  return (percentage * SCREEN_WIDTH) / 100;
};

export const hp = (percentage: number): number => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

// Aspect ratio helper
export const aspectRatio = (width: number, height: number): { width: string | number; aspectRatio: number } => {
  return {
    width: '100%',
    aspectRatio: width / height,
  };
};

// Export all for convenience
export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  responsiveFontSize,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isLandscape,
  dimensions,
  breakpoints,
  getCurrentBreakpoint,
  platformSelect,
  getSafeAreaPadding,
  wp,
  hp,
  aspectRatio,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
};