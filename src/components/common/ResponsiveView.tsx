import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { getSafeAreaPadding } from '../../utils/responsive';

interface ResponsiveViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  safeArea?: boolean | 'top' | 'bottom' | 'both';
  padding?: boolean;
  flex?: boolean;
}

export const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  children,
  style,
  safeArea = false,
  padding = true,
  flex = true,
}) => {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useResponsive();

  const getSafeAreaStyle = (): ViewStyle => {
    if (!safeArea) return {};
    
    if (safeArea === 'top') {
      return { paddingTop: insets.top };
    }
    
    if (safeArea === 'bottom') {
      return { paddingBottom: insets.bottom };
    }
    
    if (safeArea === 'both' || safeArea === true) {
      return getSafeAreaPadding(insets);
    }
    
    return {};
  };

  const baseStyle: ViewStyle = {
    ...(flex && { flex: 1 }),
    ...(padding && { padding: moderateScale(16) }),
    ...getSafeAreaStyle(),
  };

  return (
    <View style={[baseStyle, style]}>
      {children}
    </View>
  );
};