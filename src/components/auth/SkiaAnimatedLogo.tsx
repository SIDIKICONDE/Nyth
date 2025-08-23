import React, { useEffect, useRef } from 'react';
import { View, Animated, PanResponder } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';

interface SkiaAnimatedLogoProps {
  size?: number;
  colors?: string[];
}

export const SkiaAnimatedLogo: React.FC<SkiaAnimatedLogoProps> = ({
  size = 120,
  colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4']
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;
  const waveValue = useRef(new Animated.Value(0)).current;

  // Animation de battement cardiaque et vague
  useEffect(() => {
    const startLogoAnimation = () => {
      Animated.parallel([
        // Animation de battement cardiaque
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 0.5,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
        // Animation de vague sinusoïdale
        Animated.loop(
          Animated.timing(waveValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ),
        // Animation de pulsation douce
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 0.95,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    startLogoAnimation();
  }, [pulseValue, waveValue, scaleValue]);

  // Gestion du toucher pour interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Animation d'interaction au toucher
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  );

  // Animation de battement cardiaque pour le cercle principal
  const heartbeatScale = pulseValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.3, 1.1],
  });

  // Animation de vague pour l'effet de bordure
  const waveOpacity = waveValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  const waveScale = waveValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const scale = scaleValue;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 3;

  return (
    <View style={tw`items-center justify-center`}>
      <View
        style={{ width: size, height: size }}
        {...panResponder.current.panHandlers}
      >
        {/* Cercle principal avec animation de battement cardiaque */}
        <Animated.View
          style={[
            tw`absolute rounded-full`,
            {
              left: centerX - radius,
              top: centerY - radius,
              width: radius * 2,
              height: radius * 2,
              transform: [{ scale: heartbeatScale }],
              opacity: pulseValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.7, 1, 0.8],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            style={tw`flex-1 rounded-full`}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Particules réagissant au battement cardiaque */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const baseRadius = radius * 0.7;

          // Animation de pulsation pour chaque particule avec délai
          const particlePulse = pulseValue.interpolate({
            inputRange: [0, 0.3, 0.7, 1],
            outputRange: [0.8, 1.4, 1.1, 0.8],
          });

          // Distance variable basée sur le battement
          const particleDistance = pulseValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [baseRadius * 0.8, baseRadius * 1.1, baseRadius * 0.9],
          });

          return (
            <Animated.View
              key={i}
              style={[
                tw`absolute w-2 h-2 rounded-full`,
                {
                  left: centerX - 4,
                  top: centerY - 4,
                  backgroundColor: colors[i % colors.length],
                  opacity: pulseValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.4, 0.9, 0.6],
                  }),
                  transform: [
                    { scale: particlePulse },
                    {
                      translateX: Animated.multiply(
                        particleDistance,
                        new Animated.Value(Math.cos(angle + i * 0.1))
                      ),
                    },
                    {
                      translateY: Animated.multiply(
                        particleDistance,
                        new Animated.Value(Math.sin(angle + i * 0.1))
                      ),
                    },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Cercle intérieur avec effet de vague */}
        <Animated.View
          style={[
            tw`absolute rounded-full border-2`,
            {
              left: centerX - radius * 0.6,
              top: centerY - radius * 0.6,
              width: radius * 1.2,
              height: radius * 1.2,
              borderColor: colors[1],
              borderWidth: 3,
              opacity: waveOpacity,
              transform: [
                { scale: waveScale },
                {
                  scale: pulseValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9, 1.1, 0.95],
                  })
                }
              ],
            },
          ]}
        />

        {/* Effet de brillance central réagissant au battement */}
        <Animated.View
          style={[
            tw`absolute rounded-full`,
            {
              left: centerX - radius * 0.25,
              top: centerY - radius * 0.25,
              width: radius * 0.5,
              height: radius * 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              opacity: pulseValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 1, 0.8],
              }),
              transform: [
                {
                  scale: pulseValue.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0.8, 1.4, 1.2, 0.9],
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
