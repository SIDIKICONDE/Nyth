import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../contexts/ThemeContext';

interface ResponsiveTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'small';
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'normal' | 'bold' | 'medium' | 'light';
  style?: StyleProp<TextStyle>;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  variant = 'body',
  color,
  align,
  weight = 'normal',
  style,
  children,
  ...props
}) => {
  const { fontSize, isTablet } = useResponsive();
  const { currentTheme } = useTheme();

  const getFontSize = (): number => {
    const sizes = {
      h1: isTablet ? 36 : 28,
      h2: isTablet ? 28 : 24,
      h3: isTablet ? 24 : 20,
      h4: isTablet ? 20 : 18,
      body: isTablet ? 18 : 16,
      caption: isTablet ? 16 : 14,
      small: isTablet ? 14 : 12,
    };
    
    return fontSize(sizes[variant]);
  };

  const getFontWeight = (): TextStyle['fontWeight'] => {
    const weights: Record<string, TextStyle['fontWeight']> = {
      light: '300',
      normal: '400',
      medium: '500',
      bold: '700',
    };
    
    return weights[weight];
  };

  const textStyle: TextStyle = {
    fontSize: getFontSize(),
    fontWeight: getFontWeight(),
    color: color || currentTheme.colors.text,
    textAlign: align,
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};
