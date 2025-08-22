import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
// Skia imports for advanced animations
import {
  Canvas,
  Circle,
  Path,
  Skia,
  useValue,
  useClockValue,
  useComputedValue,
  useTiming,
  useSpring,
  vec,
  Group,
  LinearGradient as SkiaLinearGradient,
  RadialGradient,
  Shader,
  useDerivedValue,
  useFrameCallback,
  Rect,
  RRect,
} from '@shopify/react-native-skia';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

interface UltraModernUIProps {
  children?: React.ReactNode;
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

  // Animations pour les éléments flottants
  const [floatingAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  // Animation des particules
  const [particleAnimations] = useState(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      opacity: new Animated.Value(Math.random() * 0.7 + 0.3),
    })),
  );

  useEffect(() => {
    // Animation des éléments flottants
    const floatingAnimation = () => {
      floatingAnimations.forEach((animation, index) => {
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 3000 + index * 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 3000 + index * 500,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
        ]).start();
      });
    };

    // Animation des particules
    const particleAnimation = () => {
      particleAnimations.forEach((particle, index) => {
        const animate = () => {
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: Math.random() * width,
              duration: 8000 + Math.random() * 4000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: Math.random() * height,
              duration: 8000 + Math.random() * 4000,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: Math.random() * 0.8 + 0.2,
              duration: 4000 + Math.random() * 2000,
              easing: Easing.elastic(1),
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.6 + 0.2,
              duration: 3000 + Math.random() * 2000,
              easing: Easing.sin,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTimeout(animate, Math.random() * 5000);
          });
        };
        setTimeout(animate, index * 200);
      });
    };

    floatingAnimation();
    if (showParticles) particleAnimation();

    return () => {
      floatingAnimations.forEach(animation => animation.stopAnimation());
      particleAnimations.forEach(particle => {
        particle.x.stopAnimation();
        particle.y.stopAnimation();
        particle.scale.stopAnimation();
        particle.opacity.stopAnimation();
      });
    };
  }, [floatingAnimations, particleAnimations, showParticles]);

  return (
    <View style={tw`flex-1`}>
      {/* StatusBar moderne */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background avec gradient dynamique */}
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

      {/* Particules animées avec Skia */}
      {showParticles && (
        <UltraModernParticles
          count={30}
          colors={[
            currentTheme.colors.accent,
            '#8B5CF6',
            '#EF4444',
            '#10B981',
            '#F59E0B',
          ]}
        />
      )}

      {/* Éléments flottants avec effet de verre */}
      {showFloatingElements && (
        <View style={tw`absolute inset-0`}>
          {floatingAnimations.map((animation, index) => (
            <Animated.View
              key={index}
              style={[
                tw`absolute`,
                {
                  width: 60 + index * 20,
                  height: 60 + index * 20,
                  borderRadius: 30 + index * 10,
                  backgroundColor: currentTheme.colors.accent + '20',
                  borderWidth: 1,
                  borderColor: currentTheme.colors.accent + '40',
                  top: height * (0.2 + index * 0.2),
                  left: width * (0.1 + index * 0.3),
                },
                {
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -30],
                      }),
                    },
                    {
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.2],
                      }),
                    },
                  ],
                  opacity: animation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 0.8, 0.3],
                  }),
                },
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
          ))}
        </View>
      )}

      {/* Overlay avec gradient subtil */}
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

      {/* Contenu principal */}
      <View style={tw`flex-1`}>{children}</View>

      {/* Indicateur de qualité premium */}
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

