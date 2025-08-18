import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = 2,
  gap = 16,
  style,
}) => {
  const { moderateScale, isTablet, isLandscape } = useResponsive();

  const getColumns = (): number => {
    if (isTablet && isLandscape) {
      return Math.min(columns * 2, 4);
    }
    if (isTablet) {
      return Math.min(columns + 1, 3);
    }
    return columns;
  };

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -moderateScale(gap / 2),
  };

  const childArray = React.Children.toArray(children);
  const actualColumns = getColumns();

  return (
    <View style={[gridStyle, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / actualColumns}%`,
            paddingHorizontal: moderateScale(gap / 2),
            marginBottom: moderateScale(gap),
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveRowProps {
  children: ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  children,
  gap = 16,
  align = 'flex-start',
  wrap = false,
  style,
}) => {
  const { moderateScale } = useResponsive();

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: align,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };

  const childArray = React.Children.toArray(children);

  return (
    <View style={[rowStyle, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            marginRight: index < childArray.length - 1 ? moderateScale(gap) : 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveColumnProps {
  children: ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  style?: StyleProp<ViewStyle>;
}

export const ResponsiveColumn: React.FC<ResponsiveColumnProps> = ({
  children,
  gap = 16,
  align = 'stretch',
  style,
}) => {
  const { moderateScale } = useResponsive();

  const columnStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems: align,
  };

  const childArray = React.Children.toArray(children);

  return (
    <View style={[columnStyle, style]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{
            marginBottom: index < childArray.length - 1 ? moderateScale(gap) : 0,
            ...(align === 'stretch' && { width: '100%' }),
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};