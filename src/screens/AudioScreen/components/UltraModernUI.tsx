// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

interface UltraModernUIProps {
  children?: any;
  showParticles?: boolean;
  showGlassEffect?: boolean;
  showFloatingElements?: boolean;
}

export default function UltraModernUI({
  children,
  showParticles = true,
  showGlassEffect = true,
  showFloatingElements = true,
}: UltraModernUIProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Animations de flottement pour les éléments
  const floatingAnimation1 = useSharedValue(0);
  const floatingAnimation2 = useSharedValue(0);
  const floatingAnimation3 = useSharedValue(0);

  const floatingAnimations = [
    floatingAnimation1,
    floatingAnimation2,
    floatingAnimation3,
  ];

  // Démarrer les animations de flottement
  React.useEffect(() => {
      floatingAnimation1.value = withRepeat(
        withTiming(1, { duration: 4000 }),
        -1,
        true
      );

      floatingAnimation2.value = withRepeat(
        withTiming(1, { duration: 3500 }),
        -1,
        true
      );

      floatingAnimation3.value = withRepeat(
        withTiming(1, { duration: 4500 }),
        -1,
        true
      );
  }, []);

  return (
    <View style={tw`flex-1`}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={[
          currentTheme.colors.background,
          currentTheme.colors.background + 'E6',
          currentTheme.colors.accent + '15',
        ]}
        style={tw`absolute inset-0`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {showParticles && (
        <UltraModernParticles
          colors={[
            currentTheme.colors.accent,
            '#8B5CF6',
            '#EF4444',
            '#10B981',
            '#F59E0B',
          ]}
        />
      )}

      {showFloatingElements && (
        <View style={tw`absolute inset-0`}>
          {floatingAnimations.map((animation, index) => {
            const animatedStyle = useAnimatedStyle(() => {
              const translateY = interpolate(
                    animation.value,
                    [0, 1],
                    [0, -30],
                // @ts-ignore
                    Extrapolate.CLAMP
              );
              const scale = interpolate(
                    animation.value,
                    [0, 1],
                    [1, 1.2],
                // @ts-ignore
                    Extrapolate.CLAMP
              );
              const opacity = interpolate(
                animation.value,
                [0, 0.5, 1],
                [0.3, 0.8, 0.3],
                // @ts-ignore
                Extrapolate.CLAMP
              );

              return {
                transform: [
                  { translateY },
                  { scale }
                ],
                opacity,
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  tw`absolute rounded-full`,
                  {
                    width: 60 + index * 20,
                    height: 60 + index * 20,
                    backgroundColor: currentTheme.colors.accent + '20',
                    borderWidth: 1,
                    borderColor: currentTheme.colors.accent + '40',
                    top: height * (0.2 + index * 0.2),
                    left: width * (0.1 + index * 0.3),
                  },
                  animatedStyle,
                ]}
              >
                {showGlassEffect && Platform.OS === 'ios' && (
                  <BlurView
                    style={tw`absolute inset-0 rounded-full`}
                    blurType="light"
                    blurAmount={10}
                  />
                )}
              </Animated.View>
            );
          })}
        </View>
      )}

      <LinearGradient
        colors={[
          'transparent',
          currentTheme.colors.background + '10',
          'transparent',
        ]}
        style={tw`absolute inset-0`}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={tw`flex-1`}>{children}</View>

      <View style={tw`absolute top-12 right-4`}>
        <LinearGradient
          colors={[
            currentTheme.colors.accent,
            currentTheme.colors.accent + 'E6',
          ]}
          style={tw`px-3 py-1 rounded-full flex-row items-center`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Icon name="diamond" size={12} color="white" style={tw`mr-1`} />
          <Text style={tw`text-white text-xs font-semibold`}>
            {t('ui.premium', 'PREMIUM')}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// Composant de particules simple
function UltraModernParticles({
  colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B'],
}: {
  colors?: string[];
}) {
  const particles = colors.slice(0, 8).map((color, index) => (
    <View
      key={index}
      style={[
        tw`absolute rounded-full`,
        {
          width: 6 + (index % 3) * 2,
          height: 6 + (index % 3) * 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.5,
          shadowRadius: 2,
          top: Math.random() * height,
          left: Math.random() * width,
          opacity: 0.3 + Math.random() * 0.4,
        },
      ]}
    />
  ));

  return <View style={tw`absolute inset-0`}>{particles}</View>;
}

// Composant de démonstration simple
export function UltraModernDemo() {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <LinearGradient
          colors={[
            currentTheme.colors.accent + '20',
            currentTheme.colors.accent + '10',
            '#8B5CF6' + '15',
            '#EF4444' + '10',
          ]}
        style={tw`flex-1 w-full items-center justify-center`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[tw`text-xl font-bold`, { color: currentTheme.colors.textPrimary }]}>
          Ultra Modern UI Demo
        </Text>
        <Text style={[tw`mt-4 text-base`, { color: currentTheme.colors.textSecondary }]}>
          Interface moderne sans Skia
        </Text>
      </LinearGradient>
    </View>
  );
}

// Composant de carte avec effets de press
export function UltraModernCard({
  children,
  onPress,
  gradient = true,
  glassEffect = true,
}: {
  children: any;
  onPress?: () => void;
  gradient?: boolean;
  glassEffect?: boolean;
}) {
  const { currentTheme } = useTheme();
  const scaleAnimation = useSharedValue(1);

  const handlePressIn = () => {
    scaleAnimation.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scaleAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  return (
    <Animated.View
      style={[
        tw`rounded-2xl overflow-hidden`,
        {
          shadowColor: currentTheme.colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={tw`relative`}
        activeOpacity={1}
      >
        {gradient ? (
          <LinearGradient
            colors={[
              currentTheme.colors.background,
              currentTheme.colors.background + 'F0',
              currentTheme.colors.accent + '10',
            ]}
            style={tw`p-6`}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {children}
          </LinearGradient>
        ) : (
          <View
            style={[
              tw`p-6`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            {children}
          </View>
        )}

        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'transparent']}
          style={tw`absolute top-0 left-0 right-0 h-16`}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <LinearGradient
          colors={[
            currentTheme.colors.accent + '40',
            currentTheme.colors.accent + '20',
            'transparent',
            currentTheme.colors.accent + '20',
            currentTheme.colors.accent + '40',
          ]}
          style={tw`absolute inset-0`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {glassEffect && Platform.OS === 'ios' && (
          <BlurView
            style={tw`absolute inset-0`}
            blurType="light"
            blurAmount={5}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Bouton avec effets de press
export function UltraModernButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'medium',
  loading = false,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}) {
  const { currentTheme } = useTheme();
  const scaleAnimation = useSharedValue(1);

  const getGradientColors = () => {
    switch (variant) {
      case 'primary':
        return [currentTheme.colors.accent, currentTheme.colors.accent + 'E6'];
      case 'secondary':
        return ['#6B7280', '#4B5563'];
      case 'danger':
        return ['#EF4444', '#DC2626'];
      case 'success':
        return ['#10B981', '#059669'];
      default:
        return [currentTheme.colors.accent, currentTheme.colors.accent + 'E6'];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return tw`px-4 py-2 rounded-xl`;
      case 'large':
        return tw`px-8 py-4 rounded-2xl`;
      default:
        return tw`px-6 py-3 rounded-xl`;
    }
  };

  const handlePressIn = () => {
    scaleAnimation.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scaleAnimation.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  return (
    <Animated.View
      style={[
        tw`overflow-hidden`,
        getSizeStyles(),
        {
          shadowColor: getGradientColors()[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={tw`relative`}
        activeOpacity={1}
        disabled={loading}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={tw`flex-row items-center justify-center`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
              <LoadingSpinner />
          ) : (
            <>
              {icon && (
                <Icon name={icon} size={18} color="white" style={tw`mr-2`} />
              )}
              <Text style={tw`text-white font-semibold text-base`}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>

        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'transparent']}
          style={tw`absolute top-0 left-0 right-0 h-8`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Composant de chargement avec rotation
function LoadingSpinner() {
  const { currentTheme } = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      rotation.value = (rotation.value + 10) % 360;
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[tw`w-6 h-6`, animatedStyle]}>
      <LinearGradient
        colors={[currentTheme.colors.accent, '#8B5CF6', '#EF4444']}
        style={tw`w-6 h-6 rounded-full`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

// Indicateur de chargement avec rotation
export function UltraModernLoader({
  message = 'Chargement...',
  size = 'medium',
}: {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const { currentTheme } = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      rotation.value = (rotation.value + 15) % 360;
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 80;
      default:
        return 60;
    }
  };

  const canvasSize = getSize();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={tw`flex-1 items-center justify-center p-8`}>
      <Animated.View style={[{ width: canvasSize, height: canvasSize }, animatedStyle]}>
        <LinearGradient
          colors={[
            currentTheme.colors.accent,
            currentTheme.colors.accent + 'E6',
            '#8B5CF6',
            '#EF4444',
            currentTheme.colors.accent,
          ]}
          style={tw`w-full h-full rounded-full`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {message && (
        <Text
          style={[
            tw`mt-4 text-center font-medium`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

// Toast notification ultra-moderne
export function UltraModernToast({
  message,
  type = 'info',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}) {
  const { currentTheme } = useTheme();

  const getToastColors = () => {
    switch (type) {
      case 'success':
        return ['#10B981', '#059669'];
      case 'error':
        return ['#EF4444', '#DC2626'];
      case 'warning':
        return ['#F59E0B', '#D97706'];
      default:
        return [currentTheme.colors.accent, currentTheme.colors.accent + 'E6'];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={tw`absolute top-20 left-4 right-4 z-50`}>
      <LinearGradient
        colors={getToastColors()}
        style={tw`p-4 rounded-2xl flex-row items-center shadow-lg`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Icon name={getIcon()} size={20} color="white" style={tw`mr-3`} />
        <Text style={tw`text-white flex-1 font-medium`}>{message}</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={tw`p-1`}>
            <Icon name="close" size={16} color="white" />
          </TouchableOpacity>
        )}

        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'transparent']}
          style={tw`absolute top-0 left-0 right-0 h-1 rounded-t-2xl`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </LinearGradient>
    </View>
  );
}