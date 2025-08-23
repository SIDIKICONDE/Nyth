import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCentralizedFont } from '../../hooks/useCentralizedFont';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

interface ProgressBarProps {
  progress: number; // 0-1
  total?: number;
  current?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
  duration?: number;
  showPercentage?: boolean;
  label?: string;
  style?: any;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  current,
  color,
  backgroundColor,
  height = 8,
  borderRadius = 4,
  animated = true,
  duration = 500,
  showPercentage = false,
  label,
  style,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const progressColor = color || currentTheme.colors.primary;
  const bgColor = backgroundColor || currentTheme.colors.border + '30';

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, duration]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const displayProgress = total && current
    ? `${current}/${total}`
    : showPercentage
    ? `${Math.round(progress * 100)}%`
    : '';

  return (
    <View style={[{ marginVertical: 4 }, style]}>
      {label && (
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={[ui, { color: currentTheme.colors.text, fontSize: 12 }]}>
            {label}
          </Text>
          {displayProgress && (
            <Text style={[ui, { color: currentTheme.colors.textSecondary, fontSize: 11 }]}>
              {displayProgress}
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          tw`relative rounded-full overflow-hidden`,
          {
            height,
            borderRadius,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Animated.View
          style={[
            tw`absolute top-0 left-0 h-full`,
            {
              width,
              backgroundColor: progressColor,
              borderRadius,
            },
          ]}
        />

        {/* Effet de brillance */}
        <Animated.View
          style={[
            tw`absolute top-0 h-full w-8 bg-white opacity-30`,
            {
              transform: [
                {
                  translateX: animatedProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-32, 1000], // Animation de la brillance
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

// Indicateur de chargement avec icône et message
interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  style?: any;
  type?: 'spinner' | 'pulse' | 'shimmer';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  color,
  message,
  style,
  type = 'spinner',
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const loadingColor = color || currentTheme.colors.primary;

  const getSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  useEffect(() => {
    if (type === 'spinner') {
      const spinAnimation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }

    if (type === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [type]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconSize = getSize();

  return (
    <View style={[tw`items-center justify-center`, style]}>
      {type === 'spinner' && (
        <Animated.View
          style={[
            tw`items-center justify-center`,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="loading"
            size={iconSize}
            color={loadingColor}
          />
        </Animated.View>
      )}

      {type === 'pulse' && (
        <Animated.View
          style={[
            tw`items-center justify-center rounded-full`,
            {
              transform: [{ scale }],
              width: iconSize * 2,
              height: iconSize * 2,
              backgroundColor: loadingColor + '20',
            },
          ]}
        >
          <MaterialCommunityIcons
            name="radiobox-marked"
            size={iconSize}
            color={loadingColor}
          />
        </Animated.View>
      )}

      {type === 'shimmer' && (
        <View
          style={[
            tw`items-center justify-center rounded-full overflow-hidden`,
            {
              width: iconSize,
              height: iconSize,
              backgroundColor: loadingColor + '30',
            },
          ]}
        >
          <MaterialCommunityIcons
            name="image-outline"
            size={iconSize * 0.7}
            color={loadingColor}
          />
        </View>
      )}

      {message && (
        <Text
          style={[
            ui,
            tw`mt-3 text-center`,
            {
              color: currentTheme.colors.textSecondary,
              fontSize: size === 'small' ? 11 : size === 'large' ? 14 : 12,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Indicateur de statut avec icône et couleur
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'warning' | 'info';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'medium',
  style,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'check-circle',
          color: '#27AE60',
          defaultMessage: 'Opération réussie',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          color: '#E74C3C',
          defaultMessage: 'Une erreur est survenue',
        };
      case 'warning':
        return {
          icon: 'alert',
          color: '#F39C12',
          defaultMessage: 'Attention requise',
        };
      case 'info':
        return {
          icon: 'information',
          color: currentTheme.colors.primary,
          defaultMessage: 'Information',
        };
      default:
        return {
          icon: 'loading',
          color: currentTheme.colors.primary,
          defaultMessage: 'Chargement...',
        };
    }
  };

  const config = getStatusConfig();
  const iconSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;

  if (status === 'loading') {
    return (
      <LoadingIndicator
        size={size}
        color={config.color}
        message={message || config.defaultMessage}
        style={style}
      />
    );
  }

  return (
    <View style={[tw`flex-row items-center`, style]}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={iconSize}
        color={config.color}
      />
      {message && (
        <Text
          style={[
            ui,
            tw`ml-2`,
            {
              color: currentTheme.colors.text,
              fontSize: iconSize * 0.6,
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

// Indicateur de téléchargement avec vitesse
interface DownloadIndicatorProps {
  progress: number;
  speed?: string;
  remainingTime?: string;
  fileName?: string;
  style?: any;
}

export const DownloadIndicator: React.FC<DownloadIndicatorProps> = ({
  progress,
  speed,
  remainingTime,
  fileName,
  style,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  return (
    <View style={[tw`p-4 rounded-lg`, style]}>
      {fileName && (
        <Text
          style={[
            ui,
            tw`mb-2 text-center`,
            {
              color: currentTheme.colors.text,
              fontSize: 14,
              fontWeight: '600',
            },
          ]}
        >
          {fileName}
        </Text>
      )}

      <ProgressBar
        progress={progress}
        showPercentage={true}
        height={6}
        color={currentTheme.colors.primary}
      />

      {(speed || remainingTime) && (
        <View style={tw`flex-row justify-between mt-2`}>
          {speed && (
            <Text
              style={[
                ui,
                { color: currentTheme.colors.textSecondary, fontSize: 11 },
              ]}
            >
              {speed}
            </Text>
          )}
          {remainingTime && (
            <Text
              style={[
                ui,
                { color: currentTheme.colors.textSecondary, fontSize: 11 },
              ]}
            >
              {remainingTime}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