// Composant de chargement ultra-moderne avec Skia
function LoadingSpinner() {
  const clock = useClockValue();
  const rotation = useDerivedValue(() => {
    return [{ rotate: clock.current * 0.01 }];
  }, [clock]);

  const pulse = useDerivedValue(() => {
    return 0.8 + Math.sin(clock.current * 0.005) * 0.2;
  }, [clock]);

  const path = Skia.Path.Make();
  path.addArc({ x: 12, y: 12 }, 10, 0, 270);

  return (
    <Canvas style={tw`w-6 h-6`}>
      <Group transform={rotation} origin={vec(12, 12)}>
        <Path
          path={path}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          pathEffect={Skia.PathEffect.MakeCorner(4)}
        >
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(24, 24)}
            colors={['#3B82F6', '#8B5CF6', '#EF4444']}
            positions={[0, 0.5, 1]}
          />
        </Path>
      </Group>

      {/* Particule centrale avec pulsation */}
      <Circle cx={12} cy={12} r={3} opacity={pulse}>
        <RadialGradient
          c={vec(12, 12)}
          r={6}
          colors={['rgba(255,255,255,0.8)', 'transparent']}
        />
      </Circle>
    </Canvas>
  );
}

// Composant de particules ultra-moderne avec Skia
function UltraModernParticles({
  count = 25,
  colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981'],
}: {
  count?: number;
  colors?: string[];
}) {
  const clock = useClockValue();

  // Générer des positions initiales aléatoires
  const particles = Array.from({ length: count }, (_, i) => {
    const x = Math.random() * Dimensions.get('window').width;
    const y = Math.random() * Dimensions.get('window').height;
    const color = colors[i % colors.length];

    return {
      id: i,
      x,
      y,
      color,
      // Animation individuelle pour chaque particule
      animation: useDerivedValue(() => {
        const time = clock.current * 0.001;
        const offset = i * 0.1;
        const wave1 = Math.sin(time + offset) * 2;
        const wave2 = Math.cos(time * 0.7 + offset * 2) * 1.5;
        const wave3 = Math.sin(time * 0.3 + offset * 3) * 3;

        return {
          x: x + wave1 + wave2,
          y: y + wave2 + wave3,
          scale: 0.5 + Math.sin(time * 2 + offset) * 0.3,
          opacity: 0.3 + Math.sin(time * 1.5 + offset * 1.5) * 0.4,
        };
      }, [clock, x, y]),
    };
  });

  return (
    <Canvas style={tw`absolute inset-0`}>
      {particles.map(particle => (
        <Circle
          key={particle.id}
          cx={particle.animation.current.x}
          cy={particle.animation.current.y}
          r={3 * particle.animation.current.scale}
          opacity={particle.animation.current.opacity}
        >
          <RadialGradient
            c={vec(particle.animation.current.x, particle.animation.current.y)}
            r={6}
            colors={[
              particle.color + 'A0',
              particle.color + '40',
              'transparent',
            ]}
          />
        </Circle>
      ))}
    </Canvas>
  );
}

