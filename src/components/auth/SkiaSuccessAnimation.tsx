import React, { useEffect, useState, useRef } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import tw from 'twrnc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SkiaSuccessAnimationProps {
  visible: boolean;
  onAnimationComplete?: () => void;
  duration?: number;
}

export const SkiaSuccessAnimation: React.FC<SkiaSuccessAnimationProps> = ({
  visible,
  onAnimationComplete,
  duration = 3000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationProgress = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  // Déclencher l'animation quand visible change
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      animationProgress.setValue(0);

      // Animation principale
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      });

      // Animations des particules
      particleAnimations.forEach((particle, index) => {
        Animated.timing(particle, {
          toValue: 1,
          duration: duration + index * 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible, duration, onAnimationComplete, animationProgress, particleAnimations]);

  if (!visible && !isAnimating) return null;

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  return (
    <View style={tw`absolute inset-0`}>
      <View style={tw`flex-1 justify-center items-center`}>
        {/* Cercle principal explosif */}
        <Animated.View
          style={[
            tw`absolute rounded-full`,
            {
              left: centerX - 25,
              top: centerY - 25,
              width: 50,
              height: 50,
              backgroundColor: 'rgba(76, 205, 196, 0.3)',
              transform: [
                {
                  scale: animationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 5],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Particules explosives animées */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;

          return (
            <Animated.View
              key={i}
              style={[
                tw`absolute w-4 h-4 rounded-full`,
                {
                  left: centerX - 8,
                  top: centerY - 8,
                  backgroundColor: ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4],
                  transform: [
                    {
                      translateX: particleAnimations[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.cos(angle) * 300],
                      }),
                    },
                    {
                      translateY: particleAnimations[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.sin(angle) * 300],
                      }),
                    },
                    {
                      scale: particleAnimations[i].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.5, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Cercles concentriques */}
        {[1, 2, 3].map((multiplier) => (
          <Animated.View
            key={multiplier}
            style={[
              tw`absolute rounded-full border-2`,
              {
                left: centerX - 30 * multiplier,
                top: centerY - 30 * multiplier,
                width: 60 * multiplier,
                height: 60 * multiplier,
                borderColor: 'rgba(255, 107, 157, 0.5)',
                transform: [
                  {
                    scale: animationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 2],
                    }),
                  },
                ],
                opacity: animationProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0.7, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};
