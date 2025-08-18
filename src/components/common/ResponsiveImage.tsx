import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { aspectRatio } from '../../utils/responsive';

interface ResponsiveImageProps extends Omit<ImageProps, 'style'> {
  width?: number | string;
  height?: number | string;
  aspectRatioValue?: number; // width/height ratio
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  showLoading?: boolean;
  fallbackComponent?: React.ReactNode;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  width,
  height,
  aspectRatioValue,
  containerStyle,
  imageStyle,
  showLoading = true,
  fallbackComponent,
  source,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { wp, hp, moderateScale } = useResponsive();

  const getImageDimensions = (): ImageStyle => {
    if (aspectRatioValue) {
      return aspectRatio(aspectRatioValue, 1);
    }

    if (width && height) {
      return {
        width: typeof width === 'string' ? width : moderateScale(width),
        height: typeof height === 'string' ? height : moderateScale(height),
      };
    }

    if (width) {
      return {
        width: typeof width === 'string' ? width : moderateScale(width),
        height: undefined,
      };
    }

    if (height) {
      return {
        width: undefined,
        height: typeof height === 'string' ? height : moderateScale(height),
      };
    }

    // Default to full width with 16:9 aspect ratio
    return aspectRatio(16, 9);
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  if (error && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <View style={[getImageDimensions(), containerStyle]}>
      <Image
        source={source}
        style={[
          {
            width: '100%',
            height: '100%',
          },
          imageStyle,
        ]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />
      {showLoading && loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
};