// Composant de démonstration Skia ultra-moderne
export function SkiaUltraModernDemo() {
  const { currentTheme } = useTheme();
  const clock = useClockValue();

  // Animation d'onde sinusoïdale
  const waveAnimation = useDerivedValue(() => {
    const time = clock.current * 0.002;
    return Array.from({ length: 100 }, (_, i) => ({
      x: i * 4,
      y: 100 + Math.sin(time + i * 0.1) * 30,
    }));
  }, [clock]);

  // Animation de morphing
  const morphProgress = useDerivedValue(() => {
    return Math.sin(clock.current * 0.003) * 0.5 + 0.5;
  }, [clock]);

  // Animation de particules avec physique
  const physicsParticles = Array.from({ length: 15 }, (_, i) => {
    const startX = Math.random() * 300 + 50;
    const startY = Math.random() * 400 + 100;

    return {
      id: i,
      animation: useDerivedValue(() => {
        const time = clock.current * 0.001;
        const offset = i * 0.2;

        // Mouvement orbital avec perturbation
        const orbitRadius = 60 + Math.sin(time * 0.5 + offset) * 20;
        const orbitSpeed = time * 0.8 + offset;
        const perturbation = Math.sin(time * 2 + offset * 3) * 15;

        return {
          x: startX + Math.cos(orbitSpeed) * orbitRadius + perturbation,
          y: startY + Math.sin(orbitSpeed) * orbitRadius + perturbation * 0.7,
          scale: 0.5 + Math.sin(time * 3 + offset) * 0.3,
          color: `hsl(${(time * 50 + i * 25) % 360}, 70%, 60%)`,
        };
      }, [clock]),
    };
  });

  return (
    <Canvas style={tw`flex-1`}>
      {/* Fond avec gradient animé */}
      <Rect x={0} y={0} width={400} height={800}>
        <SkiaLinearGradient
          start={vec(0, 0)}
          end={vec(400, 800)}
          colors={[
            currentTheme.colors.accent + '20',
            currentTheme.colors.accent + '10',
            '#8B5CF6' + '15',
            '#EF4444' + '10',
          ]}
          positions={[0, 0.3, 0.7, 1]}
        />
      </Rect>

      {/* Onde sinusoïdale animée */}
      <Group>
        {waveAnimation.current.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = waveAnimation.current[index - 1];
          const path = Skia.Path.Make();
          path.moveTo(prevPoint.x, prevPoint.y);
          path.lineTo(point.x, point.y);

          return (
            <Path
              key={index}
              path={path}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
            >
              <SkiaLinearGradient
                start={vec(0, 80)}
                end={vec(400, 120)}
                colors={['#3B82F6', '#8B5CF6', '#EF4444']}
                positions={[0, 0.5, 1]}
              />
            </Path>
          );
        })}
      </Group>

      {/* Particules avec physique avancée */}
      {physicsParticles.map(particle => (
        <Group key={particle.id}>
          {/* Particule principale */}
          <Circle
            cx={particle.animation.current.x}
            cy={particle.animation.current.y}
            r={6 * particle.animation.current.scale}
          >
            <RadialGradient
              c={vec(
                particle.animation.current.x,
                particle.animation.current.y,
              )}
              r={12}
              colors={[
                particle.animation.current.color + 'C0',
                particle.animation.current.color + '60',
                'transparent',
              ]}
            />
          </Circle>

          {/* Traînée lumineuse */}
          <Circle
            cx={particle.animation.current.x - 8}
            cy={particle.animation.current.y - 8}
            r={3 * particle.animation.current.scale}
            opacity={0.4}
          >
            <RadialGradient
              c={vec(
                particle.animation.current.x - 8,
                particle.animation.current.y - 8,
              )}
              r={6}
              colors={[particle.animation.current.color + '80', 'transparent']}
            />
          </Circle>
        </Group>
      ))}

      {/* Forme morphing au centre */}
      <Group transform={[{ translateX: 200 }, { translateY: 300 }]}>
        {/* Carré qui se transforme en cercle */}
        <RRect
          x={-morphProgress.current * 50}
          y={-morphProgress.current * 50}
          width={morphProgress.current * 100}
          height={morphProgress.current * 100}
          r={morphProgress.current * 50}
        >
          <RadialGradient
            c={vec(0, 0)}
            r={50}
            colors={[
              currentTheme.colors.accent + 'A0',
              currentTheme.colors.accent + '40',
              'transparent',
            ]}
          />
        </RRect>
      </Group>

      {/* Effet de lueur globale */}
      <Circle cx={200} cy={400} r={150} opacity={0.1}>
        <RadialGradient
          c={vec(200, 400)}
          r={200}
          colors={[
            'rgba(255,255,255,0.3)',
            'rgba(255,255,255,0.1)',
            'transparent',
          ]}
        />
      </Circle>
    </Canvas>
  );
}

