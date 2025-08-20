import tw from 'twrnc';
import { ViewStyle, TextStyle } from 'react-native';
import { 
  moderateScale, 
  scale, 
  verticalScale,
  responsiveFontSize,
  wp,
  hp,
  isTablet,
  isSmallDevice,
  getCurrentBreakpoint
} from './responsive';

// Extended tailwind with responsive utilities
export const rtw = {
  // Base tw function
  style: tw.style.bind(tw),
  
  // Responsive spacing
  p: (value: number) => ({ padding: moderateScale(value * 4) }),
  px: (value: number) => ({ paddingHorizontal: moderateScale(value * 4) }),
  py: (value: number) => ({ paddingVertical: moderateScale(value * 4) }),
  pt: (value: number) => ({ paddingTop: moderateScale(value * 4) }),
  pb: (value: number) => ({ paddingBottom: moderateScale(value * 4) }),
  pl: (value: number) => ({ paddingLeft: moderateScale(value * 4) }),
  pr: (value: number) => ({ paddingRight: moderateScale(value * 4) }),
  
  m: (value: number) => ({ margin: moderateScale(value * 4) }),
  mx: (value: number) => ({ marginHorizontal: moderateScale(value * 4) }),
  my: (value: number) => ({ marginVertical: moderateScale(value * 4) }),
  mt: (value: number) => ({ marginTop: moderateScale(value * 4) }),
  mb: (value: number) => ({ marginBottom: moderateScale(value * 4) }),
  ml: (value: number) => ({ marginLeft: moderateScale(value * 4) }),
  mr: (value: number) => ({ marginRight: moderateScale(value * 4) }),
  
  // Responsive dimensions
  w: (value: number) => ({ width: moderateScale(value * 4) }),
  h: (value: number) => ({ height: moderateScale(value * 4) }),
  wp: (percentage: number) => ({ width: wp(percentage) }),
  hp: (percentage: number) => ({ height: hp(percentage) }),
  
  // Responsive text
  text: (size: number) => ({ fontSize: responsiveFontSize(size) }),
  
  // Responsive border radius
  rounded: (value: number) => ({ borderRadius: moderateScale(value) }),
  
  // Responsive gap
  gap: (value: number) => ({ gap: moderateScale(value * 4) }),
  
  // Conditional styles based on device
  tablet: (styles: ViewStyle | TextStyle) => isTablet() ? styles : {},
  phone: (styles: ViewStyle | TextStyle) => !isTablet() ? styles : {},
  small: (styles: ViewStyle | TextStyle) => isSmallDevice() ? styles : {},
  
  // Breakpoint-based styles
  breakpoint: (breakpoints: Record<string, ViewStyle | TextStyle>) => {
    const current = getCurrentBreakpoint();
    return breakpoints[current] || {};
  },
  
  // Combine multiple responsive styles
  combine: (...styles: (string | ViewStyle | TextStyle | undefined)[]) => {
    return styles.reduce<ViewStyle | TextStyle>((acc, style) => {
      if (!style) return acc;
      if (typeof style === 'string') {
        return { ...acc, ...tw.style(style) };
      }
      return { ...acc, ...style };
    }, {});
  },
};

// Helper functions for common responsive patterns
export const responsiveStyles = {
  // Container with responsive padding
  container: (padding?: number) => rtw.combine(
    'flex-1',
    rtw.px(padding || 4),
    rtw.py(padding || 4),
    rtw.tablet({ paddingHorizontal: moderateScale((padding || 4) * 6) })
  ),
  
  // Card with responsive styling
  card: (isDark?: boolean) => rtw.combine(
    `rounded-lg`,
    rtw.p(4),
    rtw.tablet(rtw.p(6)),
    {
      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#E5E5E5',
      ...rtw.rounded(12),
    }
  ),
  
  // Button with responsive sizing
  button: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = {
      small: { height: moderateScale(32), paddingHorizontal: moderateScale(12) },
      medium: { height: moderateScale(40), paddingHorizontal: moderateScale(16) },
      large: { height: moderateScale(48), paddingHorizontal: moderateScale(20) },
    };
    
    return rtw.combine(
      'items-center justify-center',
      sizes[size],
      rtw.rounded(8)
    );
  },
  
  // Grid with responsive columns
  grid: (columns: number) => {
    const tabletColumns = Math.min(columns * 2, 4);
    return rtw.combine(
      'flex-row flex-wrap',
      rtw.gap(4),
      rtw.tablet(rtw.gap(6))
    );
  },
  
  // Safe area with responsive padding
  safeArea: (insets: { top: number; bottom: number; left: number; right: number }) => ({
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: Math.max(insets.left, moderateScale(16)),
    paddingRight: Math.max(insets.right, moderateScale(16)),
  }),
};
