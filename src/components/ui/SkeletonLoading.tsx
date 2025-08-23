import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import tw from 'twrnc';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  animated?: boolean;
  duration?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
  animated = true,
  duration = 1500,
}) => {
  const { currentTheme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();

      return () => animation.stop();
    }
  }, [animated, duration]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: currentTheme.colors.border + '40',
          opacity: animated ? opacity : 0.3,
        },
        style,
      ]}
    />
  );
};

// Skeleton pour les livres de la bibliothèque
export const SkeletonBookItem: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`rounded-lg p-4 m-2`,
        {
          width: 280,
          height: 364, // 280 * 1.3
          backgroundColor: currentTheme.colors.surface + '20',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      {/* Couverture du livre */}
      <Skeleton
        width={248} // 280 - 32 padding
        height={200}
        borderRadius={6}
        style={tw`mx-auto mb-4`}
      />

      {/* Titre */}
      <Skeleton
        width="80%"
        height={16}
        style={tw`mx-auto mb-2`}
      />

      <Skeleton
        width="60%"
        height={14}
        style={tw`mx-auto mb-3`}
      />

      {/* Métadonnées */}
      <Skeleton
        width={80}
        height={12}
        style={tw`mx-auto`}
      />
    </View>
  );
};

// Skeleton pour les cassettes vidéo
export const SkeletonVideoItem: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`rounded m-2 p-2`,
        {
          width: 150,
          height: 110,
          backgroundColor: currentTheme.colors.surface + '20',
        },
      ]}
    >
      {/* Corps de la cassette */}
      <Skeleton
        width="100%"
        height="100%"
        borderRadius={4}
      />

      {/* Étiquette */}
      <View style={tw`absolute top-2 left-2 right-2 bottom-2`}>
        <Skeleton
          width="100%"
          height="100%"
          borderRadius={2}
          style={{ backgroundColor: currentTheme.colors.background + '60' }}
        />
      </View>

      {/* Trous de cassette */}
      <View style={tw`absolute bottom-3 left-6 right-6 flex-row justify-between`}>
        <Skeleton width={8} height={4} borderRadius={2} />
        <Skeleton width={8} height={4} borderRadius={2} />
      </View>
    </View>
  );
};

// Skeleton pour une étagère complète
export const SkeletonShelf: React.FC<{ itemCount?: number }> = ({
  itemCount = 3
}) => {
  return (
    <View style={tw`mb-6`}>
      <View style={tw`flex-row justify-center items-end px-4 py-4`}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <View key={index} style={tw`mx-2`}>
            <SkeletonBookItem />
          </View>
        ))}
      </View>
      <Skeleton
        width="100%"
        height={12}
        borderRadius={2}
        style={tw`mx-4`}
      />
    </View>
  );
};

// Skeleton pour une étagère vidéo
export const SkeletonVideoShelf: React.FC<{ itemCount?: number }> = ({
  itemCount = 2
}) => {
  return (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row justify-center px-4 py-2`}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <View key={index} style={tw`mx-2`}>
            <SkeletonVideoItem />
          </View>
        ))}
      </View>
      <Skeleton
        width="100%"
        height={12}
        borderRadius={2}
        style={tw`mx-4`}
      />
    </View>
  );
};

// Skeleton pour la liste complète
export const SkeletonLibrary: React.FC<{
  type?: 'books' | 'videos';
  shelfCount?: number;
}> = ({ type = 'books', shelfCount = 3 }) => {
  return (
    <View style={tw`flex-1`}>
      {Array.from({ length: shelfCount }).map((_, index) => (
        <View key={index}>
          {type === 'books' ? (
            <SkeletonShelf />
          ) : (
            <SkeletonVideoShelf />
          )}
        </View>
      ))}
    </View>
  );
};