// Composant de carte ultra-moderne
export function UltraModernCard({
  children,
  onPress,
  gradient = true,
  glassEffect = true,
  hoverEffect = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  gradient?: boolean;
  glassEffect?: boolean;
  hoverEffect?: boolean;
}) {
  const { currentTheme } = useTheme();
  const scaleAnimation = useState(new Animated.Value(1))[0];

  const handlePressIn = () => {
    if (hoverEffect) {
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (hoverEffect) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        tw`rounded-2xl overflow-hidden`,
        {
          transform: [{ scale: scaleAnimation }],
          shadowColor: currentTheme.colors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
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

        {/* Effet de brillance */}
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'transparent']}
          style={tw`absolute top-0 left-0 right-0 h-16`}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Bordure lumineuse */}
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

// Bouton ultra-moderne
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
  const scaleAnimation = useState(new Animated.Value(1))[0];

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
    Animated.spring(scaleAnimation, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <Animated.View
      style={[
        tw`overflow-hidden`,
        getSizeStyles(),
        {
          transform: [{ scale: scaleAnimation }],
          shadowColor: getGradientColors()[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
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
            <View style={tw`w-6 h-6`}>
              <LoadingSpinner />
            </View>
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

        {/* Effet de brillance animé */}
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

// Indicateur de chargement ultra-moderne avec Skia
export function UltraModernLoader({
  message = 'Chargement...',
  size = 'medium',
}: {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const { currentTheme } = useTheme();
  const clock = useClockValue();

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
  const center = canvasSize / 2;

  // Animation de rotation principale
  const mainRotation = useDerivedValue(() => {
    return [{ rotate: clock.current * 0.008 }];
  }, [clock]);

  // Animation des particules orbitantes
  const particleAnimations = useDerivedValue(() => {
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (clock.current * 0.003 + i * 45) % 360;
      const radius =
        canvasSize / 2 + 8 + Math.sin(clock.current * 0.01 + i) * 3;
      particles.push({
        x: center + Math.cos((angle * Math.PI) / 180) * radius,
        y: center + Math.sin((angle * Math.PI) / 180) * radius,
        scale: 0.5 + Math.sin(clock.current * 0.02 + i * 0.5) * 0.3,
        opacity: 0.6 + Math.sin(clock.current * 0.015 + i * 0.3) * 0.4,
      });
    }
    return particles;
  }, [clock, canvasSize, center]);

  // Animation du centre pulsant
  const centerPulse = useDerivedValue(() => {
    return 0.7 + Math.sin(clock.current * 0.008) * 0.3;
  }, [clock]);

  // Création du chemin de l'anneau principal
  const ringPath = Skia.Path.Make();
  ringPath.addArc({ x: center, y: center }, canvasSize / 3, 0, 340);

  return (
    <View style={tw`flex-1 items-center justify-center p-8`}>
      <Canvas style={[{ width: canvasSize, height: canvasSize }]}>
        {/* Anneau principal avec gradient rotatif */}
        <Group transform={mainRotation} origin={vec(center, center)}>
          <Path
            path={ringPath}
            style="stroke"
            strokeWidth={3}
            strokeCap="round"
            pathEffect={Skia.PathEffect.MakeCorner(8)}
          >
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(canvasSize, canvasSize)}
              colors={[
                currentTheme.colors.accent,
                currentTheme.colors.accent + 'E6',
                '#8B5CF6',
                '#EF4444',
                currentTheme.colors.accent,
              ]}
              positions={[0, 0.25, 0.5, 0.75, 1]}
            />
          </Path>
        </Group>

        {/* Particules orbitantes */}
        {particleAnimations.current.map((particle, index) => (
          <Circle
            key={index}
            cx={particle.x}
            cy={particle.y}
            r={4 * particle.scale}
            opacity={particle.opacity}
          >
            <RadialGradient
              c={vec(particle.x, particle.y)}
              r={8}
              colors={[
                currentTheme.colors.accent + 'A0',
                currentTheme.colors.accent + '40',
                'transparent',
              ]}
            />
          </Circle>
        ))}

        {/* Centre pulsant avec effet de brillance */}
        <Circle
          cx={center}
          cy={center}
          r={(canvasSize / 6) * centerPulse.current}
        >
          <RadialGradient
            c={vec(center, center)}
            r={canvasSize / 3}
            colors={[
              'rgba(255,255,255,0.9)',
              'rgba(255,255,255,0.4)',
              'transparent',
            ]}
          />
        </Circle>

        {/* Cœur avec icône */}
        <Circle cx={center} cy={center} r={canvasSize / 8}>
          <RadialGradient
            c={vec(center, center)}
            r={canvasSize / 4}
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
          />
        </Circle>
      </Canvas>

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

        {/* Bordure lumineuse */}
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
